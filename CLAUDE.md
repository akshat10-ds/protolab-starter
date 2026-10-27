# ProtoLab Starter

**Read [AGENTS.md](AGENTS.md) first — it holds the rules for building in this
project (use `@/design-system`, never hand-roll UI, tokens not hex values, page
conventions).** This file only covers the Claude Code specifics on top of it.

## Skills

| Skill | What it does |
|---|---|
| `/deploy` | Commit + push → shareable Vercel preview URL |
| `/fork` | Build on top of another team member's prototype |
| `/handoff` | Generate an engineer handoff doc with component inventory |
| `/update` | Check for and apply design system component updates |
| `/onboard` | Verify setup and show the getting-started guide |
| `/reference-to-prototype` | Capture a live Docusign page and rebuild it with Ink components |

Definitions live in `.claude/skills/`.

## Figma

Handed a Figma frame or URL? Read [docs/figma-to-prototype.md](docs/figma-to-prototype.md)
— name crosswalk, token mapping, and what to do about unmapped components.
Coverage index: [docs/figma-code-connect.md](docs/figma-code-connect.md).
The repaired inventory has 83 local template files, with 81 active targets and
unresolved Alert/Popover stubs. Child/variant templates do not count as separate
public families, and local files do not prove published Figma registration.

## ProtoLab MCP (optional)

`.mcp.json` connects to a hosted MCP server that adds component search,
validation, and Figma translation tools. It's a convenience, not a requirement —
the public Ink catalog is already in this repo, so everything works if the server is
unreachable or you removed the config.

The catalog now includes EmptyState, SegmentedControl, SelectTile/SelectTileGroup,
PreviewCard, Panel/Rail, Toast, Tree, WorkflowStepper, ColorPicker, StarRating,
ZoomControl, Hotspot, Meter, Tag, ToggleButton and AvatarGroup. Check the
`@/design-system` barrel and current props before composing an approximation.

When it is connected, the `plan_prototype` prompt is a good entry point for a
new screen: it maps the request to components and shows a layout plan before
building.

## Commands

```bash
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```
