# Token synchronization source follow-up

`authoring-source.tar.gz` preserves the changed Ink source files, the updated
template helper, and canonical AI source. `manifest.json` records SHA-256 for
every archived file and the archive itself; the archive contents were checked
against those hashes. Apply this to a separate copy of the 2026-10-20 repaired
authoring candidates, not to a starter's generated folders.

The source baseline is private Ink bundle `16c70f74eb3e3ee2`; this follow-up
produces `7428ea7b76fb3f5d`. No remote release was published. Starter-side
Figma exports, the emitter, tests and verification scripts remain ordinary
tracked project files under `tokens/figma/` and `scripts/`.

See `docs/figma-token-sync-2026-10-21/README.md` for reproduction, source
validation and backed-up integration. Temporary prepared paths are recorded
in the refresh manifests; this archive is the durable source copy.
