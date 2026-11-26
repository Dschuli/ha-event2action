"""Focused runtime/storage tests with HA boundary doubles (no HA installation)."""

import asyncio
from copy import deepcopy
import importlib
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import AsyncMock

ROOT = Path(__file__).resolve().parents[1]
package = types.ModuleType("event2action_test")
package.__path__ = [str(ROOT / "custom_components/event2action")]
sys.modules[package.__name__] = package
core = types.ModuleType("homeassistant.core")
core.callback = lambda function: function
sys.modules.setdefault("homeassistant", types.ModuleType("homeassistant"))
sys.modules.setdefault("homeassistant.core", core)
storage_module = importlib.import_module("event2action_test.storage")
runtime_module = importlib.import_module("event2action_test.runtime")


def mapping(**overrides):
    return {"proto": "1", "code": "42", "active": True, "service": "light.turn_on",
            "entity": "light.test", "service_data": {"brightness": 100},
            "name": "Example", "custom_metadata": {"keep": True}, **overrides}


class FileStore:
    def __init__(self, path):
        self.path = path
        self.fail = False

    async def async_load(self):
        return json.loads(self.path.read_text()) if self.path.exists() else None

    async def async_save(self, data):
        if self.fail:
            raise OSError("disk full")
        self.path.write_text(json.dumps(data))


class SilentHAStore:
    """HA boundary double emulating a write that logs and returns normally."""

    def __init__(self, hass, path):
        self.hass = hass
        self.path = path
        self.fail_silently = False

    async def async_load(self):
        try:
            return json.loads(Path(self.path).read_text())["data"]
        except FileNotFoundError:
            return None

    async def async_save(self, data):
        if not self.fail_silently:
            Path(self.path).write_text(json.dumps({"data": data}))


ha_storage = types.ModuleType("homeassistant.helpers.storage")
ha_storage.Store = SilentHAStore
sys.modules.setdefault("homeassistant.helpers", types.ModuleType("homeassistant.helpers"))
sys.modules.setdefault("homeassistant.helpers.storage", ha_storage)
VerifiedStore = importlib.import_module("event2action_test.store").VerifiedStore


class VerifiedStoreTests(unittest.IsolatedAsyncioTestCase):
    async def test_silent_write_failure_is_not_acknowledged(self):
        async def executor(function):
            return function()

        with tempfile.TemporaryDirectory() as directory:
            store = VerifiedStore(types.SimpleNamespace(async_add_executor_job=executor), str(Path(directory) / "maps"))
            await store.async_save({"revision": 1})
            store.fail_silently = True
            with self.assertRaises(OSError):
                await store.async_save({"revision": 2})
            self.assertEqual(await store.async_load(), {"revision": 1})

    async def test_malformed_json_rejected_before_ha_load(self):
        async def executor(function):
            return function()

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "maps"
            path.write_text("{broken")
            store = VerifiedStore(types.SimpleNamespace(async_add_executor_job=executor), str(path))
            with self.assertRaises(json.JSONDecodeError):
                await store.async_load()
            self.assertEqual(path.read_text(), "{broken")


class StorageTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.store = FileStore(Path(self.directory.name) / "maps.json")
        self.storage = storage_module.MapStorage(self.store)

    async def test_import_restart_and_metadata(self):
        entries = [mapping(), mapping(code="43", active=False)]
        await self.storage.save("runtime", entries, None, 0)
        restarted = storage_module.MapStorage(self.store)
        await restarted.load()
        self.assertEqual(restarted.data["runtime"]["map"], entries)
        self.assertEqual(restarted.data["runtime"]["settings"], {"block_seconds": 60})
        self.assertEqual(restarted.data["step_backup"]["map"], [])
        self.assertIsNone(restarted.data["session_backup"])

    async def test_failure_preserves_map_backup_and_revision(self):
        await self.storage.save("runtime", [mapping()], None, 0)
        previous = self.storage.snapshot()
        self.store.fail = True
        with self.assertRaises(OSError):
            await self.storage.save("runtime", [], None, 1)
        self.assertEqual(self.storage.data, previous)

    async def test_stale_edit_and_invalid_import_do_not_mutate(self):
        await self.storage.save("runtime", [mapping()], None, 0)
        previous = self.storage.snapshot()
        for entries, revision in [([], 0), ([mapping(code=42)], 1), ([mapping(active="true")], 1),
                                  ([mapping(service_data=None)], 1)]:
            with self.assertRaises(ValueError):
                await self.storage.save("runtime", entries, None, revision)
            self.assertEqual(self.storage.data, previous)

    async def test_atomic_undo_and_settings_change(self):
        await self.storage.save("runtime", [mapping()], None, 0)
        await self.storage.save("session_backup", [mapping()], None, 1)
        await self.storage.save("runtime", [mapping(code="43")], None, 2)
        backup = deepcopy(self.storage.data["step_backup"]["map"])
        await self.storage.save("runtime", backup, None, 3)
        self.assertEqual(self.storage.data["runtime"]["map"], [mapping()])
        old_backup = deepcopy(self.storage.data["step_backup"])
        await self.storage.save("runtime", [mapping()], {"block_seconds": 90}, 4)
        self.assertEqual(self.storage.data["step_backup"], old_backup)
        self.assertEqual(self.storage.data["runtime"]["settings"]["block_seconds"], 90)

    async def test_corrupt_storage_rejected(self):
        self.store.path.write_text('{"revision":0,"runtime":null}')
        with self.assertRaises(ValueError):
            await self.storage.load()

    async def test_concurrent_writers_only_one_commits(self):
        outcomes = await asyncio.gather(
            self.storage.save("runtime", [mapping()], None, 0),
            self.storage.save("runtime", [mapping(code="43")], None, 0),
            return_exceptions=True,
        )
        self.assertEqual(sum(isinstance(outcome, ValueError) for outcome in outcomes), 1)
        self.assertEqual(self.storage.data["revision"], 1)

    async def test_invalid_import_does_not_replace_session_backup(self):
        await self.storage.save("runtime", [mapping()], None, 0)
        previous = self.storage.snapshot()
        with self.assertRaises(ValueError):
            await self.storage.save("runtime", [mapping(code=None)], None, 1, capture_session=True)
        self.assertEqual(self.storage.data, previous)

    async def test_import_captures_session_in_same_commit(self):
        await self.storage.save("runtime", [mapping()], None, 0)
        await self.storage.save("runtime", [mapping(code="43")], None, 1, capture_session=True)
        self.assertEqual(self.storage.data["session_backup"]["map"], [mapping()])
        self.assertEqual(self.storage.data["runtime"]["map"], [mapping(code="43")])


class AdapterTests(unittest.TestCase):
    def test_rf433_defaults_and_alias(self):
        result = runtime_module.normalize_rf433({"proto": "custom", "code": "42"})
        self.assertEqual((result["proto"], result["code"], result["device_ieee"], result["command"]),
                         ("custom", "42", "0", ""))

    def test_zha_full_address_and_missing_fields(self):
        result = runtime_module.normalize_zha({"device_ieee": "AA:BB:CC:DD:EE:FF:00:11", "endpoint_id": 1,
                                                "command": "remote_button_short_press"})
        self.assertEqual(result["code"], "aabbccddeeff0011-1-short_press")
        self.assertEqual(result["proto"], "zha")
        self.assertIsNone(runtime_module.normalize_zha({"command": "press"}))


class RuntimeTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.storage = storage_module.MapStorage(None)
        self.hass = types.SimpleNamespace(
            loop=asyncio.get_running_loop(),
            services=types.SimpleNamespace(async_call=AsyncMock()),
            async_create_task=asyncio.create_task,
        )
        self.runtime = runtime_module.Runtime(self.hass, self.storage)
        self.addAsyncCleanup(self.runtime.stop)

    async def dispatch(self, data):
        self.runtime._receive(types.SimpleNamespace(data=data))
        await self.runtime._worker

    async def test_match_ignores_device_and_command(self):
        self.storage.data["runtime"]["map"] = [mapping()]
        await self.dispatch({"proto": 1, "code": 42, "device_ieee": "other", "command": "different"})
        self.hass.services.async_call.assert_awaited_once_with(
            "light", "turn_on", {"brightness": 100}, blocking=True, target={"entity_id": "light.test"})

    async def test_first_active_duplicate_wins(self):
        self.storage.data["runtime"]["map"] = [
            mapping(active=False), mapping(entity="light.first_active"), mapping(entity="light.second_active")
        ]
        await self.dispatch({"proto": "1", "code": "42"})
        self.hass.services.async_call.assert_awaited_once_with(
            "light", "turn_on", {"brightness": 100}, blocking=True, target={"entity_id": "light.first_active"})

    async def test_all_inactive_matches_do_not_execute(self):
        self.storage.data["runtime"]["map"] = [mapping(active=False), mapping(active=False)]
        await self.dispatch({"proto": "1", "code": "42"})
        self.hass.services.async_call.assert_not_awaited()

    async def test_block_keeps_learning_and_expires(self):
        self.storage.data["runtime"]["map"] = [mapping()]
        events = []
        self.runtime.listeners.add(events.append)
        self.runtime.block(1)
        await self.dispatch({"proto": "1", "code": "42"})
        self.assertEqual(events[-1]["last_event"]["code"], "42")
        self.hass.services.async_call.assert_not_awaited()
        await asyncio.sleep(1.05)
        await self.dispatch({"proto": "1", "code": "42"})
        self.hass.services.async_call.assert_awaited_once()

    async def test_script_variables_not_double_wrapped(self):
        for data in ({"steps": 5}, {"variables": {"steps": 5}}):
            self.storage.data["runtime"]["map"] = [mapping(service="script.turn_on", entity="script.test", service_data=data)]
            await self.dispatch({"proto": "1", "code": "42"})
            self.assertEqual(self.hass.services.async_call.call_args.args[2], {"variables": {"steps": 5}})

    async def test_service_failure_does_not_stop_next_event(self):
        self.storage.data["runtime"]["map"] = [mapping()]
        self.hass.services.async_call.side_effect = [RuntimeError("unavailable"), None]
        with self.assertLogs(runtime_module.__name__, level="ERROR"):
            await self.dispatch({"proto": "1", "code": "42"})
        await self.dispatch({"proto": "1", "code": "42"})
        self.assertEqual(self.hass.services.async_call.await_count, 2)

    async def test_queue_is_bounded_and_serial(self):
        self.storage.data["runtime"]["map"] = [mapping()]
        with self.assertLogs(runtime_module.__name__, level="WARNING"):
            for _ in range(12):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": "42"}))
        await self.runtime._worker
        # Exactly ten pending/running events are admitted.
        self.assertEqual(self.hass.services.async_call.await_count, 10)

    async def test_toggle_repeat_at_402ms_is_dropped_even_after_queue_delay(self):
        from unittest.mock import patch

        self.storage.data["runtime"]["map"] = [mapping(service="light.toggle")]
        with patch.object(runtime_module, "monotonic", side_effect=[100, 100.401928]):
            for _ in range(2):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": "42"}))
        # Simulate waiting behind another operation before processing the queue.
        # Arrival timestamps, rather than execution timestamps, decide suppression.
        await self.runtime._worker
        self.hass.services.async_call.assert_awaited_once()
        with patch.object(runtime_module, "monotonic", return_value=100.5):
            await self.dispatch({"proto": "1", "code": "42"})
        self.assertEqual(self.hass.services.async_call.await_count, 2)

    async def test_toggle_repeat_does_not_suppress_other_mapping_or_learning(self):
        from unittest.mock import patch

        self.storage.data["runtime"]["map"] = [mapping(service="light.toggle"), mapping(code="43", service="light.toggle")]
        events = []
        self.runtime.listeners.add(events.append)
        with patch.object(runtime_module, "monotonic", side_effect=[100, 100.2, 100.401928]):
            for code in ("42", "43", "42"):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": code}))
        await self.runtime._worker
        self.assertEqual(self.hass.services.async_call.await_count, 2)
        self.assertEqual([event["last_event"]["code"] for event in events], ["42", "43", "42"])

    async def test_non_toggle_repeats_are_not_suppressed(self):
        from unittest.mock import patch

        self.storage.data["runtime"]["map"] = [mapping()]
        with patch.object(runtime_module, "monotonic", side_effect=[100, 100.401928]):
            for _ in range(2):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": "42"}))
        await self.runtime._worker
        self.assertEqual(self.hass.services.async_call.await_count, 2)

    async def test_configured_toggle_interval_and_live_update(self):
        from unittest.mock import patch

        self.storage.data["runtime"]["map"] = [mapping(service="light.toggle")]
        self.runtime.set_toggle_repeat_ms(1000)
        with patch.object(runtime_module, "monotonic", side_effect=[100, 100.8, 101]):
            for _ in range(3):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": "42"}))
        await self.runtime._worker
        self.assertEqual(self.hass.services.async_call.await_count, 2)
        self.runtime.set_toggle_repeat_ms(100)
        with patch.object(runtime_module, "monotonic", side_effect=[102, 102.2]):
            for _ in range(2):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": "42"}))
        await self.runtime._worker
        self.assertEqual(self.hass.services.async_call.await_count, 4)

    async def test_zero_disables_toggle_suppression(self):
        from unittest.mock import patch

        self.storage.data["runtime"]["map"] = [mapping(service="light.toggle")]
        self.runtime.set_toggle_repeat_ms(0)
        with patch.object(runtime_module, "monotonic", return_value=100):
            for _ in range(2):
                self.runtime._receive(types.SimpleNamespace(data={"proto": "1", "code": "42"}))
        await self.runtime._worker
        self.assertEqual(self.hass.services.async_call.await_count, 2)

    def test_invalid_toggle_intervals_rejected(self):
        for value in (-1, 1.5, True, "500", None):
            with self.assertRaises(ValueError):
                self.runtime.set_toggle_repeat_ms(value)

    async def test_learning_is_shared_and_captures_one_session_backup(self):
        self.storage.store = types.SimpleNamespace(async_save=AsyncMock())
        self.storage.data["runtime"]["map"] = [mapping()]
        first, second = [], []
        self.runtime.subscribe(first.append)
        self.runtime.subscribe(second.append)
        await asyncio.gather(self.runtime.set_learning(True), self.runtime.set_learning(True))
        self.storage.store.async_save.assert_awaited_once()
        self.assertTrue(first[-1]["learning_mode"])
        self.assertTrue(second[-1]["learning_mode"])
        self.assertEqual(first[-1]["storage"]["session_backup"]["map"], [mapping()])
        newcomer = []
        self.runtime.subscribe(newcomer.append)
        self.runtime.notify()
        self.assertTrue(newcomer[-1]["learning_mode"])
        await self.runtime.set_learning(False)
        self.assertFalse(first[-1]["learning_mode"])
        self.assertFalse(second[-1]["learning_mode"])

    async def test_failed_session_backup_does_not_enable_learning(self):
        self.storage.store = types.SimpleNamespace(async_save=AsyncMock(side_effect=OSError("disk full")))
        with self.assertRaises(OSError):
            await self.runtime.set_learning(True)
        self.assertFalse(self.runtime.learning_mode)
        self.assertIsNone(self.storage.data["session_backup"])

    async def test_switching_views_preserves_block_and_last_exit_unblocks(self):
        from unittest.mock import patch

        with patch.object(runtime_module, "AUTO_UNBLOCK_GRACE_SECONDS", 0.05):
            leave_sidebar = self.runtime.subscribe(lambda data: None)
            self.runtime.block(60)
            leave_sidebar()
            leave_dashboard = self.runtime.subscribe(lambda data: None)
            await asyncio.sleep(0.07)
            self.assertGreater(self.runtime.blocked_until, 0)
            leave_dashboard()
            await asyncio.sleep(0.07)
            self.assertEqual(self.runtime.blocked_until, 0)

    async def test_leaving_one_of_two_cards_or_auto_unblock_off_keeps_block(self):
        first = self.runtime.subscribe(lambda data: None)
        second = self.runtime.subscribe(lambda data: None, auto_unblock=False)
        self.runtime.block(60)
        first()
        self.assertIsNone(self.runtime._auto_unblock_handle)
        second()
        self.assertIsNone(self.runtime._auto_unblock_handle)
        self.assertGreater(self.runtime.blocked_until, 0)


if __name__ == "__main__":
    unittest.main()
