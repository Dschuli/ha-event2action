import { LitElement, html, css } from "lit";
import { renderNavigationLinks } from "./e2a-navigation.js";

const CARD_SETTINGS_COMMAND = "event2action/sidebar_card_config";

/** Full-page home for the card, registered automatically by the integration. */
class Event2ActionPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    panel: { attribute: false },
    _draftConfig: { state: true },
    _settingsError: { state: true },
    _savingSettings: { state: true }
  };

  updated(changedProps) {
    if (changedProps.has("panel") || changedProps.has("hass") && !changedProps.get("hass")) {
      this._configureCard();
    }
    if (this.hass && changedProps.has("hass") &&
        this.hass.connection !== changedProps.get("hass")?.connection) {
      this._loadCardSettings();
    }
  }

  async _loadCardSettings() {
    try {
      this._savedConfig = await this.hass.callWS({ type: CARD_SETTINGS_COMMAND });
      this._configureCard();
    } catch {
      // Keep the panel defaults available if Event2Action is still starting.
    }
  }

  _cardConfig() {
    return {
      type: "custom:event2action-learning-card",
      ...this.panel?.config?.card_config,
      ...this._savedConfig
    };
  }

  _configureCard(config = this._cardConfig()) {
    this.renderRoot.querySelector("event2action-learning-card")?.setConfig(config);
  }

  async _openCardSettings() {
    await this._loadCardSettings();
    const config = this._cardConfig();
    this._draftConfig = config;
    this._settingsError = "";
    await this.updateComplete;
    const editor = this.renderRoot.querySelector("event2action-learning-card-editor");
    editor?.setConfig(config);
    this.renderRoot.querySelector("dialog")?.showModal();
    this.renderRoot.querySelector("#card-settings-title")?.focus();
  }

  async _closeCardSettings() {
    this.renderRoot.querySelector("dialog")?.close();
    this._draftConfig = null;
    await this.updateComplete;
    this.renderRoot.querySelector("#card-settings-button")?.focus();
  }

  async _saveCardSettings() {
    this._savingSettings = true;
    this._settingsError = "";
    try {
      this._savedConfig = await this.hass.callWS({
        type: CARD_SETTINGS_COMMAND,
        config: this._draftConfig
      });
      this._configureCard();
      this._closeCardSettings();
    } catch (err) {
      this._settingsError = err.message || "Home Assistant could not save the card settings.";
    } finally {
      this._savingSettings = false;
    }
  }

  render() {
    return html`
      <header>
        <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
        <h1>Event2Action</h1>
        <nav class="header-links" aria-label="Event2Action links">
          <button type="button" id="card-settings-button"
            @click=${this._openCardSettings} ?disabled=${!!this._draftConfig}>Card settings</button>
          ${renderNavigationLinks()}
        </nav>
      </header>
      <main>
        ${this._draftConfig ? html`
          <dialog aria-labelledby="card-settings-title"
            @cancel=${event => {
              event.preventDefault();
              if (!this._savingSettings) this._closeCardSettings();
            }}>
            <h2 id="card-settings-title" tabindex="-1">Card settings</h2>
            <event2action-learning-card-editor
              .hass=${this.hass}
              @config-changed=${event => { this._draftConfig = event.detail.config; }}
            ></event2action-learning-card-editor>
            ${this._settingsError ? html`<p role="alert">${this._settingsError}</p>` : null}
            <div class="settings-actions">
              <ha-button @click=${this._closeCardSettings} ?disabled=${this._savingSettings}>Cancel</ha-button>
              <ha-button @click=${this._saveCardSettings} ?disabled=${this._savingSettings}>Save</ha-button>
            </div>
          </dialog>
        ` : null}
        <event2action-learning-card .inSidebar=${true} .hass=${this.hass}>
        </event2action-learning-card>
      </main>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      min-height: 56px;
      padding: 0 16px 0 4px;
      color: var(--app-header-text-color, var(--primary-text-color));
      background: var(--app-header-background-color, var(--card-background-color));
    }
    h1 { font-size: 20px; font-weight: 400; margin: 0 12px; }
    .header-links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-inline-start: auto;
    }
    .header-links button {
      appearance: none;
      background: none;
      border: 0;
      font: inherit;
      cursor: pointer;
    }
    .header-links :is(a, button) {
      text-decoration: underline;
      padding: 12px 8px;
      color: inherit;
      font-size: 14px;
      text-underline-offset: 3px;
    }
    .header-links :is(a, button):focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
      border-radius: 4px;
    }
    main { padding: 16px; box-sizing: border-box; min-width: 0; }
    .settings-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    dialog {
      box-sizing: border-box;
      width: min(48rem, calc(100% - 2rem));
      max-height: calc(100dvh - 2rem);
      overflow: auto;
      padding: 20px;
      border: 0;
      border-radius: 12px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
    }
    dialog h2 { margin-top: 0; }
    dialog::backdrop { background: rgb(0 0 0 / 50%); }
    event2action-learning-card { display: block; min-width: 0; }
  `;
}

if (!customElements.get("event2action-panel")) {
  customElements.define("event2action-panel", Event2ActionPanel);
}
