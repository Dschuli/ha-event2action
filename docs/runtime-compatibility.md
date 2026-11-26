# Runtime compatibility contract

Status: Legacy source-reviewed baseline, 2026-11-25. The old package is archived under `legacy/`; the integration implementation now has focused boundary tests in `tests/`, but live Home Assistant validation remains pending.

This document records behavior in the current YAML package and learning card. It supplements the [README](../README.md) and [editor reference](../e2a-mapping-editor-reference.md) with migration acceptance cases. It does not describe an implemented Python integration or report passing integration tests.

The [migration plan](../INTEGRATION-MIGRATION-PLAN.md) defines the intended replacement. Preserve the behavior marked **Preserve**. Cases marked **Change** are deliberate migration changes. Cases marked **Review** need an explicit decision or verification in a Home Assistant test instance before claiming parity.

Source references below identify file sections and function names so they remain useful when line numbers change. YAML template type conversion, automation queue overflow, and service error behavior must also be checked in the supported Home Assistant version; this review is static.

## Event normalization

Source: [`legacy/event2action.yaml`](../legacy/event2action.yaml), `event2action_rf433_feeder` and `event2action_zha_feeder`.

| ID | Input or condition | Current result / integration acceptance | Decision |
| --- | --- | --- | --- |
| E01 | `esphome.rf433` with `protocol: 1`, `code: "1234567"`, `command: "A"` | Fires `event2action_bus` with `source: rf433`, `origin_event_type: esphome.rf433`, protocol 1, the same code and command, default device `"0"`, original payload as `raw`, and generated `ts`. Runtime learning fields are stringified. | Preserve |
| E02 | RF433 has no `protocol`, but `proto: "custom"` | Uses `proto`. The YAML also falls back to `proto` when `protocol` is false-like. An absent fallback produces `"unknown"`. | Preserve; verify false-like/native-type edge cases |
| E03 | RF433 omits `device_ieee`, `code`, or `command` | Missing fields default respectively to `"0"`, `"0"`, and `""`. These defaults do not generally replace explicitly supplied null values. | Preserve absent-field defaults; Review null handling |
| E04 | ZHA has `device_ieee: "AA:BB:CC:DD:EE:FF:00:11"`, `endpoint_id: 1`, `command: "remote_button_short_press"` | Bus `proto` is lowercase `"zha"`; code is `"aabbccddeeff0011-1-short_press"`; command is `"short_press"`; device field retains the source IEEE value. Source/origin are `zha`/`zha_event`. Includes `raw` and generated `ts`. | Preserve |
| E05 | Same ZHA address uses hyphens or uppercase | Code strips colons and hyphens and lowercases the full address. Does not shorten the address. | Preserve |
| E06 | ZHA command contains `remote_button_` | Replaces occurrences of that text, rather than checking only a leading prefix. Published command is trimmed; code construction has no separate command-trimming step. | Preserve normal inputs; Review unusual whitespace |
| E07 | ZHA device, endpoint, or command is missing or null | No bus event. Logs a warning only when `input_boolean.zha_ignored_event_logging` is on. Empty strings and zero are not rejected by this null check. | Preserve null rejection; Review stricter validation |
| E08 | A custom UI/YAML automation fires `event2action_bus` | Uses the same runtime path as built-in adapters, without user Python code. `proto` and `code` select the mapping. Device and command support learning/display; source/raw metadata is not required for execution. | Preserve |

For custom adapters, document `proto` and `code` as stable strings. Include `device_ieee` and `command` when available. Do not require `raw`, `source`, or `origin_event_type` merely to execute a mapping. The legacy bus handler supplies defaults for missing fields; validation changes for malformed events must be documented.

## Map matching and action dispatch

Source: [`legacy/event2action.yaml`](../legacy/event2action.yaml), `event2action_bus_handler`; [`src/e2a-learning-card.js`](../src/e2a-learning-card.js), `findMapping`.

Use this baseline map for cases M01–M08:

```json
[
  {
    "proto": "1",
    "code": "1234567",
    "device_ieee": "receiver-a",
    "command": "A",
    "active": true,
    "entity": "light.test",
    "service": "light.turn_on",
    "service_data": { "brightness": 100 }
  }
]
```

