"""Validated, transactional map storage independent of the transport."""

import asyncio
from copy import deepcopy
from datetime import datetime, timezone
import math

from .const import DEFAULT_BLOCK_SECONDS


def now():
    return datetime.now(timezone.utc).isoformat()


def validate_map(value):
    """Preserve metadata and order; reject ambiguous/invalid runtime entries."""
    if not isinstance(value, list):
        raise ValueError("Map must be a JSON array")
    result = deepcopy(value)
    for index, entry in enumerate(result):
        prefix = f"Entry {index + 1}"
        if not isinstance(entry, dict):
            raise ValueError(f"{prefix}: expected an object")
        for key in ("proto", "code"):
            if not isinstance(entry.get(key), str) or not entry[key]:
                raise ValueError(f"{prefix}: {key} must be a nonempty string")
        if not isinstance(entry.get("active", False), bool):
            raise ValueError(f"{prefix}: active must be a boolean")
        if not isinstance(entry.get("service_data", {}), dict):
            raise ValueError(f"{prefix}: service_data must be an object")
        if entry.get("active") is True:
            service = entry.get("service", "")
            entity = entry.get("entity", "")
            if not isinstance(service, str) or len(service.split(".")) != 2 or not all(service.split(".")):
                raise ValueError(f"{prefix}: active mapping requires a domain.service")
            if not isinstance(entity, str) or "." not in entity:
                raise ValueError(f"{prefix}: active mapping requires an entity ID")
    return result


def validate_settings(settings):
    if not isinstance(settings, dict):
        raise ValueError("Settings must be an object")
    seconds = settings.get("block_seconds", DEFAULT_BLOCK_SECONDS)
    if isinstance(seconds, bool) or not isinstance(seconds, (int, float)) or not math.isfinite(seconds) or seconds <= 0:
        raise ValueError("Blocking duration must be a positive number")
    return {"block_seconds": seconds}


class MapStorage:
    """Commit to disk before replacing the active map; serialize edits."""

    def __init__(self, store):
        self.store = store
        self.lock = asyncio.Lock()
        self.data = {
            "revision": 0,
            "runtime": {"map": [], "settings": {"block_seconds": DEFAULT_BLOCK_SECONDS}, "last_updated": now()},
            "session_backup": None,
            "step_backup": None,
        }

    async def load(self):
        loaded = await self.store.async_load()
        if loaded is None:
            return
        if not isinstance(loaded, dict) or type(loaded.get("revision")) is not int or loaded["revision"] < 0:
            raise ValueError("Invalid Event2Action storage revision")
        for slot in ("runtime", "session_backup", "step_backup"):
            record = loaded.get(slot)
            if record is None and slot != "runtime":
                continue
            if not isinstance(record, dict) or not isinstance(record.get("last_updated"), str):
                raise ValueError(f"Invalid {slot} storage record")
            validate_map(record.get("map"))
            validate_settings(record.get("settings"))
        self.data = deepcopy(loaded)

    def snapshot(self):
        return deepcopy(self.data)

    async def save(self, slot, mapping, settings, revision, capture_session=False):
        if slot not in ("runtime", "session_backup", "step_backup"):
            raise ValueError("Invalid storage slot")
        validated = validate_map(mapping)
        async with self.lock:
            if revision != self.data["revision"]:
                raise ValueError("Map changed in another session. Reload the card before saving again.")
            candidate = self.snapshot()
            record = {
                "map": validated,
                "settings": validate_settings(settings if settings is not None else candidate["runtime"]["settings"]),
                "last_updated": now(),
            }
            # A map edit and its undo snapshot are a single disk transaction.
            if slot == "runtime" and validated != candidate["runtime"]["map"]:
                candidate["step_backup"] = deepcopy(candidate["runtime"])
            if slot == "runtime" and capture_session:
                candidate["session_backup"] = deepcopy(candidate["runtime"])
            candidate[slot] = record
            candidate["revision"] += 1
            await self.store.async_save(candidate)
            self.data = candidate
            return self.snapshot()
