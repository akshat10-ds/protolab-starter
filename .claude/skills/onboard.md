---
name: onboard
description: Verify project setup and show getting-started guide
user_invocable: true
---

# /onboard — Get started with ProtoLab

Verify this project is set up correctly and show the user how to get started.

## Steps

1. Check `node_modules/` exists — if not, run `npm install`
2. Check `src/design-system/` exists and has components — this is what actually matters
3. Check `AGENTS.md` exists and read it, so the build rules are in context
4. Check `version.json` exists — show component count and build date
5. Check `.mcp.json` exists and whether the MCP server is reachable (`list_components`). **This is optional** — report it as a bonus, never as a failure
6. Start dev server if not running: `npm run dev`
7. Print the getting-started checklist:

## Output

```
ProtoLab Starter — Ready!

✓ Dependencies installed
✓ 63 components in src/design-system/
✓ Build rules loaded from AGENTS.md
✓ Dev server running at http://localhost:5173
· ProtoLab MCP connected (optional — extra search and validation tools)

Available skills:
  /deploy                  — Ship your prototype to a shareable URL
  /fork                    — Build on top of someone else's prototype
  /handoff                 — Generate engineer handoff document
  /update                  — Update design system components
  /reference-to-prototype  — Rebuild a live Docusign page with Ink components

Try saying:
  "Build me a settings page with a sidebar and form"
  "Create a dashboard with metrics cards and a data table"
  "Add a modal for creating new agreements"
```

## If something is wrong

- Missing node_modules: run `npm install` automatically
- MCP not reachable: say so in one line and carry on — the components are local, so nothing is blocked
- Missing design-system: suggest re-cloning the repo, or duplicating the v0 template at
  https://v0.app/templates/team?team=docusign-xd&c=akshatmishra
