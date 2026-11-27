"""Event adapters and serial in-memory action execution."""

import asyncio
from copy import deepcopy
import logging
from time import monotonic, time

from homeassistant.core import callback

from .const import BUS_EVENT, DEFAULT_TOGGLE_REPEAT_MS
from .storage import now

_LOGGER = logging.getLogger(__name__)
AUTO_UNBLOCK_GRACE_SECONDS = 3


def normalize_rf433(data):
    return {
        "source": "rf433", "origin_event_type": "esphome.rf433",
        "device_ieee": data.get("device_ieee", "0"),
        "proto": data.get("protocol") or data.get("proto", "unknown"),
        "code": data.get("code", "0"), "command": data.get("command", ""),
        "raw": data, "ts": now(),
    }


def normalize_zha(data):
    if any(data.get(key) is None for key in ("device_ieee", "endpoint_id", "command")):
        return None
    command = str(data["command"]).replace("remote_button_", "")
    ieee = str(data["device_ieee"]).replace(":", "").replace("-", "").lower()
    return {
        "source": "zha", "origin_event_type": "zha_event", "proto": "zha",
        "device_ieee": data["device_ieee"],
        "code": f"{ieee}-{data['endpoint_id']}-{command}", "command": command.strip(),
        "raw": data, "ts": now(),
    }


