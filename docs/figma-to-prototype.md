# Figma → prototype

Instructions for turning a Figma design into working code in this project.
Read this whenever you're handed a Figma frame, a Figma URL, or a screenshot of
one.

The rule from [AGENTS.md](../AGENTS.md) still applies: **the output is composed
from `@/design-system` components.** A Figma design tells you *which* components
and *what content* — never that you should rebuild a component by hand.

The [comprehensive review dated 2026-10-20](figma-library-review-2026-10-20.md)
records the audit findings. The subsequent
[foundation repair ledger](foundation-repair-2026-10-20/ledger.json) records the
repairs and verification limits. Use current component props and local templates
when those historical findings differ from the repaired catalog. Ordinary
content insets and row density remain flexible in this prototyping playground.

## The workflow

1. **Read the design.** When the `figma-design-to-code` skill is available, load it
   before `get_design_context`. Use the Figma MCP (`get_design_context` / `get_screenshot`)
   if it's connected, or work from the screenshot. Inspect the actual current
   component/frame node: the shared library URL's node `3140:1301` is the
   **Thumbnail**, not a component specimen. Identify the frame's layout, then
   each distinct element. A live Button read (`10:541`, 2026-10-20) returned an
   `@ds/ui` connection; adapt that API to this project's component props rather
   than copying its imports directly.
2. **Name every element as a Figma component**, e.g. "Status Badge", "Text Box",
   "Menu (Basic)".
3. **Translate each name through the crosswalk below** to get the code component.
4. **Check the colocated `.figma.ts` file** for that component — it records the
   local prop mapping and remaining limits between Figma variants and code
   props. The repaired inventory has 83 files: 81 active target URLs and two
   unresolved stubs (Alert and Popover). These include child and variant
   templates, not 83 public component families. For example, see
   `src/design-system/3-primitives/Badge/Badge.figma.ts`. Confirm the current
   `.tsx` props as well; local Button takes its label as `children`.
5. **Compose the page** inside `DocuSignShell`, following the page conventions in
   AGENTS.md.
6. **Map values to tokens, not pixels.** A Figma variable like
   `color/cobalt/100` becomes `var(--ink-cobalt-100)`. See
   [figma-token-crosswalk.md](figma-token-crosswalk.md). If a fill has no
   variable behind it, find the nearest token — do not paste the hex.

## Name crosswalk

Code names never change; the mapping absorbs the drift. When the Figma name
differs from the code name:

| Figma component | Code component |
|---|---|
| Status Badge | `Badge` |
| CardContainer | `Card` |
| Text Box | `Input` |
| Radio Button | `Radio` |
| Progress Circle | `Spinner` |
| DateInput | `DatePicker` |
| DatePicker (standalone calendar) | `DatePicker standalone` |
| Menu (Basic) | `Dropdown` |
| File Drop | `FileUpload` |
| List.Item | `List.Item` |
| Progress Stepper | `Stepper` |
| Workflow Stepper | `WorkflowStepper` |
| Panel / Rail | `Panel` / `Rail` |

Everything else maps by identical name: Avatar, AlertBadge, Button, Checkbox,
IconButton, Link, ProgressBar, Select, Slider, StatusLight, Switch, TextArea,
Tooltip, Accordion, Banner, Breadcrumb, Callout, Chip, ComboBox, FilterTag,
Modal, Pagination, Table, Tabs, TaskCard, AvatarGroup, ColorPicker, EmptyState,
Hotspot, Meter, PreviewCard, SegmentedControl, SelectTile, SelectTileGroup,
StarRating, Tag, Timeline, Toast, Tree, ToggleButton and ZoomControl.

Use `Alert` for persistent inline feedback and `Toast` for transient
notifications. Alert's historical Inline Message target has no verified current
owner, so its local template is unresolved. `Stepper` maps to **Progress
Stepper**; **Workflow Stepper** has its own public `WorkflowStepper` API.

**Overlay does not map to Popover.** The former mapping was removed because
Overlay is a dialog shell, while Popover is a positioned bubble. Its local
`.figma.ts` explicitly has no target. Choose a component from the actual
design's behavior and structure.

## When the Figma component has no code equivalent

The former missing-family list is repaired. `ColorPicker`, `EmptyState`,
`Hotspot`, `Meter`, `PreviewCard`, `SegmentedControl`, `SelectTile` and
`SelectTileGroup`, `StarRating`, `Tag`, `Toast`, `Tree`, `WorkflowStepper`,
`ZoomControl`, `Panel` and `Rail` are public components with current local
templates. `ToggleButton` and `AvatarGroup` are also public and mapped. Use
these APIs before considering an approximation.

