import { LitElement, html, css } from "lit";
import {
  AUTO_UNBLOCK,
  CUSTOM_COMMON_SERVICE_DATA_KEYS,
  ENTITY_DOMAIN_LIST,
  LOG_LEVEL,
  PREFILL_SERVICE_DATA
} from "./e2a-config.js";

const DEFAULT_CONFIG = {
  entity_domain_list: ENTITY_DOMAIN_LIST,
  custom_common_service_data_keys: CUSTOM_COMMON_SERVICE_DATA_KEYS,
  prefill_service_data: PREFILL_SERVICE_DATA,
  auto_unblock: AUTO_UNBLOCK,
  log_level: LOG_LEVEL
};

class Event2ActionLearningCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
    _customCommonServiceRows: { state: true },
    _prefillServiceRows: { state: true },
    _customCommonServiceDataKeysError: { state: true },
    _customCommonServiceFileStatus: { state: true },
    _prefillServiceDataError: { state: true },
    _prefillServiceFileStatus: { state: true }
  };

  constructor() {
    super();
    this.config = {};
    this._customCommonServiceRows = this._customCommonServiceDataKeysToRows(DEFAULT_CONFIG.custom_common_service_data_keys);
    this._prefillServiceRows = this._prefillServiceDataToRows(DEFAULT_CONFIG.prefill_service_data);
    this._customCommonServiceDataKeysError = "";
    this._customCommonServiceFileStatus = "";
    this._prefillServiceDataError = "";
    this._prefillServiceFileStatus = "";
  }

  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...(config || {})
    };
    this._customCommonServiceRows = this._customCommonServiceDataKeysToRows(this.config.custom_common_service_data_keys);
    this._prefillServiceRows = this._prefillServiceDataToRows(this.config.prefill_service_data);
  }

  _formatJson(value) {
    return JSON.stringify(value ?? {}, null, 2);
  }

  _dispatchConfig(nextConfig) {
    this.config = nextConfig;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: nextConfig },
      bubbles: true,
      composed: true
    }));
  }

  _setConfigValue(key, value) {
    this._dispatchConfig({
      ...this.config,
      [key]: value
    });
  }

  _onDomainsChanged(event) {
    const domains = Array.from(event.target.selectedOptions || [])
      .map(option => option.value)
      .filter(Boolean);
    this._setConfigValue("entity_domain_list", domains);
  }

  _onDomainsSelectorChanged(event) {
    const value = event.detail?.value;
    this._setConfigValue(
      "entity_domain_list",
      Array.isArray(value) ? value.filter(Boolean) : []
    );
  }

  _getAvailableDomains(selectedDomains = []) {
    const domains = new Set([
      ...DEFAULT_CONFIG.entity_domain_list,
      ...(selectedDomains || [])
    ]);

    Object.keys(this.hass?.services || {}).forEach(domain => {
      if (domain) domains.add(domain);
    });

    Object.keys(this.hass?.states || {}).forEach(entityId => {
      const domain = entityId.split(".")[0];
      if (domain) domains.add(domain);
    });

    return Array.from(domains).sort((a, b) => a.localeCompare(b));
  }

  _renderDomainSelector(selectedDomains) {
    const selected = Array.isArray(selectedDomains) ? selectedDomains : [];
    const options = this._getAvailableDomains(selected).map(domain => ({
      value: domain,
      label: domain
    }));

    if (customElements.get("ha-selector")) {
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{
          select: {
            multiple: true,
            mode: "dropdown",
            options
          }
        }}
          .value=${selected}
          @value-changed=${this._onDomainsSelectorChanged}
        ></ha-selector>
      `;
    }

    return html`
      <select
        multiple
        size=${Math.min(Math.max(options.length, 5), 12)}
        .value=${selected[0] || ""}
        @change=${this._onDomainsChanged}
      >
        ${options.map(option => html`
          <option
            value=${option.value}
            ?selected=${selected.includes(option.value)}
          >
            ${option.label}
          </option>
        `)}
      </select>
    `;
  }

  _customCommonServiceDataKeysToRows(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    return Object.entries(value).map(([pattern, parameters]) => {
      const [entityPattern, service] = this._splitEntityServicePattern(pattern);

      return {
        entityPattern,
        service,
        parametersText: this._formatParameterArray(parameters)
      };
    });
  }

  _prefillServiceDataToRows(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    return Object.entries(value).map(([pattern, prefill]) => {
      const [entityPattern, service] = this._splitEntityServicePattern(pattern);

      return {
        entityPattern,
        service,
        prefillText: this._formatPrefillJson(prefill)
      };
    });
  }

  _splitEntityServicePattern(pattern) {
    const text = String(pattern || "");
    const separatorIndex = text.indexOf("|");

    if (separatorIndex === -1) {
      return ["", text];
    }

    return [
      text.slice(0, separatorIndex),
      text.slice(separatorIndex + 1)
    ];
  }

  _formatInlineJson(value) {
    return JSON.stringify(value ?? {});
  }

  _formatParameterArray(value) {
    const parameters = Array.isArray(value) ? value : [];
    return JSON.stringify(parameters.map(parameter => (
      parameter && typeof parameter === "object" && !Array.isArray(parameter) ? parameter : {}
    )));
  }

  _formatPrefillJson(value) {
    if (typeof value !== "string") {
      return this._formatInlineJson(value && typeof value === "object" && !Array.isArray(value) ? value : {});
    }

    try {
      return this._formatInlineJson(JSON.parse(value));
    } catch {
      return value;
    }
  }

  _buildCustomCommonServiceDataKeys(rows) {
    const nextValue = {};
    const errors = [];

    rows.forEach((row, index) => {
      const entityPattern = String(row.entityPattern || "").trim();
      const service = String(row.service || "").trim();
      const parametersText = String(row.parametersText || "").trim();
      const isBlank = !entityPattern && !service && !parametersText;

      if (isBlank) {
        return;
      }

      if (!entityPattern || !service || !parametersText) {
        errors.push(`Block ${index + 1}: entity pattern, service, and parameters JSON are required.`);
        return;
      }

      let parameters;
      try {
        parameters = JSON.parse(parametersText);
      } catch (error) {
        errors.push(`Block ${index + 1}: ${error.message}`);
        return;
      }

      if (!Array.isArray(parameters)) {
        errors.push(`Block ${index + 1}: parameters JSON must be an array.`);
        return;
      }

      const invalidParameterIndex = parameters.findIndex(parameter => (
        !parameter ||
        typeof parameter !== "object" ||
        Array.isArray(parameter) ||
        !String(parameter.label || "").trim() ||
        !String(parameter.value || "").trim()
      ));

      if (invalidParameterIndex !== -1) {
        errors.push(`Block ${index + 1}: parameter ${invalidParameterIndex + 1} needs label and value.`);
        return;
      }

      const pattern = `${entityPattern}|${service}`;
      nextValue[pattern] = parameters;
    });

    return { value: nextValue, error: errors.join(" ") };
  }

  _setCustomCommonServiceRows(rows) {
    this._customCommonServiceRows = rows;
    const result = this._buildCustomCommonServiceDataKeys(rows);
    this._customCommonServiceDataKeysError = result.error;

    if (!result.error) {
      this._setConfigValue("custom_common_service_data_keys", result.value);
    }
  }

  _buildPrefillServiceData(rows) {
    const nextValue = {};
    const errors = [];

    rows.forEach((row, index) => {
      const entityPattern = String(row.entityPattern || "").trim();
      const service = String(row.service || "").trim();
      const prefillText = String(row.prefillText || "").trim();
      const isBlank = !entityPattern && !service && !prefillText;

      if (isBlank) {
        return;
      }

      if (!entityPattern || !service || !prefillText) {
        errors.push(`Block ${index + 1}: entity pattern, service, and prefill JSON are required.`);
        return;
      }

      let prefill;
      try {
        prefill = JSON.parse(prefillText);
      } catch (error) {
        errors.push(`Block ${index + 1}: ${error.message}`);
        return;
      }

      if (!prefill || typeof prefill !== "object" || Array.isArray(prefill)) {
        errors.push(`Block ${index + 1}: prefill JSON must be an object.`);
        return;
      }

      nextValue[`${entityPattern}|${service}`] = this._formatInlineJson(prefill);
    });

    return { value: nextValue, error: errors.join(" ") };
  }

  _setPrefillServiceRows(rows) {
    this._prefillServiceRows = rows;
    const result = this._buildPrefillServiceData(rows);
    this._prefillServiceDataError = result.error;

    if (!result.error) {
      this._setConfigValue("prefill_service_data", result.value);
    }
  }

  _onCustomCommonServiceRowChanged(index, key, value) {
    const rows = this._customCommonServiceRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    ));
    this._setCustomCommonServiceRows(rows);
  }

  _onPrefillServiceRowChanged(index, key, value) {
    const rows = this._prefillServiceRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    ));
    this._setPrefillServiceRows(rows);
  }

  _addCustomCommonServiceRow() {
    this._customCommonServiceRows = [
      ...this._customCommonServiceRows,
      {
        entityPattern: "",
        service: "",
        parametersText: '[{"label":"","value":"","default":""}]'
      }
    ];
  }

  _addPrefillServiceRow() {
    this._prefillServiceRows = [
      ...this._prefillServiceRows,
      {
        entityPattern: "",
        service: "",
        prefillText: "{}"
      }
    ];
  }

  _removeCustomCommonServiceRow(index) {
    this._setCustomCommonServiceRows(
      this._customCommonServiceRows.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  _removePrefillServiceRow(index) {
    this._setPrefillServiceRows(
      this._prefillServiceRows.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  _exportCustomCommonServiceJson() {
    const result = this._buildCustomCommonServiceDataKeys(this._customCommonServiceRows);
    this._customCommonServiceDataKeysError = result.error;

    if (result.error) {
      this._customCommonServiceFileStatus = "";
      return;
    }

    const json = JSON.stringify(result.value, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `event2action_service_parameters_${timestamp}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    this._customCommonServiceFileStatus = `Exported ${filename}.`;
  }

  _importCustomCommonServiceJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const value = JSON.parse(text);
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new Error("Expected a JSON object keyed by entity/service patterns.");
        }

        const rows = this._customCommonServiceDataKeysToRows(value);
        const result = this._buildCustomCommonServiceDataKeys(rows);

        if (result.error) {
          throw new Error(result.error);
        }

        this._customCommonServiceFileStatus = `Imported ${file.name}.`;
        this._setCustomCommonServiceRows(rows);
      } catch (error) {
        this._customCommonServiceFileStatus = "";
        this._customCommonServiceDataKeysError = error.message;
      }
    };

    input.click();
  }

  _exportPrefillServiceJson() {
    const result = this._buildPrefillServiceData(this._prefillServiceRows);
    this._prefillServiceDataError = result.error;

    if (result.error) {
      this._prefillServiceFileStatus = "";
      return;
    }

    const json = JSON.stringify(result.value, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `event2action_prefill_service_data_${timestamp}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    this._prefillServiceFileStatus = `Exported ${filename}.`;
  }

  _importPrefillServiceJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const value = JSON.parse(text);
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new Error("Expected a JSON object keyed by entity/service patterns.");
        }

        const rows = this._prefillServiceDataToRows(value);
        const result = this._buildPrefillServiceData(rows);

        if (result.error) {
          throw new Error(result.error);
        }

        this._prefillServiceFileStatus = `Imported ${file.name}.`;
        this._setPrefillServiceRows(rows);
      } catch (error) {
        this._prefillServiceFileStatus = "";
        this._prefillServiceDataError = error.message;
      }
    };

    input.click();
  }

  _renderCustomCommonServiceDataTable(rows) {
    return html`
      <div class="combo-list">
        ${rows.length ? rows.map((row, index) => html`
          <div class="combo-block">
            <div class="combo-head">
              <label class="combo-field">
                <span>Entity pattern</span>
                <input
                  type="text"
                  placeholder="*dimmer_control"
                  .value=${row.entityPattern || ""}
                  @input=${event => this._onCustomCommonServiceRowChanged(index, "entityPattern", event.target.value)}
                  aria-label="Entity pattern"
                />
              </label>
              <label class="combo-field">
                <span>Service pattern</span>
                <input
                  type="text"
                  placeholder="script.*"
                  .value=${row.service || ""}
                  @input=${event => this._onCustomCommonServiceRowChanged(index, "service", event.target.value)}
                  aria-label="Service pattern"
                />
              </label>
            </div>
            <label class="combo-body combo-field">
              <span>Parameters JSON</span>
              <textarea
                rows="3"
                placeholder='[{"label":"steps","value":"steps","default":5}]'
                .value=${row.parametersText || ""}
                @input=${event => this._onCustomCommonServiceRowChanged(index, "parametersText", event.target.value)}
                aria-label="Parameters JSON array"
              ></textarea>
            </label>
            <button
              type="button"
              class="icon-button"
              title="Remove service parameter block"
              @click=${() => this._removeCustomCommonServiceRow(index)}
            >x</button>
          </div>
        `) : html`
          <div class="empty-table">No custom parameters configured.</div>
        `}
      </div>

      <div class="config-actions">
        <button
          type="button"
          @click=${() => this._addCustomCommonServiceRow()}
        >
          Add
        </button>
        <button
          type="button"
          @click=${() => this._exportCustomCommonServiceJson()}
        >
          Export JSON
        </button>
        <button
          type="button"
          @click=${() => this._importCustomCommonServiceJson()}
        >
          Import JSON
        </button>
      </div>
      ${this._customCommonServiceFileStatus
        ? html`<small>${this._customCommonServiceFileStatus}</small>`
        : null}
    `;
  }

  _renderPrefillServiceDataTable(rows) {
    return html`
      <div class="combo-list">
        ${rows.length ? rows.map((row, index) => html`
          <div class="combo-block">
            <div class="combo-head">
              <label class="combo-field">
                <span>Entity pattern</span>
                <input
                  type="text"
                  placeholder="*dimmer_control"
                  .value=${row.entityPattern || ""}
                  @input=${event => this._onPrefillServiceRowChanged(index, "entityPattern", event.target.value)}
                  aria-label="Prefill entity pattern"
                />
              </label>
              <label class="combo-field">
                <span>Service pattern</span>
                <input
                  type="text"
                  placeholder="script.*"
                  .value=${row.service || ""}
                  @input=${event => this._onPrefillServiceRowChanged(index, "service", event.target.value)}
                  aria-label="Prefill service pattern"
                />
              </label>
            </div>
            <label class="combo-body combo-field">
              <span>Prefill JSON</span>
              <textarea
                rows="3"
                placeholder='{"steps":5,"bounce_at_top":false}'
                .value=${row.prefillText || ""}
                @input=${event => this._onPrefillServiceRowChanged(index, "prefillText", event.target.value)}
                aria-label="Prefill JSON object"
              ></textarea>
            </label>
            <button
              type="button"
              class="icon-button"
              title="Remove prefill block"
              @click=${() => this._removePrefillServiceRow(index)}
            >x</button>
          </div>
        `) : html`
          <div class="empty-table">No prefill data configured.</div>
        `}
      </div>

      <div class="config-actions">
        <button
          type="button"
          @click=${() => this._addPrefillServiceRow()}
        >
          Add
        </button>
        <button
          type="button"
          @click=${() => this._exportPrefillServiceJson()}
        >
          Export JSON
        </button>
        <button
          type="button"
          @click=${() => this._importPrefillServiceJson()}
        >
          Import JSON
        </button>
      </div>
      ${this._prefillServiceFileStatus
        ? html`<small>${this._prefillServiceFileStatus}</small>`
        : null}
    `;
  }

  _onJsonChanged(key, textKey, errorKey, event) {
    const text = event.target.value;
    this[textKey] = text;

    try {
      const parsed = JSON.parse(text || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Expected a JSON object");
      }
      this[errorKey] = "";
      this._setConfigValue(key, parsed);
    } catch (error) {
      this[errorKey] = error.message;
    }
  }

  _renderSwitch(checked, onChange) {
    if (customElements.get("ha-switch")) {
      return html`
        <ha-switch
          .checked=${checked}
          @change=${onChange}>
        </ha-switch>
      `;
    }

    return html`
      <input
        type="checkbox"
        .checked=${checked}
        @change=${onChange}
      />
    `;
  }

  render() {
    const config = {
      ...DEFAULT_CONFIG,
      ...(this.config || {})
    };

    return html`
      <div class="editor">
        <label class="field">
          <span>Entity domains</span>
          ${this._renderDomainSelector(config.entity_domain_list)}
          <small>Entity domains shown by the target entity selector.</small>
        </label>

        <div class="field">
          <span>Custom common service data keys</span>
          ${this._renderCustomCommonServiceDataTable(this._customCommonServiceRows)}
          <small>Each block is one entity/service match. Entity and service support wildcards, for example <code>*dimmer_control</code> and <code>script.*</code>. Parameters must be a JSON array.</small>
          ${this._customCommonServiceDataKeysError
            ? html`<div class="error">${this._customCommonServiceDataKeysError}</div>`
            : null}
        </div>

        <div class="field">
          <span>Prefill service data</span>
          ${this._renderPrefillServiceDataTable(this._prefillServiceRows)}
          <small>Each block is one entity/service match. Entity and service support wildcards. Prefill JSON must be an object and is stored in the config as the matching JSON string.</small>
          ${this._prefillServiceDataError
            ? html`<div class="error">${this._prefillServiceDataError}</div>`
            : null}
        </div>

        <div class="field switch-row">
          <span>
            <span>Auto unblock</span>
            <small>Unblock Event2Action automatically when leaving the card.</small>
          </span>
          ${this._renderSwitch(
            config.auto_unblock !== false,
            event => this._setConfigValue("auto_unblock", event.target.checked)
          )}
        </div>

        <label class="field">
          <span>Log level</span>
          <select
            .value=${String(config.log_level ?? LOG_LEVEL)}
            @change=${event => this._setConfigValue("log_level", Number(event.target.value))}
          >
            <option value="0">0 - off</option>
            <option value="1">1 - errors</option>
            <option value="2">2 - warnings</option>
            <option value="3">3 - info</option>
            <option value="4">4 - debug</option>
          </select>
        </label>
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: grid;
      gap: 16px;
    }

    .field {
      display: grid;
      gap: 6px;
    }

    .field > span,
    .switch-row > span > span {
      font-weight: 500;
    }

    input,
    select,
    textarea {
      box-sizing: border-box;
      width: 100%;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
      font: inherit;
    }

    textarea {
      font-family: var(--code-font-family, monospace);
      resize: vertical;
    }

    button {
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px 10px;
      font: inherit;
      cursor: pointer;
    }

    button:hover {
      background: var(--secondary-background-color);
    }

    .combo-list {
      display: grid;
      gap: 10px;
    }

    .combo-block {
      display: grid;
      grid-template-columns: 1fr 36px;
      gap: 8px;
      align-items: start;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }

    .combo-head,
    .combo-body {
      grid-column: 1;
    }

    .combo-field {
      display: grid;
      gap: 4px;
    }

    .combo-field > span {
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .combo-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 8px;
    }

    .combo-body textarea {
      min-height: 76px;
    }

    .config-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .config-actions button {
      flex: 1 1 90px;
      white-space: nowrap;
    }

    .config-actions button:first-child {
      flex-grow: 0;
    }

    .add-row-button {
      justify-self: start;
    }

    .icon-button {
      grid-column: 2;
      grid-row: 1 / span 2;
      width: 36px;
      min-height: 36px;
      padding: 0;
      font-size: 18px;
      line-height: 1;
    }

    .empty-table {
      color: var(--secondary-text-color);
      border: 1px dashed var(--divider-color);
      border-radius: 4px;
      padding: 12px;
    }

    @media (max-width: 600px) {
      .combo-head {
        grid-template-columns: 1fr;
      }
    }

    small {
      color: var(--secondary-text-color);
      line-height: 1.35;
    }

    .switch-row {
      grid-template-columns: 1fr auto;
      align-items: center;
    }

    .error {
      color: var(--error-color);
      font-size: 12px;
    }
  `;
}

if (!customElements.get("event2action-learning-card-editor")) {
  customElements.define("event2action-learning-card-editor", Event2ActionLearningCardEditor);
}
