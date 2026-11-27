import { html } from "lit";

export function renderNavigationLinks() {
  return html`
    <a href="/config/integrations/integration/event2action">Integration settings</a>
    <a
      href="https://github.com/Dschuli/ha-event2action/blob/integration-migration/examples/adapters/EXAMPLES_README.md"
      target="_blank" rel="noopener noreferrer">
      Adapter examples
    </a>
  `;
}
