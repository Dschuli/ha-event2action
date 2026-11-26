"""HA Store wrapper that verifies writes before acknowledging them."""

import json

from homeassistant.helpers.storage import Store


class VerifiedStore(Store):
    """Store logs some write failures instead of raising; verify before ack."""

    def _read_data(self):
        with open(self.path, encoding="utf-8") as file:
            envelope = json.load(file)
        if not isinstance(envelope, dict) or not isinstance(envelope.get("data"), dict):
            raise ValueError("Invalid Event2Action storage envelope")
        return envelope["data"]

    async def async_load(self):
        # Reject malformed files before Store can rename them and return None.
        try:
            await self.hass.async_add_executor_job(self._read_data)
        except FileNotFoundError:
            pass
        return await super().async_load()

    async def async_save(self, data):
        await super().async_save(data)
        persisted = await self.hass.async_add_executor_job(self._read_data)
        if persisted != data:
            raise OSError("Event2Action storage write could not be verified")
