// Exercise card behavior with browser/HA boundaries stubbed, without a browser.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function card() {
  const source = fs.readFileSync("src/e2a-learning-card.js", "utf8").replace(/^import .*;\r?\n/gm, "");
  const tags = new Map();
  const context = {
    LitElement: class { requestUpdate() {} disconnectedCallback() {} },
    BusyOverlayMixin: base => base,
    CONFIG: { DEFAULT_BLOCK_SECONDS: 60, AUTO_UNBLOCK: true },
    logger: { info() {}, debug() {}, warn() {}, error() {} },
    renderNavigationLinks: () => "Integration settings | Adapter examples",
    setLogLevel() {}, formatDateTime: (_, value) => String(value),
    confirm: async () => true,
    customElements: { get: name => tags.get(name), define: (name, value) => tags.set(name, value) },
    window: {}, structuredClone, Date, JSON, Set, Object, Number, performance, clearInterval,
    html: (parts, ...values) => parts.reduce((text, part, i) => text + part + (values[i] ?? ""), ""),
    css: () => "", e2aTheme: "", e2aLayout: "", e2aComponents: "", e2aStyles: "",
  };
  vm.runInNewContext(source, context);
  const result = new (tags.get("event2action-learning-card"))();
  result.hass = { connection: {}, callWS: async () => {} };
  result.renderBusyOverlay = () => "";
  result._applyBackend({ storage: { revision: 0, runtime: { map: [], settings: { block_seconds: 60 }, last_updated: new Date().toISOString() } }, last_event: null });
  return result;
}

test("fresh install exposes import before receiving a hardware event", () => {
  const instance = card();
  assert.equal(instance._hasValidLastData, false);
  assert.match(instance.render(), /Import/);
});

test("save waits for backend acknowledgement and sends expected revision", async () => {
  const instance = card();
  let message;
  instance.hass.callWS = async value => {
    message = value;
    assert.equal(instance._revision, 0);
    return { storage: { revision: 1, runtime: { map: [], settings: { block_seconds: 90 }, last_updated: new Date().toISOString() } } };
  };
  await instance._save_map("runtime", [], { block_seconds: 90 });
  assert.equal(message.type, "event2action/save");
  assert.equal(message.revision, 0);
  assert.equal(instance._revision, 1);
  assert.equal(instance._blockSeconds, 90);
});

test("failed save retains edit lock and unsaved draft", async () => {
  const instance = card();
  instance._lockedPcc = { proto: "1", code: "42" };
  instance._draft = { proto: "1", code: "42", active: false };
  instance._original = {};
  instance._editorStartedAt = Date.now() + 100;
  instance.hass.callWS = async () => { throw new Error("disk full"); };
  await instance._saveMap();
  assert.ok(instance._lockedPcc);
  assert.equal(instance._draft.code, "42");
  assert.equal(instance._revision, 0);
});

test("block countdown ignores clock differences between HA and browser", () => {
  const instance = card();
  for (const skew of [-2, 2, 120]) {
    const serverTime = Date.now() / 1000 + skew;
    instance._applyBackend({ blocked_until: serverTime + 60, server_time: serverTime });
    assert.equal(instance._blockCounter, 60);
    const remaining = instance._blockedUntil - performance.now() / 1000;
    assert.ok(remaining > 59 && remaining <= 60);
  }
  instance._applyBackend({ blocked_until: 0, server_time: Date.now() / 1000 });
  assert.equal(instance._blockCounter, 0);
  assert.equal(instance._blockedUntil, 0);
});

test("card prefers first active match but keeps inactive mappings editable", () => {
  const instance = card();
  const inactive = { proto: "1", code: "42", active: false };
  const firstActive = { proto: "1", code: "42", active: true, entity: "light.first" };
  const secondActive = { proto: "1", code: "42", active: true, entity: "light.second" };
  assert.equal(instance.findMapping([inactive, firstActive, secondActive], "1", "42"), firstActive);
  assert.equal(instance.findMapping([inactive], "1", "42"), inactive);
  assert.equal(instance.findMapping([inactive], "1", "other"), null);
});

test("learning and block state are shared by existing and newly opened cards", () => {
  const sidebar = card();
  const dashboard = card();
  const serverTime = Date.now() / 1000;
  const status = {
    learning_mode: true, learning_started_at: new Date().toISOString(), learning_revision: 1,
    blocked_until: serverTime + 60, server_time: serverTime, last_event: null,
  };
  sidebar._applyBackend(status);
  dashboard._applyBackend(status);
  assert.equal(sidebar._learningMode, true);
  assert.equal(dashboard._learningMode, true);
  assert.equal(sidebar._blockCounter, 60);
  assert.equal(dashboard._blockCounter, 60);
  const newlyOpened = card();
  newlyOpened._applyBackend(status);
  assert.equal(newlyOpened._learningMode, true);
  assert.equal(newlyOpened._blockCounter, 60);
  for (const instance of [sidebar, dashboard, newlyOpened]) {
    instance._applyBackend({ ...status, learning_mode: false, blocked_until: 0 });
    assert.equal(instance._learningMode, false);
    assert.equal(instance._blockCounter, 0);
  }
});

test("leaving one card does not send a global unblock or learning-off command", () => {
  const instance = card();
  let commands = 0;
  let unsubscribed = false;
  instance.hass.callWS = async () => { commands++; };
  instance._blockedUntil = performance.now() / 1000 + 60;
  instance._learningMode = true;
  instance._unsubscribeBackend = () => { unsubscribed = true; };
  instance.disconnectedCallback();
  assert.equal(commands, 0);
  assert.equal(unsubscribed, true);
  assert.equal(instance._learningMode, true);
});

function editor(storage) {
  const source = fs.readFileSync("src/e2a-card-editor.js", "utf8").replace(/^import[\s\S]*?;\r?\n/gm, "");
  const tags = new Map();
  vm.runInNewContext(source, {
    LitElement: class {}, html: () => "", css: () => "", localStorage: storage,
    AUTO_UNBLOCK: true, CUSTOM_COMMON_SERVICE_DATA_KEYS: {}, ENTITY_DOMAIN_LIST: [],
    LOG_LEVEL: 2, PREFILL_SERVICE_DATA: {},
    customElements: { get: name => tags.get(name), define: (name, value) => tags.set(name, value) },
  });
  return new (tags.get("event2action-learning-card-editor"))();
}

test("advanced sections start collapsed and remember independent state when reopened", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const first = editor(storage);
  assert.equal(first._expandedSections.common, false);
  assert.equal(first._expandedSections.prefill, false);
  first._onSectionToggle("common", { currentTarget: { open: true } });
  const reopened = editor(storage);
  assert.equal(reopened._expandedSections.common, true);
  assert.equal(reopened._expandedSections.prefill, false);
  reopened._onSectionToggle("common", { currentTarget: { open: false } });
  assert.equal(editor(storage)._expandedSections.common, false);
});

test("advanced sections still toggle when browser storage is unavailable", () => {
  const instance = editor({ getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } });
  instance._onSectionToggle("prefill", { currentTarget: { open: true } });
  assert.equal(instance._expandedSections.prefill, true);
});
