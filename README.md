# ProtoLab Starter

Build Docusign prototypes with AI. The Ink component catalog is already installed —
your AI tool composes screens instead of inventing them.

**[protolab-starter.vercel.app](https://protolab-starter.vercel.app)** — see what
you get out of the box.

## Start here: duplicate the v0 template

**[→ Open the ProtoLab template in v0](https://v0.app/templates/team?team=docusign-xd&c=akshatmishra)**

Duplicate it, then describe what you want:

> "Build me an agreements list page with search, filters, and status badges."

Nothing to install. The template already carries the components, the tokens, and
the instructions the AI follows ([AGENTS.md](AGENTS.md)), so the first screen
comes out looking like Docusign.

## Or use it anywhere else

The project is a plain Vite + React + TypeScript repo — any AI tool works.

```bash
git clone https://github.com/akshat10-ds/protolab-starter.git
cd protolab-starter
npm install && npm run dev      # http://localhost:5173
```

Open `/components` for the standalone Ink component gallery, separate from the
prototype shell. It has component search, category filters, button size/mode
comparisons and interactive examples. The prototype's `/#tokens` page checks
CSS against the pinned Figma token snapshot.

| Tool | How it picks up the rules |
|---|---|
| **v0** | Reads `AGENTS.md` |
| **Claude Code** | Reads `CLAUDE.md` → `AGENTS.md`, plus the `/` skills below |
| **Cursor / Codex / Windsurf** | Read `AGENTS.md` |
| **GitHub Copilot** | Reads `.github/copilot-instructions.md` → `AGENTS.md` |
| **Figma Make** | Runs the scripts in `.figma/make/` |

[Open in VS Code](vscode://vscode.git/clone?url=https://github.com/akshat10-ds/protolab-starter.git)
clones the repo and suggests the AI extensions.

## What your AI is told to do

The short version of [AGENTS.md](AGENTS.md):

- Import every piece of UI from `@/design-system` — never hand-roll one
- No Tailwind, no shadcn, no other UI library
- Design tokens instead of hex codes and pixel values
- `DocuSignShell` wraps every page; `DataTable` takes `columns` + `data`; tables never sit inside a Card
- Never edit `src/design-system/` or `src/ai-system/` — they're generated

If your prototype starts drifting toward generic AI-looking UI, point the tool
back at `AGENTS.md`.

## Figma

The repaired catalog has 83 local Code Connect template files, including 81
active target URLs and two unresolved stubs (Alert and Popover). These include
child components and multiple variants of one family; they are not a count of
public component families or published Figma registrations. Hand your tool a Figma frame and it can translate
it — [docs/figma-to-prototype.md](docs/figma-to-prototype.md) has the name
crosswalk (`Status Badge` → `Badge`, `Text Box` → `Input`, …), the token
mapping, and how to check an unfamiliar component. The
[coverage index](docs/figma-code-connect.md) records current mappings and limits.

## Keep prototypes aligned

Use live Docusign screens for page structure and behavior, and the Figma
library for component appearance and token semantics. Compose both through
`@/design-system`; shared component gaps belong in the upstream release.

```bash
npm run audit:design-system       # app source-use guardrail
npm run test:audit:design-system  # audit parser and CLI checks
npm run typecheck                # includes generated-source diagnostics
npm run build                    # Vite build; does not type-check
```

The audit is a static guardrail, not a visual-fidelity score. See the
[dated positioning review](docs/protolab-positioning-2026-10-20.md),
[audit usage](scripts/design-system-audit.md), and
[generated-source issue register](docs/design-system-upstream-issues.md).

## Skills (Claude Code)

| Skill | What it does |
|-------|-------------|
| `/deploy` | Ship your prototype to a shareable Vercel URL |
| `/fork` | Build on top of someone else's prototype |
| `/handoff` | Generate an engineer handoff document |
| `/update` | Update design system components |
| `/onboard` | Verify setup and show the getting-started guide |
| `/reference-to-prototype` | Rebuild a live Docusign page with Ink components |

## Optional: ProtoLab MCP

`.mcp.json` connects to a hosted server that adds component search, validation,
and Figma translation tools. It's optional — the components ship in this repo,
so nothing breaks without it. Details: [protolab-mcp.vercel.app](https://protolab-mcp.vercel.app).

## Component layers

| Layer | Examples |
|-------|----------|
| Layouts | DocuSignShell, AgreementTableView |
| Patterns | DataTable, GlobalNav, LocalNav, PageHeader, FilterBar, AIChat |
| Composites | Modal, Tabs, ComboBox, Panel/Rail, EmptyState, PreviewCard, SelectTile, SegmentedControl, Toast, Tree, WorkflowStepper, ColorPicker, StarRating, ZoomControl |
| Primitives | Button, Input, Card, Icon, Badge, Avatar/AvatarGroup, ToggleButton, Hotspot, Meter, Tag |
| Utilities | Stack, Grid, Inline, Container, Spacer, Portal |
| Tokens | CSS custom properties (colors, spacing, type) |

Use the public exports in `src/design-system/index.ts` and each component's
props as the catalog. The [2026-10-20 repair ledger](docs/foundation-repair-2026-10-20/ledger.json)
records implementation and verification evidence; the older audits remain historical.

## Browse prototypes

See what the team has built: [ProtoLab Gallery](https://protolab-mcp.vercel.app/prototypes)
