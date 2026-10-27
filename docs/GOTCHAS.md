# Gotchas — traps that have already bitten someone

Read this alongside `PATTERNS.md`. Every item here was hit while building
prototypes in this repo.

## Component APIs (each one builds fine, then renders wrong)

| Component | Trap | Correct |
|---|---|---|
| `Badge` | There is **no `size` prop**. Passing `size="small"` is unsupported. `kind="error"`, `"info"` and `"neutral"` don't exist | `kind`: `subtle` · `emphasis` · `success` · `warning` · `alert` · `promo` · `promoSubtle` |
| `Banner` / `Alert` | Their kinds differ from Badge's: errors are `danger`, not `alert` | `information` · `danger` · `success` · `warning` · `promo` · `subtle` · `neutral` |
| `Banner` content | Banner wraps its message in a paragraph, so headings, Text paragraphs and layout blocks inside it create invalid HTML | Keep Banner content inline. Use public `Alert` for a composed announcement containing headings, paragraphs and actions |
| `Heading` | There is **no `size` prop**. `level={1}` renders 36px semibold, which is not the Docusign title | Use `PageHeader`, or the styled heading in PATTERNS.md §4 |
| `Text` | `color` only takes `primary` · `secondary` · `tertiary` · `success` · `error`. There's no `warning` | Show warnings with `Badge kind="warning"` or a `Banner` |
| `Stack` / `Inline` / `Grid` | `gap` takes named values, not numbers or tokens. Stack/Grid support `none` · `small` · `medium` · `large`; Inline also supports `xs` and `xl` | For any other value, use a `style` with a `--ink-spacing-*` token |
| `FilterBar` | `search` needs **both** `value` and `onChange`, or the input is frozen | Wire it to the page's `search` state |
| `Select` | There is no `options` array prop | Render native `<option>` children inside the public `Select`; `onChange` receives the select change event |
| `DataTable` | `getRowKey` is **required**. It has no children. Never wrap it in a `Card`, and never put a table inside a table | Pass `columns` + `data` arrays and use `cell: (row) => …` for custom cells |
| `IconButton` | Its `aria-label` prop is required. That's correct here; the sr-only rule in AGENTS.md applies to hand-written buttons | `<IconButton icon="star" aria-label="Favorite" />` |
| `Icon` / `icon=` props | Icon names remain dynamic strings. A wrong name passes typechecking, warns in the console and renders nothing | Look up filenames and provenance under `src/design-system/3-primitives/Icon/assets/system/`. Icon uses exact independent 20px/24px masters; legacy `iconPaths.ts` is not its catalog. Chart icons are `chart-bar` / `chart-pie`, and grids are `layout-grid`. See [icon evidence](foundation-repair-2026-10-20/icons-standard.md) |
| `var(--ink-…)` tokens | An unresolved token without a fallback invalidates the CSS value. Historical snippets used names such as `--ink-surface`, `--ink-font-color`, `--ink-spacing-75`/`175`, `--ink-shadow-elevation-2`, `--ink-text-secondary`; do not copy them | Check `src/design-system/1-tokens/tokens.css`. Use `--ink-bg-color-default` (surface), `--ink-font-default` / `--ink-font-secondary` (text), `--ink-shadow-sm`/`md` (shadow) |
| `Button` | `kind="brand"` is only for the Home **Start** button | Page CTAs use `kind="primary"`; everything else uses `secondary` / `tertiary` |
| `Avatar` | `size` is `xsmall` · `small` · `medium` · `large` | Use `small` in tables |
| `Badge` content | `children` works but is deprecated | Prefer `<Badge kind="success" text="Sent" />` |
| `Grid` | Columns are always equal (`repeat(n, 1fr)`), and `columns` **overrides** any `gridTemplateColumns` you pass in `style` | For a 2:1 split use `columns={3}` and put `style={{ gridColumn: 'span 2' }}` on the wide child |
| Gap scales | The scales differ by component. `Stack`: small 8 · medium 16 · large 24. `Inline`: xs 4 · small 8 · **medium 12** · large 16 · xl 24. `Grid`: small 8 · medium 16 · large 24 | Pick the gap by pixel value, not by name |
| `DataTable` columns | `const cols: any[]` (common in `App.tsx`) hides bad column props like `align: 'end'` from the type check | Type new columns as `DataTableColumn<Row>[]` (exported from `@/design-system`) |
| Buttons inside clickable rows | With `onRowClick` set, clicking an `IconButton` or `Button` in a cell **also opens the row** | Wrap the control's handler: `onClick={(e) => { e.stopPropagation(); … }}` |
| `DataTable` pagination | `App.tsx` hardcodes `totalItems` (1334, 1659) to mirror production counts | For new tables use `totalItems: data.length` |
| `DataTable` switching resource types | Columns are retained internally until an effect synchronizes them; rendering a different row shape in the same table instance can call the old cell renderers | Give tables with different row shapes distinct React `key`s. Key the table, not its owning page, so local edits survive navigation |

