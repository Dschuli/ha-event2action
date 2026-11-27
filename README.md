# Event2Action

### Learn and map any button or event to Home Assistant actions

Event2Action is the missing **button-learning layer for Home Assistant**. Use its visual learning interface to map **RF433 and IR remotes, Zigbee buttons, MQTT and ESPHome events**, or virtually any other Home Assistant event to actions—without creating a separate automation for every button.

<table>
  <tr>
    <td><img src="pictures/e2a-editor-learning-mode.png" alt="Event2Action learning mode with an active mapping editor" /></td>
  </tr>
</table>

A familiar remote can switch a modern plug, set a lighting scene, or run a script. Event2Action brings those mappings into one visual interface.

> This development branch packages Event2Action as a Home Assistant integration with a bundled card. The earlier YAML/MQTT version has been used daily by the author for several months. Upgrading users should export their maps and follow the migration steps below.

## Map a button

1. Open Event2Action and enable learning.
2. Press a remote button.
3. Choose the target entity and action, then save.
4. Turn learning off and test the button.

## What you can do

- Reuse RF433 and IR remotes, or connect Zigbee, Bluetooth, Wi-Fi, and Matter buttons through their Home Assistant integrations.
- Map presses, double presses, and holds to lights, plugs, scenes, scripts, and automations.
- Give mappings friendly names and configure service data in the visual editor.
- Block actions while learning, undo changes, and export or import maps as JSON.
- Use the sidebar interface or add Learning Cards to dashboards. Learning and event blocking are shared across views.

Mappings and backups are stored locally in Home Assistant. MQTT is needed only for sources that use it.

## Supported event sources

| Setup | Sources |
| --- | --- |
| Built in | ESPHome RF433 and ZHA |
| Example adapters | Zigbee2MQTT, Matter, Tasmota RF Bridge, OpenMQTTGateway, Shelly Button1, Shelly BLU RC Button 4, and Flic |
| Custom adapter | Other HA events, MQTT messages, and IR receivers, depending on their output |

An adapter converts a button event into the code Event2Action learns. The examples guide has the full source list, IKEA guidance, and setup instructions. Copy-and-edit examples need testing on physical devices. [Browse adapter examples](examples/adapters/EXAMPLES_README.md)

For ESPHome RF433, the author's sniffer project provides an ESP32/CC1101 receiver for RC Switch-compatible remotes. [rf433-esphome-sniffer](https://github.com/Dschuli/rf433-esphome-sniffer)

## Install

Requires **Home Assistant 2026.11+**, an administrator account, and a working event source.

1. Copy `custom_components/event2action/`, including `frontend/`, to `/config/custom_components/event2action/`.
2. Restart Home Assistant.
3. Add **Event2Action** under **Settings → Devices & services → Add integration**.
4. Reload the browser and open **Event2Action** in the sidebar.

The integration loads the bundled card automatically. To add a dashboard card, use:

```yaml
type: custom:event2action-learning-card
```

For this development branch, use the manual installation above. HACS distribution is moving from Dashboard to Integration, and the catalog entry still requires migration.

<details>
<summary>Upgrade from the YAML/MQTT version</summary>

1. Export your map from the old card. Keep your custom card configuration and a Home Assistant backup.
2. Remove the old `packages/event2action.yaml` include and standalone card resource.
3. Restart Home Assistant to stop the old runtime, then install the integration.
4. Select **Import Map** and test representative buttons.

Old undo backups do not transfer. Blocking duration starts at 60 seconds, and learning starts off. Keep MQTT and package includes used by other integrations. Automations referencing old helpers or `script.temporary_toggle` need updating.

Maps from **v0.1.3-beta** need conversion before import. [Migration guide](migration/README.md)

To roll back, remove the integration and restart, restore the previous package and card resource, restart again, and import the original export.

</details>

## Configure

**Card settings** in the sidebar header opens the Learning Card editor. Configure entity domains, automatic unblocking, logging, service data suggestions, and prefilled service data. Sidebar card settings are saved in Home Assistant. Dashboard cards have their own configuration through the dashboard editor.

**Integration settings → Configure** opens Event2Action's runtime options. The same screen is available under **Settings → Devices & services → Event2Action**.

| Setting | Purpose |
| --- | --- |
| ESPHome RF433 / ZHA adapters | Enable or disable each built-in adapter. Disable one before enabling a replacement for the same events. |
| Show in sidebar | Show or hide the entry. The page remains at `/event2action-learning`. |
| RF433 event name | Defaults to `esphome.rf433`. Change it for a sniffer using the same payload format under another event name. |
| Toggle repeat suppression | Ignore rapid repeats of the same toggle mapping. Default 500 ms; set to 0 to disable. |

Integration settings apply immediately. Select **Adapter examples** from the card or integration settings for source setup.

## Everyday use

Use **Block events** while learning if existing mappings could cause unwanted actions. Learning and blocking are independent controls. Save a mapping before switching views, as unsaved drafts belong to the open card.

With **Auto unblock** enabled, closing the last card clears the block after a three-second grace period. Switching between Event2Action views during that time keeps it active. The blocking timer also expires normally.

The first enabled mapping for a protocol/code pair runs. Toggle repeat suppression prevents repeated radio messages from immediately toggling a device back. Other actions and learning continue to receive repeats.

Export maps as JSON for portable backups. The integration stores maps and undo snapshots in `/config/.storage/event2action.maps`; edit them through the UI.

For richer actions, map a button to a script. The RF433 sniffer project includes an optional dimmer-control script. [Dimmer script](https://github.com/Dschuli/rf433-esphome-sniffer/tree/main/dimmer_control)

## Troubleshooting

- **Card missing or outdated** — Remove old `/hacsfiles/` or `/local/` Event2Action resource entries and refresh the browser.
- **No incoming event** — Check your source integration, then listen for `event2action_bus` in Developer Tools → Events. Follow your source's adapter guide.
- **No action** — Check that the mapping is enabled, events are unblocked, and the target entity and action exist.
- **Import rejected** — Follow the reported entry/field error. Older v0.1.3-beta maps need conversion first.
- **Save failed** — Check HA storage permissions, free space, and logs, then retry. The previous map remains active.
- **Another session changed the map** — Reload and review the newer data before saving.

For a hardware-free test, fire `esphome.rf433` in Developer Tools → Events with `{"protocol":1,"code":"111111111","command":"test"}`. Use your configured RF433 event name if you changed it.

## Documentation

- [Quick start](QUICKSTART.md) — Installation and your first mapping.
- [Adapter examples](examples/adapters/EXAMPLES_README.md) — Supported sources, device setup, and custom adapters.
- [Mapping editor reference](e2a-mapping-editor-reference.md) — Editor controls, service data, and import/export.

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
