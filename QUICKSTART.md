# Quick Start Guide

Set up the Event2Action editor and runtime in Home Assistant.

## Prerequisites

- [ ] Home Assistant installed and running
- [ ] MQTT broker configured
- [ ] An RF433 source that emits `esphome.rf433`events, or Zigbee devices using ZHA (emitting `zha` event ), or another event source with a corresponding feeder automation

## 1. Install Home Assistant Files

Copy the files into your Home Assistant config directory:

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

Restart Home Assistant.

## 2. Create Helper Entities

In Home Assistant, go to Settings -> Devices & Services -> Helpers -> Create Helper.

Create:

- Text helper named `Event2Action Last Event Store`
- Toggle helper named `Event2Action Block Events`

The expected entity IDs are:

- `input_text.event2action_last_event_store`
- `input_boolean.event2action_block_events`

See [HELPERS.md](HELPERS.md) if Home Assistant generates different entity IDs.

## 3. Add the Dashboard Card

Add this resource in Settings -> Dashboards -> Resources:

```yaml
url: /local/event2action/e2a-learning-card.js
type: module
```

Add this card to a dashboard:

```yaml
type: custom:event2action-learning-card
```

Optional card configuration is available through the card editor, or as YAML keys beside `type`:

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
custom_common_service_data_keys: {}
prefill_service_data: {}
```

Use a panel view for the cleanest layout.

## 4. Verify the Event Flow

Open Developer Tools -> Events.

Listen to:

```text
event2action_bus
```

Then fire this test event:

```text
esphome.rf433
```

With event data:

```json
{
  "protocol": 1,
  "code": "111111111",
  "pressed": "test"
}
```

If the feeder is working, an `event2action_bus` event appears and `input_text.event2action_last_event_store` updates.

## 5. Create Your First Mapping

1. Enable learning mode in the card.
2. Trigger an RF433 or ZHA button event.
3. Select the target entity.
4. Select the service, such as `light.toggle` or `switch.turn_on`.
5. Save the mapping.
6. Disable learning mode and trigger the event again.

Optional example: if you later install a separate `ha-dimmer-control-by-handheld` project that provides `script.dimmer_control`, you can map a button to `script.turn_on` with target `script.dimmer_control` and service data like `{"light_entity":"light.living_room","steps":5,"bounce_at_top":false}`.

## Troubleshooting

**No bus event appears**

- Confirm `e2a_automations.yaml` is included.
- Confirm the feeder automation is enabled.
- Confirm the incoming event is named `esphome.rf433` or `zha_event`.

**Card not showing**

- Verify `/config/www/event2action/e2a-learning-card.js` exists.
- Verify the dashboard resource URL is `/local/event2action/e2a-learning-card.js`.
- Clear the browser cache.

**Mapping does not execute**

- Check `sensor.event2action_runtime_map`.
- Make sure `input_boolean.event2action_block_events` is off.
- Check the automation trace for `Event2Action Bus Handler`.

## More Detail

- Full overview: [README.md](README.md)
- Editor reference: [e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md)
- Helper setup: [HELPERS.md](HELPERS.md)
