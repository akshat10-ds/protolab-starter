# Figma Code Connect — coverage index

Local mappings only. Nothing is published to Figma's servers; the `[ds-ui]` library files are never written to. Each `<Name>.figma.ts` is colocated with its component and carries its own header (target node, drift notes, omitted axes).

Figma files: `[ds-ui] Component Library` (`nAKX1rO3Mir2OCBdCkC5oq`), `[ds-ui] Icon Library` (`Y7VyYvcCvXjG1pgeXicozZ`).
Token crosswalk: [figma-token-crosswalk.md](figma-token-crosswalk.md).

Token synchronization was completed separately on **2026-10-21**: all 855
variables / 3,380 mode values and 49 styles are represented, with 10,844 browser
checks. See the current crosswalk and sync workflow. This does not change the
scope of the component mapping and visual-fidelity observations below.

Repaired source inventory checked **2026-10-20**. A template with a target URL records a
mapping; it does not prove current Figma registration or visual fidelity. The
token crosswalk and fidelity audits contain Figma observations from
**2026-07-17**; use them as historical evidence until the relevant live nodes,
variables, and rendered states have been checked again.

The [comprehensive 2026-10-20 review](figma-library-review-2026-10-20.md)
provides per-owner metadata, source/API comparisons and representative Figma
screenshots. The subsequent [repair ledger](foundation-repair-2026-10-20/ledger.json)
records fixes made after that review. Use the repaired source rather than
repeating a historical gap claim.
Runtime visual parity and published Code Connect registration are separate
checks; neither follows from the existence of a local template.

## Local targets (81)

There are **83 `.figma.ts` files**: **81 active target URLs**, plus two
unresolved stubs (Alert and Popover). These counts include child parts and
multiple published owners for one runtime family; they are not counts of
public component families or registry entries.

**3-primitives (24 targets):** AlertBadge, Avatar, AvatarGroup, Badge→`Status Badge`, Button, Card→`CardContainer`, Card.Image, Checkbox, Hotspot, IconButton, Input→`Text Box`, Link, Meter, ProgressBar, Radio→`Radio Button`, Select, Slider, Spinner→`Progress Circle`, StatusLight, Switch, Tag, TextArea, ToggleButton, Tooltip.

**4-composites (57 targets), grouped by runtime API:**

| Runtime API | Local template owners/parts |
|---|---|
| Accordion, Banner, Breadcrumb, Chip | One target each |
| Callout | Root, Body, Footer |
| ColorPicker | Gradient/image/image-upload owner |
| ComboBox | Standard and editable owners |
| ComboButton | Split action owner |
| DatePicker | DateInput field and standalone DatePicker calendar |
| Dropdown | Basic, icon, nested, sections, selectable and shortcuts menu owners |
| EmptyState | Root, Header, Body, Footer |
| FileUpload, FilterTag, List.Item, Pagination | One target each |
| Modal | Root, Body, Footer |
| Panel, Rail | Separate supplemental panel and rail owners |
| PreviewCard | Root, Heading, Image |
| SegmentedControl | Root and Option |
| SelectTile, SelectTileGroup, StarRating | One target each |
| Stepper | Progress Stepper |
| Table | Root and cell-content owner |
| Tabs | Current tab owner |
| TaskCard | Root, Header, Body, Footer |
| Timeline, Toast, ZoomControl | One target each |
| Tree | Standard, no-parent-selection and deep-nested owners |
| WorkflowStepper | Compact, expanded and Item owners |

DatePicker's field maps to `DateInput`; its standalone calendar maps through
`DatePicker standalone`. Stepper is Progress Stepper; WorkflowStepper is a
separate public family. Alert remains persistent inline feedback at runtime,
but its historical Inline Message target is no longer asserted as active.

The [offline template execution report](foundation-repair-2026-10-20/composites-template-execution.json)
checks 81 templates against 955 saved current variants with zero execution
errors. Getter/property checks and generated snippet typechecking also passed;
see [mapping repair evidence](foundation-repair-2026-10-20/composites.md). This
is saved-data contract verification, not live Dev Mode registration or proof of
every rendered variant.

## Components without a local template target

