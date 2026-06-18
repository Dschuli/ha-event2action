# Required Helper Entities

Create these helper entities in Home Assistant before using the Event2Action Learning Card.

> For complete setup instructions, see [QUICKSTART.md](QUICKSTART.md) or [README.md](README.md).
> For detailed editor usage, see [e2a-mapping-editor-reference.md](e2a-mapping-editor-reference.md).

## How to Create Helpers

1. Navigate to **Settings** -> **Devices & Services** -> **Helpers**
2. Click **Create Helper**
3. Follow the instructions below for each helper

## Text Input Helper

**Type**: Text

**Configuration**:
- **Name**: `Event2Action Last Event Store`
- **Icon**: `mdi:gesture-tap-button` (optional)
- **Entity ID**: `input_text.event2action_last_event_store`
- **Mode**: Text
- **Maximum length**: 255
- **Pattern**: leave empty

**Purpose**: Stores the most recent normalized event data for the learning interface.

## Toggle Helper

**Type**: Toggle

**Configuration**:
- **Name**: `Event2Action Block Events`
- **Icon**: `mdi:cancel` (optional)
- **Entity ID**: `input_boolean.event2action_block_events`
- **Initial state**: Off

**Purpose**: Temporarily blocks mapped actions during learning mode to prevent unwanted activations while configuring mappings.

## Alternative YAML Configuration

If you prefer YAML configuration, add this to your `configuration.yaml`:

```yaml
input_text:
  event2action_last_event_store:
    name: Event2Action Last Event Store
    max: 255

input_boolean:
  event2action_block_events:
    name: Event2Action Block Events
    icon: mdi:cancel
```

Then restart Home Assistant.