| ID | Input or condition | Expected result | Decision |
| --- | --- | --- | --- |
| M01 | Bus event `proto: 1`, `code: 1234567` | Runtime stringifies event matching values and selects the baseline string-valued entry. Calls `light.turn_on`, targeting `light.test`, with `brightness: 100`. | Preserve |
| M02 | Same proto/code, different device, command, or source | Same entry executes. These additional fields are not part of the runtime key. Do not silently change the key to include the device address. | Preserve |
| M03 | Different proto or code, including case differences | No match and no action. No general case folding is applied by the bus handler. | Preserve |
| M04 | Duplicate entries share proto/code | Legacy selects the first entry even if inactive. Integration now skips inactive entries and executes the first active match in array order. If all matches are inactive, no action runs. The card prefers the same active entry, falling back to an inactive entry only for display/editing. | Change requested during live testing |
| M05 | Matching entry has `active: false`, missing `active`, or `active: "true"` | Does not execute; YAML requires boolean true. | Preserve |
| M06 | Empty map or no matching entry | No action. Still updates learning event data. | Preserve |
| M07 | No `service_data` field | Uses an empty object. Null or malformed values are not explicitly normalized by this YAML default. | Preserve omitted-field default; Review invalid values |
| M08 | Map entry stores numeric proto/code | Backend YAML compares against stringified event fields without explicitly converting stored fields. Card `findMapping` stringifies both entry and event fields, so frontend matching can differ from backend execution. Do not claim numeric map entries execute equivalently to strings. | Review import normalization; never silently create key collisions |
| M09 | Map sensor is unknown/unavailable/missing | Attempts the learning update, logs a missing-map error, and does not execute actions. | Change: use explicit integration readiness/error state, never replace corrupt storage with an empty map |

### Script service data

Source: `event2action_bus_handler`, branch where `entry.service.startswith('script.')`.

| ID | Mapping action | Expected dispatch | Decision |
| --- | --- | --- | --- |
| A01 | `service: "script.turn_on"`, entity `script.test`, data `{"steps": 5}` | Calls `script.turn_on` targeting `script.test` with `{"variables": {"steps": 5}}`. | Preserve |
| A02 | Script service data `{"variables": {"steps": 5}}` | Passes the data unchanged; does not wrap twice. | Preserve |
| A03 | Non-script service with nested service data | Passes service data through and targets `entry.entity`; does not wrap it in `variables`. | Preserve |
| A04 | Any service beginning with `script.` | Uses the same wrapping branch, even if that particular service does not accept variables. | Review: preserve existing valid calls; report invalid calls clearly |
| A05 | An action call fails | Call is marked `continue_on_error: true`. Verify recoverable errors do not prevent later queued events; do not promise all template/configuration errors are swallowed. | Preserve recoverable-error behavior |

## Ordering and repeated events

Source: automation `mode`/`max` settings and toggle delay in [`legacy/event2action.yaml`](../legacy/event2action.yaml).

| ID | Input or condition | Current result / acceptance | Decision |
| --- | --- | --- | --- |
| Q01 | Multiple bus events | Bus handler is queued, `max: 10` (running and queued runs). Preserve serial processing and verify overflow behavior in Home Assistant. | Preserve |
| Q02 | Repeated identical button events | Legacy YAML has no explicit deduplication. Integration now suppresses repeated toggle actions for the same proto/code/service/entity within the configured interval (default 500 ms) of the last admitted toggle; non-toggle repeats remain unchanged. | Change requested during live testing |
| Q03 | Toggle action | Legacy adds a 500 ms queue delay. Integration replaces that delay with per-mapping repeat suppression based on monotonic event arrival time, so queued repeats do not toggle back later. Events at or beyond the configured interval are allowed; suppressed packets do not extend the window. Learning still sees repeated events. | Change requested during live testing |
| Q04 | Concurrent RF433 adapter invocations | Adapter is `single`, so an invocation while it is running is not queued. | Review: do not accidentally multiply events; decide whether to retain adapter-level dropping |
| Q05 | Concurrent ZHA adapter invocations | Adapter is queued with `max: 10`; 50 traces retained. | Preserve normalization order; Review queue limits and diagnostics equivalents |
| Q06 | Blocking changes while events wait in queue | Blocking is checked when each run reaches its execution branch, not necessarily at event arrival. | Preserve |

## Learning and blocking

Sources: bus handler; `temporary_toggle` script; card `updated`, `setLastEventData`, `toggleLearningMode`, `blockEvents`, `unBlockEvents`, and lifecycle callbacks.

