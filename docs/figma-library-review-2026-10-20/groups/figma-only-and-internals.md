# Figma-only families and internal masters — 2026-10-20

Current full-file data, not the July list. This group covers 52 owners on 19 pages (including four non-component documentation pages), with per-owner coverage and exact links in [the JSON ledger](figma-only-and-internals.json). All actual variants and descendants were read. Thirteen family screenshots were inspected; internal quarks are traced through parent component specimens and metadata. Runtime pixel/interaction parity remains unverified.

| Family | Available reuse and substantive gap | Priority |
|---|---|---|
| ColorPicker | No ColorPicker export. Existing Input, Slider, Button and FileUpload provide pieces; they do not provide color-space selection, swatch history or eyedropper behavior. | P3 unless an editor key screen needs color selection |
| EmptyState | No dedicated EmptyState export; documented empty-state composition and existing views are the intended reuse path. Image/header/body/footer are slots, not four missing standalone controls. | P2 when a key empty screen needs the reusable composition |
| Hotspot | A single 24px authoring/annotation hotspot exists. No exact runtime component. Its presence does not require adding onboarding tour flows. | P3 |
| Meter | ProgressBar can express a similar track but is a progress indicator rather than a semantic strength meter; kind lanes differ. | P3 unless a strength/quality key screen needs it |
| PreviewCard | Document preview, heading/description, status and menu are a composition; focus/hover/active border states are explicit live design states. Generic Card is available but no PreviewCard contract. | P2 when a key screen uses document grids |
| SegmentedControl | No exact SegmentedControl export. Tabs may fit content switching; a labelled Button group can fit action selection. They are not automatically equivalent keyboard/selection semantics. | P2 when visible on a key screen |
| SelectTile | No exact SelectTile or SelectTileGroup export. Figma includes selected, hover/active, row/column, image fit/fill/none, icon, readOnly and disabled. A Card alone cannot express accessible choice behavior. | P2 when a key choice screen needs tiles |
| StarRating | No exact StarRating export. Six rating levels and disabled states are current; rating accessibility and labels would need a source-owned reusable contract if required. | P3 |
| Tag | The live Tag is a removable neutral label. Chip provides a related dismissible affordance but also selected, icon and other API features; map deliberately rather than assume exact identity. | P2 if removable tags are on a key screen |
| Toast | No exact Toast export. Figma is a transient dark feedback surface with kind icon, copy and close. Alert is persistent inline feedback; local Alert's stale InlineMessage target does not become a Toast mapping. | P2 only where key-screen feedback needs toast behavior |
| Tree | Three tree compositions plus Item/Header masters exist. No recursive Tree export. List/LocalNav do not prove tree expansion, parent selection and keyboard support. | P2 only for a key hierarchy screen |
| WorkflowStepper | Workflow stepper is an actionable progress composition with Compact/Expanded presets, distinct from ProgressStepper. Local Stepper supplies an indicator foundation, not the exact workflow contract. | P3 unless a workflow key screen needs it |
| ZoomControl | Horizontal/vertical zoom controls can be composed from existing pieces. No exact ZoomControl export; use the composition only if a document-preview key screen needs it. | P3 |
| 🧰 Form Element Quarks | Internal labels, helper/error text, character count and browser resize handle belong to their parent field APIs/CSS. They are not standalone missing controls. | P2 for shared field consistency |
| 🧰 Component Quarks | Internal caret/disclosure/bar/indicator/connector/heading/close/slot/deprecation/FPO authoring pieces. Reuse the parent APIs; no export required per internal master. Heading's nine display levels differ from local semantic-only Heading API; PageHeader and token composition remain the documented screen solution. | P2 for shared parent APIs; P3 authoring/deprecated placeholders |

Missing families are a conditional capability backlog, not a demand to implement unused production flows. Home/list/detail/overview/empty states should keep using the established shell and high-level patterns. Insets and row density are observations rather than remediation gates.

Raw metadata captures root and child dimensions, layout, typography, fills, strokes, radii, effects and variable bindings. It does not prove exact glyph path equality, responsive behavior, keyboard behavior or a side-by-side local render for every variant. Source-only components and the separate Icon/AI/Iris renderer audit are recorded in the combined report.
