---
name: onboard
description: Verify project setup and show getting-started guide
user_invocable: true
---

# /onboard — Get started with ProtoLab

Verify this project is set up correctly and show the user how to get started.

## Steps

1. Check `node_modules/` exists — if not, run `npm install`
2. Check `.mcp.json` exists — verify the MCP server URL is reachable by calling `list_components` tool
3. Check `src/design-system/` exists and has components
4. Check `version.json` exists — show component count and build date
5. Start dev server if not running: `npm run dev`
6. Print the getting-started checklist:

## Output

```
ProtoLab Starter — Ready!

✓ Dependencies installed
✓ ProtoLab MCP connected (63 components available)
✓ Dev server running at http://localhost:5173

Available skills:
  /deploy    — Ship your prototype to a shareable URL
  /fork      — Build on top of someone else's prototype
  /handoff   — Generate engineer handoff document
  /update    — Update design system components

Try saying:
  "Build me a settings page with a sidebar and form"
  "Create a dashboard with metrics cards and a data table"
  "Add a modal for creating new agreements"
```

## If something is wrong

- Missing node_modules: run `npm install` automatically
- MCP not reachable: check internet connection, show the MCP URL for manual verification
- Missing design-system: suggest re-cloning the repo
