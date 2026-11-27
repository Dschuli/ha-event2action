# Event2Action quick start

Requires Home Assistant 2026.11 or newer and an administrator account. MQTT is not required.

## Upgrade an existing installation

1. Export your map to JSON in the old card and retain the file.
2. Remove the old `packages/event2action.yaml` from Home Assistant's included packages and remove the standalone card/resource.
3. Restart Home Assistant to stop the old runtime.
4. Follow the installation steps below, then select **Import Map** in the card.

Old session and step backups do not transfer. Blocking duration resets to 60 seconds. Keep custom dashboard configuration separately. Do not remove MQTT or package includes used by other integrations.

## Install the integration

1. Copy this repository's `custom_components/event2action/` folder, including `frontend/`, to `/config/custom_components/event2action/`.
2. Restart Home Assistant.
3. Select **Settings → Devices & services → Add integration → Event2Action**.
4. Reload the browser and open **Event2Action** in the sidebar. The full-page learning card is created automatically.

You can configure the sidebar card through **Card settings** in its header. A dashboard card is optional:

```yaml
type: custom:event2action-learning-card
```

The integration loads its card automatically; do not add a separate resource. This development branch changes distribution from Dashboard to Integration; its existing Marketplace catalog entry still needs publisher migration.

## Integration settings

**Show in sidebar** is enabled by default. You can hide the entry under **Settings → Devices & services → Event2Action → Configure** without restarting. The page remains available at `/event2action-learning`, and the runtime and dashboard cards continue working.

### Toggle repeat suppression

Open **Settings → Devices & services → Event2Action → Configure**. Set **Toggle repeat suppression (ms)** to the interval during which repeated events for the same toggle mapping should be ignored. Default: **500 ms**; **0** disables suppression. Changes apply immediately. Other mappings and non-toggle actions are unaffected; learning still receives repeated events. This option is stored with the integration and is not included in map JSON exports.

## Map and test a button

1. Import your saved JSON, or enable learning to create mappings.
2. Block action execution while learning if needed. Learning and blocking are separate controls.
3. Press a button, choose its target and action, then save.
4. Turn learning off, unblock events, and test the button.

Without hardware, fire `esphome.rf433` in Developer Tools → Events:

```json
{"protocol": 1, "code": "111111111", "command": "test"}
```

RF433 and ZHA adapters are built in. Custom UI/YAML automations can fire `event2action_bus` with string `proto` and `code` values; no Python adapter code is required.

For another event source, choose an adapter from the [examples guide](examples/adapters/EXAMPLES_README.md). It covers Zigbee2MQTT, Matter, RF bridges, Wi-Fi and Bluetooth buttons, and custom events. Copy-and-edit examples need hardware testing.

The guide is also available through **Adapter examples** in the card header and integration settings.

Maps and new undo snapshots persist through the HA Store API in `.storage/event2action.maps`; button execution reads memory. Do not edit that file directly. Use JSON export for a portable map backup.

See [README.md](README.md) for storage behavior, troubleshooting, and rollback, and [the editor reference](e2a-mapping-editor-reference.md) for card options.
