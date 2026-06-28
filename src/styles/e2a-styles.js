import { css } from "lit";

export const e2aStyles = css`

  .content {
    display: flex;
    flex-direction: column;
    column-gap: var(--e2a-gap);
    row-gap: var(--e2a-gap-xxs);
  }

  ha-textfield {
    --mdc-text-field-height: var(--e2a-gap-lg);
  }

  ha-textfield::part(field) {
    border-radius: var(--e2a-gap-md)  !important ;
  }

  ha-textfield::part(container) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  ha-textfield::part(label) {
    font-size: 0.85em;
  }

  .row {
    margin-bottom:var(--e2a-row-margin, 12px);
  }


  .buttons {
    display: flex;
    gap: var(--e2a-gap, 12px) ;
    margin-top: 16px;
  }
`;