| ID | Input or condition | Current result / integration acceptance | Decision |
| --- | --- | --- | --- |
| L01 | Event arrives while blocked | Learning fields are updated before the block check; mapped action does not run. | Preserve |
| L02 | Event arrives while learning is off | Backend can still execute actions and update last-event data. Card does not automatically open the editor. | Preserve |
| L03 | Enable learning mode | Records the previous event timestamp, clears the edit lock, and requests a session backup. Enabling learning alone does not call `blockEvents`. | Preserve separation of learning and blocking |
| L04 | First valid new event while learning and editor unlocked | Opens editor for proto/code. Further events do not replace the locked draft. | Preserve |
| L05 | Event timestamp is not newer than the handled timestamp | Card does not reopen the editor for that event. | Preserve stale-event suppression |
| L06 | Request positive blocking duration | Card calls `temporary_toggle` with status on. Script uses restart mode, so a later request replaces the previous timer. Expiry turns blocking off. Explicit unblock uses off with zero seconds. | Preserve user-visible timer replacement and unblock |
| L07 | Duration absent from MQTT settings | Default is 60 seconds; optional card `default_block_seconds` can set initial fallback. A valid persisted `settings.block_seconds` overrides it when synced. No other runtime setting is consumed from that settings object. | Preserve duration setting after installation; Change migration resets to 60 |
| L08 | Leave card with `auto_unblock: true` (default) | Card attempts to unblock; stores learning mode and possibly remaining countdown in browser storage. Reconnection may re-block from the saved countdown. | Change at migration: ignore/clear stale keys; Review subsequent lifecycle design |
| L09 | Learning JSON exceeds the input-text helper's 255-character maximum | Helper update can fail, but `continue_on_error` allows execution to proceed. | Change: event subscription removes this transport limit |

The integration starts with learning off and no active block. Migration uses ordinary JSON import after the user removes the legacy package/card and restarts Home Assistant. No staged runtime, migration activation mode, or automatic legacy detector is planned; the documented cutover order prevents concurrent runtimes.

## Editing, backups, and JSON migration

Source: card `_build_new_map`, `_delete_from_map`, `_start_EditMode`, `_onEditorSave`, `_saveMap`, `_createBackupIfNeeded`, `_onUndo`, `_onExportMap`, and `_onImportMap`.

| ID | Operation | Current result / integration acceptance | Decision |
| --- | --- | --- | --- |
| D01 | Export current map | Downloads the current map array only. Includes entry metadata/service data, excludes runtime settings and both backups. Current UI refuses export of an empty map. | Preserve existing nonempty export compatibility; Review empty export UX |
| D02 | Import JSON array | Replaces rather than merges the current map, after confirmation and a session-backup attempt. Current importer checks array shape only. | Preserve replacement semantics; Change to backend validation with useful errors |
| D03 | Import invalid JSON or a non-array root | Reject without changing the map. For the new backend, reject invalid entries before any mutation too. | Preserve and strengthen |
| D04 | Save an edited entry | Key is proto/code; replacements keep position, new entries append, and unrelated entries retain their data. Edited entries remove legacy `button` and truthy `temp`. | Preserve normal edit behavior; Review malformed/duplicate keys |
| D05 | Delete a mapping | Removes every entry matching the proto/code composite key. | Preserve |
| D06 | Save a friendly name | Trims name; empty name removed. Rejects another mapping's name matching after trim and locale lowercase. | Preserve ordinary name uniqueness; Review locale policy |
| D07 | Entity/service missing | Editor can save after explicit confirmation. Existing maps may contain incomplete records. | Review: migration must report these, not silently discard them |
| D08 | Session/step backups after migration | New session captures pre-session map; edits/deletes capture pre-change map; undo restores step during learning and session outside learning. Legacy equality checks compare maps, not settings. Undo publishes a backup map with current runtime settings rather than restoring backup settings. | Preserve user-visible map undo; define transactional backend behavior |
| D09 | Map changed during editing | Legacy card uses timestamps and offers overwrite. | Change: backend revision checks and explicit conflict resolution |
| D10 | Legacy session/step history | Not transferred. Show warning before migration; no pre-migration undo available. Fresh backup history starts under the integration. | Change, agreed scope |
| D11 | Existing current-format JSON map | Preserve array order, boolean active values, string keys, target/service data, names, and other entry metadata. Do not require live MQTT access. Reset block duration to 60 seconds. | Preserve map; Change storage/settings/history |
| D12 | v0.1.3-beta mappings | Use the existing [migration procedure](../migration/README.md) for full IEEE addresses and code conversion. Do not guess missing addresses or claim raw old exports require no conversion. | Preserve explicit conversion path |

