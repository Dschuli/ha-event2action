# Hardware Wiring

Hardware wiring and firmware setup are outside the scope of this repository.

Event2Action consumes Home Assistant events. For RF433 use, provide an external source that fires `esphome.rf433` events with protocol/code data. For Zigbee button use, enable ZHA so Home Assistant emits `zha_event`.

See [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md) for the supported Event2Action setup path.
