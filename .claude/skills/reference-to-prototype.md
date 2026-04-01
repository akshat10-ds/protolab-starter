---
name: reference-to-prototype
description: Capture a live reference page and generate a production-accurate prototype view using Ink design system components
user_invocable: true
---

# /reference-to-prototype — Build from a live reference

Capture a live production page, extract a structural spec, then generate Ink prototype code that matches ~95% fidelity. The design system handles spacing, colors, typography — this skill captures **what** components to use and **what** content they display.

## Input

The user provides either:
- A URL to a live page (opens in Chrome DevTools MCP)
- A screenshot path
- A sidebar view name to build (e.g., "Requests", "Parties")

If the user has the reference page already open, ask which tab to use.

## Phase 1: CAPTURE

Extract the structural skeleton from the reference page. Use Chrome DevTools MCP tools.

### 1a. Screenshot
Take a viewport screenshot for visual reference. Save to the project root with a descriptive name (e.g., `docusign-requests-ref.png`).

### 1b. Accessibility snapshot
Take an a11y snapshot (`take_snapshot`). This gives you the component tree: headings, buttons, inputs, tables, labels, badges — everything with its role and text.

### 1c. Icon extraction
Run `evaluate_script` to extract SVG path data from sidebar nav items and any other icon-bearing elements:

```js
() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const targets = btns.filter(b => b.querySelector('svg'));
  return targets.map(btn => {
    const label = btn.textContent?.replace(/New/g, '').trim();
    const pathD = btn.querySelector('svg path')?.getAttribute('d')?.substring(0, 80);
    return { label, pathStart: pathD };
  }).filter(r => r.label && r.label.length < 40);
}
```

Then match each extracted path against `src/design-system/3-primitives/Icon/iconPaths.ts` using Grep. The first 40-60 characters of the `d` attribute are enough to uniquely identify an icon.

### 1d. Table structure
If the page has a data table, extract column headers and a sample row from the a11y snapshot. Note:
- Which columns are sortable (look for sort indicators)
- Which cells have custom rendering (badges, avatars, links, icons)
- Whether rows are selectable (checkboxes)
- Pagination info (page size, total items)

## Phase 2: SPEC

Build a structured spec from the captured data. Present this to the user for approval before writing code.

### Spec format

```
## Page: [Name]

### PageHeader
- title: "[exact title text]"
- showAIBadge: true/false
- aiBadgeText: "[text]"
- actions:
  - Button kind="secondary" label="[text]"
  - IconButton icon="[name]" variant="tertiary"

### Banner (if present)
- kind: "promo" | "information" | etc.
- icon: "[name]" or customIcon: IrisIcon
- text: "[content]"
- closable: true/false

### FilterBar
- viewSelector: Button "[label]" (if present)
- search placeholder: "[text]"
- showSearchIndicator: true/false
- quickActions: [list of IconButtons]
- filters:
  - Chip "[label]" (removable)
  - Button "[label]" menuTrigger
  - ...

### DataTable
- selectable: true/false
- showColumnControl: true/false
- rowHeight: "default" | "tall"
- columns:
  | Key | Header | Width | Sortable | Cell renderer |
  |-----|--------|-------|----------|---------------|
  | ... | ...    | ...   | ...      | Text / Badge / Avatar+Text / Link / etc. |

### Sample data (3-5 rows minimum, match real data shapes)
[structured data matching the column spec]

### Pagination
- pageSize: [n]
- totalItems: [n]
```

### Matching to Ink components

Use this mapping for common UI patterns seen in production:

| Reference element | Ink component | Key props |
|-------------------|--------------|-----------|
| Page title + AI pill | `PageHeader` | `title`, `showAIBadge` |
| Outlined button with dropdown arrow | `Button kind="secondary" menuTrigger` |
| Filled purple button | `Button kind="brand"` |
| Green pill with dot + text | `Badge kind="success"` + inline dot span |
| Avatar circle with initials | `Avatar size="small" initials="XX"` |
| Filter chip with × | `Chip onRemove={() => {}}` |
| Search box | `FilterBar search={{ ... }}` |
| Sortable column | Column with `sortable: true` |
| Column visibility gear | `showColumnControl` on DataTable |
| Star/favorite icon | `IconButton icon="star" variant="tertiary"` |

### Icon matching

For any icon, prefer exact SVG path matching over guessing names:
1. Extract the SVG `d` attribute from the reference
2. Grep the first 40 chars against `iconPaths.ts`
3. Use the matched icon name

If no path match, use the closest semantic icon name from the design system.

## Phase 3: BUILD

After the user approves the spec:

### 3a. Add types and data
- Add the data interface to App.tsx (e.g., `interface RequestItem { ... }`)
- Add sample data array (minimum 5-8 rows, matching real data from the reference)
- Add column definitions with cell renderers

### 3b. Add the view
- Add the view ID to `SidebarView` type
- Add the view label to `VIEW_LABELS`
- Add filtered data memo
- Wire the sidebar click handler
- Add the view rendering in the `AgreementTableView` content block:
  - PageHeader with correct title, badge, actions
  - FilterBar with correct search, filters, quickActions
  - DataTable with columns, data, pagination

### 3c. Verify
- Run `npx vite build` to confirm no errors
- Reload the browser and navigate to the new view
- Take a screenshot and compare side-by-side with the reference

## Rules

1. **Don't guess icons** — always match SVG paths or ask the user
2. **Don't guess button variants** — check if it's filled (brand) or outlined (secondary)
3. **Use real data** from the reference, not placeholder text
4. **Match column order** exactly as shown in the reference
5. **Present the spec before building** — the user must approve
6. **The design system handles visual polish** — don't add custom CSS for spacing, colors, or typography
7. **Reuse existing patterns** — if another view (e.g., Navigator/Completed) already does something similar, copy its approach
8. **One view at a time** — don't try to build multiple views in one pass
