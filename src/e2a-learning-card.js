import { LitElement, html, css } from "lit";
import { renderNavigationLinks } from "./e2a-navigation.js";
import { confirm } from "./mixins/confirm.js";
import { BusyOverlayMixin } from "./mixins/busy_overlay_mixin.js";
import { formatDateTime } from "./utils/format.js";
import "./e2a-editor.js";
import "./e2a-card-editor.js";
import "./e2a-panel.js";
import * as CONFIG from "./e2a-config.js";
import { logger, setLogLevel } from "./utils/e2a-utils.js";
import { e2aTheme } from "./styles/e2a-theme.js";
import { e2aLayout } from "./styles/e2a-layout.js";
import { e2aComponents } from "./styles/e2a-components.js";
import { e2aStyles } from "./styles/e2a-styles.js";

class E2ALearningCard extends BusyOverlayMixin(LitElement) {

  /* =========================================================
   * Reactive properties
   * ========================================================= */
  static properties = {
    inSidebar: { attribute: false },
    hass: { attribute: false },
    config: { attribute: false },
    _lockedPcc: { state: true },
    _learningMode: { state: true },
    _draft: { state: true },
    _original: { state: true }
  };

  /* =========================================================
   * Lifecycle Methods
   * ========================================================= */
  constructor() {
    super();

    this._records = {};
    this._revision = null;
    this._backendError = "Connecting to Event2Action…";
    this._unsubscribeBackend = null;
    this._backendConnection = null;
    this._connectingBackend = false;
    this._backendGeneration = 0;
    this._lastEvent = null;
    this._blockedUntil = 0;
    this._blockSeconds = CONFIG.DEFAULT_BLOCK_SECONDS;
    this._entityDomainList = CONFIG.ENTITY_DOMAIN_LIST;
    this._customCommonServiceDataKeys = CONFIG.CUSTOM_COMMON_SERVICE_DATA_KEYS;
    this._prefillServiceData = CONFIG.PREFILL_SERVICE_DATA;
    this._autoUnblock = CONFIG.AUTO_UNBLOCK;
    this._logLevel = CONFIG.LOG_LEVEL;

    this._undoLabel = "Undo last session";
    this._undoHint = "Restores the mapping to the state before starting the last learning session.";
    this._busyLabel = "Working…";

    this._lockedPcc = null;
    this._learningMode = false;
    this._lastHandledEventTs = null;     // timestamp of last "old" RF event
    this._editorStartedAt = null;       // when editor was started for current code
    this._prevStoreState = null;
    this._busy = false;
    this._undoDisabled = false;

    this._resetLastEventData();
    this._blockCounter = 0;
    this._blockCounterInterval = null;
    this._savedBlockTime = null;
  }

  setConfig(config) {
    this.config = config || {};

    this._entityDomainList = this._normalizeStringList(
      this.config.entity_domain_list,
      CONFIG.ENTITY_DOMAIN_LIST
    );
    this._customCommonServiceDataKeys = this._normalizeObjectConfig(
      this.config.custom_common_service_data_keys,
      CONFIG.CUSTOM_COMMON_SERVICE_DATA_KEYS
    );
    this._prefillServiceData = this._normalizeObjectConfig(
      this.config.prefill_service_data,
      CONFIG.PREFILL_SERVICE_DATA
    );
    this._autoUnblock = this._normalizeBoolean(
      this.config.auto_unblock,
      CONFIG.AUTO_UNBLOCK
    );
    this._logLevel = this._normalizeNumber(
      this.config.log_level,
      CONFIG.LOG_LEVEL
    );
    setLogLevel(this._logLevel);

    const configuredBlockSeconds = this._normalizeNumber(
      this.config.default_block_seconds,
      null
    );
    if (configuredBlockSeconds !== null && configuredBlockSeconds > 0) {
      this._blockSeconds = configuredBlockSeconds;
    }
    this._connectBackend();
  }

  static getConfigElement() {
    return document.createElement("event2action-learning-card-editor");
  }

  static getStubConfig() {
    return {
      entity_domain_list: CONFIG.ENTITY_DOMAIN_LIST,
      custom_common_service_data_keys: CONFIG.CUSTOM_COMMON_SERVICE_DATA_KEYS,
      prefill_service_data: CONFIG.PREFILL_SERVICE_DATA,
      auto_unblock: CONFIG.AUTO_UNBLOCK,
      log_level: CONFIG.LOG_LEVEL
    };
  }

