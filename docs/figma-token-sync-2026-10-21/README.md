# Complete Figma token snapshot synchronization — 2026-10-21

Scope: every variable, every exported mode and every style in
`nAKX1rO3Mir2OCBdCkC5oq`. Figma and live Docusign were read-only. Changes are
local on `codex/fix-protolab-foundation`; no release was published.

Inputs: `tokens/figma/snapshot.json`, `styles.json` and the retained code-only
foundation in `compatibility.css`. The emitter and offline verifier are
`scripts/figma-token-model.mjs` and `scripts/sync-figma-tokens.mjs`. Tests cover
absent modes, cycles, unresolved aliases, name collisions, recipient values,
Touch sizing, density, inverse shorthand, gradient geometry and deliberate drift.

The emitter updates a separate authoring source. Ink's normal bundle/template
generators then create the starter copies. The refresh manifest records the
backup and exact hashes. The follow-up source archive in
`patches/2026-10-21-figma-token-sync/` applies to the prior foundation candidate
and preserves the work beyond its temporary checkout.

## Repeat the sync

1. Load the `figma-use` skill. Execute `tokens/figma/export-variables.plugin.js`
   read-only through `use_figma`, setting `offset` to 0, 60, 120, and so on.
   Merge only after checking IDs, counts, collections and all mode IDs. Preserve
   raw alias definitions. Run `export-styles.plugin.js` for the style snapshot.
2. Run `verify-live.plugin.js`; compare its canonical fingerprints with the
   export. Repeat extraction if the file changed during capture. Never accept
   partial responses or silently exclude unmatched names.
3. Keep `compatibility.css` as the code-only foundation, not generated output.
   Update the explicit mapping for actual naming changes. The model fails
   closed on collisions, incomplete modes, unknown types and unresolved aliases.
4. Generate into the separate authoring checkout:

   ```bash
   npm run tokens:generate -- /absolute/path/to/ink/protolab-source --ai-source /absolute/path/to/ai/system/ai-system
   node scripts/sync-figma-tokens.mjs --write-preview
   npm run test:tokens
   ```

5. There, run `bundle-data.ts` and `generate-template.ts` with the installed
   `tsx` runtime. Validate full source contracts, template contracts and build.
   Keep a single token CSS import in the public barrel; neither template CSS
   nor individual CSS modules should repeat it.
   Prepare the canonical AI used set with `prepare-ai-used-set.mjs`, preserving
   its seed and checking its manifest. Canonical AI's public barrel imports
   `@ink` once; its CSS modules must not repeat the Ink token sheet. Make the
   installed dependency runtime available when typechecking the isolated set.
6. Back up the starter's generated tree/version. Compare candidate files and
   preserve unrelated changes. Refresh from validated output and copy its
   `version.json`.
7. Run token checks, typecheck, source-use audit, tests and build. Open `#tokens`,
   run its browser check and inspect Standard/Inverse/Touch specimens. Recheck
   Home and Agreements.

`npm run tokens:check` is an offline snapshot check. Later Figma changes require
a fresh export and regeneration. No recurring automation or Figma write was
configured.

## Runtime integration

The public `@/design-system` barrel imports tokens once. Existing app content
is preserved. Medium/small Buttons use CTA size and flex-padding variables;
Touch modes produce 48px controls. Default DataTable rows use utility
`Table/itemHeight`; explicit compact/tall props retain their existing sizes.
Badge text uses semantic success/warning/error/subtle roles for Inverse mode.
The canonical AI source and its generated used set were refreshed to use the
same single import, avoiding a multi-megabyte duplicate CSS bundle.

The development `#tokens` view compares actual computed CSS with a generated
reference asset. It covers all exported values, style properties, Ink/utility
combinations and seven compatibility text aliases. This is not an exhaustive
component-variant or raster-fidelity test.
