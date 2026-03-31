# ProtoLab Starter

Ink Design System starter template — 63 production components, ready to prototype with AI.

## What This Is

A Vite + React + TypeScript project pre-loaded with the complete Ink Design System (Docusign's component library). Use it to build high-fidelity prototypes that look and behave like the real product.

## ProtoLab MCP (auto-connected)

This project is connected to the ProtoLab MCP server via `.mcp.json`. The MCP provides:

- **Composition intelligence** — knows how to combine components correctly
- **Validation** — checks your code for wrong props, missing imports, hardcoded values
- **Figma integration** — translates Figma designs to Ink components
- **Component search** — find the right component for any UI need

### Recommended entry point

Use the `plan_prototype` prompt for new screens:
> "Build me a settings page with a sidebar, form fields, and a save button"

The MCP will analyze your request, map it to Ink components, show you a layout plan, and then build it.

## Available Skills

- `/deploy` — commit + push → get a shareable Vercel preview URL
- `/fork` — build on top of another team member's prototype
- `/handoff` — generate engineer handoff document with component inventory
- `/update` — check for and apply design system component updates
- `/onboard` — verify setup and show getting-started guide

## Design System Structure

Components are organized in 6 layers (higher layers compose lower ones):

```
src/design-system/
├── 1-tokens/      — CSS custom properties (colors, spacing, typography)
├── 2-utilities/   — Stack, Grid, Inline, Container, Spacer
├── 3-primitives/  — Button, Input, Card, Icon, Badge, Select, ...
├── 4-composites/  — Modal, Tabs, ComboBox, Accordion, Dropdown, ...
├── 5-patterns/    — DataTable, GlobalNav, LocalNav, PageHeader, FilterBar, ...
└── 6-layouts/     — DocuSignShell, AgreementTableView
```

All components are imported from `@/design-system`:
```tsx
import { Button, DataTable, DocuSignShell } from '@/design-system';
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Key Conventions

- **DocuSignShell** wraps every page — always include `globalNav` and optionally `localNav`
- **DataTable** is data-driven — pass `columns` + `data`, never use children
- **Tables are NOT wrapped in Cards** (Docusign convention)
- Use **design tokens** (CSS custom properties) — never hardcode colors or spacing
- Import all components from `@/design-system` barrel export
