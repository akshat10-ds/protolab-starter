# Reproduce and integrate the private repair candidate

Run these commands only against the isolated candidates. No package installation is needed with the prepared dependency symlinks. A source archive and SHA-256 manifest are saved under `patches/2026-10-20-foundation-repair/`; extract into separate checkouts for durable review or reconstruction. The candidate does not represent a published Ink/AI release.

## Regenerate and validate

The exact executed command sequence is saved as `regenerate-candidate.sh` beside the archives. Its prepared paths are:

```sh
cd /private/tmp/protolab-foundation-repair/ink
TSX_HOOK=/Users/akshat.mishra/Documents/Work/protolab-mcp/node_modules/tsx/dist/cjs/index.cjs
node --require "$TSX_HOOK" scripts/bundle-data.ts
node --require "$TSX_HOOK" scripts/generate-template.ts
ln -s /Users/akshat.mishra/Documents/Work/protolab-starter/node_modules template/ink-starter/node_modules
AI_SOURCE_ROOT=/private/tmp/protolab-foundation-repair/ai/system/ai-system node scripts/check-source-contracts.mjs
AI_SOURCE_ROOT=/private/tmp/protolab-foundation-repair/ai-used-set-final node scripts/check-source-contracts.mjs
node scripts/check-template-contracts.mjs
node --test template/ink-starter/scripts/check-source-shadows.test.mjs
npm --prefix template/ink-starter run build
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node node_modules/vitest/vitest.mjs run
AI_SOURCE_ROOT=/private/tmp/protolab-foundation-repair/ai/system/ai-system node node_modules/vitest/vitest.mjs run --config tests/ai-source.config.ts
AI_SOURCE_ROOT=/private/tmp/protolab-foundation-repair/ai-used-set-final AI_USED_SET=1 node node_modules/vitest/vitest.mjs run --config tests/ai-source.config.ts
node node_modules/next/dist/bin/next build
AI_SOURCE_ROOT=/private/tmp/protolab-foundation-repair/ai/system/ai-system node scripts/check-source-contracts.mjs
```

The AI subset is a separate preparation step with a **new** output directory. Its seed is the preserved original starter set, not a wholesale copy of canonical AI:

```sh
node scripts/prepare-ai-used-set.mjs \
  /private/tmp/protolab-foundation-repair/ai/system/ai-system \
  /private/tmp/protolab-foundation-repair/starter-before/src/ai-system \
  /private/tmp/protolab-foundation-repair/ai-used-set-new
```

Inspect the adjacent manifest and use that path for subset checks and integration if regenerating it. The delivered final candidate is `ai-used-set-final` with its exact hashes in `contracts.json` and the saved manifest.

## Back up and refresh

The integrator owns this operation. Substitute a fresh backup path; preserve existing app, CSS, scenarios, fonts and deployment settings.

```sh
cd /Users/akshat.mishra/Documents/Work/protolab-starter
BACKUP_DIR=/private/tmp/protolab-foundation-repair/before-final-refresh
mkdir "$BACKUP_DIR"
cp -a src/design-system "$BACKUP_DIR/design-system"
cp -a src/ai-system "$BACKUP_DIR/ai-system"
cp version.json "$BACKUP_DIR/version.json"
rsync -a --delete /private/tmp/protolab-foundation-repair/ink/template/ink-starter/src/design-system/ src/design-system/
rsync -a --delete /private/tmp/protolab-foundation-repair/ai-used-set-final/ src/ai-system/
cp /private/tmp/protolab-foundation-repair/ink/template/ink-starter/version.json version.json
npm run test:source-shadows
npm run typecheck
npm run test:audit:design-system
npm run audit:design-system
npm run build
```

After the local checks, CUA must exercise refreshed screens and controls, including new families, keyboard skip/focus behavior, strict date entry, AIBadge top/bottom information controls, Iris sending/context, artifact navigation, panel resize and starter source-use constraints. Only the integrator may mark finding closure from the final refreshed evidence. Keep saved metadata comparisons distinct from browser/raster proof.