- **Popover** — its `.figma.ts` intentionally drops the former `[INK] Overlay` target. Overlay is a dialog shell; it does not represent the positioned Popover API. Do not restore that mapping.
- **Alert** — the historical `123:919` owner was not found in the current inventory. The runtime API remains public; its template has no active target until a current owner is verified.
- **Drawer** — `[INK] Panel` maps to the public supplemental `Panel`/`Rail` family. Drawer remains a modal portal dialog and has no local target.
- **FileInput** — File Drop is owned by FileUpload; FileInput is a labeled form field with no Figma structure.
- **Available without templates:** BarChart, Skeleton, Divider, Icon, AIIcon, AIBadge, SearchInput, all of 5-patterns and 6-layouts, and all of ai-system. Absence of a template does not establish absence of a Figma design. AIBadge's historical `19467:181071` was not found; no replacement target is fabricated.
- **Former missing families are implemented and mapped:** ColorPicker, EmptyState, Hotspot, Meter, PreviewCard, SegmentedControl, SelectTile/SelectTileGroup, StarRating, Tag, Toast, Tree, WorkflowStepper and ZoomControl. Panel/Rail, ToggleButton, AvatarGroup, ComboButton and Timeline also have current targets.
- **List.Heading has no separate public component/template.** Use the existing list and public typography/layout composition for a section heading; do not invent a mapping to an unverified owner.
- **Non-Basic menus:** Dropdown supports icons, shortcuts, sections, dividers, selected/alert/end content and one level of nested children, with current templates for six menu owners. Application submenu data still needs to be supplied.

## Historical Figma flags

July deprecation, missing-family and paint-style observations remain historical
in the [dated audits](figma-library-review-2026-10-20.md). The repair uses current
owners for active mappings, keeps disproved targets unresolved, supplies exact
AI artwork, and sets glass blur to 16px. Token lane names and local template
presence alone do not establish a Figma variable, paint style or registration.

## Current local icon inventory (2026-10-20)

`Icon` now uses **582 unmodified active System SVG exports** from the icon
library: **291 independent 20px small masters and 291 24px medium masters**.
These are asset/master counts, not Code Connect template counts. Exact files,
node IDs and SHA-256 provenance live in `Icon/assets/system/`. The legacy
`iconPaths.ts` is preserved for compatibility and is not the renderer's catalog.

- `documentAnalyze`, `documentSplit` and `folderCopy` now resolve in both sizes;
  camelCase and kebab-case names are supported.
- All nine historical aliases and six local extension paths remain available.
- Generic Icon delegates `ai-iris`, `ai-iris-inverse`, `ai-spark`,
  `ai-spark-filled` and the `ai-iris-filled` compatibility alias to exact colored
  AIIcon artwork. IrisIcon and IrisIconInverse remain public wrappers.
- [Icon repair evidence](foundation-repair-2026-10-20/icons-standard.md) records
  export fidelity, geometry, tint handling, asset emission and representative
  browser checks. It does not claim an exhaustive glyph raster comparison.

## Source changes newer than the historical audits

The repair includes public missing families, current slots and state APIs,
corrected template getter/child composition, exact icon assets, 16px glass blur,
numeric Drawer spacing, Link subtle tokens and Avatar cozy tracking. Preserve
the dated audits as historical records; inspect the current props and
[repair ledger](foundation-repair-2026-10-20/ledger.json) before proposing a fix
again. Shared changes belong in the authoring source and update bundle, not
local edits to generated `src/design-system/` or `src/ai-system/`.

## Conventions

- Code names never change; mapping absorbs drift (recorded per file header).
- Design-only variant axes (`❖ State`, `❖ Focus`) are omitted.
- Recheck text/slot paths against the current owner. The repaired templates use current Boolean/slot types and dynamic connected children. Current Modal title content is under `Modal.Header > headerTitle > text` (header names vary by size); the older `Header > header > text` and "Title Text" paths are historical.
- Supply real application bindings where a template expects image sources/alts, action names, field limits, hidden avatar identities, Tree hierarchy or submenu data. Templates do not fabricate unconnected foreign descendants or assets.
- Inspect an actual current component node. The shared link's node `3140:1301` is the library **Thumbnail**, not a component specimen. A live read of Button node `10:541` on 2026-10-20 returned a connection to `@ds/ui`; translate its API through the local template and component props (for example, local Button uses `children` for its label).
- The July notes recorded desktop `add_code_connect_map` registration as pending. Current local files do not prove its present registration status; inspect Dev Mode if registration matters to the task.