Current `Dropdown` already supports icons, shortcuts, sections, dividers,
selection and one level of nested items, with templates for all six menu
owners. Inspect the API for application submenu data and behavior. `[INK] Panel`
maps to the supplemental docked/floating `Panel` with `Rail`; `Drawer` remains
a modal dialog even when its scrim is hidden.

For an unfamiliar family, check `src/design-system/index.ts`, its current props,
and the coverage index before concluding it is missing. If no component fits,
compose existing public components and tokens and say which part is
approximated. Do not install a UI package or add a file to `src/design-system/`.

`Timeline` is implemented, exported and now mapped to the current parent owner
(`1109:4043`). It supports individual collapsible items; inspect its props.

## When the code component has no local Figma mapping

These have no local template target and are correct to use even though the
design may not show them: `BarChart`, `Skeleton`, `Divider`, `Icon`, `AIIcon`,
`AIBadge`, `SearchInput`, `FileInput`, `Drawer`, everything in `5-patterns/` (DataTable, GlobalNav, LocalNav,
PageHeader, FilterBar, AIChat, AgentPanel) and `6-layouts/` (DocuSignShell,
AgreementTableView). A missing template does not prove a missing Figma
design. AIBadge's historical target was not found in the current component file;
no replacement target or fresh visual-match claim is fabricated. Alert and
Popover retain explicitly unresolved template files.

A Figma frame that draws a table, sidebar, or app header by hand should still
become `DataTable`, `LocalNav`, and `GlobalNav` in code.

## Variants and states

- Design-only variant axes — `❖ State`, `❖ Focus` — are **omitted** from the
  mapping. Hover, focus, and pressed states come from the component's CSS; don't
  reimplement them from the Figma layers.
- Check current text and slot paths rather than trusting the template's recorded
  names. The repair refreshed the stale Boolean/slot reads identified in the review.
  For `Modal`, the inspected title path is `Modal.Header > headerTitle > text`,
  with header names varying by size. The template's `Header > header > text`
  path and the older "Title Text" name are historical and should not be copied.
- Templates bind real application images, accessible action labels, field limits,
  hidden avatar data, Tree hierarchy and submenu data. Supply those bindings;
  do not invent design content to make a snippet run.

## Known gaps

Use the repair evidence rather than treating the July gap list as current.
Metadata and source checks do not establish rendered parity for every variant.

- **Icons**: `Icon` uses 582 exact active System SVG exports: 291 small 20px
  masters and 291 medium 24px masters. `documentAnalyze`, `documentSplit` and
  `folderCopy` are available (camelCase and kebab-case). Nine historical aliases
  and six local extension paths remain compatible. See
  [standard icon evidence](foundation-repair-2026-10-20/icons-standard.md).
- **AI icons**: `AIIcon` selects exact colored Iris, inverse Iris and spark
  assets at each size. Generic `Icon` delegates `ai-iris`, `ai-iris-inverse`,
  `ai-spark`, `ai-spark-filled`, and the `ai-iris-filled` compatibility alias.
  `IrisIcon` and `IrisIconInverse` remain exported wrappers.
- **Tokens**: glass blur is now 16px. Drawer numeric spacing, Link subtle
  tokens and Avatar cozy tracking remain present. Check current tokens and the
  [repair contracts](foundation-repair-2026-10-20/contracts.md) before applying
  a historical suggestion again.
- **Unresolved targets**: Alert, Popover and the historical AIBadge target
  remain explicitly documented. Full-page Overlay is not an anchored Popover.
  No local template proves published Code Connect registration.

Shared component/token changes must come through the authoring source and
update bundle; do not patch generated `src/design-system/` or `src/ai-system/`.

## Reference

- [figma-code-connect.md](figma-code-connect.md) — full coverage index, per-component drift notes, flags raised to the DS team
- [figma-token-crosswalk.md](figma-token-crosswalk.md) — Figma variables ↔ CSS custom properties
- Figma files: `[ds-ui] Component Library` (`nAKX1rO3Mir2OCBdCkC5oq`), `[ds-ui] Icon Library` (`Y7VyYvcCvXjG1pgeXicozZ`)

Nothing here is published to Figma's servers, and the `[ds-ui]` library files are
never written to. The mappings are local only.
