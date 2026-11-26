# Custom event adapter template

[custom-event-adapter.yaml](custom-event-adapter.yaml) is a copy-and-edit example, not an installed automation or a Home Assistant blueprint. The integration never loads this directory. It also declares `initial_state: false`, so a copied automation starts disabled after a restart until explicitly enabled.

The adapter does three things: receives a source event, converts its payload to a stable identity, and fires `event2action_bus`. No Python or MQTT storage is required. RF433 (`esphome.rf433`) and ZHA (`zha_event`) are already handled by the integration; do not add a second adapter for those same events.

Need help creating an adapter for another event source? The author offers help with additional adapters. [Open an issue on the GitHub project](https://github.com/Dschuli/ha-event2action/issues/new) and include the event source/device, incoming event type, and an example event payload with any sensitive information removed.

## Working ZHA reference

[zha-event-adapter.yaml](zha-event-adapter.yaml) applies the same template structure to real `zha_event` payloads. It mirrors the built-in adapter: full IEEE address without separators and in lowercase, endpoint, and command with `remote_button_` removed. For example, `AA:BB:CC:DD:EE:FF:00:11`, endpoint `1`, and `remote_button_short_press` become protocol `zha` and code `aabbccddeeff0011-1-short_press`.

It is reference YAML only, outside active configuration and with `initial_state: false`. Keep it disabled when using the integration's built-in ZHA adapter; even filtering to one device does not prevent duplication for that device. There is currently no option to disable just the built-in ZHA adapter. Use this example to understand the normalization or adapt it for a different source/event type, not as an additional ZHA automation.

## Working ESPHome RF433 reference

For a second concrete example, [esphome-rf433-event-adapter.yaml](esphome-rf433-event-adapter.yaml) mirrors the built-in `esphome.rf433` adapter. It takes `protocol` (or the `proto` fallback) and `code` directly from the payload, preserving existing RF433 match keys. Missing device/code/command default to `"0"`/`"0"`/`""`; a missing protocol fallback defaults to `"unknown"`. Device and command are metadata rather than parts of the code in this adapter. The YAML includes an optional code-validation guard.

The RF433 example is also disabled and not loaded automatically. Do not enable it alongside the built-in RF433 adapter; there is currently no option to disable only that built-in adapter. Its field normalization matches the integration, but its automation queue is merely an example. If you need to make changes, you can use a different event name emitted from the source, which would avoid duplication.

## Create an adapter

1. In Developer Tools → Events, listen to your source event and inspect a real payload.
2. Create a new, empty automation and open its YAML editor. Paste the example as one automation; there is no top-level `automation:` key or list dash.
3. Change the incoming event type, required-field guard, variable transformations, and protocol namespace to fit your source. Give the automation a descriptive name.
4. Save and deliberately enable it for testing. Keep `initial_state: false` while experimenting; remove that line when ready to let Home Assistant remember the enabled state across restarts.
5. Listen for `event2action_bus`, fire a source event, and confirm exactly one normalized event per expected source event. Use a real/fired source event rather than Run actions, which has no event trigger payload.
6. Open Event2Action, enable learning, block actions if appropriate, and create a mapping. Then leave learning, unblock, and test it.

If maintaining `automations.yaml` by hand, add this object as a list item and use a unique `id`. Do not paste the standalone object into a package or `configuration.yaml` unchanged.

## Example transformation

Fire event type `my_remote_button` with event data:

```json
{"device_id": "remote_1", "button": 2, "action": "PRESS"}
```

The adapter produces:

```json
{
  "proto": "custom_remote",
  "code": "remote_1/2/press",
  "device_ieee": "remote_1",
  "command": "press"
}
```

Only `proto` and `code` select a mapping. The first active match wins. `device_ieee` and `command` improve learning/display but do not distinguish mappings, so include device and action in `code` when required. Keep normalization consistent and preserve full device identifiers. Changing an existing key means its old mapping no longer matches. Use unambiguous separators or encoding if source values can contain `/`.

## Optional features

| Feature | When useful |
| --- | --- |
| Exact device filter | Restrict the event trigger to one device with `event_data`. |
| Payload validation | Recommended; the supplied guard rejects absent/null/blank fields and allows button `0`. Adapt it to your event format. |
| Action filter | Add a condition to ignore releases, battery/status updates, or unsupported commands if they should not become buttons. Keep press/double/hold distinct when useful. |
| Metadata | `device_ieee` and `command` support learning/display. `source`, `origin_event_type`, `raw`, and `ts` are optional diagnostics. The current runtime generates its own learning timestamp. |
| Automation traces | Uncomment the trace settings when debugging. Raw payloads are usually unnecessary and can contain sensitive data. |

Do not copy map storage, action dispatch, learning/blocking helpers, or undo logic into an adapter; those belong to the integration. The integration's configurable toggle repeat suppression already handles rapid repeats of the same toggle mapping. Avoid generic adapter delays or debounce unless the source requires it: they can remove intentional double presses or hold repeats. Never listen to `event2action_bus` and emit the same event from this adapter, which would create a loop.

See Home Assistant's [automation YAML reference](https://www.home-assistant.io/docs/automation/yaml/) and [event action reference](https://www.home-assistant.io/actions/event/) for syntax and startup-state behavior.
