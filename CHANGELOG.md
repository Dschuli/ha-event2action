# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Project scope narrowed to the Event2Action editor, runtime, MQTT storage, helper scripts, and feeder automations.
- RF433 handling now assumes an external source emits `esphome.rf433` events.
- ZHA button handling is normalized through the shared `event2action_bus` flow.

### Removed

- Bundled RF433 firmware directory.
- Optional helper examples that are outside the current Event2Action scope.
- Hardware setup instructions from the core project documentation.

### Features

- Learning mode interface for mapping event codes.
- Visual editor for creating and editing mappings.
- Session and step-level backup with undo functionality.
- Import/export functionality for mappings.
- Event blocking for temporary suspension of actions.
- MQTT-based state management.
- Configurable logging levels.
- Responsive Lovelace UI.

## Project Structure

- `/homeassistant` - Home Assistant automations, scripts, MQTT sensors, and frontend files
- Markdown documentation for setup, helpers, and editor usage