  _normalizeStringList(value, fallback) {
    if (Array.isArray(value)) {
      const entries = value.map(item => String(item).trim()).filter(Boolean);
      return entries.length ? entries : fallback;
    }
    if (typeof value === "string") {
      const entries = value.split(",").map(item => item.trim()).filter(Boolean);
      return entries.length ? entries : fallback;
    }
    return fallback;
  }

  _normalizeObjectConfig(value, fallback) {
    return value && typeof value === "object" ? value : fallback;
  }

  _normalizeBoolean(value, fallback) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }
    return fallback;
  }

  _normalizeNumber(value, fallback) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  _getRuntimeMappingEntity() { return "runtime"; }
  _getSessionBackupEntity() { return "session_backup"; }
  _getStepBackupEntity() { return "step_backup"; }

  async _connectBackend() {
    if (!this.isConnected || !this.hass?.connection || this._connectingBackend) return;
    if (this._backendConnection === this.hass.connection && this._subscribedAutoUnblock === this._autoUnblock) return;
    const generation = ++this._backendGeneration;
    this._connectingBackend = true;
    const connection = this.hass.connection;
    this._backendConnection = connection;
    this._subscribedAutoUnblock = this._autoUnblock;
    try {
      if (this._unsubscribeBackend) this._unsubscribeBackend();
      this._unsubscribeBackend = null;
      const unsubscribe = await connection.subscribeMessage(
        data => { if (generation === this._backendGeneration) this._applyBackend(data); },
        { type: "event2action/subscribe", auto_unblock: this._autoUnblock }
      );
      if (!this.isConnected || generation !== this._backendGeneration) {
        unsubscribe();
        return;
      }
      this._backendConnection = connection;
      this._unsubscribeBackend = unsubscribe;
    } catch (err) {
      this._backendError = err.message || "Set up the Event2Action integration, then reload this page.";
      this.requestUpdate();
    } finally {
      this._connectingBackend = false;
      if (this.isConnected && (generation !== this._backendGeneration || this._subscribedAutoUnblock !== this._autoUnblock)) this._connectBackend();
    }
  }

  _applyBackend(data) {
    const wasLearning = this._learningMode;
    const sessionChanged = data.learning_mode === true
      && this._learningStartedAt !== data.learning_started_at;
    if (typeof data.learning_mode === "boolean") this._learningStartedAt = data.learning_started_at;
    if (typeof data.learning_mode === "boolean") this._learningMode = data.learning_mode;
    if (data.storage && (this._revision === null || data.storage.revision >= this._revision)) {
      this._revision = data.storage.revision;
      this._records = Object.fromEntries(Object.entries(data.storage)
        .filter(([key, value]) => key !== "revision" && value)
        .map(([key, value]) => [key, { attributes: value, last_updated: value.last_updated }]));
      this._syncBlockSecondsFromRuntimeSettings();
    }
    if (wasLearning !== this._learningMode || sessionChanged) {
      this._lockedPcc = null;
      this._lastHandledEventTs = this._learningMode
        ? new Date(data.learning_started_at).getTime() : 0;
    }
    if (data.storage || wasLearning !== this._learningMode || sessionChanged) {
      if (this._learningMode) {
        this._undoLabel = "Undo last save";
        this._undoDisabled = !this._records.step_backup
          || this._revision <= data.learning_revision
          || this._compare_mapping_states("step_backup", "runtime");
        this._undoHint = this._undoDisabled
          ? "No saved mapping changes yet in this learning session."
          : "Restores the mapping to the state before the last save.";
      } else {
        this._undoLabel = "Undo last session";
        this._setSessionBackupHint();
      }
    }
    this._lastEvent = data.last_event;
    // Translate HA's clock to a local monotonic deadline for every instance.
    const remaining = Math.max(0, (data.blocked_until || 0) - (data.server_time ?? Date.now() / 1000));
    this._blockedUntil = remaining ? performance.now() / 1000 + remaining : 0;
    this._blockCounter = Math.ceil(remaining);
    this._backendError = null;
    this.setLastEventData();
    if (this._learningMode && !this._lockedPcc && this._hasValidLastData && this._lastTs > this._lastHandledEventTs) {
      this._start_EditMode(this._lastProto, this._lastCode, this._lastPressed);
    }
    this.requestUpdate();
  }

  /* =========================================================
   * Lifecycle Methods (continued)
   * ========================================================= */
  connectedCallback() {
    super.connectedCallback();
    // Legacy browser state must not reactivate learning or an old block.
    try {
      localStorage.removeItem("e2a_learning_mode");
      localStorage.removeItem("e2a_block_time");
    } catch (_) { /* Browser storage is optional. */ }
    this._blockCounterInterval = setInterval(() => {
      this._blockCounter = Math.max(0, Math.ceil(this._blockedUntil - performance.now() / 1000));
      this.requestUpdate();
    }, 1000);
    this._connectBackend();
  }

  disconnectedCallback() {
    this._backendGeneration++;
    if (this._unsubscribeBackend) this._unsubscribeBackend();
    this._unsubscribeBackend = null;
    this._backendConnection = null;
    clearInterval(this._blockCounterInterval);
    super.disconnectedCallback();
  }

  updated(changedProps) {
    if (changedProps.has("hass")) this._connectBackend();
  }

  /* =========================================================
   * State & Data Management
   * ========================================================= */
  setLastEventData() {
    const data = this._lastEvent;
    if (!data) { this._resetLastEventData(); return; }
    this._lastDeviceIeee = data.device_ieee || "";
    this._lastProto = data.proto;
    this._lastCode = data.code;
    this._lastPressed = data.command || "";
    this._lastTs = new Date(data.ts).getTime();
    this._hasValidLastData = data.proto != null && data.code != null && Number.isFinite(this._lastTs);
  }

  _resetLastEventData() {
    this._hasValidLastData = false;
    this._lastDeviceIeee = null;
    this._lastProto = null;
    this._lastCode = null;
    this._lastPressed = null;
    this._lastTs = null;
  }

  _get_mapping_data(slot) {
    const stateObj = this._records[slot];
    if (!stateObj) {
      logger.warn("E2ALearningCard: storage record not found");
      return { lastupdated: 0, map: [], settings: {} };
    }
    const lastupdated = stateObj.last_updated;
    const map = stateObj.attributes?.map || [];
    const settings = stateObj.attributes?.settings || {};
    logger.debug("E2ALearningCard: fetched mapping data with", map.length, "entries", lastupdated);
    return { lastupdated, map, settings };
  }

  _getBlockSecondsFromSettings(settings) {
    const seconds = Number(settings?.block_seconds);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  }

  _syncBlockSecondsFromRuntimeSettings() {
    const settings = this._records[this._getRuntimeMappingEntity()]?.attributes?.settings;
    const seconds = this._getBlockSecondsFromSettings(settings);
    if (seconds !== null && seconds !== this._blockSeconds) {
      this._blockSeconds = seconds;
    }
  }

  _compare_mapping_states(firstSlot, secondSlot) {
    return JSON.stringify(this._records[firstSlot]?.attributes?.map) === JSON.stringify(this._records[secondSlot]?.attributes?.map);
  }

  _isDirty() {
    return JSON.stringify(this._draft) !== JSON.stringify(this._original);
  }

  _hasValue(value) {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  findMapping(map, proto, code) {
    if (!Array.isArray(map)) return null;

    const p = String(proto);
    const c = String(code);

    const matches = map.filter(e =>
      String(e.proto) === p &&
      String(e.code) === c
    );
    // Show the entry the runtime executes. Keep an inactive entry accessible
    // for editing when there is no active match.
    return matches.find(e => e.active === true) || matches[0] || null;
  }

  _setBusy(active, label) {
    this._busy = active;
    if (label !== undefined) {
      this._busyLabel = label;
    }
  }

  _setSessionBackupHint() {
    const lastupdated = this._records[this._getSessionBackupEntity()]?.last_updated;
    if (lastupdated) {
      if (this._compare_mapping_states(this._getSessionBackupEntity(), this._getRuntimeMappingEntity())) {
        this._undoDisabled = true;
        this._undoHint = "Mapping state matches the last session backup.";
      } else {
        this._undoDisabled = false;
        this._undoHint = "Restores the RF/Zigbee mapping to the state before starting the last learning session.\n" + "dated " +
          formatDateTime(this.hass, new Date(lastupdated));
      }
    } else {
      this._undoDisabled = true;
      this._undoHint = "No session backup available to undo.";
    }
  }

  _getSetupIssues() {
    return this._backendError || this._revision === null
      ? [{ title: "Event2Action integration unavailable", items: [this._backendError || "Connecting…"] }]
      : [];
  }

  _renderDashboardLinks() {
    return this.inSidebar ? null : html`
      <nav class="dashboard-links" aria-label="Event2Action links">${renderNavigationLinks()}</nav>
    `;
  }

  _renderSetupIssues(issues) {
    return html`<ha-card header="Event2Action"><div class="content">
        ${this._renderDashboardLinks()}
      ${issues.map(issue => html`<p>${issue.title}</p>${issue.items.map(item => html`<p>${item}</p>`)}`)}
      <p>Set up Event2Action under Settings → Devices &amp; services. Reload this page after setup.</p>
    </div></ha-card>`;
  }

  async _save_map(slot, map, settings = null, captureSession = false) {
    const result = await this.hass.callWS({
      type: "event2action/save", slot, map, revision: this._revision, capture_session: captureSession,
      ...(settings === null ? {} : { settings })
    });
    this._applyBackend(result);
  }

  /* =========================================================
   * Map Manipulation
   * ========================================================= */
  _build_new_map(oldMap, newMap) {
    logger.debug("E2ALearningCard: Building new map", newMap, oldMap);
    const result = [];
    const seen = new Set();

    // Remove temp field from newMap entries
    const cleanedNewMap = newMap.map(entry => {
      const cleaned = { ...entry };
      if (cleaned.temp) delete cleaned.temp;
      delete cleaned.button;
      return cleaned;
    });

    // pass 1: walk old map, replace with new if present
    for (let i = 0; i < oldMap.length; i++) {
      const oldEntry = oldMap[i];
      const oldKey = oldEntry.proto + ":" + oldEntry.code;
      let replaced = false;
      for (let j = 0; j < cleanedNewMap.length; j++) {
        const newEntry = cleanedNewMap[j];
        const newKey = newEntry.proto + ":" + newEntry.code;
        if (newKey === oldKey) {
          result.push(structuredClone(newEntry));
          seen.add(newKey);
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        result.push(structuredClone(oldEntry));
      }
    }
    // pass 2: append entries that are only in newMap
    for (let j = 0; j < cleanedNewMap.length; j++) {
      const newEntry = cleanedNewMap[j];
      const newKey = newEntry.proto + ":" + newEntry.code;
      if (!seen.has(newKey)) {
        result.push(structuredClone(newEntry));
      }
    }
    return result;
  }

  _delete_from_map(oldMap, toDelete) {
    const result = [];
    const deleteKey = toDelete.proto + ":" + toDelete.code;
    // walk old map, skip the one to delete
    for (let i = 0; i < oldMap.length; i++) {
      const oldEntry = oldMap[i];
      const oldKey = oldEntry.proto + ":" + oldEntry.code;
      if (oldKey !== deleteKey) {
        result.push(structuredClone(oldEntry));
      }
    }
    return result;
  }

  /* =========================================================
   * Learning Mode & Editor Management
   * ========================================================= */
  async toggleLearningMode(e) {
    if (!this.hass) return;
    try {
      this._applyBackend(await this.hass.callWS({
        type: "event2action/learning", enabled: e.target.checked
      }));
    } catch (err) {
      e.target.checked = this._learningMode;
      await confirm(err.message || "Could not change learning mode.", { yes: "Ok", no: "" });
    }
  }

  // Enter edit mode for current last event
  _start_EditMode(proto, code, command) {
    logger.info("E2ALearningCard: starting editor for ", proto, code);
    this._lockedPcc = { proto: proto, code: code };
    this._editorStartedAt = Date.now();
    const stateObj = this._records[this._getRuntimeMappingEntity()];
    logger.debug("E2ALearningCard: map stateObj =", stateObj);
    if (!stateObj) return;
    const map = Array.isArray(stateObj.attributes?.map) ? stateObj.attributes.map : [];
    const existing = this.findMapping(map, proto, code);

    // Create a base object with event metadata for new entries.
    const baseEntry = {
      ...this._lockedPcc,
      device_ieee: this._lastDeviceIeee || "",
      active: true,
      service: "",
      entity: "",
      service_data: {},
      remote: "",
      type: "",
      channel: "",
      command: command || ""
    };

    // Migrate the legacy button field while editing, but only save command.
    let originalEntry = structuredClone(existing ?? baseEntry);
    originalEntry.device_ieee = this._lastDeviceIeee || originalEntry.device_ieee || "";
    originalEntry.command = command || originalEntry.command || originalEntry.button || "";
    delete originalEntry.button;

    this._original = originalEntry;
    this._draft = structuredClone(this._original);
  }

  _onDraftChanged(e) {
    const { field, value } = e.detail;
    this._draft = { ...this._draft, [field]: value };
  }

  _onMappingNameChanged(e) {
    this._draft = { ...this._draft, name: e.target.value };
  }

  /* =========================================================
   * Event Handlers (User Actions)
   * ========================================================= */
  async blockEvents(seconds) {
    try {
      this._applyBackend(await this.hass.callWS({ type: "event2action/block", seconds }));
    } catch (err) {
      await confirm(err.message || "Could not block events.", { yes: "Ok", no: "" });
    }
  }

  async unBlockEvents() {
    this._applyBackend(await this.hass.callWS({ type: "event2action/block", seconds: 0 }));
  }

  async _saveBlockSeconds(seconds) {
    const blockSeconds = Number(seconds);
    if (!Number.isFinite(blockSeconds) || blockSeconds <= 0) return;

    const { map, settings } = this._get_mapping_data(this._getRuntimeMappingEntity());

    try {
      await this._save_map(
        this._getRuntimeMappingEntity(),
        map,
        {
          ...settings,
          block_seconds: blockSeconds
        }
      );
    } catch (err) {
      logger.error("E2A: failed to save block seconds", err);
      await confirm(
        "Failed to save block duration.\nCheck Home Assistant logs for details.",
        { yes: "Ok", no: "" }
      );
    }
  }

  async _onExportMap() {
    const { map } = this._get_mapping_data(this._getRuntimeMappingEntity());
    if (!map || map.length === 0) {
      await confirm("Current RF/Zigbee mapping is empty. Nothing to export.", { yes: "Ok", no: "" });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `event2action_map_${timestamp}.json`;
    const json = JSON.stringify(map, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async _onImportMap() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedMap = JSON.parse(text);

        if (!Array.isArray(importedMap)) {
          await confirm("Invalid file format. Expected a JSON array.", { yes: "Ok", no: "" });
          return;
        }

        const ok = await confirm(
          `Import ${importedMap.length} mapping(s) from file?\n\nThis replaces the current map. Legacy session and step backups are not imported. A new installation starts with a 60-second blocking duration. Keep your original export.`,
          { yes: "Import", no: "Cancel" }
        );
        if (!ok) return;

        this._setBusy(true, "Importing map…");
        try {
          await this._save_map(
            this._getRuntimeMappingEntity(),
            importedMap, null, true
          );
          await confirm("Map imported successfully.", { yes: "Ok", no: "" });
        } catch (err) {
          logger.error("E2A: failed to import map", err);
          await confirm(
            err.message || "Failed to import mapping.",
            { yes: "Ok", no: "" }
          );
        } finally {
          this._setBusy(false);
        }
      } catch (err) {
        logger.error("E2A: failed to read import file", err);
        await confirm("Failed to read file. Make sure it's a valid JSON file.", { yes: "Ok", no: "" });
      }
    };

    input.click();
  }

  async _onEditorCancel() {
    if (this._isDirty()) {
      const discard = await confirm("You have unsaved changes. Do you really want to discard them?", { yes: "Discard", no: "Keep editing" });
      if (!discard) return;
    }

    this._draft = structuredClone(this._original);
    this._lastHandledEventTs = this._lastTs;
    this._lockedPcc = null;
  }

  async _onEditorSave(e) {
    const name = (this._draft.name || "").trim();
    const { map } = this._get_mapping_data(this._getRuntimeMappingEntity());
    const duplicateName = name && map.some(entry =>
      (entry.proto !== this._lockedPcc.proto || entry.code !== this._lockedPcc.code) &&
      (entry.name || "").trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (duplicateName) {
      await confirm(`Mapping name "${name}" is already in use. Please choose a unique name.`, { yes: "Ok", no: "" });
      return;
    }

    const normalizedDraft = { ...this._draft };
    if (name) normalizedDraft.name = name;
    else delete normalizedDraft.name;
    this._draft = normalizedDraft;

    if (!this._draft.entity || !this._draft.service) {
      await confirm("Entity and Service fields are required for an active mapping. Disable the mapping to save an incomplete record.", { yes: "Ok", no: "" });
      if (this._draft.active) return;
    }
    this._saveMap(false);
  }

  async _onEditorDelete() {
    logger.info("E2ALearningCard: Deleting mapping for", this._lockedPcc);
    if (!this._lockedPcc) return;
    const confirmDelete = await confirm("Are you sure you want to delete this mapping?", { yes: "Delete", no: "Cancel" });
    if (!confirmDelete) return;
    logger.debug("E2ALearningCard: Deleting mapping for", this._lockedPcc);
    this._saveMap(true);
  }

  async _saveMap(doDelete = false) {
    logger.info("E2ALearningCard: Saving edited mapping", doDelete);
    if (!this._lockedPcc) return;

    const stateObj = this._records[this._getRuntimeMappingEntity()];
    if (!stateObj) return;
    const lastUpdated = new Date(stateObj.last_updated).getTime();
    if (lastUpdated > this._editorStartedAt) {
      const overwrite = await confirm("The RF mapping has changed since you started editing.\nSaving now will overwrite those changes.\n\nDo you want to proceed?", { yes: "Overwrite", no: "Cancel" });
      if (!overwrite) return;
    }

    // The backend captures the step backup atomically. Build against the latest
    // map after any asynchronous overwrite prompt, preserving unrelated edits.
    this._setBusy(true, doDelete ? "Deleting mapping…" : "Saving mapping…");
    const map = this._records[this._getRuntimeMappingEntity()]?.attributes?.map || [];
    const newMap = doDelete ? this._delete_from_map(map, this._lockedPcc) : this._build_new_map(map, [this._draft]);
    logger.debug("E2ALearningCard: built new map with", newMap.length, "entries", newMap);

    try {
      await this._save_map(
        this._getRuntimeMappingEntity(),
        newMap
      );
      logger.info("E2A: Change saved to mapping");
    } catch (err) {
      logger.error("E2A: failed to save mapping", err);
      await confirm(
        err.message || "Failed to save mapping.",
        { yes: "Ok", no: "" }
      );
      return;
    } finally {
      this._setBusy(false);
    }

    this._original = structuredClone(this._draft);
    this._lastHandledEventTs = this._lastTs;
    this._lockedPcc = null;
    this._undoDisabled = false;
  }

  async _onUndo() {
    logger.info("E2ALearningCard: Undoing");
    if (this._learningMode) {
      // Restore step backup
      const lastupdated = this._records[this._getStepBackupEntity()]?.last_updated;
      if (!lastupdated) {
        logger.warn("E2ALearningCard: no step backup available");
        this._setBusy(false);
        return;
      }
      const ok = await confirm("Are you sure you want to undo the last save operation?" +
        "\nThis will restore the RF/Zigbee mapping to the state before the last save,\n" +
        "dated " + formatDateTime(this.hass, new Date(lastupdated)), { yes: "Undo", no: "Cancel" })
      if (!ok) return;
      this._setBusy(true, "Undoing last save…");
      try {
        await this._save_map(
          this._getRuntimeMappingEntity(),
          this._records[this._getStepBackupEntity()]?.attributes?.map || []
        );
        logger.info("E2ALearningCard: session undo completed");
        await confirm("Mapping before last save restored.", { yes: "Ok", no: "" });

        this._undoHint = "Last saving already undone.";
        this._undoDisabled = true;
      } catch (err) {
        logger.error("E2ALearningCard: failed to undo session", err);
        await confirm(
          "Failed to undo last save.\nCheck Home Assistant logs for details.",
          { yes: "Ok", no: "" }
        );
      } finally {
        this._setBusy(false);
      }
    } else {
      // Restore session backup
      const lastupdated = this._records[this._getSessionBackupEntity()]?.last_updated;
      if (!lastupdated) {
        logger.warn("E2ALearningCard: no session backup available");
        return;
      }
      const ok = await confirm("Are you sure you want to undo the last learning session?" +
        "\nThis will restore the RF/Zigbee mapping to the state before starting the last learning session,\n" +
        "dated " + formatDateTime(this.hass, new Date(lastupdated)), { yes: "Undo", no: "Cancel" })
      if (!ok) return;
      this._setBusy(true, "Restoring session backup…");
      try {
        await this._save_map(
          this._getRuntimeMappingEntity(),
          this._records[this._getSessionBackupEntity()]?.attributes?.map || []
        );
        logger.info("E2ALearningCard: session undo completed");
        await confirm("Mapping restored to state before last learning session.", { yes: "Ok", no: "" });
        this._setSessionBackupHint();
      } catch (err) {
        logger.error("E2ALearningCard: failed to undo session", err);
        await confirm(
          "Failed to undo session.\nCheck Home Assistant logs for details.",
          { yes: "Ok", no: "" }
        );
      } finally {
        this._setBusy(false);
      }
    }
  }

  /* =========================================================
   * Render
   * ========================================================= */

  _renderSwitch(checked, disabled, onChange) {
    if (customElements.get("ha-switch")) {
      return html`
        <ha-switch
          .checked=${checked}
          ?disabled=${disabled}
          @change=${onChange}>
        </ha-switch>
      `;
    }

    return html`
      <input
        class="e2a-fallback-switch"
        type="checkbox"
        .checked=${checked}
        ?disabled=${disabled}
        @change=${onChange}
      />
    `;
  }

  render() {
    if (!this.hass) {
      return html`
        <ha-card header="Event2Action Learning">
          <div class="content">
        ${this._renderDashboardLinks()}
            <p>Loading Home Assistant state.</p>
          </div>
        </ha-card>
        ${this.renderBusyOverlay()}
      `;
    }

    const setupIssues = this._getSetupIssues();
    if (setupIssues.length) {
      return this._renderSetupIssues(setupIssues);
    }

    const runtimeRecord = this._records[this._getRuntimeMappingEntity()];

    const isEditing = !!this._lockedPcc;

    // What we show as "current"
    const displayProto = isEditing ? this._lockedPcc.proto : this._lastProto;
    const displayCode = isEditing ? this._lockedPcc.code : this._lastCode;

    // Mapping lookup ONLY relevant in view mode
    const map = runtimeRecord?.attributes?.map || [];
    const match = this.findMapping(map, displayProto, displayCode)
    const nonEditMatch = !isEditing && displayProto && displayCode ? match : null;

    const blocked = this._blockedUntil > performance.now() / 1000;

    return html`
    <ha-card header="Event2Action Learning">
      <div class="content">
        ${this._renderDashboardLinks()}

        <!-- Learning toggle -->
        <div class="row toolbar">
          <div class="control-group">
            ${this._renderSwitch(
      this._learningMode,
      isEditing,
      this.toggleLearningMode
    )}
            <span style="margin-left: 8px;">
              ${this._learningMode ? "Learning mode ON" : "Learning mode OFF"}
            </span>
          </div>
          <div class="control-group">
            <ha-button
              title=${this._undoHint}
              ?disabled=${this._undoDisabled}
              @click=${this._onUndo}
            >
              ${this._undoLabel}
            </ha-button>
          </div>
          <div class="control-group action-panel">
            <ha-button class=${blocked ? "danger" : ""}
              @click=${() => blocked ? this.unBlockEvents() : this.blockEvents(this._blockSeconds)}
              title=${blocked ? "Terminate event blocking" : "Temporarily block event2action automation from acting on incoming events"}>
              ${blocked ? `Unblock - ${this._blockCounter} sec` : "Block events"}
            </ha-button>
            <ha-input
              label="seconds"
              type="number"
              min="1"
              class="block-duration"
              .value=${String(this._blockSeconds)}
              @input=${(e) => { this._blockSeconds = Number(e.target.value); }}
              @change=${(e) => this._saveBlockSeconds(e.target.value)}
            ></ha-input>
          </div>
          <div class="control-group action-panel">
            <ha-button
              @click=${this._onExportMap}
              title="Export current mapping to JSON file"
              ?disabled=${this._learningMode || isEditing}
            >
              Export Map
            </ha-button>
            <ha-button
              @click=${this._onImportMap}
              title="Import Mapping from JSON file"
              ?disabled=${this._learningMode || isEditing}
            >
              Import Map
            </ha-button>
          </div>
        </div>

        ${this._learningMode && !isEditing
        ? html`<p><em>Learning active – press a remote button.</em></p>`
        : null}

        <!-- ================= EDIT MODE ================= -->
        ${isEditing ? html`
          <div class="mapping-heading">
            <div class="mapping-details">
              <b>Editing mapping for:</b>
              <p class="mapping-identity">
                Proto ${this._lockedPcc.proto},
                Code ${this._lockedPcc.code}
              </p>
            </div>
            <label class="mapping-enabled">
              ${this._renderSwitch(
                this._draft?.active ?? true,
                false,
                e => this.renderRoot.querySelector("e2a-editor").setActive(e.target.checked)
              )}
              <span>Enabled</span>
            </label>
          </div>

          <div class="row-4">
            <ha-input
              label="Friendly name (Optional)"
              .value=${this._draft?.name ?? ""}
              @input=${this._onMappingNameChanged}>
            </ha-input>
          </div>

          <e2a-editor
            .hass=${this.hass}
            .draft=${this._draft}
            .collection=${map}
            .entityDomainList=${this._entityDomainList}
            .customCommonServiceDataKeys=${this._customCommonServiceDataKeys}
            .prefillServiceData=${this._prefillServiceData}
            .existing=${!!match}
            .externalDirty=${(this._draft?.name ?? "") !== (this._original?.name ?? "")}
            .disabled=${false}
            @draft-changed=${this._onDraftChanged}
            @save=${this._onEditorSave}
            @cancel=${this._onEditorCancel}
            @delete=${this._onEditorDelete}>
          </e2a-editor>

          <hr />

          <p><b>Last incoming event</b></p>
          <ul>
            <li>Proto: ${this._lastProto}</li>
            <li>Code: ${this._lastCode}</li>
            ${this._lastPressed ? html`<li>Command: ${this._lastPressed}</li>` : null}
          </ul>
        ` : null}

        <!-- ================= VIEW MODE ================= -->
        ${!isEditing ? html`
          <b>Last event</b>
          <ul class="no_vert_margin" >
            ${nonEditMatch?.name ? html`<li>Mapping name: ${nonEditMatch.name}</li>` : null}
            <li>Proto: ${displayProto}</li>
            <li>Code: ${displayCode}</li>
            ${this._lastPressed ? html`<li>Command: ${this._lastPressed}</li>` : null}
          </ul>

          ${nonEditMatch
          ? html`
                <b>Action data for last event</b>
                <ul class="no_vert_margin">
                  <li>Entity: ${nonEditMatch.entity}</li>
                  <li>Service: ${nonEditMatch.service}</li>
                  <li class="item ${this._hasValue(nonEditMatch.service_data) ? '' : 'hidden'}">Service Data:
                    <pre>${JSON.stringify(nonEditMatch.service_data ?? {}, null, 2)}</pre>
                  </li>
                  <li>Active: ${nonEditMatch.active ? "yes" : "no"}</li>
                  <li>Remote: ${nonEditMatch.remote}</li>
                  <li>Type: ${nonEditMatch.type}</li>
                  <li>Command: ${nonEditMatch.command ?? nonEditMatch.button ?? ""}</li>
                  <li>Channel: ${nonEditMatch.channel}</li>
                </ul>
              `
          : html`
                <p><b>Unmapped code</b></p>
                <p>This code is not assigned yet.</p>
              `}
        ` : null}
      </div>
    </ha-card>
    ${this.renderBusyOverlay()}
  `;
  }


  /* =========================================================
   * Styles
   * ========================================================= */
  static styles = [
    super.styles ?? [],
    e2aTheme,
    e2aComponents,
    e2aLayout,
    e2aStyles,
    css`
    :host {
      position: relative;
      display: block;
      }
    .dashboard-links {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 12px;
    }
    .dashboard-links a { color: inherit; text-underline-offset: 3px; }
    .mapping-heading {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: center;
      justify-items: start;
      text-align: left;
      gap: var(--e2a-gap, 12px);
      margin-top: 16px;
      margin-bottom: 16px;
    }
    .mapping-details {
      align-self: start;
      min-width: 0;
    }
    .mapping-enabled {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      flex-shrink: 0;
      margin: 0;
      line-height: normal;
    }
    .mapping-enabled ha-switch,
    .mapping-enabled input {
      display: block;
      margin: 0;
      align-self: center;
    }
    .mapping-identity {
      margin: 4px 0 0;
      overflow-wrap: anywhere;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--e2a-gap, 12px);
    }
    .toolbar > .control-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--e2a-gap, 12px);
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }
    .toolbar .action-panel {
      background: var(--secondary-background-color);
      padding: 8px;
      border-radius: var(--e2a-border-radius);
    }
    .toolbar ha-button {
      max-width: 100%;
    }
    .toolbar .block-duration {
      flex: 0 1 100px;
      width: 100px;
      min-width: 0;
      max-width: 100%;
    }
    .content {
      padding: 16px;
      min-width: 0;
      li > pre {
        margin: 0;
      }
    }
    .setup-alert {
      border-left: 4px solid var(--warning-color, #f4b400);
      background: var(--secondary-background-color);
      padding: 12px 16px;
      border-radius: var(--e2a-border-radius);
    }
    .setup-alert h3 {
      margin-top: 0;
    }
    .setup-alert code {
      font-family: var(--code-font-family, monospace);
    }
    .e2a-fallback-switch {
      width: 40px;
      height: 20px;
      accent-color: var(--primary-color);
    }`
  ]
}

/* =========================================================
 * Card registration
 * ========================================================= */
if (!customElements.get("e2a-learning-card")) {
  customElements.define("e2a-learning-card", E2ALearningCard);
}

// A separate subclass is required because the Web Components spec does not
// allow the same constructor to be registered under two different tag names.
class Event2ActionLearningCard extends E2ALearningCard { }
if (!customElements.get("event2action-learning-card")) {
  customElements.define("event2action-learning-card", Event2ActionLearningCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "event2action-learning-card",
  name: "Event2Action Learning Card",
  description: "Generic event learning and action mapping UI",
});