Retain dashboard card configuration separately: entity domains, service-data presets, auto-unblock, and log level are card options, not MQTT runtime settings.

## Legacy quirks requiring explicit decisions

Do not reproduce these accidentally or silently fix them while claiming exact parity:

- Runtime and frontend do not use `device_ieee` in the matching key. Changing this can break existing maps even though the newer schema stores device addresses.
- Frontend edit/delete keys concatenate `proto + ':' + code`; different pairs containing colons can collide. A Python tuple key avoids this ambiguity, but collision cases need migration reporting.
- Import validation currently accepts any array, including duplicates and incomplete records. Stronger validation needs actionable errors and an unchanged original export.
- `_createBackupIfNeeded` has confusing empty-map prompt control flow: its false response returns success without publishing, while the true response proceeds to publish. Define intended new behavior rather than preserving prompt labels as a specification.
- `_saveMap` clears editing state and enables undo in its final flow even after a publish failure. The integration must retain the prior active map and report failure; avoid claiming success or discarding unsaved work.
- The generic `script.temporary_toggle` supports helpers beyond Event2Action, off/toggle modes, and zero-duration operations. Replacing Event2Action's use does not automatically migrate external users of that script.

## Acceptance test handoff

The case IDs above are specifications for implementation tests, not executed tests. When the integration exists:

1. Turn E01–E08 into normalization fixtures with fixed clocks; compare normalized values and types. Verify YAML native-type edge cases in Home Assistant first.
2. Use the baseline map to test M01–M09 and record service calls for A01–A05, including duplicates, first-active precedence, and numeric-key rejection/normalization policy.
3. Use a controlled clock and blocked service calls for Q01–Q06 and L01–L09 to verify serialization, overflow, pacing, event visibility, and timer expiry.
4. Test D01–D12 with exported JSON fixtures; assert entry/order preservation and no mutation on validation or persistence failure.
5. In a real Home Assistant test instance, migrate with the legacy runtime disabled, restart, verify persisted data, and confirm each source event triggers exactly one action. Exercise rollback with the integration runtime disabled first.

Complete every Review decision and link the resulting implementation tests before marking runtime parity verified. See `tests/test_backend.py` and `tests/frontend.test.cjs` for implemented boundary tests. This historical baseline is not a claim of full live-HA parity.

## Implementation decisions for the integration branch

- Numeric map keys and invalid active action fields are rejected with entry-specific import errors. Existing string-valued keys, duplicate order and metadata are preserved. Matching now selects the first active entry. Incomplete inactive entries remain supported.
- Runtime event matching still uses only proto/code. No device-key schema change is included.
- Built-in adapters normalize immediately; the single bounded bus queue provides ordering and overflow handling. The former RF433 single-run drop window and separate ZHA queue/trace history are not reproduced.
- Null/missing required ZHA fields are rejected as before; the old logging helper is removed. RF433 fallback/default behavior for normal inputs is preserved; exotic YAML null/native-type cases still require live verification.
- Runtime step snapshots and map edits are atomic. Import captures a session snapshot in the same commit. Failed validation/saves preserve the prior runtime data; the card retains unsaved edits on save failure.
- Old backup history and browser learning/countdown state are excluded. Duration starts at 60 seconds. Normal map imports preserve the integration's current duration.
- The generic legacy temporary-toggle script and its external callers are not recreated. The integration provides its own blocking command and backend timer.
- Current local tests use boundary doubles, not Home Assistant itself. Setup, static frontend loading, WebSocket permissions, real service dispatch, restarts, and migration must still be exercised in HA before a stable release.

Toggle repeat suppression is now configurable through the integration options flow (`toggle_repeat_ms`), default 500 ms; 0 disables it. Settings apply live and reset the suppression history. The configured interval replaces fixed 500 ms references above.

Learning mode and blocking now have one backend state shared by all card instances. One session backup is captured on transition into learning. Auto unblock is handled on the last subscriber leaving, with a 3-second grace period canceled by a new subscriber. Unsaved drafts are local; runtime learning state is not persisted across HA restarts.
