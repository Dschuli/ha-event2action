#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawnSync } = require("child_process");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

function normalizeAddress(value, expectedLengths = [12, 16]) {
  const normalized = String(value ?? "").trim().replace(/[:-]/g, "").toLowerCase();
  if (!expectedLengths.includes(normalized.length) || !/^[0-9a-f]+$/.test(normalized)) return null;
  return normalized;
}

function formatAddress(normalized) {
  return normalized.match(/.{2}/g).join(":");
}

async function askForAddress(question, expectedLengths, requiredSuffix = null) {
  while (true) {
    const answer = await ask(`${question}\n> `);
    const normalized = normalizeAddress(answer, expectedLengths);
    if (!normalized) {
      console.error(`Invalid address. Enter ${expectedLengths.map(length => length / 2).join(" or ")} hexadecimal bytes, with or without ':' or '-' separators.`);
      continue;
    }
    if (requiredSuffix && !normalized.endsWith(requiredSuffix)) {
      console.error(`Address mismatch: the address must end with ${requiredSuffix}.`);
      continue;
    }
    return normalized;
  }
}

function parseLegacyZhaCode(code) {
  const text = String(code ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const numericCode = Number(text);
  if (!Number.isSafeInteger(numericCode)) return null;

  const deviceDecimal = Math.floor(numericCode / 1000);
  const eventPart = numericCode % 1000;
  return {
    deviceDecimal,
    deviceSuffix: deviceDecimal.toString(16).padStart(6, "0"),
    endpoint: Math.floor(eventPart / 100),
    pressType: eventPart % 100
  };
}

function migrateLegacyCommand(entry, endpoint) {
  const value = String(entry.command ?? entry.button ?? "").trim();
  const match = value.match(/^(\d+)\s*-\s*(press|dblPress|longPress|unknown)$/);
  if (!match || Number(match[1]) !== endpoint) return value;

  return {
    press: "short_press",
    dblPress: "double_press",
    longPress: "long_press",
    unknown: "unknown"
  }[match[2]];
}

function defaultOutputPath(inputPath) {
  const parsed = path.parse(inputPath);
  let candidate = path.join(parsed.dir, `${parsed.name}_v0.2.0_migrated.json`);
  if (!fs.existsSync(candidate)) return candidate;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(parsed.dir, `${parsed.name}_v0.2.0_migrated_${timestamp}.json`);
}

function showWindowsFileDialog(mode, suggestedPath = "") {
  if (process.platform !== "win32") return undefined;

  const isSave = mode === "save";
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.${isSave ? "SaveFileDialog" : "OpenFileDialog"}
$dialog.Filter = 'JSON files (*.json)|*.json|All files (*.*)|*.*'
$dialog.Title = '${isSave ? "Save migrated Event2Action mapping" : "Select exported Event2Action mapping"}'
${isSave ? `
$suggested = $env:E2A_MIGRATION_SUGGESTED_PATH
if ($suggested) {
  $dialog.InitialDirectory = [System.IO.Path]::GetDirectoryName($suggested)
  $dialog.FileName = [System.IO.Path]::GetFileName($suggested)
}
$dialog.AddExtension = $true
$dialog.DefaultExt = 'json'
$dialog.OverwritePrompt = $false
` : "$dialog.CheckFileExists = $true\n$dialog.Multiselect = $false"}
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.FileName)
}
`;

  const result = spawnSync("powershell.exe", ["-NoProfile", "-STA", "-Command", script], {
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, E2A_MIGRATION_SUGGESTED_PATH: suggestedPath }
  });

  if (result.error || result.status !== 0) return undefined;
  const selectedPath = result.stdout.trim();
  return selectedPath || null;
}

async function migrate(importedMap) {
  const migratedMap = importedMap.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Entry ${index + 1} is not a mapping object.`);
    }
    return { ...entry };
  });
  const zhaGroups = new Map();

  migratedMap.forEach((entry, index) => {
    if (String(entry.proto ?? "").toLowerCase() !== "zha") return;
    const legacyCode = parseLegacyZhaCode(entry.code);
    if (!legacyCode) {
      throw new Error(`Entry ${index + 1} has ZHA code "${entry.code}", which is not a v0.1.3 numeric code.`);
    }
    const key = String(legacyCode.deviceDecimal);
    if (!zhaGroups.has(key)) zhaGroups.set(key, { ...legacyCode, indexes: [] });
    zhaGroups.get(key).indexes.push(index);
  });

  const nonZhaMissingAddress = migratedMap.filter(entry =>
    String(entry.proto ?? "").toLowerCase() !== "zha" && !normalizeAddress(entry.device_ieee)
  );
  if (nonZhaMissingAddress.length) {
    const snifferAddress = await askForAddress(
      `Enter the sniffer MAC/IEEE address for ${nonZhaMissingAddress.length} non-ZHA mapping(s).`,
      [12, 16]
    );
    const formattedAddress = formatAddress(snifferAddress);
    nonZhaMissingAddress.forEach(entry => { entry.device_ieee = formattedAddress; });
  }

  for (const group of zhaGroups.values()) {
    const addressesInFile = [...new Set(group.indexes
      .map(index => normalizeAddress(migratedMap[index].device_ieee, [16]))
      .filter(address => address?.endsWith(group.deviceSuffix)))];

    let ieeeAddress = addressesInFile[0] ?? null;
    if (addressesInFile.length > 1) {
      throw new Error(`Old ZHA device ${group.deviceDecimal} has conflicting IEEE addresses in the file.`);
    }
    if (!ieeeAddress) {
      ieeeAddress = await askForAddress(
        `Enter the full ZHA IEEE address for old device ID ${group.deviceDecimal} (hex suffix ${group.deviceSuffix}).`,
        [16],
        group.deviceSuffix
      );
    } else {
      console.log(`Using ${formatAddress(ieeeAddress)} from the file for old ZHA device ${group.deviceDecimal} (${group.deviceSuffix}).`);
    }

    for (const index of group.indexes) {
      const entry = migratedMap[index];
      const legacyCode = parseLegacyZhaCode(entry.code);
      const command = migrateLegacyCommand(entry, legacyCode.endpoint);
      entry.device_ieee = formatAddress(ieeeAddress);
      entry.command = command;
      entry.code = `${ieeeAddress}-${legacyCode.endpoint}-${command}`;
      delete entry.button;
      delete entry.temp;
    }
  }

  for (const entry of migratedMap) {
    if (entry.command == null && entry.button != null) entry.command = entry.button;
    delete entry.button;
    delete entry.temp;
  }

  return migratedMap;
}

