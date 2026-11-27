"""Event2Action integration: local storage, event runtime, and bundled card."""

from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import add_extra_js_url, async_remove_panel, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.exceptions import ConfigEntryError

from .const import (
    CONF_RF433_ENABLED, CONF_SHOW_IN_SIDEBAR, CONF_TOGGLE_REPEAT_MS,
    CONF_ZHA_ENABLED, DEFAULT_TOGGLE_REPEAT_MS, DOMAIN, VERSION,
)
from .runtime import Runtime
from .storage import MapStorage
from .store import VerifiedStore
from .websocket_api import register

CARD_URL = f"/event2action/event2action-learning-card.js?v={VERSION}"
PANEL_PATH = "event2action-learning"


async def async_setup(hass, config):
    hass.data.setdefault(DOMAIN, {})
    register(hass)
    return True


async def async_setup_entry(hass, entry):
    storage = MapStorage(VerifiedStore(hass, 1, "event2action.maps", atomic_writes=True))
    try:
        await storage.load()
    except Exception as err:
        raise ConfigEntryError(f"Cannot load Event2Action maps: {err}") from err
    data = hass.data[DOMAIN]
    if not data.get("static_registered"):
        await hass.http.async_register_static_paths([
            StaticPathConfig("/event2action", str(Path(__file__).parent / "frontend"), False)
        ])
        data["static_registered"] = True
    add_extra_js_url(hass, CARD_URL)
    await async_update_panel(hass, entry)
    runtime = Runtime(
        hass, storage, entry.options.get(CONF_TOGGLE_REPEAT_MS, DEFAULT_TOGGLE_REPEAT_MS),
        rf433_enabled=entry.options.get(CONF_RF433_ENABLED, True),
        zha_enabled=entry.options.get(CONF_ZHA_ENABLED, True),
    )
    data["runtime"] = runtime
    runtime.start()
    entry.async_on_unload(entry.add_update_listener(async_update_options))
    return True


async def async_update_panel(hass, entry):
    """Hide only the sidebar entry; keep the panel reachable by its URL."""
    data = hass.data[DOMAIN]
    show = entry.options.get(CONF_SHOW_IN_SIDEBAR, True)
    if data.get("show_in_sidebar") == show:
        return
    if "show_in_sidebar" in data:
        async_remove_panel(hass, PANEL_PATH)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="event2action-panel",
        sidebar_title="Event2Action" if show else None,
        sidebar_icon="mdi:remote",
        module_url=CARD_URL,
        embed_iframe=False,
        require_admin=True,
    )
    data["show_in_sidebar"] = show


async def async_update_options(hass, entry):
    runtime = hass.data[DOMAIN].get("runtime")
    if runtime is not None:
        runtime.set_adapters_enabled(
            rf433_enabled=entry.options.get(CONF_RF433_ENABLED, True),
            zha_enabled=entry.options.get(CONF_ZHA_ENABLED, True),
        )
        repeat_ms = entry.options.get(CONF_TOGGLE_REPEAT_MS, DEFAULT_TOGGLE_REPEAT_MS)
        if runtime.toggle_repeat_seconds != repeat_ms / 1000:
            runtime.set_toggle_repeat_ms(repeat_ms)
    await async_update_panel(hass, entry)


async def async_unload_entry(hass, entry):
    runtime = hass.data[DOMAIN].pop("runtime")
    await runtime.stop()
    async_remove_panel(hass, PANEL_PATH)
    hass.data[DOMAIN].pop("show_in_sidebar", None)
    remove_extra_js_url(hass, CARD_URL)
    return True
