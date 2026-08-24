# ProtoLab Starter — instructions for AI tools

This is a Docusign prototyping template. Read this before writing any code.
It applies to every AI tool that opens this project — v0, Claude Code, Cursor,
GitHub Copilot, Figma Make, or anything else.

## The one rule

**Every piece of UI comes from `@/design-system`. Do not write your own.**

```tsx
import { Button, Card, DataTable, DocuSignShell, Stack } from '@/design-system';
```

63 components are already installed. Before you build anything, look for the
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
- ❌ Edit anything inside `src/design-system/` — it's generated and gets overwritten by `/update`

### Always do these

- ✅ Import from the `@/design-system` barrel, never from deep paths
- ✅ Use layout components — `Stack`, `Inline`, `Grid`, `Container`, `Spacer` — instead of custom flex CSS
- ✅ Use design tokens for any value you can't get from a component prop:
  `var(--ink-cobalt-100)`, `var(--ink-spacing-300)`, `var(--ink-text-secondary)`
  (full list: `src/design-system/1-tokens/tokens.css`)
- ✅ Put your screens in `src/` outside `src/design-system/` — e.g. `src/pages/Settings.tsx`

## The six layers

Higher layers compose lower ones. Reach for the highest layer that fits.

| Layer | Folder | Examples |
|---|---|---|
| Layouts | `6-layouts/` | DocuSignShell, AgreementTableView |
| Patterns | `5-patterns/` | DataTable, GlobalNav, LocalNav, PageHeader, FilterBar, AIChat, AgentPanel |
| Composites | `4-composites/` | Modal, Tabs, ComboBox, Accordion, Dropdown, Drawer, Pagination, Stepper |
| Primitives | `3-primitives/` | Button, Input, Card, Icon, Badge, Select, Avatar, Switch, Text, Heading |
| Utilities | `2-utilities/` | Stack, Grid, Inline, Container, Spacer, Portal |
| Tokens | `1-tokens/` | CSS custom properties |

Building a page header from a `Heading` + two `Button`s is a mistake when
`PageHeader` exists. Same for `FilterBar`, `DataTable`, and `GlobalNav`.

## Page conventions

**Every screen is wrapped in `DocuSignShell`.** `globalNav` is required,
`localNav` is optional (omit it for full-width pages like settings).

```tsx
<DocuSignShell
  globalNav={{ logo: <Logo />, navItems, user: { name: 'Akshat Mishra' } }}
  localNav={{ sections, activeItemId: 'agreements' }}
>
  <PageHeader title="Agreements" actions={<Button kind="primary">New</Button>} />
  <FilterBar … />
  <DataTable columns={columns} data={rows} />
</DocuSignShell>
```

- **`DataTable` is data-driven** — pass `columns` and `data` arrays. It has no children.
- **Tables are never wrapped in a `Card`.** That's the Docusign convention.
- **Never nest a table inside a table** — no `DataTable` inside a `DataTable` cell, Card-in-table, or `<table>` inside `<td>`. See `.github/skills/no-nested-tables/`.
- **Every button needs an accessible name**, as text inside the button. Icon-only buttons get a `<span className="sr-only">` label, not `aria-label`. See `.github/skills/button-accessible-labels/`.
- **Page CTAs use `kind="primary"`**, not `kind="brand"`.

## What's already here

`src/App.tsx` is a working Docusign app — Home, Insights, Agreements,
Workspaces, Requests, Admin — built entirely from these components. It is the
best reference in the repo: when you're unsure how something should look, find
the closest screen there and follow its structure.

To build a new screen, add a page component and route to it from `App.tsx`.
Don't rewrite `App.tsx` from scratch unless asked.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

## Figma

37 components are mapped to the `[ds-ui]` Figma library via colocated
`<Name>.figma.ts` Code Connect files. If you're given a Figma frame or a
Figma URL, read [docs/figma-to-prototype.md](docs/figma-to-prototype.md) first —
it has the name crosswalk (Figma `Status Badge` → code `Badge`, `Text Box` →
`Input`, and so on) and tells you what to do about the Figma components that
have no code counterpart.

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
