# Changelog

All notable changes to Event2Action are documented in this file.

## v0.2.0 — changes from v0.1.3-beta

### Breaking changes

- Replaced the event and mapping field `pressed`/`button` with `command`.
- Changed ZHA mapping codes from the legacy numeric format to
  `<full-ieee-without-separators>-<endpoint>-<command>`.
- Existing v0.1.3-beta ZHA mappings must be migrated or learned again before they
  can be used with v0.2.0.

### Added

- Added `device_ieee` to normalized events, the last-event store, and saved
  mappings. The value is retained internally and is not displayed in the
  learning UI.
- Added an optional, case-insensitively unique friendly name (`name`) for each
  mapping. Friendly names are stored for organization and future functionality.
- Added optional logging for ignored, incomplete ZHA events through the
  `input_boolean.zha_ignored_event_logging` helper.
- Added a standalone v0.1.3-beta to v0.2.0 mapping migration utility:
  `migration/migrate-v0.1.3-to-v0.2.0.js`.
- Added native Windows Open and Save As dialogs to the migration utility when
  input or output paths are omitted.

### Changed

- ZHA codes now include the device's complete IEEE address instead of a decimal
  representation of its final three bytes.
- ZHA commands are normalized by removing the `remote_button_` prefix.
- The mapping editor's **Button** field is now **Command** and is prefilled from
  incoming `command` data, with legacy `pressed` data accepted as a fallback.
- New and edited mappings save `command` only; the legacy `button` property and
  temporary `temp` data are removed on save.
- The learning card displays the incoming command and a mapping's friendly name
  when available.
- The RF433 feeder now forwards `device_ieee` and `command` in its normalized
  event data.

### Migration

- The migration utility adds missing `device_ieee` values, renames `button` to
  `command`, removes temporary data, and rebuilds legacy ZHA codes.
- Existing matching IEEE addresses are reused where possible; otherwise the
  utility prompts for the sniffer or complete ZHA device address.
- Generated legacy ZHA button values are converted as follows:

  | v0.1.3-beta value | v0.2.0 value |
  |---|---|
  | `<endpoint>-press` | `short_press` |
  | `<endpoint>-dblPress` | `double_press` |
  | `<endpoint>-longPress` | `long_press` |
  | `<endpoint>-unknown` | `unknown` |

- Migration writes a separate JSON file and never modifies the source export or
  the active Home Assistant mapping.