async function main() {
  let inputPath = process.argv[2];
  if (!inputPath) {
    const selectedInput = showWindowsFileDialog("open");
    if (selectedInput === null) throw new Error("Input file selection was cancelled.");
    inputPath = selectedInput ?? await ask("Path to the exported v0.1.3-beta mapping JSON file:\n> ");
  }
  inputPath = path.resolve(inputPath.replace(/^['"]|['"]$/g, ""));

  if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const importedMap = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!Array.isArray(importedMap)) throw new Error("Invalid file format: expected a JSON array.");

  console.log(`Loaded ${importedMap.length} mapping(s) from ${inputPath}.`);
  const migratedMap = await migrate(importedMap);
  let outputPath = process.argv[3];
  if (!outputPath) {
    const suggestedOutput = defaultOutputPath(inputPath);
    const selectedOutput = showWindowsFileDialog("save", suggestedOutput);
    if (selectedOutput === null) throw new Error("Output file selection was cancelled.");
    outputPath = selectedOutput ?? suggestedOutput;
  }
  outputPath = path.resolve(outputPath.replace(/^['"]|['"]$/g, ""));

  if (fs.existsSync(outputPath)) throw new Error(`Output file already exists: ${outputPath}`);
  fs.writeFileSync(outputPath, `${JSON.stringify(migratedMap, null, 2)}\n`, "utf8");
  console.log(`Migration complete. Wrote ${migratedMap.length} mapping(s) to:\n${outputPath}`);
  console.log("Review the new file, import it in Event2Action v0.2.0, and test every mapping.");
}

main()
  .catch(error => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
