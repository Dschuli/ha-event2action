import { css } from "https://unpkg.com/lit@2/index.js?module";

export const e2aTheme = css`
  :host {
    /* ===== Spacing ===== */
    --e2a-gap: 12px;
    --e2a-gap-xxs: 4px;
    --e2a-gap-xs: 6px;
    --e2a-gap-sm: 10px;
    --e2a-gap-md: 12px;
    --e2a-gap-lg: 16px;
    --e2a-gap-xl: 24px;

    --e2a-row-margin: 12px;

    /* =====================
    * ACCENT / BRAND
    * ===================== */
    --e2a-accent: var(--accent-color);
    --e2a-accent-hover: color-mix(in srgb, var(--e2a-accent) 85%, black 15%);
    --e2a-accent-active: color-mix(in srgb, var(--e2a-accent) 70%, transparent);

    /* =====================
    * TEXT
    * ===================== */
    --e2a-text-primary: var(--primary-text-color);
    --e2a-text-secondary: var(--secondary-text-color);
    --e2a-text-muted: var(--disabled-text-color);

    /* =====================
    * BACKGROUNDS
    * ===================== */
    --e2a-bg-card: var(--card-background-color);
    --e2a-bg-primary: var(--primary-background-color);
    --e2a-bg-secondary: var(--secondary-background-color);

    /* =====================
    * HOVER / ACTIVE (HA-style overlays)
    * ===================== */
    --e2a-hover-bg: rgba(var(--rgb-primary-text-color), 0.04);
    --e2a-active-bg: rgba(var(--rgb-primary-text-color), 0.08);
    --e2a-focus-ring: rgba(var(--rgb-accent-color), 0.35);

    /* =====================
    * BORDERS / DIVIDERS
    * ===================== */
    --e2a-border: var(--divider-color);
    --e2a-border-hover: rgba(var(--rgb-primary-text-color), 0.2);
    --e2a-border-radius: 16px;

    /* =====================
    * STATES
    * ===================== */
    --e2a-success: var(--success-color);
    --e2a-warning: var(--warning-color);
    --e2a-error: var(--error-color);
    --e2a-info: var(--info-color);

    /* =====================
    * ICONS
    * ===================== */
    --e2a-icon: var(--icon-color);
    --e2a-icon-active: var(--icon-active-color);
    --e2a-icon-inactive: var(--icon-inactive-color);
  }
`;
