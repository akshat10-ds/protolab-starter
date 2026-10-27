---
name: handoff
description: Generate an engineer handoff document (HANDOFF.md) with a component inventory for a ProtoLab prototype. Use when the user says "handoff", "hand this to engineering", or "what components does this use".
---

# /handoff — Prepare prototype for engineering

Generate a HANDOFF.md document that gives engineers everything they need to build from this prototype.

## Steps

0. Work in the project folder that contains `.protolab.json`. Read its `brief` and `deviations`.
1. Scan all `.tsx` files in `src/` (excluding `src/design-system/`) for Ink component imports
2. Build a component inventory: which components are used, how many instances of each
3. Check by hand against `AGENTS.md`: hardcoded colors/spacing, components not imported from `@/design-system`, tables wrapped in Cards, buttons without accessible names
4. Generate `HANDOFF.md` with:

### HANDOFF.md Structure

```markdown
# Prototype Handoff: {name}

## Component Inventory
| Component | Instances | Layer |
|-----------|-----------|-------|
| DocuSignShell | 1 | Layout |
| DataTable | 1 | Pattern |
| ...

## Component Tree
App
└── DocuSignShell (globalNav, localNav)
    └── AgreementTableView
        ├── PageHeader (title, actions)
        ├── FilterBar (search, filters)
        └── DataTable (columns, data, selectable)

## Design Tokens Used
- Colors: --ink-cobalt-90, --ink-bg-default, ...
- Spacing: --ink-spacing-200, --ink-spacing-300, ...

## Patterns used
- Bulk Send view: list layout (AgreementTableView), modelled on Requests

## Deviations from Docusign patterns
(from `deviations` in .protolab.json, or "None")

## Validation
- ✓ All props valid
- ⚠ Hardcoded color on line 34 — use --ink-font-default instead

## Migration to @ds/ui
To use this in production with the @ds/ui package:
1. Install: npm install @ds/ui @ds/tokens
2. Replace imports: `@/design-system` → `@ds/ui`
3. Replace token CSS: `src/design-system/1-tokens/tokens.css` → `@ds/tokens/css`
```

5. Also generate `ink-manifest.json` with the component list for the gallery

## Example output

```
Handoff ready! See HANDOFF.md for:
- 8 Ink components used
- Component tree visualization
- 1 validation warning (hardcoded color)
- Migration guide to @ds/ui

Share the preview link (from .protolab.json) with your engineer alongside this document.
```
