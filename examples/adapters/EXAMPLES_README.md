# Event adapter examples

Start with a working device in Home Assistant, then choose the adapter for its connection below. ESPHome RF433 and ZHA are built in. The other adapters are YAML automations you copy and configure.

## Choose your source

| Event source | Support |
|---|---|
| RF433 remotes via ESPHome (RC Switch), e.g. [rf433-esphome-sniffer](https://github.com/Dschuli/rf433-esphome-sniffer) | ✅ Built-in adapter provided |
| Zigbee buttons and scene switches via ZHA | ✅ Built-in adapter |
| Zigbee buttons and scene switches via Zigbee2MQTT | [Example YAML code provided](zigbee2mqtt-event-adapter.yaml) \* |
| Matter buttons and remotes exposed as HA event entities | [Example YAML code provided](matter-event-adapter.yaml) \* |
| Sonoff RF Bridge running Tasmota (decoded RF codes via MQTT) | [Example YAML code provided](tasmota-rf-bridge-event-adapter.yaml) \* |
| OpenMQTTGateway with RCSwitch (decoded RF codes via MQTT) | [Example YAML code provided](openmqttgateway-rcswitch-event-adapter.yaml) \* |
| Shelly Button1 via the HA Shelly integration (Wi-Fi) | [Example YAML code provided](shelly-button1-event-adapter.yaml) \* |
| Shelly BLU RC Button 4 via BTHome (Bluetooth) | [Example YAML code provided](shelly-blu-rc-button4-event-adapter.yaml) \* |
| Flic 2, Duo, and Twist via the native Flic integration (Bluetooth) | [Example YAML code provided](flic-event-adapter.yaml) \* |
| Other MQTT messages | Custom adapter required |
| ESPHome custom events | Custom adapter required |
| IR receivers | Custom adapter required (depends on receiver/event format) |
| Other Home Assistant events | Custom adapter required |

\* **Hardware testing needed.** The copy-and-edit adapters have been checked for YAML and template behavior, but still need physical device testing. Test reports are welcome with your model, HA version, and a sample event. [Report results](https://github.com/Dschuli/ha-event2action/issues/new)

## Install an example

1. Set up the source integration and confirm button presses reach Home Assistant.
2. Paste the selected YAML into a new automation's YAML editor and replace its device values as described below.
3. Save and enable the automation. Examples use `initial_state: false`, so remove that line when ready to preserve the enabled state across HA restarts.
4. Listen for `event2action_bus` in Developer Tools → Events. Press a button, then learn it in Event2Action.

Test with real presses rather than **Run actions**, which has no incoming event data. Check repeated presses, holds, and reconnects. Use one adapter per source event to avoid duplicate actions.

**MQTT sources:** publish button events without retain and clear old retained messages before enabling the adapter. HA's MQTT trigger cannot distinguish a retained replay from a new press. Also check that unrelated status updates do not republish an old action.

## Zigbee and Matter

### Zigbee2MQTT remote example

Use [zigbee2mqtt-event-adapter.yaml](zigbee2mqtt-event-adapter.yaml) for remotes publishing a JSON `action` field.

- In Zigbee2MQTT, merge this setting into the existing MQTT configuration:

  ```yaml
  mqtt:
    include_device_information: true
  ```

- Confirm a press includes `device.ieeeAddr`, then enter the remote's JSON topic in the automation, for example `zigbee2mqtt/living_room_remote`.
- Subscribe to the device topic. `/action`, `/set`, and `/availability` subtopics have different payloads.

A message with `action: "1_double"` and `device.ieeeAddr: "0x00158d0001234567"` produces:

```yaml
proto: zigbee2mqtt
code: 00158d0001234567/1_double
```

The IEEE address separates remotes even if they publish identical actions. Missing actions or device information are ignored. Extra rotation/step attributes need custom handling for continuous dimming.

For several remotes, give them friendly names such as `remotes/living_room` and `remotes/bedroom`, then use `zigbee2mqtt/remotes/+` as the trigger topic. `+` matches one topic level. Avoid overlapping wildcard and exact-topic automations. Renaming a remote requires updating an exact-topic subscription; its mapping codes stay the same.

References — [device information](https://www.zigbee2mqtt.io/guide/configuration/all-settings.html#include_device_information), [MQTT messages](https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html), [retained-message settings](https://www.zigbee2mqtt.io/guide/configuration/devices-groups.html).

### Matter remote example

Use [matter-event-adapter.yaml](matter-event-adapter.yaml) with remotes already connected through HA's Matter integration. Matter-over-Thread devices also require a Thread border router.

Replace the trigger's entity list with the actual `event.*` entities for your buttons. One automation can list several remotes. The adapter preserves each entity's press types. For entity `event.remote_button_1` and `event_type: double_press`, the output is:

```yaml
proto: matter
code: event.remote_button_1/double_press
```

If the source supplies an additional `button: 2` attribute, the code becomes `event.remote_button_1/button_2/double_press`. Entity renames require updating the automation and relearning affected mappings.

The adapter skips startup and availability recovery, including the first event without a previous valid state. Press again after recovery. Test reconnects for replayed actions. Wheel direction or dimming steps carried in extra attributes may require adapting the example.

References — [HA Matter](https://www.home-assistant.io/integrations/matter/), [event entities](https://www.home-assistant.io/integrations/event/).

### IKEA remote examples

| Remote family | Setup |
| --- | --- |
| Zigbee models such as STYRBAR, RODRET, SOMRIG, and older TRÅDFRI remotes | Use built-in ZHA support or the Zigbee2MQTT example above. |
| BILRESA dual-button and scroll-wheel remotes | Use the Matter example above with the actual HA button entities. |

Learn the actions your model exposes. For a scroll-wheel BILRESA, inspect rotation events before mapping them; continuous dimming may need device-specific handling.

Device references — [STYRBAR](https://www.zigbee2mqtt.io/devices/E2001_E2002.html), [SOMRIG](https://www.zigbee2mqtt.io/devices/E2213.html), [BILRESA Matter/Thread instructions](https://www.ikea.com/qa/en/manuals/bilresa-remote-control-white-smart-dual-button__AA-2646178-1-100.pdf).

## Bluetooth

### Shelly BLU RC Button 4 Bluetooth example

Use [shelly-blu-rc-button4-event-adapter.yaml](shelly-blu-rc-button4-event-adapter.yaml) after adding the remote to HA's BTHome integration. Reception needs a Bluetooth adapter or ESPHome Bluetooth proxy. Encrypted devices need their bindkey during setup. Dual-protocol models must use Bluetooth/BTHome mode for this example.

Listen for `bthome_ble_event` and press all four buttons. Add the remotes' Bluetooth addresses to `variables.allowed_addresses`, one per line. Letter case is ignored; an empty list forwards nothing.

A source event containing address `AA:BB:CC:DD:EE:FF`, `event_class: button_2`, and `event_type: double_press` produces:

```yaml
proto: bthome
code: aabbccddeeff/button_2/double_press
```

Supported types are `press`, `double_press`, `triple_press`, `long_press`, and `hold_press` on `button_1` through `button_4`. Each remote gets separate codes. Holds can repeat; simultaneous buttons are forwarded separately. If a button is absent from the source events, check reception, firmware, and BTHome decoding first.

References — [HA BTHome](https://www.home-assistant.io/integrations/bthome/), [Shelly protocol](https://shelly-api-docs.shelly.cloud/docs-ble/Devices/BLU/wall_us/), [HA event payload](https://github.com/home-assistant/core/blob/dev/homeassistant/components/bthome/__init__.py).

### Flic 2, Duo, and Twist Bluetooth example

Use [flic-event-adapter.yaml](flic-event-adapter.yaml) with HA's native Flic integration (`flic_button`, HA 2026.11+).

Replace the trigger list with the actual `event.*` entity IDs from your Flic device pages and remove unused entries. Flic 2 and Twist have one button entity; Duo has separate big- and small-button entities. One automation can cover several devices.

The default commands are `single_press`, `double_press`, `hold`, `rotate_left`, and `rotate_right`. Flic 2 supports the first three. Set `enable_swipes: true` to add Duo's four swipe directions.

For entity `event.living_room_flic_twist_button`, a clockwise/increment event produces:

```yaml
proto: flic
code: living_room_flic_twist_button/rotate_right
```

Ordinary and push-twist rotations share the same direction codes. Each received rotation event runs one action, regardless of its step count, making this suitable for mapped brightness steps. Fast turns can exceed the automation or action queue.

Entity renames require updating the list and relearning mappings. After changing Twist modes, recheck entity IDs and events. The adapter skips startup/recovery and the first event without a previous valid state; press again afterwards. Test reconnects for queued or replayed presses.

References — [HA Flic](https://www.home-assistant.io/integrations/flic_button/), [HA event implementation](https://github.com/home-assistant/core/blob/dev/homeassistant/components/flic_button/event.py), [event names](https://github.com/50ButtonsEach/pyflic-ble/blob/main/src/pyflic_ble/const.py).

## Wi-Fi and RF bridges

### Shelly Button1 Wi-Fi example

Use [shelly-button1-event-adapter.yaml](shelly-button1-event-adapter.yaml) with the Wi-Fi Button1 added through HA's Shelly integration. Complete its Gen1 CoIoT setup and confirm presses produce `shelly.click` events. Wake the button during setup.

The example accepts all Button1 devices. To select one, uncomment the trigger's device filter and enter its exact `device` value. It supports single, double, triple, and long presses.

Device `shellybutton1-A4C12A45174`, channel `1`, and click type `double` produce protocol `shelly`, code `shellybutton1-a4c12a45174/1/double`. Each device/channel has distinct mappings. Check wake-from-sleep behavior as well as reconnects.

References — [HA Shelly setup and events](https://www.home-assistant.io/integrations/shelly/), [Button1 API](https://shelly-api-docs.shelly.cloud/gen1/#shelly-button1).

### Sonoff RF Bridge + Tasmota example

Use [tasmota-rf-bridge-event-adapter.yaml](tasmota-rf-bridge-event-adapter.yaml) with a working Tasmota bridge and HA MQTT integration.

Press a remote button and copy the MQTT topic carrying `RfReceived.Data` into the trigger. The default layout is `tele/<bridge_topic>/RESULT`; custom FullTopic settings may differ.

A message on `tele/rf_bridge/RESULT` with `RfReceived.Data: "8D9EE7"` produces protocol `tasmota_rf_bridge`, code `tele/rf_bridge/RESULT/8D9EE7`. Hex values are uppercased, an optional `0x` prefix is removed, and leading zeros are preserved.

The example handles decoded RF codes. Portisch `RfRaw.Data` frames need a different decoder. One bridge can receive many remotes. If several bridges hear the same press, select one to forward it. Changing the topic requires relearning affected mappings.

References — [Tasmota RF Bridge](https://tasmota.github.io/docs/devices/Sonoff-RF-Bridge-433/), [Tasmota RF rules](https://tasmota.github.io/docs/Rules/).

### OpenMQTTGateway with RCSwitch example

Use [openmqttgateway-rcswitch-event-adapter.yaml](openmqttgateway-rcswitch-event-adapter.yaml) with an RCSwitch receiver and HA MQTT integration.

Enter the gateway's JSON receive topic, normally `home/<gateway_name>/433toMQTT`. A press must provide `value`, `protocol`, and `length`. RTL_433, RF2, and scalar/raw payloads need another adapter.

On `home/OpenMQTTGateway/433toMQTT`, the payload `{"value":1315156,"protocol":1,"length":24,"delay":317}` produces protocol `openmqttgateway_rcswitch`, code `home/OpenMQTTGateway/433toMQTT/1/24/1315156`.

One gateway can cover many remotes. If yours only publishes value-suffixed JSON topics, use `home/YOUR_GATEWAY/433toMQTT/+`. Subscribe to one layout to avoid forwarding the same press twice. Changing the topic layout requires relearning mappings.

References — [RCSwitch gateway](https://docs.openmqttgateway.com/use/rf#rcswitch-based-gateway), [HA integration and topic variants](https://docs.openmqttgateway.com/integrate/home_assistant.html).

## Built-in adapter references

### Working ZHA reference

[zha-event-adapter.yaml](zha-event-adapter.yaml) mirrors the built-in ZHA adapter. A full device IEEE address, endpoint, and command form the code. For example, address `AA:BB:CC:DD:EE:FF:00:11`, endpoint `1`, and `remote_button_short_press` produce protocol `zha`, code `aabbccddeeff0011-1-short_press`.

### Working ESPHome RF433 reference

[esphome-rf433-event-adapter.yaml](esphome-rf433-event-adapter.yaml) mirrors the built-in RF433 adapter. Protocol and code come from the incoming `esphome.rf433` event; `proto` is accepted as an alternative to `protocol`. For `{"protocol":1,"code":"1234567","command":"A"}`, the mapping uses protocol `1`, code `1234567`.

The sniffer event name can be changed in Event2Action's integration settings. It must carry the same fields.

Both YAML files are references for studying or replacing the built-in behavior. Keep them disabled while the corresponding built-in adapter is enabled. You can disable either built-in adapter under **Integration settings → Configure**.

## Create an adapter

### Generic Home Assistant event example

Start with [custom-event-adapter.yaml](custom-event-adapter.yaml). Inspect a real source event, then adjust the trigger, field checks, and conversion to suit it.

An adapter sends `event2action_bus` with two matching fields:

| Field | Purpose |
| --- | --- |
| `proto` | A source name, such as `custom_remote`, keeping its codes separate from other sources. |
| `code` | The device, button, and action information needed to identify the mapping. |

For example, `my_remote_button` with `{"device_id":"remote_1","button":2,"action":"PRESS"}` becomes:

```yaml
proto: custom_remote
code: remote_1/2/press
command: press
device_ieee: remote_1
```

`command` and `device_ieee` provide display information. Only `proto` and `code` choose the mapping, so their formatting must stay consistent. Changing that format requires relearning affected mappings. The examples ignore incomplete or unsupported input; adapt those checks to your source.

Follow the installation steps at the top of this guide. For hand-maintained `automations.yaml`, add the automation as a list item with a unique `id`. Enable automation traces if you need to inspect the conversion. Avoid forwarding `event2action_bus` back into itself.

Need help with another source? Include the device, incoming event type, and a sample payload with sensitive details removed. [Ask for an adapter](https://github.com/Dschuli/ha-event2action/issues/new)
