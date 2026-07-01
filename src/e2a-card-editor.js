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
    _prefillServiceDataText: { state: true },
    _customCommonServiceDataKeysError: { state: true },
    _prefillServiceDataError: { state: true }
  };

  constructor() {
    super();
    this.config = {};
    this._customCommonServiceRows = this._customCommonServiceDataKeysToRows(DEFAULT_CONFIG.custom_common_service_data_keys);
    this._prefillServiceDataText = this._formatJson(DEFAULT_CONFIG.prefill_service_data);
    this._customCommonServiceDataKeysError = "";
    this._prefillServiceDataError = "";
  }

  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...(config || {})
    };
    this._customCommonServiceRows = this._customCommonServiceDataKeysToRows(this.config.custom_common_service_data_keys);
    this._prefillServiceDataText = this._formatJson(this.config.prefill_service_data);
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

    return Object.entries(value).flatMap(([pattern, parameters]) => {
      const [entityPattern, service] = this._splitEntityServicePattern(pattern);
      const parameterList = Array.isArray(parameters) ? parameters : [];

      return parameterList.map(parameter => ({
        entityPattern,
        service,
        parameterText: this._formatInlineJson(parameter && typeof parameter === "object" ? parameter : {})
      }));
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

  _getAvailableServices(selectedService = "") {
    const services = new Set();

    Object.entries(this.hass?.services || {}).forEach(([domain, domainServices]) => {
      Object.keys(domainServices || {}).forEach(service => {
        services.add(`${domain}.${service}`);
      });
    });

    if (selectedService) {
      services.add(selectedService);
    }

    return Array.from(services).sort((a, b) => a.localeCompare(b));
  }

  _buildCustomCommonServiceDataKeys(rows) {
    const nextValue = {};
    const errors = [];

    rows.forEach((row, index) => {
      const entityPattern = String(row.entityPattern || "").trim();
      const service = String(row.service || "").trim();
      const parameterText = String(row.parameterText || "").trim();
      const isBlank = !entityPattern && !service && !parameterText;

      if (isBlank) {
        return;
      }

      if (!entityPattern || !service || !parameterText) {
        errors.push(`Row ${index + 1}: entity pattern, service, and parameter JSON are required.`);
        return;
      }

      let parameter;
      try {
        parameter = JSON.parse(parameterText);
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
        return;
      }

      if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) {
        errors.push(`Row ${index + 1}: parameter JSON must be an object.`);
        return;
      }

      if (!String(parameter.label || "").trim() || !String(parameter.value || "").trim()) {
        errors.push(`Row ${index + 1}: parameter JSON needs label and value.`);
        return;
      }

      const pattern = `${entityPattern}|${service}`;
      nextValue[pattern] = [
        ...(nextValue[pattern] || []),
        parameter
      ];
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

  _onCustomCommonServiceRowChanged(index, key, value) {
    const rows = this._customCommonServiceRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    ));
    this._setCustomCommonServiceRows(rows);
  }

  _addCustomCommonServiceRow() {
    this._customCommonServiceRows = [
      ...this._customCommonServiceRows,
      {
        entityPattern: "",
        service: "",
        parameterText: '{"label":"","value":"","default":""}'
      }
    ];
  }

  _removeCustomCommonServiceRow(index) {
    this._setCustomCommonServiceRows(
      this._customCommonServiceRows.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  _renderServiceSelector(row, index) {
    const options = this._getAvailableServices(row.service).map(service => ({
      value: service,
      label: service
    }));

    if (customElements.get("ha-selector")) {
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{
          select: {
            options,
            custom_value: true,
            mode: "dropdown"
          }
        }}
          .value=${row.service || ""}
          @value-changed=${event => this._onCustomCommonServiceRowChanged(index, "service", event.detail?.value || "")}
        ></ha-selector>
      `;
    }

    return html`
      <input
        type="text"
        list="event2action-service-list"
        placeholder="script.turn_on"
        .value=${row.service || ""}
        @input=${event => this._onCustomCommonServiceRowChanged(index, "service", event.target.value)}
      />
    `;
  }

  _renderCustomCommonServiceDataTable(rows) {
    const serviceOptions = this._getAvailableServices();

    return html`
      ${serviceOptions.length ? html`
        <datalist id="event2action-service-list">
          ${serviceOptions.map(service => html`<option value=${service}></option>`)}
        </datalist>
      ` : null}

      <div class="editable-table" role="table" aria-label="Custom common service data keys">
        <div class="table-row table-head" role="row">
          <span role="columnheader">Entity pattern</span>
          <span role="columnheader">Service</span>
          <span role="columnheader">Parameter JSON</span>
          <span role="columnheader">Actions</span>
        </div>

        ${rows.length ? rows.map((row, index) => html`
          <div class="table-row" role="row">
            <input
              type="text"
              placeholder="*dimmer_control"
              .value=${row.entityPattern || ""}
              @input=${event => this._onCustomCommonServiceRowChanged(index, "entityPattern", event.target.value)}
              aria-label="Entity pattern"
            />
            ${this._renderServiceSelector(row, index)}
            <textarea
              rows="2"
              placeholder='{"label":"steps","value":"steps","default":5}'
              .value=${row.parameterText || ""}
              @input=${event => this._onCustomCommonServiceRowChanged(index, "parameterText", event.target.value)}
              aria-label="Parameter JSON"
            ></textarea>
            <button
              type="button"
              class="icon-button"
              title="Remove parameter"
              @click=${() => this._removeCustomCommonServiceRow(index)}
            >x</button>
          </div>
        `) : html`
          <div class="empty-table">No custom parameters configured.</div>
        `}
      </div>

      <button
        type="button"
        class="add-row-button"
        @click=${() => this._addCustomCommonServiceRow()}
      >
        Add parameter
      </button>
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
          <small>Each row becomes one common parameter for an entity pattern and service. Entity patterns may use wildcards, for example <code>*dimmer_control</code>.</small>
          ${this._customCommonServiceDataKeysError
            ? html`<div class="error">${this._customCommonServiceDataKeysError}</div>`
            : null}
        </div>

        <label class="field">
          <span>Prefill service data</span>
          <textarea
            rows="8"
            .value=${this._prefillServiceDataText}
            @input=${event => this._onJsonChanged(
              "prefill_service_data",
              "_prefillServiceDataText",
              "_prefillServiceDataError",
              event
            )}
          ></textarea>
          <small>JSON object keyed by entity/service patterns. Values are inserted into the service data field.</small>
          ${this._prefillServiceDataError
            ? html`<div class="error">${this._prefillServiceDataError}</div>`
            : null}
        </label>

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

    .editable-table {
      display: grid;
      gap: 8px;
      overflow-x: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: minmax(150px, 1fr) minmax(170px, 1fr) minmax(230px, 1.5fr) 44px;
      gap: 8px;
      align-items: start;
      min-width: 720px;
    }

    .table-head {
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .icon-button {
      width: 36px;
      min-height: 36px;
      padding: 0;
      font-size: 22px;
      line-height: 1;
    }

    .add-row-button {
      justify-self: start;
    }

    .empty-table {
      color: var(--secondary-text-color);
      border: 1px dashed var(--divider-color);
      border-radius: 4px;
      padding: 12px;
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
