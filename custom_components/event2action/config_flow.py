"""Single-instance UI setup. Existing users use ordinary JSON import."""

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers.selector import BooleanSelector

try:
    import probatio as vol
except ImportError:
    import voluptuous as vol

from .const import (
    CONF_RF433_EVENT, DEFAULT_RF433_EVENT, validate_rf433_event,
    CONF_RF433_ENABLED, CONF_SHOW_IN_SIDEBAR, CONF_TOGGLE_REPEAT_MS,
    CONF_ZHA_ENABLED, DEFAULT_TOGGLE_REPEAT_MS, DOMAIN,
)


class Event2ActionConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure Event2Action."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return Event2ActionOptionsFlow()

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Event2Action", data={})
        return self.async_show_form(step_id="user")


class Event2ActionOptionsFlow(config_entries.OptionsFlow):
    """Configure global runtime behavior without reloading the integration."""

    async def async_step_init(self, user_input=None):
        errors = {}
        if user_input is not None:
            user_input = {**user_input, **user_input.get("advanced", {})}
            value = user_input.get(CONF_TOGGLE_REPEAT_MS)
            try:
                event_type = validate_rf433_event(user_input.get(CONF_RF433_EVENT, DEFAULT_RF433_EVENT))
            except ValueError:
                errors[CONF_RF433_EVENT] = "invalid_rf433_event"
            if type(value) is not int or value < 0:
                errors[CONF_TOGGLE_REPEAT_MS] = "invalid_toggle_repeat_ms"
            if not errors:
                return self.async_create_entry(title="", data={
                    **self.config_entry.options,
                    CONF_TOGGLE_REPEAT_MS: value,
                    CONF_RF433_EVENT: event_type,
                    CONF_SHOW_IN_SIDEBAR: user_input.get(CONF_SHOW_IN_SIDEBAR, True),
                    CONF_RF433_ENABLED: user_input.get(CONF_RF433_ENABLED, True),
                    CONF_ZHA_ENABLED: user_input.get(CONF_ZHA_ENABLED, True),
                })
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required(CONF_RF433_ENABLED, default=self.config_entry.options.get(
                    CONF_RF433_ENABLED, True
                )): BooleanSelector(),
                vol.Required(CONF_ZHA_ENABLED, default=self.config_entry.options.get(
                    CONF_ZHA_ENABLED, True
                )): BooleanSelector(),
                vol.Required(CONF_SHOW_IN_SIDEBAR, default=self.config_entry.options.get(
                    CONF_SHOW_IN_SIDEBAR, True
                )): BooleanSelector(),
                vol.Required("advanced"): section(
                    vol.Schema({
                        vol.Required(CONF_RF433_EVENT, default=self.config_entry.options.get(
                            CONF_RF433_EVENT, DEFAULT_RF433_EVENT
                        )): str,
                        vol.Required(CONF_TOGGLE_REPEAT_MS, default=self.config_entry.options.get(
                            CONF_TOGGLE_REPEAT_MS, DEFAULT_TOGGLE_REPEAT_MS
                        )): vol.All(int, vol.Range(min=0)),
                    }),
                    {"collapsed": not errors},
                ),
            }),
            errors={"advanced": errors} if errors else {},
        )
