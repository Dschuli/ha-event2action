import { css } from "lit";

export const e2aLayout = css`
  .row {
    margin-bottom: var(--e2a-gap-md);
  }

  .row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--e2a-gap-md);
    margin-bottom: var(--e2a-gap-md);
  }

  .row-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--e2a-gap-md);
    margin-bottom: var(--e2a-gap-md);
  }

  .row-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--e2a-gap, 12px);
    margin-bottom: var(--e2a-row-margin, 12px);
  }

  .row-1-3 {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: var(--e2a-gap, 12px);
    margin-bottom: var(--e2a-row-margin, 12px);
  }

  .row-1-2-1 {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: var(--e2a-gap, 12px);
    margin-bottom: var(--e2a-row-margin, 12px);
  }

  .buttons {
    display: flex;
    justify-content: space-between;
    gap: var(--e2a-gap-md);
    margin-top: var(--e2a-gap-lg);
  }

  .no_vert_margin {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .hidden {
    display: none !important;
  }

  .flex_align {
    display: flex;
    align-items: center;
    gap: var(--e2a-gap, 12px);
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .row-4 {
      grid-template-columns: repeat(2, 1fr);
    }

    .row-3 {
      grid-template-columns: 1fr 1fr;
    }

    .row-1-2-1 {
      grid-template-columns: 1fr;
    }

    .flex_align {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .row-4,
    .row-3,
    .row-2 {
      grid-template-columns: 1fr;
    }

    .row-1-3 {
      grid-template-columns: 1fr;
    }

    .buttons {
      flex-direction: column;
    }

    .flex_align {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;
