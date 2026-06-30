# Quick Start Guide

Set up the Event2Action editor and runtime in Home Assistant.

## Prerequisites

- [ ] Home Assistant installed and running
- [ ] MQTT broker configured
- [ ] An RF433 source that emits `esphome.rf433`events, or Zigbee devices using ZHA (emitting `zha` event ), or another event source with a corresponding feeder automation

## 1. Install the Home Assistant Package

HACS installs the Lovelace card only. It does not copy the Home Assistant package into your config directory.

From the Home Assistant Terminal/SSH add-on, download the package file into `/config/packages/`:

```bash
mkdir -p /config/packages
wget -O /config/packages/event2action.yaml https://raw.githubusercontent.com/Dschuli/ha-event2action/main/packages/event2action.yaml
```

If your terminal does not have `wget`, use `curl` instead:

```bash
mkdir -p /config/packages
curl -L -o /config/packages/event2action.yaml https://raw.githubusercontent.com/Dschuli/ha-event2action/main/packages/event2action.yaml
```

Make sure package loading is enabled in `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

If you already have a `homeassistant:` section, add only the `packages:` line under it. Restart Home Assistant after adding the package or changing `configuration.yaml`.

## 2. Add the Dashboard Card

Add this resource in Settings -> Dashboards -> Resources:

```yaml
url: /hacsfiles/ha-event2action/event2action-learning-card.js
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

## 3. Verify the Event Flow

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

- Confirm `/config/packages/event2action.yaml` is installed and Home Assistant was restarted.
- Confirm the feeder automation is enabled.
- Confirm the incoming event is named `esphome.rf433` or `zha_event`.

**Card not showing**

- Verify the HACS frontend file exists under `/config/www/community/ha-event2action/`.
- Verify the dashboard resource URL is `/hacsfiles/ha-event2action/event2action-learning-card.js`.
- Clear the browser cache.

**Mapping does not execute**

- Check `sensor.event2action_runtime_map`.
- Make sure `input_boolean.event2action_block_events` is off.
- Check the automation trace for `Event2Action Bus Handler`.

## More Detail

- Full overview: [README.md](README.md)
- Editor reference: [e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md)
- Helper setup: [HELPERS.md](HELPERS.md)
