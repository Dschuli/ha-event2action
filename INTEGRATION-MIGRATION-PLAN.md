# Event2Action integration and storage migration plan

Status: Implementation in progress; local boundary tests added, live Home Assistant validation pending
Date: 2026-11-25

## Objective

Replace Event2Action's MQTT-backed YAML package with a custom Home Assistant integration that bundles the runtime and learning card. Store mappings and backups through Home Assistant's versioned `Store` API. Use manual JSON export/import to preserve the current map. Users retire the legacy runtime before installing the integration to prevent duplicate action execution. Legacy session and step backups are excluded from migration with an explicit warning.

The target user experience is one integration installation, a setup flow, and an immediately accessible Event2Action interface. Depending on the Home Assistant version and existing installation, a restart or browser reload may still be required.

## Release strategy

1. Reuse the existing JSON map export; no dedicated transition release or migration bundle is planned.
2. Publish a beta integration with storage, runtime, bundled frontend, and ordinary JSON import/export.
3. Validate fresh installations, migrations, and rollback before publishing a stable integration release.

Keep the mapping format stable during this move. Treat changes to mapping semantics as a separate project.

## 1. Record the compatibility contract

The source-reviewed baseline and concrete acceptance cases are in [docs/runtime-compatibility.md](docs/runtime-compatibility.md). Focused tests now verify the Python storage/runtime and frontend boundaries. Full live Home Assistant parity is not yet verified.

- [x] Inventory runtime maps and their `settings` fields.
- [x] Document that legacy session and step backups are not migrated; retain backup functionality for new integration sessions.
- [x] Record RF433 and ZHA normalization behavior.
- [x] Record action execution behavior, including script variables, matching, queueing, and blocking.
- [x] Record learning mode, timed blocking, undo, and import/export behavior.
- [x] Record existing dashboard options and custom event adapter expectations.
- [x] Specify preservation of the `event2action_bus` event contract so existing custom adapters continue working without Python code.
- [ ] Resolve the contract's Review items and verify Home Assistant template and queue edge cases.
- [ ] Implement the contract's acceptance cases as tests when the integration runtime is introduced.

Acceptance: a current map produces the same actions after migration without relearning buttons.

Current implementation references:

- `legacy/event2action.yaml`: archived helpers, adapters, bus handler, temporary blocking script, and MQTT sensors.
- `src/e2a-learning-card.js`: MQTT publishing, sensor polling, backups, and blocking calls.
- `src/e2a-config.js`: default entities, topics, and card configuration.
- `migration/`: existing v0.1.3-beta mapping conversion.

## 2. Define JSON export/import migration

- [ ] Reuse the current card's JSON export of the active map as the primary migration format.
- [ ] Accept existing map-only JSON exports in the integration without requiring a new migration bundle.
- [ ] Verify all mapping fields survive export and import unchanged.
- [ ] Document that the current export contains map entries only. The only runtime setting currently consumed is `block_seconds`; reset it to the default of 60 seconds during migration. Retain dashboard card configuration separately.
- [ ] Display this warning before migration: "Only the current map will be migrated. Previous session and step backups will not be transferred, so undo cannot restore pre-migration states. Blocking duration will reset to 60 seconds. Keep your JSON export."
- [ ] Initialize legacy backup history as unavailable; establish fresh backups under the integration's normal backup rules.
- [ ] Start with learning mode off and no active event block. Ignore or clear legacy browser keys `e2a_learning_mode` and `e2a_block_time` so stale browser state does not reactivate learning or blocking after migration.
- [ ] Explain how older v0.1.3-beta exports use the existing conversion tool before import.
- [ ] Document exporting the current map and taking a Home Assistant backup before migration.
- [ ] Put the short migration warning in the upgrade instructions and integration import flow; no legacy card update is required.

Acceptance: an existing user can migrate using the current JSON map export, with explicit disclosure of excluded history and the blocking-duration reset. No manual runtime-setting migration is required.

## 3. Create the integration skeleton

Proposed structure:

```text
custom_components/event2action/
  manifest.json
  __init__.py
  config_flow.py
  const.py
  storage.py
  runtime.py
  websocket_api.py
  frontend.py
  strings.json
  translations/en.json
  frontend/event2action-learning-card.js
```

