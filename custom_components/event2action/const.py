"""Event2Action constants."""

DOMAIN = "event2action"
VERSION = "0.3.0"
BUS_EVENT = "event2action_bus"
DEFAULT_BLOCK_SECONDS = 60
CONF_TOGGLE_REPEAT_MS = "toggle_repeat_ms"
DEFAULT_TOGGLE_REPEAT_MS = 500
CONF_SHOW_IN_SIDEBAR = "show_in_sidebar"
CONF_RF433_ENABLED = "rf433_enabled"
CONF_ZHA_ENABLED = "zha_enabled"
CONF_RF433_EVENT = "rf433_event"
DEFAULT_RF433_EVENT = "esphome.rf433"


def validate_rf433_event(value):
    """Reject empty, wildcard, and adapter-output events to prevent loops."""
    if not isinstance(value, str) or not value.strip() or value.strip() in ("*", BUS_EVENT, "zha_event"):
        raise ValueError("Choose a source event other than *, event2action_bus, or zha_event")
    return value.strip()
