# ProtoLab Architecture — For INK Team

## What It Is

ProtoLab is a prototyping platform built on the Ink Design System. It separates the **artifact** (protolab-starter template) from the **brain** (ProtoLab MCP server).

## Two Repos

### protolab-starter (github.com/akshat10-ds/protolab-starter)
- **The template** — standalone Vite + React project
- Contains all 63 Ink DS components in `src/design-system/`
- Components are framework-agnostic (React + CSS Modules)
- Deployed on Vercel at protolab-starter.vercel.app
- Anyone clones it, opens in VS Code, and starts building with AI

### protolab-mcp (github.com/akshat10-ds/protolab-mcp)
- **The MCP server** — Next.js app deployed on Vercel
- Provides AI composition intelligence for 63 Ink components
- Tools: search, validate, scaffold, scan, handoff
- Prompts: plan_prototype, build_prototype, figma_to_code
- Auto-connects via `.mcp.json` in the starter template
- Live at protolab-mcp.vercel.app

## How Updates Flow

```
protolab-source/ (component source in protolab-mcp)
    |
    v
GitHub Action triggers on component changes
    |
    v
generate-template.ts rebuilds template
    |
    v
Syncs src/design-system/ to protolab-starter repo
    |
    v
Vercel auto-deploys updated template
```

## Design System Integration

- All 63 Ink DS components included
- All 6 layers: Tokens → Utilities → Primitives → Composites → Patterns → Layouts
- Design tokens (spacing, colors, radius, gradients) used throughout
- CSS Modules for component styling (framework-agnostic)
- Barrel exports from `@/design-system`

## Cost Impact

- v0 alone: $4,530 / 3 months for 40 users
- v0 + ProtoLab MCP: 40x cost reduction (case study: $68 → $1.67)
- Projected annual savings at 310-person scale: $260K+

## Live URLs

- Template: https://protolab-starter.vercel.app
- MCP Server: https://protolab-mcp.vercel.app
- Gallery: https://protolab-mcp.vercel.app/prototypes
- MCP Endpoint: https://protolab-mcp.vercel.app/api/mcp