- [ ] Implement one normal UI setup flow, shared by new and upgrading users; no migration mode or wizard.
- [ ] Support one Event2Action instance initially.
- [ ] Add options for adapters and runtime settings.
- [ ] Implement setup, unload, and reload lifecycle handling.
- [ ] Ensure the integration starts without MQTT installed.
- [ ] Select and document the minimum supported Home Assistant version.

## 4. Implement versioned persistent storage

- [ ] Use Home Assistant's `Store` API for runtime maps, settings, session/step backups, and revision.
- [ ] Load storage during integration setup.
- [ ] Build an in-memory lookup preserving current matching behavior.
- [ ] Validate map entries and settings before saving.
- [ ] Serialize mutations and check expected revisions to prevent lost updates between browser tabs.
- [ ] Save map and backup changes together in one storage document.
- [ ] Await persistence before activating the new in-memory state and confirming success.
- [ ] Keep the previous active state when saving fails and report the failure to the card.
- [ ] Define storage-version migrations and behavior for corrupt or unsupported storage.
- [ ] Never silently replace unreadable storage with an empty map.

Acceptance: confirmed saves survive restart; button presses use memory without disk access.

## 5. Port the YAML runtime into Python

| Legacy component | Integration replacement |
| --- | --- |
| RF433 feeder | Listener for `esphome.rf433` |
| ZHA feeder | Listener for `zha_event` |
| Bus handler | Listener for `event2action_bus` |
| Last-event input text | Learning event subscription |
| Blocking helper and `temporary_toggle` | Integration-owned blocking state and timer |
| MQTT map sensors | Storage manager and WebSocket API |

- [ ] Preserve normalization, action execution, script-variable handling, queueing, and error behavior.
- [ ] Keep event normalization and action execution modular for runtime testing; no migration-specific execution mode.
- [ ] Replace timed blocking with integration-owned state and timers.
- [ ] Define blocking behavior after restart and timer expiry.
- [ ] Clean up subscriptions and timers on unload.
- [ ] Expose focused entities or services where useful for user automations; do not expose entire maps as state attributes by default.

Acceptance: representative event/action cases behave identically to the legacy runtime.

## 6. Move the card to the integration API

- [ ] Add a frontend backend-client layer.
- [ ] Replace MQTT publishing with map-save WebSocket commands.
- [ ] Replace map sensor reads with map-fetch commands.
- [ ] Replace sensor polling with direct save acknowledgments and backend updates.
- [ ] Subscribe to learning events and map revisions.
- [ ] Replace `script.temporary_toggle` calls with dedicated blocking commands.
- [ ] Move backup creation and restoration into the backend.
- [ ] Validate permissions server-side and restrict editing to administrators.
- [ ] Handle connection loss, reconnect, revision conflicts, and backend/frontend version incompatibility.
- [ ] Preserve the card type, editor, and existing card configuration where practical.
- [ ] Replace package/MQTT setup messages with integration setup guidance.
- [ ] Keep JSON import/export available.

Acceptance: learning, editing, blocking, undo, and import/export work with no MQTT services or map sensors.

## 7. Bundle and register the frontend

- [ ] Build the card into the integration release artifact.
- [ ] Serve the bundled JavaScript through supported Home Assistant frontend mechanisms.
- [ ] Register the frontend and version its URL for cache refresh.
- [ ] Provide an immediately accessible Event2Action interface.
- [ ] Support use of the card in existing dashboards.
- [ ] Handle storage-managed and YAML-managed dashboard resources explicitly.
- [ ] Provide migration instructions for removing old resource references and avoiding duplicate custom-element registration.

Acceptance: fresh users install only the integration and can open Event2Action after setup.

## 8. Keep migration limited to normal JSON import

- [ ] Accept the existing current-map JSON array through the integration's ordinary import action.
- [ ] Validate entries before saving and show clear errors without changing the current map on failure.
- [ ] Confirm replacement of an existing map and show the imported entry count.
- [ ] Show one warning: "Previous session and step backups will not transfer. Blocking duration resets to 60 seconds. Keep your original JSON export."
- [ ] Do not add automatic MQTT import, legacy-installation detection, resumable migration, migration provenance, a dedicated wizard, or a migration activation mode.

