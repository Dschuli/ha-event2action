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

### Zigbee2MQTT remote example

[zigbee2mqtt-event-adapter.yaml](zigbee2mqtt-event-adapter.yaml) can be pasted directly into a new HA automation's YAML editor. It is an example for remotes that publish a JSON `action` field; it is not a built-in adapter or a claim of testing every model.

1. Confirm Zigbee2MQTT and Home Assistant's MQTT integration already work.
2. Enable `mqtt.include_device_information: true` in Zigbee2MQTT (merge into its existing `mqtt:` section). Verify a new message contains `device.ieeeAddr`. Copy the remote's exact device JSON topic; do not use `/action`, `/set`, or `/availability`.
3. Set the remote's Zigbee2MQTT `retain` option to `false`. If its topic already has a retained message, clear that retained message before enabling the automation. The YAML MQTT trigger does not expose a retained flag, so the example cannot itself distinguish an old retained press from a live press. Also verify your source does not republish cached actions with unrelated updates.
4. Paste the YAML and replace only the trigger `topic`. The IEEE address is read from the message automatically. Save and deliberately enable it; remove `initial_state: false` once ready if you want HA to remember the enabled state across restarts.
5. Listen for `event2action_bus`, press each button, and learn its action in Event2Action. Also verify reconnecting MQTT does not execute an old press.

Example input on `zigbee2mqtt/living_room_remote`:

```json
{"action": "1_double", "battery": 90, "device": {"ieeeAddr": "0x00158d0001234567"}}
```

With that payload, the match key is protocol `zigbee2mqtt`, code `00158d0001234567/1_double`. The command is `1_double`. Missing/null/blank actions or device IEEE addresses, non-JSON payloads, and non-object JSON are ignored. If no events arrive, first check that device information is enabled in Zigbee2MQTT; battery-only messages do not become events. Distinct action strings are preserved, so no model-specific list is needed. This is discrete-action mapping, not continuous dimming based on extra step/rotation attributes.

The IEEE address from the payload keeps existing map keys stable if you rename a remote. Update an exact-topic subscription when its topic changes; a wildcard subscription keeps working if the new topic still matches. MQTT remains an event-source dependency; Event2Action's maps and backups still use HA storage.

#### Cover multiple remotes with one automation

The remotes do not need to publish to the same exact topic. Give them Zigbee2MQTT friendly names such as `remotes/living_room` and `remotes/bedroom`. With the default base topic, their JSON messages appear on:

```text
zigbee2mqtt/remotes/living_room
zigbee2mqtt/remotes/bedroom
```

Change only the example's trigger topic to:

```yaml
triggers:
  - trigger: mqtt
    topic: "zigbee2mqtt/remotes/+"
```

`+` matches one topic level, covering both remotes without their `/set`, `/action`, or `/availability` subtopics. Devices with further nested names need a subscription matching that layout. Adjust `zigbee2mqtt` if you use another base topic. This is an alternative trigger, not an additional automation to install alongside an overlapping copy.

Keep `mqtt.include_device_information: true` enabled. Each message supplies its own `device.ieeeAddr`, so two remotes sending `1_single` still produce different Event2Action codes. The same automation handles new remotes placed under this topic prefix without per-device IEEE settings. Apply the retained-message precautions above to every remote covered by the subscription.

Alternatively, use separate exact-topic automations for selected remotes. **Only one adapter should forward each remote:** do not run both a wildcard adapter and an exact-topic adapter covering that same device, or overlapping wildcard subscriptions. Prefer a remote-only prefix over a broad `zigbee2mqtt/#` subscription, which also receives bridge/control traffic.

Required Zigbee2MQTT setting (not Home Assistant configuration; merge with existing MQTT settings):

```yaml
mqtt:
  include_device_information: true
```

References: [device information setting](https://www.zigbee2mqtt.io/guide/configuration/all-settings.html#include_device_information), [Zigbee2MQTT device messages](https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html), [device configuration](https://www.zigbee2mqtt.io/guide/configuration/devices-groups.html), and [HA MQTT trigger](https://www.home-assistant.io/triggers/mqtt/).

### Generic Home Assistant event example

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
