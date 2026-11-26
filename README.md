# Event2Action

### Learn and map any button or event to Home Assistant actions

Event2Action is the missing **button-learning layer for Home Assistant**. Use its visual learning interface to map **RF433 and IR remotes, Zigbee buttons, MQTT and ESPHome events**, or virtually any other Home Assistant event to actions—without creating a separate automation for every button.

<table>
  <tr>
    <td><img src="pictures/e2a-editor-learning-mode.png" alt="Event2Action learning mode with an active mapping editor" /></td>
  </tr>
</table>

- ✅ Reuse old RF433 and IR remotes
- ✅ Map Zigbee buttons and scene switches
- ✅ Connect MQTT, ESPHome, and custom events
- ✅ Control lights, plugs, scenes, scripts, and automations
- ✅ Keep everything local, with no cloud dependency

> **Integration migration:** This branch replaces the YAML/MQTT runtime with a bundled custom integration. Export your old map before upgrading and follow the migration steps below. Local tests pass; validation in a running Home Assistant instance is still required.

> **Legacy status:** Event2Action is stable in my daily Home Assistant installation and has been running reliably for several months. The configuration UI and setup process are still evolving, so feedback and issue reports are welcome.

## Why Event2Action?

- **Reuse existing remotes (RF433, IR etc)** from Intertechno, Elro, Brennenstuhl, A-Trust, and similar systems to control modern Home Assistant devices
- **Keep familiar physical controls** for household members who prefer old-school remotes over apps, dashboards, or voice control
- **Turn simple remote buttons into generic Home Assistant triggers** for lights, plugs, scenes, scripts, and automations
- **Works locally** with no cloud dependency once Home Assistant and your event source are running
- **One button, multiple possibilities**: trigger scenes, scripts, or complex automations from a single press
- **One central automation flow** handles incoming events through normalized event adapters
- **Cost-effective**: repurpose existing remotes instead of buying new smart buttons

## Map a Button in 30 Seconds

1. Enable learning mode.
2. Press a button or fire an event.
3. Select a Home Assistant entity and action.
4. Save the mapping.
5. Press the button again—done.

## Supported Event Sources

| Event source | Support |
|---|---|
| RF433 remotes and wall switches via ESPHome | ✅ Built-in adapter |
| Zigbee buttons and scene switches via ZHA | ✅ Built-in adapter |
| Zigbee buttons and scene switches via Zigbee2MQTT | [Example YAML code provided](examples/adapters/zigbee2mqtt-event-adapter.yaml) |
| Other MQTT messages | Custom adapter required |
| ESPHome custom events | Custom adapter required |
| IR receivers | Custom adapter required (depends on receiver/event format) |
| Other Home Assistant events | Custom adapter required |

**Built-in adapter** means no additional automation is needed. **Example YAML code provided** means copy the supplied automation and set its device-specific values. **Custom adapter required** means adapt the [generic template](examples/adapters/custom-event-adapter.yaml) or write an automation for your source's payload. These are setup requirements, not different processing modes: every adapter sends the same normalized `event2action_bus` event. Examples are not automatically installed or hardware-verified for every device.

A **custom event adapter** can be a simple Home Assistant automation that converts a source event into Event2Action's normalized format. The integration includes adapters for `esphome.rf433` and `zha_event`. Custom adapters can still fire `event2action_bus` from UI/YAML automations without Python code.

Start with the inactive [YAML adapter template](examples/adapters/custom-event-adapter.yaml) and its [setup and optional-feature guide](examples/adapters/README.md). It shows an incoming event, payload-to-code transformation, and outgoing bus event. The integration does not load or activate the example.

In Home Assistant, select **Adapter examples** in the Event2Action sidebar page header to open the guide and YAML examples on GitHub in a new tab.

A disabled [working ZHA YAML example](examples/adapters/zha-event-adapter.yaml) demonstrates the same structure with real Zigbee/ZHA payloads and matches the built-in normalization. Keep it disabled alongside the integration's built-in ZHA adapter.

