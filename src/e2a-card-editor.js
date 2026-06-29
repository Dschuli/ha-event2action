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
    _customCommonServiceDataKeysText: { state: true },
    _prefillServiceDataText: { state: true },
    _customCommonServiceDataKeysError: { state: true },
    _prefillServiceDataError: { state: true }
  };

  constructor() {
    super();
    this.config = {};
    this._customCommonServiceDataKeysText = this._formatJson(DEFAULT_CONFIG.custom_common_service_data_keys);
    this._prefillServiceDataText = this._formatJson(DEFAULT_CONFIG.prefill_service_data);
    this._customCommonServiceDataKeysError = "";
    this._prefillServiceDataError = "";
  }

  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...(config || {})
    };
    this._customCommonServiceDataKeysText = this._formatJson(this.config.custom_common_service_data_keys);
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

        <label class="field">
          <span>Custom common service data keys</span>
          <textarea
            rows="10"
            .value=${this._customCommonServiceDataKeysText}
            @input=${event => this._onJsonChanged(
              "custom_common_service_data_keys",
              "_customCommonServiceDataKeysText",
              "_customCommonServiceDataKeysError",
              event
            )}
          ></textarea>
          <small>JSON object keyed by entity/service patterns, for example <code>*dimmer_control|script.turn_on</code>.</small>
          ${this._customCommonServiceDataKeysError
            ? html`<div class="error">${this._customCommonServiceDataKeysError}</div>`
            : null}
        </label>

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