class Runtime:
    def __init__(self, hass, storage, toggle_repeat_ms=DEFAULT_TOGGLE_REPEAT_MS,
                 *, rf433_enabled=True, zha_enabled=True):
        self.hass = hass
        self.storage = storage
        self.listeners = set()
        self.unsubscribers = []
        self.last_event = None
        self.learning_mode = False
        self.learning_started_at = None
        self.learning_revision = None
        self._learning_lock = asyncio.Lock()
        self._auto_unblock_handle = None
        self.blocked_until = 0
        self._timer = None
        self._worker = None
        self._running = False
        self._queue = asyncio.Queue()
        self._last_toggle = {}
        self.set_toggle_repeat_ms(toggle_repeat_ms)
        self.set_adapters_enabled(rf433_enabled=rf433_enabled, zha_enabled=zha_enabled)

    @callback
    def set_adapters_enabled(self, *, rf433_enabled, zha_enabled):
        """Apply built-in adapter settings immediately, leaving the custom bus active."""
        self.rf433_enabled = rf433_enabled
        self.zha_enabled = zha_enabled

    @callback
    def set_toggle_repeat_ms(self, milliseconds):
        if type(milliseconds) is not int or milliseconds < 0:
            raise ValueError("Toggle repeat suppression must be a nonnegative integer in milliseconds")
        self.toggle_repeat_seconds = milliseconds / 1000
        self._last_toggle.clear()

    def status(self):
        return {
            "last_event": deepcopy(self.last_event),
            "blocked_until": self.blocked_until,
            "server_time": time(),
            "learning_mode": self.learning_mode,
            "learning_started_at": self.learning_started_at,
            "learning_revision": self.learning_revision,
        }

    @callback
    def subscribe(self, listener, auto_unblock=True):
        """Keep shared state across view switches; unblock after the last exit."""
        if self._auto_unblock_handle is not None:
            self._auto_unblock_handle.cancel()
            self._auto_unblock_handle = None
        self.listeners.add(listener)

        @callback
        def unsubscribe():
            self.listeners.discard(listener)
            if not self.listeners and auto_unblock and self.blocked_until:
                if self._auto_unblock_handle is not None:
                    self._auto_unblock_handle.cancel()
                self._auto_unblock_handle = self.hass.loop.call_later(
                    AUTO_UNBLOCK_GRACE_SECONDS, self._auto_unblock
                )

        return unsubscribe

    @callback
    def _auto_unblock(self):
        self._auto_unblock_handle = None
        if not self.listeners:
            self.block(0)

    async def set_learning(self, enabled):
        """Start one shared learning session and capture its backup once."""
        async with self._learning_lock:
            if enabled == self.learning_mode:
                return
            if enabled:
                data = self.storage.snapshot()
                await self.storage.save(
                    "session_backup", data["runtime"]["map"],
                    data["runtime"]["settings"], data["revision"],
                )
                self.learning_started_at = now()
                self.learning_revision = self.storage.data["revision"]
            self.learning_mode = enabled
            self.notify(include_maps=True)

    @callback
    def notify(self, include_maps=False):
        data = self.status()
        if include_maps:
            data["storage"] = self.storage.snapshot()
        for listener in tuple(self.listeners):
            listener(data)

    @callback
    def start(self):
        self.unsubscribers = [
            self.hass.bus.async_listen("esphome.rf433", self._rf433),
            self.hass.bus.async_listen("zha_event", self._zha),
            self.hass.bus.async_listen(BUS_EVENT, self._receive),
        ]

    @callback
    def _rf433(self, event):
        if self.rf433_enabled:
            self.hass.bus.async_fire(BUS_EVENT, normalize_rf433(event.data))

    @callback
    def _zha(self, event):
        if not self.zha_enabled:
            return
        if (data := normalize_zha(event.data)) is not None:
            self.hass.bus.async_fire(BUS_EVENT, data)

    @callback
    def _receive(self, event):
        # max=10 includes the currently executing event, as in the YAML runtime.
        outstanding = self._queue.qsize() + int(self._running)
        if outstanding >= 10:
            _LOGGER.warning("Event2Action queue full; dropping event")
            return
        # Capture arrival time before queueing: service latency must not turn a
        # repeated radio packet into a second toggle after it waits in the queue.
        self._queue.put_nowait((dict(event.data), monotonic()))
        if self._worker is None or self._worker.done():
            self._worker = self.hass.async_create_task(self._run())

    async def _run(self):
        self._running = True
        try:
            await self._drain()
        finally:
            self._running = False

    async def _drain(self):
        while not self._queue.empty():
            data, received_at = self._queue.get_nowait()
            self.last_event = {
                "device_ieee": str(data.get("device_ieee", "0")),
                "proto": str(data.get("proto", "unknown")),
                "code": str(data.get("code", "0")),
                "command": str(data.get("command", "")), "ts": now(),
            }
            self.notify()
            entry = next((item for item in self.storage.data["runtime"]["map"]
                          if item["proto"] == self.last_event["proto"]
                          and item["code"] == self.last_event["code"]
                          and item.get("active") is True), None)
            if self.blocked_until > time() or entry is None:
                continue
            if self.toggle_repeat_seconds and entry["service"].endswith(".toggle"):
                self._last_toggle = {
                    key: stamp for key, stamp in self._last_toggle.items()
                    if received_at - stamp < self.toggle_repeat_seconds
                }
                key = (entry["proto"], entry["code"], entry["service"], entry["entity"])
                if key in self._last_toggle:
                    _LOGGER.debug("Ignoring repeated toggle for %s within %s ms", key, self.toggle_repeat_seconds * 1000)
                    continue
                self._last_toggle[key] = received_at
            try:
                domain, service = entry["service"].split(".", 1)
                service_data = deepcopy(entry.get("service_data", {}))
                if domain == "script" and "variables" not in service_data:
                    service_data = {"variables": service_data}
                await self.hass.services.async_call(
                    domain, service, service_data, blocking=True,
                    target={"entity_id": entry["entity"]},
                )
            except Exception:  # Keep subsequent events running after action errors.
                _LOGGER.exception("Event2Action action failed")

    @callback
    def block(self, seconds):
        if self._timer:
            self._timer.cancel()
            self._timer = None
        self.blocked_until = time() + seconds if seconds else 0
        if seconds:
            self._timer = self.hass.loop.call_later(seconds, self.block, 0)
        self.notify()

    async def stop(self):
        if self._auto_unblock_handle is not None:
            self._auto_unblock_handle.cancel()
            self._auto_unblock_handle = None
        for unsubscribe in self.unsubscribers:
            unsubscribe()
        self.unsubscribers.clear()
        self.block(0)
        if self._worker is not None:
            self._worker.cancel()
            try:
                await self._worker
            except asyncio.CancelledError:
                pass
        self.listeners.clear()
