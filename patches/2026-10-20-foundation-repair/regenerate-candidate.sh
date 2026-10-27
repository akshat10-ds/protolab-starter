#!/bin/sh
set -eu
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
