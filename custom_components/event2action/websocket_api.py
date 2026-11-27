"""Admin-only storage and learning WebSocket API."""

import logging
import math

try:
    import probatio as vol
except ImportError:
    import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import callback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
_SIDEBAR_CARD_CONFIG = "sidebar_card_config"


def register(hass):
    websocket_api.async_register_command(hass, subscribe)
    websocket_api.async_register_command(hass, save)
    websocket_api.async_register_command(hass, block)
    websocket_api.async_register_command(hass, learning)
    websocket_api.async_register_command(hass, sidebar_card_config)


def get_runtime(hass, connection, msg):
    runtime = hass.data.get(DOMAIN, {}).get("runtime")
    if runtime is None:
        connection.send_error(msg["id"], "not_ready", "Set up the Event2Action integration first")
    return runtime


@websocket_api.websocket_command({
    vol.Required("type"): "event2action/subscribe",
    vol.Optional("auto_unblock", default=True): bool,
})
@websocket_api.require_admin
@callback
def subscribe(hass, connection, msg):
    runtime = get_runtime(hass, connection, msg)
    if runtime is None:
        return

    @callback
    def send(data):
        connection.send_event(msg["id"], data)

    connection.subscriptions[msg["id"]] = runtime.subscribe(send, msg["auto_unblock"])
    connection.send_result(msg["id"])
    send({**runtime.status(), "storage": runtime.storage.snapshot()})


@websocket_api.websocket_command({
    vol.Required("type"): "event2action/save",
    vol.Required("slot"): str,
    vol.Required("map"): list,
    vol.Required("revision"): int,
    vol.Optional("settings"): dict,
    vol.Optional("capture_session", default=False): bool,
})
@websocket_api.require_admin
@websocket_api.async_response
async def save(hass, connection, msg):
    runtime = get_runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        snapshot = await runtime.storage.save(
            msg["slot"], msg["map"], msg.get("settings"), msg["revision"], msg["capture_session"]
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_map", str(err))
        return
    except Exception:
        _LOGGER.exception("Could not persist Event2Action map")
        connection.send_error(msg["id"], "save_failed", "Could not save map to disk. Previous map remains active.")
        return
    runtime.notify(include_maps=True)
    connection.send_result(msg["id"], {"storage": snapshot, **runtime.status()})


@websocket_api.websocket_command({
    vol.Required("type"): "event2action/block", vol.Required("seconds"): vol.Any(int, float),
})
@websocket_api.require_admin
@callback
def block(hass, connection, msg):
    runtime = get_runtime(hass, connection, msg)
    if runtime is None:
        return
    seconds = msg["seconds"]
    if isinstance(seconds, bool) or not math.isfinite(seconds) or seconds < 0:
        connection.send_error(msg["id"], "invalid_duration", "Duration must be a finite nonnegative number")
        return
    runtime.block(seconds)
    connection.send_result(msg["id"], runtime.status())


@websocket_api.websocket_command({
    vol.Required("type"): "event2action/learning", vol.Required("enabled"): bool,
})
@websocket_api.require_admin
@websocket_api.async_response
async def learning(hass, connection, msg):
    runtime = get_runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        await runtime.set_learning(msg["enabled"])
    except ValueError as err:
        connection.send_error(msg["id"], "conflict", str(err))
        return
    except Exception:
        _LOGGER.exception("Could not start Event2Action learning session")
        connection.send_error(msg["id"], "save_failed", "Could not save the session backup. Learning state is unchanged.")
        return
    connection.send_result(msg["id"], {"storage": runtime.storage.snapshot(), **runtime.status()})


@websocket_api.websocket_command({
    vol.Required("type"): "event2action/sidebar_card_config",
    vol.Optional("config"): dict,
})
@websocket_api.require_admin
@callback
def sidebar_card_config(hass, connection, msg):
    """Read or save the sidebar card settings on the integration entry."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        connection.send_error(msg["id"], "not_ready", "Set up Event2Action first")
        return
    entry = entries[0]
    if "config" in msg:
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, _SIDEBAR_CARD_CONFIG: msg["config"]}
        )
    connection.send_result(msg["id"], entry.options.get(_SIDEBAR_CARD_CONFIG, {}))
