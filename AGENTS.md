# ProtoLab Starter — instructions for AI tools

This is a Docusign prototyping template. Read this before writing any code.
It applies to every AI tool that opens this project — v0, Claude Code, Cursor,
GitHub Copilot, Figma Make, or anything else.

## The one rule

**Every piece of UI comes from `@/design-system`. Do not write your own.**

```tsx
import { Button, Card, DataTable, DocuSignShell, Stack } from '@/design-system';
```

The public Ink catalog is already installed. Before you build anything, look for the
component that already does it:

```bash
cat src/design-system/index.ts          # everything you can import
ls src/design-system/3-primitives/      # one folder per component
```

If a component looks close but not exact, read its `.tsx` file and use its
props. Composing existing components is always right; a new hand-rolled
component is almost always wrong.

### Never do these

- ❌ Install a UI library (shadcn, MUI, Chakra, Radix, Ant, daisyUI, …)
- ❌ Add Tailwind, or write utility classes like `className="flex gap-4 p-6"`
- ❌ Hardcode a color, font, radius, or spacing value (`#4C00FB`, `16px`, `1rem`)
- ❌ Write a `<button>`, `<input>`, `<table>`, or `<select>` by hand
- ❌ Edit anything inside `src/design-system/` or `src/ai-system/` — they're generated and get overwritten by `/update`

### Always do these

- ✅ Import from the `@/design-system` barrel, never from deep paths
- ✅ Use layout components — `Stack`, `Inline`, `Grid`, `Container`, `Spacer` — instead of custom flex CSS
- ✅ Use design tokens for any value you can't get from a component prop:
  `var(--ink-cobalt-100)`, `var(--ink-spacing-300)`, `var(--ink-font-secondary)`
  (full list: `src/design-system/1-tokens/tokens.css`)
- ✅ Build new screens as views inside `src/App.tsx`, next to their closest sibling (see [docs/PATTERNS.md](docs/PATTERNS.md)), never inside `src/design-system/`

## Docusign patterns first

Whatever you're asked to build, follow this order:

1. Extend an existing Docusign screen.
2. Otherwise, use an existing layout: list, detail overlay, overview, empty state or Iris.
3. Only if neither fits, build something new from the same parts: the shell, the page container, the type hierarchy and the spacing.

Before building anything, read **[docs/PATTERNS.md](docs/PATTERNS.md)**. It has the
map of `App.tsx`, the screen catalog, layout recipes and the type hierarchy. Also read
**[docs/GOTCHAS.md](docs/GOTCHAS.md)**, which lists component props that look
right but aren't.

## The six layers

Higher layers compose lower ones. Reach for the highest layer that fits.

| Layer | Folder | Examples |
|---|---|---|
| Layouts | `6-layouts/` | DocuSignShell, AgreementTableView |
| Patterns | `5-patterns/` | DataTable, GlobalNav, LocalNav, PageHeader, FilterBar, AIChat, AgentPanel |
| Composites | `4-composites/` | Modal, Tabs, ComboBox, Panel/Rail, EmptyState, PreviewCard, SelectTile, SegmentedControl, Toast, Tree, WorkflowStepper |
| Primitives | `3-primitives/` | Button, Input, Card, Icon, Badge, Avatar/AvatarGroup, ToggleButton, Hotspot, Meter, Tag, Text, Heading |
| Utilities | `2-utilities/` | Stack, Grid, Inline, Container, Spacer, Portal |
| Tokens | `1-tokens/` | CSS custom properties |

Building a page header from a `Heading` + two `Button`s is a mistake when
`PageHeader` exists. Same for `FilterBar`, `DataTable`, and `GlobalNav`.

Previously missing families now have public components. Use `EmptyState`,
`SegmentedControl`, `SelectTile`/`SelectTileGroup`, `PreviewCard`, `StarRating`,
`ColorPicker`, `ZoomControl`, `Tree`, `Toast`/`ToastProvider`/`useToast`,
`WorkflowStepper`, `Hotspot`, `Meter`, `Tag`, and `ToggleButton` instead of
approximating them. Use `Panel`/`Rail` for supplemental in-flow panels and
`Drawer` for modal drawers. Read the props before composing variants.

## Page conventions

**There is exactly one `DocuSignShell`, in `App.tsx`. Don't create another.**
Every screen renders inside it as a view: it gets the global nav and its tab's left
nav (`localNav`, which is omitted for full-width pages like settings) for free. A list
screen inside the shell looks like this:

```tsx
<AgreementTableView
  pageHeader={<PageHeader title="Agreements" actions={<Button kind="primary">New</Button>} />}
  filterBar={<FilterBar search={{ value: search, onChange: setSearch }} … />}
>
  <DataTable columns={columns} data={rows} getRowKey={(r) => r.id} />
</AgreementTableView>
```

- **`DataTable` is data-driven** — pass `columns` and `data` arrays. It has no children.
- **Tables are never wrapped in a `Card`.** That's the Docusign convention.
- **Never nest a table inside a table** — no `DataTable` inside a `DataTable` cell, Card-in-table, or `<table>` inside `<td>`. See `.github/skills/no-nested-tables/`.
- **Every button needs an accessible name**, as text inside the button. Icon-only buttons get a `<span className="sr-only">` label, not `aria-label`. See `.github/skills/button-accessible-labels/`. (The Ink `IconButton` is the exception: its `aria-label` prop is required, so pass it.)
- **Page CTAs use `kind="primary"`**, not `kind="brand"`.

## What's already here

`src/App.tsx` is a working Docusign app — Home, Insights, Agreements,
Workspaces, Requests, Admin — built entirely from these components. It is the
best reference in the repo: when you're unsure how something should look, find
the closest screen there and follow its structure.

To build a new screen, add it as a view in `App.tsx` next to its closest sibling,
following the recipe in [docs/PATTERNS.md](docs/PATTERNS.md). When copying from
`App.tsx`, preserve its screen structure and compose through the current public
components and tokens; see [docs/GOTCHAS.md](docs/GOTCHAS.md). Don't rewrite
`App.tsx` from scratch unless asked.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

## Figma

The repaired local inventory has 83 colocated `.figma.ts` files: 81 active
target URLs plus unresolved Alert and Popover stubs. Templates include child
parts and variant owners; these are not component-family or published-registration
counts. See the [coverage index](docs/figma-code-connect.md). If you're given a Figma frame or a
Figma URL, read [docs/figma-to-prototype.md](docs/figma-to-prototype.md) first —
it has the name crosswalk (Figma `Status Badge` → code `Badge`, `Text Box` →
`Input`, and so on) and tells you what to do about the Figma components that
need a mapping check. Local templates do not authorize writing to the Figma library.

## Optional: ProtoLab MCP

`.mcp.json` points at a hosted MCP server that adds component search,
validation, and Figma translation tools. **It's optional** — everything above
works without it, because the components are already in this repo. If your tool
supports MCP it will connect on its own; if it doesn't, ignore it.

## Skills (Claude Code)

Slash commands in `.claude/skills/`. Claude Code runs these; other tools
should just read the file if a user asks for that workflow.

| Skill | What it does |
|---|---|
| `/deploy` | Push the prototype to a shareable Vercel preview URL |
| `/fork` | Branch off someone else's prototype |
| `/handoff` | Generate `HANDOFF.md` with a component inventory for engineers |
| `/update` | Refresh `src/design-system/` to the latest components |
| `/onboard` | Verify setup and print a getting-started checklist |
| `/reference-to-prototype` | Rebuild a live Docusign page as an Ink prototype |
