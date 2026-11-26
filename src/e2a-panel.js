import { LitElement, html, css } from "lit";

/** Full-page home for the card, registered automatically by the integration. */
class Event2ActionPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    panel: { attribute: false }
  };

  firstUpdated() {
    this._configureCard();
  }

  updated(changedProps) {
    if (changedProps.has("panel")) this._configureCard();
  }

  _configureCard() {
    this.renderRoot.querySelector("event2action-learning-card")?.setConfig({
      type: "custom:event2action-learning-card",
      ...(this.panel?.config?.card_config || {})
    });
  }

  render() {
    return html`
      <header>
        <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
        <h1>Event2Action</h1>
        <a class="examples-link"
          href="https://github.com/Dschuli/ha-event2action/tree/integration-migration/examples/adapters"
          target="_blank" rel="noopener noreferrer">
          Adapter examples
        </a>
      </header>
      <main>
        <event2action-learning-card .hass=${this.hass}></event2action-learning-card>
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
    .examples-link {
      margin-inline-start: auto;
      padding: 12px 8px;
      color: inherit;
      font-size: 14px;
      text-underline-offset: 3px;
    }
    .examples-link:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
      border-radius: 4px;
    }
    main { padding: 16px; box-sizing: border-box; min-width: 0; }
    event2action-learning-card { display: block; min-width: 0; }
  `;
}

if (!customElements.get("event2action-panel")) {
  customElements.define("event2action-panel", Event2ActionPanel);
}
