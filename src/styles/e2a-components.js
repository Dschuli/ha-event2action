import { css } from "https://unpkg.com/lit@2/index.js?module";

export const e2aComponents = css`

  ha-textfield {
    --mdc-text-field-height: 36px;
  }

  ha-textfield::part(field) {
    border-radius: 12px !important;
  }

  ha-textfield::part(container) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  ha-textfield::part(label) {
    font-size: 0.85em;
  }

  ha-button.danger {
    --wa-color-brand-fill-loud: var(--e2a-accent);
    --wa-color-brand-border-loud: var(--e2a-accent);
    --button-color-fill-loud-hover:  var(--e2a-accent-hover);
    --wa-color-brand-on-loud: #fff;
  }
`;

