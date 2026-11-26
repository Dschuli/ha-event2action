# Legacy YAML package

`event2action.yaml` is retained only as the source baseline and rollback reference for the old card release. It uses MQTT sensors and must not run alongside the new Event2Action integration, which would execute actions twice.

For new installations and manual JSON migration, follow [QUICKSTART.md](../QUICKSTART.md). For rollback, disable/remove the integration and restart before restoring the matching old card/package release. Do not pair this package with the new card.
