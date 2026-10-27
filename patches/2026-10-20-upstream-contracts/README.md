# Upstream contract repair patches — 2026-10-20

Two reviewable patches repair the authoritative sources without editing the
starter's generated folders. The isolated generated template and compatibility
copy both typecheck and build. **These patches are not a compatible release yet:**
the local upstream component source predates capabilities already in the starter,
and several token meanings still need an approved specification.

## What to review

| Artifact | Target and scope |
|---|---|
| `protolab-mcp.patch` | 30 files in `../protolab-mcp`: authoritative Ink components/tokens, bundle/template generation, and release validation. |
| `akshat-lab.patch` | 5 files in `../akshat-lab/system/ai-system`: canonical companion callers, including their typed Dropdown trigger. |
| `source-manifest.json` | SHA-256 preimages/postimages for every patch file. The validator rejects changed preimages. |
| `source-drift.json` | Runtime source-file differences that must be reconciled before a wholesale refresh. |
| `validation.json`, `validation/` | Recorded checks and remaining issues. |
| `validate-isolated.py`, `runtime-semantics.mjs` | Repeatable checks using existing local dependencies and disposable copies. |

The patches contain no production `any` additions, suppression comments, compiler
exclusions, or starter-only token aliases. Negative API test cases intentionally
use `@ts-expect-error`; an unexpectedly permissive API makes those tests fail.

The component repairs cover incompatible native `onChange` overrides, browser
refs/timers under React 19, typed cloned-child props, the actual FilterTag ref
nodes, legacy callers, and breadcrumb link semantics. Source public barrels now
survive bundling/template generation; previously the generator overwrote them
and erased exported types. The generated starter's build now includes TypeScript,
and the MCP build checks its generated public API before publishing assets.

Typography references move to their existing semantic names. A canonical,
mode-independent monospace token preserves the consumers' explicit existing
`monospace` fallback. Unsupported AI `FilterTag.icon` and `Tooltip.size` props are
removed because the installed components ignore them; the patches do not invent
an icon treatment or a compact tooltip appearance.

## What the checks establish

- Fresh template generated from the patched authoritative Ink source: **zero
  TypeScript diagnostics**, positive/negative public API probes pass, build passes.
- **Nine server-rendered semantic assertions** pass: breadcrumb link and name,
  FilterTag root elements, trigger aria attributes, and destructive action mapping.
- Current starter copied privately, with only the reviewed source repair deltas:
  **zero TypeScript diagnostics and a passing build**, after the separate app-owned
  `sidebarMap` annotation below. The original 61 generated diagnostics are removed
  in that compatibility copy.
- Current token inventory improves from **14 names / 38 references** to
  **9 names / 26 references**. No ambiguous replacement is guessed.
- Both patches apply cleanly in disposable copies and produce exact manifest
  postimages. The source checkouts remain unchanged.

The separate application correction needed when exported types are restored is:

```tsx
const sidebarMap: Record<TabId, React.ComponentProps<typeof DocuSignShell>['localNav']> = {
  // existing entries
};
```

Its old `object | undefined` annotation erased the required sidebar fields.
This app correction is not part of either upstream patch.

These checks do not verify interactive browser behavior, current Figma equality,
production screenshots, the full Lab HQ regression surface, or a live publication.
The source patches were reviewed against the React quality checklist; existing
barrel/component conventions take precedence over generic import suggestions.

## Release prerequisites that remain

1. **Reconcile source drift.** There are 72 differing shared `.tsx`/`.css` files and
   three starter-only runtime files. A fresh wholesale replacement in the latest
   private starter copy produces **six App diagnostics**: absent `BarChart` and
   `IrisIconInverse` exports, the old required label on Dropdown dividers, and
   missing `Dropdown.variant`, `FilterBar.rightAlignFilters`, and
   `DataTable.bordered`. Earlier copies produced five before the app used the
   newer Dropdown capability. Recover the reviewed source/provenance for those
   releases; port approved changes back into the authoritative source. Do not
   copy the older generated folder over this starter.
