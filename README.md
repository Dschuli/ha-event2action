# Event2Action Mapper for Home Assistant

Event2Action is a Home Assistant editor and runtime for mapping normalized button events to Home Assistant actions. It focuses on the Lovelace learning card, MQTT-backed runtime map storage, helper scripts, and feeder automations for `esphome.rf433` and `zha_event`.

Bring your own event source. For RF433, this project expects Home Assistant to receive `esphome.rf433` events with protocol/code data. For Zigbee buttons, it consumes native `zha_event` payloads.

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Minimal setup path
- **[e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md)** - Detailed editor features and usage
- **[HELPERS.md](HELPERS.md)** - Helper entity setup

## Features

- **Event2Action runtime**: one central bus handler executes mapped Home Assistant actions
- **RF433 feeder**: normalizes `esphome.rf433` events into the shared `event2action_bus`
- **ZHA feeder**: normalizes `zha_event` button payloads into the same bus
- **Learning mode**: interactively learn and map incoming event codes
- **Visual editor**: create and edit mappings without hand-editing JSON
- **Backup and undo**: session and step-level backups
- **Import/export**: save and restore mappings as JSON
- **Event blocking**: temporarily suppress action execution while learning
- **MQTT storage**: publish runtime maps and backups through Home Assistant MQTT sensors

## Requirements

- Home Assistant 2024.1 or newer
- MQTT Broker, such as Mosquitto
- Modern web browser for the Lovelace card
- At least one event source:
  - RF433 source that fires Home Assistant events named `esphome.rf433`
  - Zigbee devices using ZHA, which emit `zha_event`

## Installation

### 1. Home Assistant Files

Copy the Home Assistant files into `/config/`:

```bash
cp homeassistant/e2a_mqtt_sensors.yaml /config/
cp homeassistant/e2a_scripts.yaml /config/
cp homeassistant/e2a_automations.yaml /config/
cp -r homeassistant/www/* /config/www/
```

Add these includes to `configuration.yaml`:

```yaml
mqtt: !include e2a_mqtt_sensors.yaml
script: !include e2a_scripts.yaml
automation: !include e2a_automations.yaml
```

If you already split your configuration differently, copy the contents of those files into your existing MQTT, script, and automation configuration instead.

### 2. Automations

The automation file contains three parts:

- `Event2Action RF433 Feeder`: listens for `esphome.rf433`
- `Event2Action ZHA Feeder`: listens for `zha_event`
- `Event2Action Bus Handler`: stores the latest normalized event and runs mapped actions

Restart Home Assistant after adding the files.

### 3. Helper Entities

Create the helper entities described in [HELPERS.md](HELPERS.md):

- `input_text.event2action_last_event_store`
- `input_boolean.event2action_block_events`

### 4. Dashboard Card

Add the card resource:

```yaml
url: /local/event2action/e2a-learning-card.js
type: module
```

Then add the Lovelace card:

```yaml
type: custom:event2action-learning-card
```

The card works best in a panel view.

## Event Source Expectations

### RF433

The RF433 feeder expects events named `esphome.rf433` with data similar to:

```json
{
  "protocol": 1,
  "code": "1234567",
  "pressed": "A"
}
```

`protocol` may also be provided as `proto`. The feeder normalizes these fields into `proto`, `code`, `pressed`, `source`, and `origin_event_type`.

### ZHA

The ZHA feeder listens for `zha_event` and derives a stable code from the device IEEE address, endpoint, and command. It supports short, double, and long press style commands.

## Usage

1. Enable learning mode in the Event2Action card.
2. Press a button or fire a test event.
3. Pick the target entity and service.
4. Save the mapping.
5. Disable learning mode and test the button.

For detailed editor behavior, backup/restore, import/export, and service data examples, see [e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md).

### Optional Script Targets

Event2Action can call any Home Assistant script. For example, a future companion project named `ha-dimmer-control-by-handheld` could provide a `script.dimmer_control` service target for handheld remote dimming. In that setup, map a learned button to `script.turn_on`, target `script.dimmer_control`, and pass service data such as:

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
  "pressed": "test"
}
```

This exercises the RF433 feeder and the shared runtime flow without requiring a physical RF source.

## Configuration

Edit `homeassistant/www/event2action/e2a-config.js` to customize:

- Supported entity domains
- MQTT sensor names and topics
- Helper entity names
- Default event blocking duration
- Logging level

## Troubleshooting

### No Events Appear

1. In Developer Tools -> Events, listen for `event2action_bus`.
2. Fire or trigger an `esphome.rf433` or `zha_event`.
3. Verify `homeassistant/e2a_automations.yaml` is included and the feeder automations are enabled.
4. Check that `input_text.event2action_last_event_store` is updated.

### Learning Mode Not Working

1. Verify the helper entities exist.
2. Verify MQTT sensors from `e2a_mqtt_sensors.yaml` are present.
3. Check browser console output for card errors.
4. Clear the browser cache after frontend file changes.

### Mappings Not Executing

1. Verify `sensor.event2action_runtime_map` contains a map attribute.
2. Confirm `input_boolean.event2action_block_events` is off.
3. Check the target entity and service still exist.
4. Review the automation trace for `Event2Action Bus Handler`.

## Project Structure

```text
event2action-mapper/
├── homeassistant/
│   ├── e2a_automations.yaml     # RF433/ZHA feeders and bus handler
│   ├── e2a_mqtt_sensors.yaml    # MQTT sensor definitions
│   ├── e2a_scripts.yaml         # Event blocking helper script
│   └── www/
│       ├── event2action/
│       │   ├── e2a-learning-card.js
│       │   ├── e2a-editor.js
│       │   ├── e2a-config.js
│       │   └── styles/
│       ├── utils/
│       └── mixins/
├── pictures/
└── README.md
```

## License

This project is open source and available under the MIT License.