The disabled [ESPHome RF433 YAML example](examples/adapters/esphome-rf433-event-adapter.yaml) shows `esphome.rf433` normalization, protocol fallback, and field defaults. Keep it disabled alongside the built-in RF433 adapter.

For Zigbee2MQTT, use the [copy-and-edit YAML automation](examples/adapters/zigbee2mqtt-event-adapter.yaml): enable `mqtt.include_device_information: true` in Zigbee2MQTT, enter only the remote's exact MQTT topic in the automation, then enable it. The adapter reads the IEEE address from `device.ieeeAddr` automatically. It handles all nonempty JSON `action` values without a per-button list. MQTT is used only for incoming events; map storage stays in HA. See the [adapter guide](examples/adapters/README.md#zigbee2mqtt-remote-example) for prerequisites and retained-message handling.

Need an adapter for another event source? The author offers help creating additional adapters. [Open a GitHub issue](https://github.com/Dschuli/ha-event2action/issues/new) with your event source/device, incoming event type, and an example payload with sensitive information removed.

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Minimal setup path
- **[e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md)** - Detailed editor features and usage

## Features

- **Event2Action runtime**: one central bus handler executes mapped Home Assistant actions
- **RF433 event adapter**: normalizes `esphome.rf433` events into the shared `event2action_bus`
- **ZHA event adapter**: normalizes `zha_event` button payloads into the same bus
- **Learning mode**: interactively learn and map incoming event codes
- **Visual editor**: create and edit mappings without hand-editing JSON
- **Friendly names**: optionally assign a unique human-readable name to a mapping for organization and future functionality
- **Backup and undo**: session and step-level backups
- **Import/export**: save and restore mappings as JSON
- **Event blocking**: temporarily suppress action execution while learning
- **Home Assistant storage**: maps and undo backups are stored locally through the HA Store API, with no MQTT dependency

## How It Works

Event adapters translate source-specific payloads into a stable protocol/code pair and fire the shared `event2action_bus` event. The learning card captures that normalized event and stores its action mapping. The central bus handler then executes the mapped Home Assistant action whenever the event occurs again.

For example, the built-in ZHA adapter uses `zha` as the protocol and derives a distinctive code from the device's full IEEE address, endpoint, and command (such as press, double press, or long press). Use it as a template for IR receivers, MQTT devices, NFC scans, doorbells, BLE buttons, or other event sources.

## Requirements

- Home Assistant 2026.11 or newer
- Administrator access to configure Event2Action and edit maps
- Modern web browser for the Lovelace card
- At least one event source:
  - RF433 source that fires Home Assistant events named `esphome.rf433`
  - Zigbee devices using ZHA, which emit `zha_event`

## Installation

Event2Action is now an integration with a bundled card. Do not install the old YAML package or a separate copy of the card.

1. For this development version, copy `custom_components/event2action/` (including its `frontend/` folder) into `/config/custom_components/event2action/`.
2. Restart Home Assistant.
3. Open **Settings → Devices & services → Add integration → Event2Action** and complete setup.
4. Reload the browser. The integration automatically loads the bundled card; no dashboard resource entry is required. Its `brand/` folder supplies the integration icon.
5. Open **Event2Action** in the sidebar. Its full-page learning interface is created automatically; no dashboard view is required.

Optionally, add the card to a dashboard if you want a separate view or custom card configuration:

```yaml
type: custom:event2action-learning-card
```

The automatic sidebar page uses default card options; existing dashboard cards retain their own configuration. Use a dedicated panel view for a customized dashboard card if desired. The integration runs independently of whether its card is open. The card's storage/learning API requires an administrator account.

For HACS/Marketplace, this repository must be installed as an **Integration**, rather than Dashboard. Its existing dashboard catalog listing does not change category automatically; publisher/catalog changes remain necessary. Manual installation above works independently of that listing.

### Upgrade from the YAML/MQTT version

1. Export the current map to JSON using the old card. Keep that file and any custom dashboard card configuration. A Home Assistant backup is recommended.
2. Remove `/config/packages/event2action.yaml` from the packages include and remove the old standalone card installation and resource reference.
3. Restart Home Assistant to stop the old runtime **before** installing the integration.
4. Install and set up the integration as above, then use **Import Map**. Verify the mapping count and test representative buttons.

**Old session and step backups do not transfer. Blocking duration starts at 60 seconds.** New undo history is created by the integration. Learning starts off with no active block. Keep the original export for rollback.

Keep MQTT if other integrations use it, and keep the package include if other packages use it. External automations that reference old helpers or `script.temporary_toggle` need updating. Custom adapters firing `event2action_bus` continue to work.

For rollback, disable/remove the integration and restart first, restore the previous package/card version and resource, restart, and import your original JSON if needed. This restores the exported snapshot, not subsequent edits.

### Storage

Maps, settings, and fresh undo snapshots are stored in `/config/.storage/event2action.maps` through Home Assistant's versioned Store API. Do not edit this file manually. Maps are loaded into memory at setup; button presses do not access disk. Saves are acknowledged only after disk verification. JSON export/import remains the portable backup path.

When several entries share the same protocol and code, the first active entry in map order executes. Inactive entries are skipped; if none are active, no action runs.

Repeated events mapped to the same toggle action within the configured interval (500 ms by default) are ignored for action execution, preventing radio repeats from toggling a device on and immediately off. The window uses event arrival time and does not delay other mappings. Repeated events remain visible for learning; non-toggle actions are unaffected.

### Shared learning and blocking

Learning mode and event blocking are shared across all Event2Action cards, including the sidebar page and dashboard views. Switching views keeps both states in sync. A learning session captures its backup once, even when multiple cards are open. Unsaved editor drafts remain local to each card; save before changing views. Learning starts off after an HA restart.

With **Auto unblock** enabled on the last card to disconnect, the backend unblocks after a 3-second grace period if no card reconnects. Switching to another Event2Action view during that period preserves the block. Closing one of several cards does not unblock the others; the configured blocking timer still expires normally.

### Runtime settings

**Show in sidebar** is enabled by default. Turn it off under **Settings → Devices & services → Event2Action → Configure** to hide the sidebar entry immediately. The integration keeps running, existing dashboard cards keep working, and administrators can still open `/event2action-learning` directly.

Open **Settings → Devices & services → Event2Action → Configure** to set **Toggle repeat suppression (ms)**. The default is **500**; **0** disables suppression. Changes apply immediately without a restart. The option is stored with the integration configuration, separately from map JSON exports.

## Event Source Expectations

### RF433

The RF433 event adapter expects events named `esphome.rf433` with data similar to:

```json
{
  "protocol": 1,
  "code": "1234567",
  "command": "A"
}
```

`protocol` may also be provided as `proto`. The adapter normalizes these fields into `device_ieee`, `proto`, `code`, `command`, `source`, and `origin_event_type`.

### ZHA

The ZHA event adapter listens for `zha_event` and derives a stable code from the full device IEEE address (with `:` or `-` separators removed), endpoint, and command. It supports short, double, and long press style commands. Because this format replaces the earlier shortened IEEE suffix, existing ZHA mappings created with the old format must be migrated or learned again.

### Migrating from v0.1.3-beta

Use the standalone migration tool for existing v0.1.3-beta maps. See [migration/README.md](migration/README.md) for the procedure. The migration utility is separate from the card UI and produces a new JSON file for review and import.

## Usage

1. Enable learning mode in the Event2Action card.
2. Press a button or fire a test event.
3. Optionally enter a unique Friendly name, intended to support future functionality enhancements.
4. Pick the target entity and service.
5. Save the mapping.
6. Disable learning mode and test the button.

For detailed editor behavior, backup/restore, import/export, and service data examples, see [e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md).

### Optional Script Targets

Event2Action can call any Home Assistant script. For example, the RF433 sniffer project [`Dschuli/rf433-esphome-sniffer`](https://github.com/Dschuli/rf433-esphome-sniffer) includes dimmer-control support that can provide a `script.dimmer_control` service target for handheld remote dimming. In that setup, map a learned button to `script.turn_on`, target `script.dimmer_control`, and pass service data such as:

```json
{
  "light_entity": "light.living_room",
  "steps": 5,
  "bounce_at_top": false
}
```

That script is not bundled here; this repository only stores and executes the mapping.

## Testing Without Hardware

Open Home Assistant Developer Tools -> Events and fire an `esphome.rf433` event:

```json
{
  "protocol": 1,
  "code": "111111111",
  "command": "test"
}
```

This exercises the RF433 event adapter and the shared runtime flow without requiring a physical RF source.

## Configuration

Open the dashboard card configuration editor to customize the user-facing options:

- Supported entity domains
- Custom common service data dropdown entries
- Prefilled service data by entity/service pattern for custom entities, e.g. scripts
- Auto-unblock behavior
- Logging level

Example YAML:

```yaml
type: custom:event2action-learning-card
entity_domain_list:
  - switch
  - light
  - cover
  - script
  - automation
auto_unblock: true
log_level: 2
custom_common_service_data_keys:
  "*dimmer_control|script.turn_on":
    - label: light_entity
      value: light_entity
      default: ""
prefill_service_data:
  "*dimmer_control|script.turn_on": '{"light_entity":" ","steps":5,"bounce_at_top":false}'
```

The card editor groups **Custom common service data keys** and **Prefill service data** into collapsible sections. Both start collapsed and remember their expanded state in the same browser.

Card options remain in dashboard configuration. The runtime blocking duration is stored by the integration. No MQTT topics or helper sensor names need configuring.

## Troubleshooting

- **Integration unavailable:** confirm Event2Action is configured under Devices & services, use an administrator account, and reload the browser after setup.
- **Card missing or old UI:** remove old `/hacsfiles/` or `/local/` Event2Action resource references, then refresh the browser. The integration serves `/event2action/event2action-learning-card.js` automatically.
- **No events:** listen for `event2action_bus` in Developer Tools and test `esphome.rf433` or `zha_event`. Custom adapters must supply stable string `proto` and `code` values.
- **No action:** check the map entry is active, the target/service exists, and events are unblocked. Review Home Assistant logs for Event2Action errors.
- **Import rejected:** the error identifies the entry and field. Proto/code must be nonempty strings; active entries need valid target/service fields, and service data must be an object. Older v0.1.3-beta maps require the separate conversion tool.
- **Save failed:** the previous map remains active. Check storage permissions/free space. Keep the draft and retry after resolving the error.
- **Another session changed the map:** reload the card and review the newer data before saving.

## Development and project structure

```text
custom_components/event2action/   # Integration, runtime, Store, API, bundled frontend
src/                              # Card and editor source
legacy/event2action.yaml           # Old package, rollback reference only
migration/                        # Older mapping-format conversion utility
tests/                            # Runtime/storage and frontend boundary tests
docs/runtime-compatibility.md      # Legacy behavior baseline and acceptance cases
```

Run `npm run build` to rebuild `dist/` and the integration's `frontend/` copy together. Run `npm test` for focused tests. These use Home Assistant boundary doubles; a real HA installation is still required for integration setup, frontend registration, permissions, restart, and migration smoke testing.

## Acknowledgments

- Home Assistant community for inspiration and support
- All contributors and users of this project
- AI-assisted tools were used to support the coding, documentation, and review process. All resulting changes were reviewed and tested by the project maintainer.

## License

This project is open source and available under the MIT License.
