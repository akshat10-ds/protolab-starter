# Figma Code Connect — coverage index

Local mappings only. Nothing is published to Figma's servers; the `[ds-ui]` library files are never written to. Each `<Name>.figma.ts` is colocated with its component and carries its own header (target node, drift notes, omitted axes).

Figma files: `[ds-ui] Component Library` (`nAKX1rO3Mir2OCBdCkC5oq`), `[ds-ui] Icon Library` (`Y7VyYvcCvXjG1pgeXicozZ`).
Token crosswalk: [figma-token-crosswalk.md](figma-token-crosswalk.md).

## Mapped (37)

**3-primitives (16):** Avatar, AlertBadge, Badge→`Status Badge`, Button, Card→`CardContainer`, Checkbox, IconButton, Input→`Text Box`, Link, ProgressBar, Radio→`Radio Button`, Select, Slider, Spinner→`Progress Circle`, StatusLight, Switch, TextArea, Tooltip
**4-composites (21):** Accordion, Alert→`Inline Message`, Banner, Breadcrumb, Callout, Chip, ComboBox, DatePicker→`DateInput`, Dropdown→`Menu (Basic)`, FileUpload→`File Drop`, FilterTag, List→`List.Item`, Modal, Pagination, Popover→`Overlay`, Stepper→`Progress Stepper`, Table, Tabs, TaskCard

Notable target choices (reasoning in file headers): Alert is Inline Message, not Toast (persistent vs transient). DatePicker is `DateInput` — Figma's `[INK] DatePicker` is only the standalone calendar. Stepper is Progress Stepper, not Workflow Stepper.

## Skipped — no honest Figma counterpart

- **Drawer** — `[INK] Panel` is a docked side panel, not a portal overlay dialog (1/7 prop overlap).
- **FileInput** — File Drop is owned by FileUpload; FileInput is a labeled form field with no Figma structure.
- **Code-only, generate-in-Figma-later:** BarChart, Skeleton, Divider, AIBadge, ComboButton, SearchInput, all of 5-patterns and 6-layouts, all of ai-system.
- **Figma-only, unmapped:** ColorPicker, EmptyState, Hotspot, Meter, PreviewCard, SegmentedControl, SelectTile, StarRating, Tag, Timeline, Toast, Tree, WorkflowStepper, ZoomControl, `[INK] List.Heading`, Menu variants beyond Basic.

## Flags for the DS team

- Deprecation-flagged components with **no in-file successor**: Modal, Banner, File Drop, Inline Message, Select Menu, SideNav.
- No parent `[INK] List` component set — only List.Item / List.Heading.
- No paint style for the AI Iris gradient (`--ink-gradient-ai-iris`); `--ink-badge-ai-*` and `--ink-tag-*` token lanes have no live Figma variables.
- Value drift: `--ink-elevation-glass` is 8px blur in code vs 16 in Figma.

## Icon set reconciliation (2026-07-17)

Code `Icon/iconPaths.ts` (285 glyphs) vs Figma Icon Library System page (`Y7VyYvcCvXjG1pgeXicozZ`, 288 base icons). Full coverage — all 288 fingerprinted by glyph bbox + raw-path eyeball. **~93% current: 267/271 shared glyphs geometrically identical, viewBox uniform (24×24, zero overrides).**

- **Missing in code (15)** — newer Figma glyphs not yet pulled: ai-iris-inverse, ai-flow, arrow-nested, bookmark-filled, clear-formatting, compare, document-lock, highlighter, lightbulb, panel, panel-filled, pencil-box, subscript, superscript, toggle.
- **Path drift (4)** — process-spinner (code is a degenerate single-bar stub vs full Figma glyph); ai-iris / ai-spark / ai-spark-filled (bespoke code paths, different construction/size from Figma).
- **Extra in code (5, likely intentional)** — sliders-horizontal, ai-iris-filled (Figma has no filled iris), boolean, line, presentation.
- **Name aliases (9)** — same glyph, code uses a different name than Figma: settings/gear, edit/pencil, user/person, more-vertical/overflowVertical, transaction/transactions, table-border-slash/tableBorderOff, info/statusInfo, database/dataServer, spark/AI_spark. Renaming would break consumers — leave as aliases.
- **AI icons + gradient** — Figma System has flat AI_iris/irisInverse/spark/sparkFilled. Code represents them two disjoint ways: drifted `ai-*` paths in iconPaths.ts, and `AIIcon.tsx` (Figma-exact spark path + a **code-only** linear gradient #D9155D→#A02AAC→#4C06FF — no Figma style, per the crosswalk). **BUG: AIIcon.tsx renders the spark-filled path for ALL four names, so `ai-iris` draws a spark.**

Update work = pull the 15 missing + fix the 4 drift; AI icons need the gradient decision + the AIIcon bug fix; aliases stay.

## Conventions

- Code names never change; mapping absorbs drift (recorded per file header).
- Design-only variant axes (`❖ State`, `❖ Focus`) are omitted.
- Label/description/error text extraction targets the verified layer names `Label string` / `Description string` / `Error Text` (Modal: path-scoped `text` under Header — the layer named "Title Text" is the deprecated one).
- Desktop `add_code_connect_map` registration is pending: Figma lazy-loads pages, so someone must click through the component pages once in the desktop app before the local map can register (only affects Dev Mode display, not code→design generation).
