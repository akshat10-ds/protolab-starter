# Source contracts, tokens and generation — 2026-10-20

Status: source repair implemented. The integrator reports final starter source hash equality, zero TypeScript diagnostics, zero audit violations and a passing build; bounded main-app CUA now passes (see browser/root-checks.json). These are private review candidates. Nothing was pushed, published, merged, deployed or written to Figma.

The Ink candidate lives at `/private/tmp/protolab-foundation-repair/ink`; authoring source is `protolab-source/src/design-system`. It preserves the newer starter API before applying upstream repairs, as recorded in `source-reconciliation.json`. Canonical AI repairs live in `/private/tmp/protolab-foundation-repair/ai/system/ai-system`. The starter's generated folders were not edited by this agent.

## Contract and behavior repairs

- Public root and layer barrels preserve runtime exports, static members, authored prop/type exports, motion helpers and the new public families. `DataTableColumnVisibility` disambiguates the DataTable visibility type from Table's existing `ColumnVisibility`.
- SearchInput composes native event handlers and keeps controlled debounced input responsive; clearing, selecting and unmounting cancel pending searches. Dropdown handles enabled keyboard indices, nested menus, selected/checkable items, alert actions, end slots, persistent selection, trigger callbacks, default prevention and focus return. Popover preserves its child's ref and composes click/default-prevention behavior, portal positioning, dialog naming and Escape focus return.
- LocalNav navigation rows and per-item menu controls are separate native buttons. Menu controls have item-specific names; bubbled Enter/Space cannot invoke a wrapping navigation action. Active/collapsed geometry is retained, with three semantic/nesting/collapsed regressions.
- Button, Tooltip, Text and Icon API drift in patterns/layouts and table helpers is repaired against supported props. Hidden action bars use `inert` and `aria-hidden` while retaining their transitions.
- Canonical AI adapters now use supported FilterTag leading content, Input labels and start slots, primary page CTAs, document navigation, typed resize handlers and safe optional screen-state maps. SourceListView has named selection checkboxes and a real select-all label. ActivityTimeline normalizes arbitrary numeric color indices into the typed recipient palette.

## Token resolution

Every runtime Ink reference in the full Ink source and full canonical AI source resolves. Consumers use documented semantic roles; no undefined-name aliases were added. The unused AgentCanvas highlight/keyframe rules referring to missing yellow tokens were removed after confirming no component callsite. Existing generic monospace consumers now share an explicit `--ink-font-family-mono` token with the same monospace fallback.

The accepted body-xs→detail-s and spacing75→spacing100 normalizations were extended to the corresponding Ink consumers; these are documented normalizations, not claims of exact Figma specimens for every label. Shell canvas and AIChat expand controls use their page and secondary CTA roles. Ten confirmed Standard token discrepancies were repaired, and the existing glass effect token now matches the saved 16px effect.

Saved explicit-name Standard comparison: 367 equal, one intentional focus-inset difference, 78 without an explicit name mapping and 22 excluded deprecated/nonsemantic entries, across 1,094 declarations. `--ink-focus-inset` remains -4px under the prior accepted user decision although saved Figma reports zero. Inverse/touch runtime and every glyph raster/permutation are not proven by this comparison. See `contracts-evidence/token-comparison.json`.

## Generation delivery

The bundle and both full-template and MCP subset generation preserve authoritative barrels, declaration files, motion helpers, CSS, JSON provenance and SVG assets. Dependencies use parsed named imports, including barrel aliases. Every registry example compiles against the emitted public API; actual inherited native props are accepted by TypeScript rather than guessed by string scans. The catalog has 85 public/virtual entries, which is not a Figma family count.

Full authoring checks include `.figma.ts` with an explicit documented helper declaration. Generated projects remain ES2020, set `noEmit: true` in tsconfig and always typecheck with `--noEmit`. Both generated build and typecheck run `scripts/check-source-shadows.mjs`; its Node test detects emitted siblings while allowing standalone JavaScript. The source bundler refuses shadows before mutating the bundle. One compiler-output burst at 14:21:19 produced 256 untracked Ink/AI sibling outputs; they were preserved outside source, with exact hashes in `contracts-evidence/upstream-shadow-quarantine.json`. The process that emitted that burst was not conclusively identified. A later guarded build produced no recurrence. The integrator separately preserved three starter outputs from the same burst.

## AI starter provenance

`ai-used-set-final` is a private candidate seeded from the existing 78 released starter files and expanded by canonical import/type/asset closure to 96 files. It is not a new live-prototype used-set computation or a published AI release. Its adjacent manifest records every canonical/output hash, the 18 added dependency paths and the deliberate trimmed-barrel/generated-readme transformations. The full canonical source and the preserved subset have separate tests; unused full-system components were not copied merely to satisfy tests. The integrator verified local scripted Iris sending, attached source context, artifact pagination/zoom and panel resizing in the refreshed starter. The existing Open in Navigator callback remains a prototype hook.

## Validation and reproducibility

Final bundle `16c70f74eb3e3ee2` contains the LocalNav integration repair. Exact output hashes, paths, command results and durable source archives are recorded in `contracts.json`. Validation covers full Ink plus canonical AI and prepared AI subset strict source contracts with zero undefined tokens; emitted source parity; all registry examples; positive/negative public API probes; four actual MCP subset builds; source-shadow rejection before bundle writes; generated Vite build; server TypeScript and Next build; the default upstream suite; eight canonical AI SSR tests and four subset SSR tests.

Earlier control browser evidence contains six passing groups (Dropdown callbacks, nested states/keyboard, default prevention/dismissal, Popover refs/focus, debounced SearchInput and cleanup). It predates the final icon/family changes and is not a refreshed-starter browser pass. All subsequent browser verification belongs to the integrator through CUA. The final finding ledger records completed bounded integration checks with explicit visual and native-picker limits.

Final code checks: 22 upstream suites, 257 tests passed and five skipped; eight canonical AI tests and four preserved-subset AI tests passed. Source/archive recovery instructions are in `refresh-commands.md`; per-file archive checksums are in `../../patches/2026-10-20-foundation-repair/source-manifest.json`.
