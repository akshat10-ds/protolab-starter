# Copilot instructions

Follow [AGENTS.md](../AGENTS.md) for everything in this repo. The essentials:

- Every piece of UI is imported from `@/design-system` — the public Ink catalog is
  already installed. Never hand-roll a button, input, table, or modal, and never
  add a UI library (shadcn, MUI, Tailwind, Radix, …).
- Use design tokens (`var(--ink-cobalt-100)`, `var(--ink-spacing-300)`) instead
  of hex codes and pixel values. Token list: `src/design-system/1-tokens/tokens.css`.
- Never edit files inside `src/design-system/` or `src/ai-system/` — they're generated.
- `DocuSignShell` wraps every page. `DataTable` is data-driven (`columns` +
  `data`, no children). Tables are never wrapped in a `Card`.
- `src/App.tsx` is the reference implementation — match its structure.
- Use the public EmptyState, SegmentedControl, SelectTile/SelectTileGroup,
  PreviewCard, Panel/Rail, Toast, Tree, WorkflowStepper, ColorPicker, StarRating,
  ZoomControl, Hotspot, Meter, Tag, ToggleButton and AvatarGroup where they fit.
  Read the props instead of rebuilding these families.

Task-specific rules live in `.github/skills/` (`no-nested-tables`,
`button-accessible-labels`) and apply automatically via
`.github/instructions/`.

Working from a Figma design? Read [docs/figma-to-prototype.md](../docs/figma-to-prototype.md).
The [coverage index](../docs/figma-code-connect.md) records 83 local template
files: 81 active target URLs plus unresolved Alert/Popover stubs. Child/variant
templates are distinct from public family counts and published registration.