2. **Resolve token intent.** Remaining current names include canvas and neutral
   backgrounds, `body-xs`, annotation yellow, and spacing-75. Two other names
   occur in newer starter styles absent from this older source snapshot:
   `--ink-font-color` and `--ink-font-color-link-subtle`. Reconcile those styles
   using the approved `font-color-default` and `font-color-link-subtle-default`
   roles where established. The upstream source's textual inventory improves
   from 28 names / 80 references to 23 / 70; that older inventory also includes
   documentation references. See the JSON inventories for exact locations.
3. **Validate the actual AI used set.** Compiling the entire current canonical
   AI system against the current Ink snapshot still reports **16 additional
   diagnostics**. They include Timeline, Accordion, Input and SuggestionChip API
   differences and older/deprecated components. Classify them against the live
   release closure; do not call the entire canonical system or its release gate
   clean. The current released used set's repaired compatibility copy is clean.
4. **Run visual and interaction checks.** No distinct AIIcon geometry, composed
   PageHeader API, Iris CTA variant, or new visual state is supplied by this
   contract patch. Those remain separate approved design/API work.

## Authoritative locations and delivery paths

- Ink source: `../protolab-mcp/protolab-source/src/design-system/`.
  `scripts/bundle-data.ts` reads it (or `PROTOLAB_ROOT`) into `data/bundle.json`
  and static source assets. `scripts/generate-template.ts` emits
  `template/ink-starter/`, `version.json` and the starter-kit download zip.
  Its version hash covers the bundle; it does not prove visual parity.
- AI source: `../akshat-lab/system/ai-system/`. The canonical
  `../akshat-lab/.claude/skills/release-chat-to-protolab/SKILL.md` computes the
  current used-set closure and delivers it through a reviewed starter PR,
  with the tag only after merge. Follow its current preflight, confirmation,
  regression and review requirements when actually cutting a release.
- The current starter `/update` and plugin `/update` recipes refresh Ink only.
  An Ink zip update cannot deliver a new AI release. Refresh both compatible
  releases deliberately; retain their separate provenance.
- The old architecture diagram mentions an automatic GitHub sync. The inspected
  MCP checkout has no `.github/workflows/`; the starter only has a prototype
  publishing workflow. An automatic component sync was **not established**.

## Reproduce without modifying a source checkout

From the starter, with its and MCP's dependencies already installed:

```sh
python3 patches/2026-10-20-upstream-contracts/validate-isolated.py
```

The runner prints its private workspace and writes logs plus `validation.json`
there. Optional `--starter`, `--mcp` and `--lab` arguments select other checkouts.
It does not install packages, fetch, commit, push, publish, or edit those roots.

## Apply and refresh after review

The following are maintainer actions, **not actions performed by this task**.
First select clean review branches in the two authoritative repositories and
check `source-manifest.json` against those branches. Then check and apply:

```sh
PATCHES=/absolute/path/to/protolab-starter/patches/2026-10-20-upstream-contracts
patch --dry-run --batch -p1 -d /absolute/path/to/protolab-mcp -i "$PATCHES/protolab-mcp.patch"
patch --batch -p1 -d /absolute/path/to/protolab-mcp -i "$PATCHES/protolab-mcp.patch"
patch --dry-run --batch -p1 -d /absolute/path/to/akshat-lab -i "$PATCHES/akshat-lab.patch"
patch --batch -p1 -d /absolute/path/to/akshat-lab -i "$PATCHES/akshat-lab.patch"
```

In the MCP source, regenerate with `npm run bundle` and `npm run template`;
its updated `npm run build` installs the generated template's declared dev
dependencies, runs the API contract checks and TypeScript gate, builds the
starter assets, then builds the server. Review generated bundle changes too.
This task installed nothing and used existing dependencies in isolated copies.

Before publishing, reconcile the prerequisites above and test the **whole current
starter against that generated output**, with its real app and compatible AI
release. Require a clean typecheck, token inventory and the approved visual/
interaction checks. Publish only that compatible bundle through the source's
reviewed deployment process. Refresh Ink through the documented backed-up
`/update` workflow; refresh AI through its separately reviewed used-set release.
Check the restored app contracts, record both release identifiers and rerun the
checks. Do not treat the clean generated demo as permission to replace the
current starter with an older API.