## Copying from `App.tsx`

- **Reuse the repaired screen composition.** `App.tsx` preserves the Docusign
  screens through public components, layout utilities and tokens. Its former
  raw controls and source-use findings were repaired; do not reintroduce them
  when copying a section. See the [app repair evidence](foundation-repair-2026-10-20/app.md).
- **Keep verification clean.** After the backed-up 2026-10-20 refresh,
  `npm run typecheck` has zero diagnostics, the build passes and the app
  source-use audit has zero findings. Rerun these checks after changes. The
  [upstream issue register](design-system-upstream-issues.md) describes the
  historical pre-repair diagnostics; current repair evidence is in the
  [foundation ledger](foundation-repair-2026-10-20/ledger.json). Do not hide
  unsupported props or new diagnostics with broad suppressions.
- **Don't edit `src/design-system/` or `src/ai-system/`.** They're generated and get overwritten by `/update`.

## Structure

- Never change `src/main.tsx` to render anything other than `<App />`.
- Never add a second `DocuSignShell`, a page with its own top nav, or your own page padding.
- Tabs are selected by URL hash (`#agreements`), and views inside a tab by `useState`.
  To make the preview open on a new screen, change the initial `useState` and record it
  in `.protolab.json` as
  `"defaultViewChanged": { "file": "src/App.tsx", "state": "sidebarView", "from": "'completed'", "to": "'parties'" }`.
- Overlays (`DetailPageShell`) are `position: fixed` with `zIndex: 1060` and cover the
  shell. To open one in the preview, set **both** the list view it opens from (so the back
  arrow lands there) and the overlay state. Use a representative row, not just the first
  one: in `PARTIES_DATA`, the first rows are Docusign itself.
- Public files (`docusign-logo.svg`, `avatar.jpg`) must be referenced as
  `` `${import.meta.env.BASE_URL}file.svg` ``, never `"/file.svg"`. Absolute paths break in the preview.

## Local verification

Run these from the starter root with the installed dependencies:

```bash
npm run audit:design-system
npm run test:audit:design-system
npm run typecheck
npm run build
```

The static audit guards app-owned source use. The refreshed starter has zero
findings, including with `npm run audit:design-system -- --no-baseline`; the
historical baseline in `scripts/design-system-audit-baseline.json` was retained,
not lowered to obtain a pass. A passing audit does not certify visual parity or
accessibility. Run the separate typecheck and build as well. See
[scripts/design-system-audit.md](../scripts/design-system-audit.md) for scope
and baseline review.

The Cowork build script below expects a packaged prototype with
`.protolab.json`. The source checkout does not carry that metadata or the
Cowork type/token baseline files. It now rejects missing metadata before
copying files. Use the local commands above in this checkout.

## Build and preview (Cowork)

- **Always build with the plugin's `scripts/build.sh`.** It installs the npm packages
  once per session into `/tmp` (never into the user's folder), runs the baseline type
  check and `check-ink.py` (Vite checks neither), then builds.
- **Never run `npm install` / `npm ci` yourself, and don't add new npm packages to a
  prototype.** The design system already covers the UI, and every prototype has to build
  from the starter's lockfile. Use the Ink `Icon`, not `lucide-react`.
- **Look before you publish.** `/preview` makes a single-file self-check copy and
  screenshots it. Look at the screenshot: shell, left nav, title size, spacing, and
  that the new screen is the one showing.
- **Asset filenames change on every build.** When republishing, pass `null` for old `assets/…` paths.
- **The `<title>` tag names the preview.** It's set to the prototype name.
- **In a new conversation**, read the preview (`Artifact action: "read"`, with `previewUrl`
  from `.protolab.json`) before republishing to it, or the publish is refused.
- **Mounted folders can refuse `rm` and `zip`** ("Operation not permitted"). Ask for delete
  permission with `allow_cowork_file_delete`, or write zips to `/tmp` and copy them over.
- **If `build.sh` prints `FAILED=dependencies`, npm can't reach its registry.** That's an
  org network setting (Admin settings › Capabilities), not a bug, so say so plainly and stop.
  The maintainer can also ship an offline build (`build-plugin.sh --offline`), which
  bundles the packages but makes the plugin about 40 MB.
- **Keep the plugin lean.** Big or binary files in a plugin (e.g. a 40 MB archive) make
  Customize show "Couldn't load files". Plugin files should be text, images or fonts,
  each under 256 KiB, with 512 files at most.
