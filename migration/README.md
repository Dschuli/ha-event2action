# Mapping migration: v0.1.3-beta to v0.2.0

This standalone tool converts an exported Event2Action v0.1.3-beta mapping to the v0.2.0 schema. It never changes the source file or the active Home Assistant mapping.

## Requirements

- Node.js 18 or newer
- A mapping exported from Event2Action v0.1.3-beta
- The MAC/IEEE address of the event-source sniffer used by non-ZHA mappings
- The full IEEE address of each ZHA device

## Procedure

1. Export the mapping from v0.1.3-beta and retain the original file as a backup.
2. From the repository root, run:

   ```shell
   node migration/migrate-v0.1.3-to-v0.2.0.js path/to/event2action_map.json
   ```

   On Windows, paths can be quoted:

   ```powershell
   node migration/migrate-v0.1.3-to-v0.2.0.js "C:\Users\User\Downloads\event2action_map.json"
   ```

   On Windows, omitting the input path opens a native file selector. Omitting the output path opens a native **Save As** dialog with the generated filename prefilled. If native dialogs are unavailable, the tool falls back to a terminal prompt for the input and the generated output path.

   Cancelling either dialog stops the migration without changing any files. An optional second argument sets the output path and skips the **Save As** dialog:

   ```shell
   node migration/migrate-v0.1.3-to-v0.2.0.js input.json output.json
   ```

3. Enter the sniffer MAC/IEEE address if non-ZHA entries are missing `device_ieee`. One value is applied to all such entries.
4. For each unique old ZHA device, enter its full eight-byte IEEE address. The prompt shows:
   - The decimal device portion extracted from the old numeric code
   - The corresponding six-digit hexadecimal suffix
5. The tool verifies that the full IEEE address ends with the suffix encoded in the old code. It asks again if the address does not match.
6. Review the generated `<original-name>_v0.2.0_migrated.json` file.
7. In Event2Action v0.2.0, use **Import Map** to import the migrated file.
8. Test every mapping before removing the original export.

## Transformations

The tool:

- Adds `device_ieee` where needed.
- Renames `button` to `command`.
- Removes temporary `temp` data.
- Groups old ZHA entries by the device portion of their numeric code.
- Reuses a matching full `device_ieee` already present in any entry belonging to that device.
- Rebuilds ZHA codes as `<full-ieee-without-separators>-<endpoint>-<command>`.
- Refuses to overwrite an existing output file.

Generated v0.1.3 ZHA Button values are converted as follows:

| v0.1.3 Button | v0.2.0 Command |
|---|---|
| `<endpoint>-press` | `short_press` |
| `<endpoint>-dblPress` | `double_press` |
| `<endpoint>-longPress` | `long_press` |
| `<endpoint>-unknown` | `unknown` |

Whitespace around the hyphen is accepted. A manually changed Button/Command that does not match the generated pattern for the entry's endpoint is preserved and used in the new code.

## Safety and errors

- The input export is read-only.
- The Home Assistant mapping is not contacted or modified.
- Invalid JSON, non-array input, malformed mapping entries, unrecognized ZHA codes, conflicting IEEE data, and existing output paths stop the migration with an error.
- If an output with the default name already exists, a timestamp is added to the new filename.
