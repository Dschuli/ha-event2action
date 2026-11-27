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

**Hardware testing needed:** The Zigbee2MQTT, Matter, Tasmota Sonoff RF Bridge, OpenMQTTGateway RCSwitch, Shelly Button1, Shelly BLU RC Button 4, and Flic examples (marked with an asterisk in the main README) have not been verified on physical devices. YAML and example transformations are checked locally. Please test before relying on them, and [report results or corrections](https://github.com/Dschuli/ha-event2action/issues/new) with your model, HA/source versions, and a redacted payload or event-entity state/attributes.

### Flic 2, Duo, and Twist Bluetooth example

[flic-event-adapter.yaml](flic-event-adapter.yaml) covers the three models through Home Assistant's native `flic_button` integration, available from HA 2026.11. Pair the devices through that integration with working Bluetooth reception. The example reads the event entities supplied by that integration.

1. Inspect each device's `event.*` entities in HA. Flic 2 and Twist each supply one button entity. Duo supplies separate big- and small-button entities.
2. Paste the example into one new automation's YAML editor. Replace every placeholder in `triggers[0].entity_id` with the actual `event.*` entity ID of a Flic button you want to support, and remove unused entries. Find these IDs on the Flic device page or in Developer Tools → States. These are event entity IDs, rather than event-bus names or press types. One automation can cover several devices and models.
3. Leave `enable_swipes: false` for a compact set of mappings. Set it to `true` to also forward Duo's four swipe directions.
4. Save and deliberately enable the automation. Listen for `event2action_bus` and learn presses, holds, and rotation directions. Use real device events to test. Run actions has no state-trigger payload. Remove `initial_state: false` when ready to let HA remember the enabled state across restarts.

Each event entity produces at most five default command codes: `single_press`, `double_press`, `hold`, `rotate_left`, and `rotate_right`. Flic 2 supplies the three press commands. Duo and Twist can also supply rotation. Swipes add at most four more commands per entity. Raw `click` and `double_click` become `single_press` and `double_press`. Clockwise/increment events become `rotate_right`; counter-clockwise/decrement events become `rotate_left`. Ordinary and push-twist rotations share those direction keys. Up/down and selector-change events are ignored. Angles, absolute positions, step counts, and speed never enter the mapping key.

For example, entity `event.living_room_flic_twist_button` with a changed timestamp and `event_type: twist_increment` produces protocol `flic`, code `living_room_flic_twist_button/rotate_right`. The entity ID with its `event.` prefix removed separates devices and Duo buttons. Renaming an entity requires updating the trigger list and relearning affected mappings. `device_ieee` contains the full entity ID for display.

Twist's configured mode determines the source rotation events. Default/Continuous modes expose increment/decrement events; Selector mode exposes clockwise/counter-clockwise events. Changing modes can also change the entity ID, so inspect and update the list afterwards. Rotation fires one mapped action per received event, independent of how many steps the event represents. Test fast turns, repeats, both Duo buttons, all enabled gestures, and mode changes on real hardware. Fast turns can exceed the example's automation queue or Event2Action's action queue.

The guard ignores attribute-only changes, unknown/unavailable/restored state recovery, and the first update without a prior valid state. Press again after setup or recovery. This guard cannot remove every event queued or replayed by a device/integration on reconnect, so test reconnects for unwanted actions. Avoid overlapping adapters forwarding the same entities.

References are [HA's Flic integration and event types](https://www.home-assistant.io/integrations/flic_button/), [HA's Flic event implementation](https://github.com/home-assistant/core/blob/dev/homeassistant/components/flic_button/event.py), and [Flic event constants](https://github.com/50ButtonsEach/pyflic-ble/blob/main/src/pyflic_ble/const.py). Hardware testing is still needed.

### Shelly BLU RC Button 4 Bluetooth example

[shelly-blu-rc-button4-event-adapter.yaml](shelly-blu-rc-button4-event-adapter.yaml) forwards `bthome_ble_event` button events from a Shelly BLU RC Button 4. Configure the remote through Home Assistant's BTHome integration with working Bluetooth reception, using a local adapter or an ESPHome Bluetooth proxy. Supply the bindkey during BTHome setup if encryption is enabled. For a dual-protocol model, use Bluetooth/BTHome mode with this example.

1. Listen for `bthome_ble_event` in Developer Tools → Events. Press each of the four buttons and confirm the payload includes `address`, `event_class` (`button_1` through `button_4`), and `event_type`.
2. Paste the example into one new automation's YAML editor and fill `variables.allowed_addresses` with the observed Bluetooth addresses of the remotes you want to support. Add one list entry per remote. Letter case is ignored. An empty list forwards nothing. The automation listens to BTHome events and immediately filters them to these addresses and the supported button actions.
3. Save and deliberately enable the automation. Listen for `event2action_bus`, press each button, and learn its actions in Event2Action. Run actions has no source-event payload. Remove `initial_state: false` when ready to let HA remember the enabled state across restarts.
4. Test all four buttons, repeated presses, double/triple/long presses, holds, simultaneous presses, and HA/Bluetooth reconnects. If any button fails to appear in the source events, resolve reception, firmware, or BTHome decoding before testing the adapter. A missing source event cannot create a mapping.

Example incoming `bthome_ble_event` data:

```json
{"device_id":"ha_device_id","address":"AA:BB:CC:DD:EE:FF","event_class":"button_2","event_type":"double_press","event_properties":null}
```

The match key is protocol `bthome`, code `aabbccddeeff/button_2/double_press`. The full Bluetooth address is lowercased with colons removed. The button identifier and press type distinguish mappings. HA entity names and device-registry IDs are excluded from the key, keeping it stable across entity renames. `device_ieee` contains the Bluetooth address for display.

The guard accepts `press`, `double_press`, `triple_press`, `long_press`, and `hold_press` on the four numbered button channels. Invalid/missing fields, other event classes, and unsupported press types are ignored. Firmware and HA versions determine which events appear. Hold events may repeat and should be mapped deliberately. The example forwards each event without additional debounce and treats simultaneous button events separately. It does not combine buttons into chords or implement continuous dimming. Keep one adapter per received event to avoid duplicate actions. One automation can cover several remotes through `allowed_addresses`; each remote has distinct mapping keys. The address list selects devices explicitly because the source event has no manufacturer/model field.

References are the [HA BTHome setup guide](https://www.home-assistant.io/integrations/bthome/), [HA BTHome event payload implementation](https://github.com/home-assistant/core/blob/dev/homeassistant/components/bthome/__init__.py), [HA BTHome button event types](https://github.com/home-assistant/core/blob/dev/homeassistant/components/bthome/event.py), and [Shelly BLU RC Button 4 protocol documentation](https://shelly-api-docs.shelly.cloud/docs-ble/Devices/BLU/wall_us/). This example still needs physical hardware verification.

### Shelly Button1 Wi-Fi example

[shelly-button1-event-adapter.yaml](shelly-button1-event-adapter.yaml) forwards `shelly.click` events from the Wi-Fi Shelly Button1 through Home Assistant's Shelly integration. It supports `single`, `double`, `triple`, and `long` clicks.

1. Add the Button1 to Home Assistant's Shelly integration and complete its Gen1 CoIoT setup as described in the HA documentation. Wake the battery-powered button during setup.
2. In Developer Tools → Events, listen for `shelly.click` and press the button. Confirm `device`, `channel`, and `click_type` in the payload.
3. Paste the example into one new automation's YAML editor, save, and deliberately enable it. It covers all Button1 devices by default. Uncomment the `event_data` device filter to select one button, using its exact observed device value.
4. Listen for `event2action_bus` and learn each desired press type in Event2Action. Test repeated presses and reconnects with the real button. Run actions has no source-event payload. Remove `initial_state: false` when ready to let HA remember the automation's enabled state across restarts.

Example incoming `shelly.click` data:

```json
{"device_id":"e09c64a22553484d804353ef97f6fcd6","device":"shellybutton1-A4C12A45174","channel":1,"click_type":"double","generation":1}
```

The resulting match key is protocol `shelly`, code `shellybutton1-a4c12a45174/1/double`. Device names are trimmed and lowercased, and channels are normalized to decimal integers. The device, channel, and press type distinguish mappings. `device_id` is unused, and `device_ieee` contains the normalized Shelly device name as display metadata. Missing or invalid fields, other Shelly models, and unsupported click types are ignored.

One automation handles several Button1 devices with separate keys. Keep only one adapter forwarding each source event. The example forwards each received press without additional debounce. Changing the device identifier requires relearning affected mappings. Verify startup, wake-from-sleep, reconnects, and all four press types on physical hardware.

References are the [HA Shelly event and Gen1 setup documentation](https://www.home-assistant.io/integrations/shelly/#events) and [Shelly Button1 API](https://shelly-api-docs.shelly.cloud/gen1/#shelly-button1).

### OpenMQTTGateway with RCSwitch example

[openmqttgateway-rcswitch-event-adapter.yaml](openmqttgateway-rcswitch-event-adapter.yaml) forwards decoded JSON messages from an OpenMQTTGateway RCSwitch receiver. Set up the gateway, compatible RF hardware, and Home Assistant MQTT integration first. This example does not handle RTL_433, RF2, raw RF frames, or plain scalar MQTT payloads.

1. Listen to MQTT while pressing the remote. Confirm a JSON object containing `value`, `protocol`, and `length`, and copy its exact receive topic. The standard topic is `home/<gateway_name>/433toMQTT`; adjust for your configured base topic and gateway name. Do not subscribe to transmit command topics.
2. Ensure RF messages on the selected topic are published without retain and clear any old retained message before enabling the adapter. HA's MQTT trigger cannot identify retained replays.
3. Paste the example into one new automation's YAML editor, replace its trigger topic, save, and deliberately enable it. Remove `initial_state: false` when ready to let HA remember the enabled state across restarts.
4. Listen for `event2action_bus`, press each button, and learn its code in Event2Action. Test repeated presses and MQTT/HA reconnects for false actions. Run actions has no MQTT trigger payload.

Example input on `home/OpenMQTTGateway/433toMQTT`:

```json
{"value":1315156,"protocol":1,"length":24,"delay":317}
```

The match key is protocol `openmqttgateway_rcswitch`, code `home/OpenMQTTGateway/433toMQTT/1/24/1315156`. The key includes the receiver topic, RCSwitch protocol number, bit length, and decimal value. `delay` and raw timing data are excluded because reception timing varies. The fields accept decimal integers or digit strings and normalize leading zeros; missing/null/blank fields, booleans, fractions, negative values, invalid JSON, and non-object payloads are ignored. Protocol and length must be positive. A value of zero is accepted if published by the source.

Use one receive topic per gateway; a single gateway can cover many remote buttons without per-button configuration. Some gateway configurations publish a value suffix such as `433toMQTT/1315156`; the example's unsuffixed subscription does not match these. Prefer the standard unsuffixed JSON topic when available. Otherwise subscribe to `home/YOUR_GATEWAY/433toMQTT/+` for value-suffixed JSON messages only, after inspecting actual payloads. The actual topic remains part of the match key, so changing the topic layout requires relearning mappings. Do not subscribe to both layouts if the gateway publishes the same reception on both.

`device_ieee` contains the receiving topic as display metadata, not a remote IEEE address. These keys are separate from the ESPHome and Tasmota adapters. Avoid overlapping subscriptions and multiple receivers forwarding the same RF transmission. Received repeats are forwarded without extra debounce; gateway repeat filtering and RF compatibility depend on its configuration and firmware. Verify behavior with your actual remote and actions.

References: [OpenMQTTGateway RCSwitch RF documentation](https://docs.openmqttgateway.com/use/rf#rcswitch-based-gateway), [Home Assistant integration and RF topic variants](https://docs.openmqttgateway.com/integrate/home_assistant.html), and [HA MQTT trigger](https://www.home-assistant.io/triggers/mqtt/).

### Sonoff RF Bridge + Tasmota example

[tasmota-rf-bridge-event-adapter.yaml](tasmota-rf-bridge-event-adapter.yaml) forwards decoded `RfReceived.Data` messages from a Sonoff RF Bridge running Tasmota. It requires a working bridge, RF reception, and Home Assistant MQTT integration. It does not flash or configure the bridge and does not handle Portisch `RfRaw.Data` frames, rolling codes, or every RF device/protocol.

1. Listen to MQTT while pressing the real remote and copy the exact topic containing `RfReceived.Data`. With Tasmota's default FullTopic layout this is `tele/<Topic>/RESULT`; custom FullTopic settings may differ.
2. Ensure RF messages on that topic are published without retain, and clear any old retained message before enabling the adapter. HA's YAML MQTT trigger cannot identify retained replays. Check any Tasmota rules or other publishers forwarding messages to this topic too.
3. Paste the example into one new automation's YAML editor, replace the trigger topic, save, and deliberately enable it. Remove `initial_state: false` when ready to let HA remember its enabled state across restarts.
4. Listen for `event2action_bus`, press each remote button, and learn the codes in Event2Action. Test MQTT/HA reconnects for false actions. Run actions has no MQTT trigger payload.

Example input on `tele/rf_bridge/RESULT`:

```json
{"Time":"2026-01-01T12:00:00","RfReceived":{"Sync":9640,"Low":350,"High":950,"Data":"8D9EE7","RfKey":"None"}}
```

The resulting match key is protocol `tasmota_rf_bridge`, code `tele/rf_bridge/RESULT/8D9EE7`. Hex strings are trimmed and uppercased, an optional `0x` prefix is removed, and leading zeros are preserved. Non-JSON/non-object messages, missing or invalid `RfReceived.Data`, status messages, and raw sniffing frames are ignored. Timing fields, timestamps, and `RfKey` are not part of the key. The received RF data identifies the button; the bridge does not supply a separate remote IEEE address. `device_ieee` contains the receiver topic as display metadata.

One bridge can receive many remotes without per-button configuration. The topic scopes the key to the receiving bridge: renaming its topic requires updating the automation and relearning mappings. If two bridges hear the same RF transmission, each may produce an event; restrict forwarding to one receiver for that transmission. Avoid overlapping adapter subscriptions or other automations forwarding the same messages. Repeated RF messages are forwarded without debounce; verify repeat behavior with your remote and actions. These keys are separate from the built-in ESPHome RF433 adapter's keys.

References: [Tasmota Sonoff RF Bridge documentation](https://tasmota.github.io/docs/devices/Sonoff-RF-Bridge-433/), [Tasmota RF rules](https://tasmota.github.io/docs/Rules/), and [HA MQTT trigger](https://www.home-assistant.io/triggers/mqtt/).

### Matter remote example

[matter-event-adapter.yaml](matter-event-adapter.yaml) can be pasted into a new HA automation. Replace the placeholder `event.*` entity IDs with the remote's actual button entities. One automation may list several buttons/remotes. Set up the device through HA's Matter integration first; Matter-over-Thread devices also require a working Thread border router. MQTT is not involved.

The example watches changes to event entity timestamps and reads `attributes.event_type`, preserving the press names exposed by the device. If a `button` attribute is present, it is also included in the code to distinguish buttons sharing an entity. For example, entity `event.remote_button_1`, a changed timestamp, and `event_type: double_press` produce:

```yaml
proto: matter
code: event.remote_button_1/double_press
command: double_press
device_ieee: event.remote_button_1
```

Here `device_ieee` is optional display metadata containing an HA entity ID, not an IEEE address. With an additional `button: 2` attribute, the code would be `event.remote_button_1/button_2/double_press`. The timestamp is never part of the match key. Entity renames require updating/relearning affected mappings.

The guard ignores attribute-only changes, unknown/unavailable states, and recovery from missing/restored/unknown/unavailable state. This avoids treating recovery as a press, but deliberately ignores the first update when no prior valid timestamp exists; press again after recovery. It cannot guarantee removal of every device/integration replay. The `event.received` trigger is an alternative when selecting specific known event types; this generic example uses a state trigger to capture all types without a model-specific list.

Enable deliberately after saving. Verify real presses, repeated presses of the same type, multiple buttons, long/double press behavior, and startup/reconnection without false actions. Use the real remote; Run actions has no state-trigger payload. Do not run overlapping adapters for the same entities. The example does not implement continuous rotary/dimmer behavior from device-specific attributes.

References: [HA Matter integration](https://www.home-assistant.io/integrations/matter/), [event entity timestamps and types](https://www.home-assistant.io/integrations/event/), and [event received trigger](https://www.home-assistant.io/triggers/event.received/).

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
