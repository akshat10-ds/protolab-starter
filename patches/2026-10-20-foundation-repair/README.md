# Private foundation repair source candidates

Final generated bundle: `16c70f74eb3e3ee2`, built 2026-10-20T21:47:23.749Z.
No release, push, merge, deployment or Figma write was performed.

- `ink-source-candidate.tar.gz`: Ink authoring source, registry, generator/server code, tests, metadata, fonts and configuration (1,083 files). It includes preserved newer starter capabilities and all agents' frozen component repairs.
- `ai-source-candidate.tar.gz`: full canonical AI source candidate (158 files).
- `ai-used-set-candidate.tar.gz`: exact prepared starter AI subset (96 files), seeded from the existing 78-file release and expanded by canonical dependency closure. This is not a newly computed live-prototype used set.
- `ink-starter-kit.zip`: complete generated Vite starter, including source-shadow guards and SVG assets.
- `source-manifest.json`: base Git commits, every source file's SHA-256 and byte count, archive hashes and final generated version.
- `ai-used-set-manifest.json`: canonical/output hashes, deliberate transformations and the 18 added dependency files.
- `archive-verification.json`: successful independent reads of all source/subset archive members and all 957 runtime files in the generated ZIP.
- `regenerate-candidate.sh`: exact prepared-workspace generation and verification commands. Edit absolute paths when reconstructing elsewhere; reuse existing dependencies or install the declared packages in the review checkout.
- `export-candidates.py`: source snapshot/manifest exporter used for this delivery.

Extract each source archive into a separate checkout at its recorded base commit and review the resulting diff. Paths are repository-relative; no Git metadata, node_modules, caches or generated compiler siblings are included. The source candidates have no tracked deletions. The AI subset archive extracts directly into an empty AI output directory. The ZIP extracts as `ink-starter/`.

Checks and refresh commands are recorded in `docs/foundation-repair-2026-10-20/contracts.md`, `contracts.json` and `refresh-commands.md`. Refreshed-app browser verification and finding closure are owned by the integrator; the source evidence alone is not an all-permutation visual pass.