Acceptance: the existing export can be imported using the normal card interface, with understandable validation and replacement confirmation.

## 9. Document and verify manual cutover

1. Export the active map to JSON and retain the file. Keep any custom dashboard card configuration separately. A Home Assistant backup is recommended.
2. Remove the old package from the included packages directory and remove the standalone card installation and resource reference.
3. Restart Home Assistant so the legacy runtime is no longer running.
4. Install and set up the new integration normally.
5. Import the JSON map, read the backup-history/default-duration warning, and verify the entry count.
6. Test representative buttons, learning, blocking, and newly created undo history.

Keep retained MQTT data and the original export until satisfied with the upgrade. Do not remove the general `packages:` configuration if other packages use it, or MQTT if other integrations use it. Review external automations that reference legacy helpers or `script.temporary_toggle` before removing them.

No automatic conflict detector is planned. The documented ordering prevents the legacy and integration runtimes from executing concurrently.

Acceptance: each physical event executes its mapped action once, the current map is preserved, blocking duration defaults to 60 seconds, and fresh backup history works.

## 10. Document simple rollback

1. Disable or remove the integration and restart Home Assistant before restoring the old runtime.
2. Restore the previous package, standalone card, and resource reference, then restart Home Assistant.
3. Import the retained original JSON export through the old card if needed.

- [ ] Keep the old release and original JSON export available.
- [ ] Explain that rollback restores the exported snapshot; later integration edits are not included in that file.
- [ ] Verify this manual procedure once in the Home Assistant test installation.

No automated rollback or special reverse-conversion tooling is planned.

Acceptance: users can return to the previous release and known map snapshot without duplicate execution.

## 11. Test the complete lifecycle

- [ ] Fresh installation without MQTT or a broker.
- [ ] Restart persistence and storage-version upgrades.
- [ ] RF433 and ZHA normalization and action parity.
- [ ] Script variables, queueing, and action error handling.
- [ ] Save failures and simultaneous browser edits.
- [ ] Learning subscriptions, blocking expiry, reconnect, and unload cleanup.
- [ ] New session/step backups and restoration; excluded legacy history and its migration warning.
- [ ] Empty maps, invalid imports, and unsupported formats.
- [ ] Manual cutover order leaves only the integration runtime active.
- [ ] Frontend resource replacement and cache refresh.
- [ ] Full migration and rollback on a real Home Assistant test installation.

## 12. Publish and retire the legacy distribution

- [ ] Before publishing, change the sidebar's **Adapter examples** link in `src/e2a-panel.js` from `integration-migration` to `main`, ensure the examples are merged into `main`, and rebuild the frontend bundles with `npm run build`.
- [ ] Validate current Marketplace/HACS integration packaging requirements before changing distribution metadata.
- [ ] Decide how the existing card listing transitions to the integration listing; document the path for current users.
- [ ] Add release automation that builds and packages matching backend and frontend versions.
- [ ] Run integration and distribution validation in CI.
- [ ] Publish beta releases with separate fresh-install and migration instructions.
- [ ] Publish stable only after migration and rollback acceptance checks pass.
- [ ] Make integration installation the primary README and quickstart path.
- [ ] Mark the YAML package and standalone card distribution as legacy.
- [ ] Keep the legacy export-capable release, mapping conversion utility, and migration documentation available.
- [ ] Use versioned storage migrations for future data-format changes.

## Completion criteria

- New users install one integration with no Event2Action-specific MQTT or package setup.
- Runtime and frontend are released and updated together.
- Maps and backups persist in Home Assistant storage and execute from memory.
- Existing users can import their current JSON map without relearning buttons; blocking duration resets to 60 seconds, and excluded legacy backup history is clearly disclosed.
- The supported cutover prevents duplicate action execution.
- Migration failures preserve original data and offer a tested rollback path.

## Reference documentation

- [Marketplace installation types and HACS compatibility](https://contributors.home-assistant.io/marketplace/how-it-works/)
- [Dashboard distribution and resource handling](https://contributors.home-assistant.io/marketplace/guides/dashboard/)

Implementation must verify the supported Home Assistant APIs and packaging rules for the selected minimum version.
