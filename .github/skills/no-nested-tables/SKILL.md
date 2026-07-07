---
name: no-nested-tables
description: 'Prevent table elements from being nested inside other table elements. Use when writing or reviewing DataTable, <table>, <thead>, <tbody>, <tr>, <td>, or <th> elements in TSX, JSX, or HTML.'
user-invocable: true
---

# No Nested Tables

Never place a table element inside another table element.

## When To Use
- Adding a DataTable component inside any layout
- Writing or reviewing JSX/TSX that contains `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, or `<th>` elements
- Reviewing a DataTable rendered inside a Card, Modal, Accordion, or any composite component that itself uses a table internally

## Rules
1. A table element is any of: `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, `<th>`, or the `DataTable` component.
2. No table element may appear as a descendant of another table element — at any nesting depth.
3. If tabular data must appear inside a cell, extract it to a separate component rendered outside the parent table.
4. Do not use a table for layout purposes inside a cell (`<td>` / `<th>`).
5. A `DataTable` component counts as a `<table>` — do not nest it inside another `DataTable`, `<td>`, or `<th>`.

## Detection Procedure
1. Locate every table element in the file.
2. For each one, walk up the JSX/HTML ancestor tree.
3. If any ancestor is also a table element, a violation exists.
4. Report the inner element and the ancestor that contains it.

## Fix Procedure
1. Extract the inner table (and its data) into its own component or sibling element.
2. Place the extracted component alongside — not inside — the outer table.
3. If the goal was to show related data inline, use an expandable row pattern or a detail panel instead.

## Violation Examples

### JSX — nested DataTable inside a cell
```tsx
// WRONG
<DataTable columns={outerCols} data={outerData}>
  {/* DataTable renders a <table> internally */}
  <DataTable columns={innerCols} data={innerData} />
</DataTable>

// WRONG — DataTable inside a <td>
<table>
  <tbody>
    <tr>
      <td>
        <DataTable columns={cols} data={rows} />
      </td>
    </tr>
  </tbody>
</table>
```

### HTML — nested table inside a cell
```html
<!-- WRONG -->
<table>
  <tbody>
    <tr>
      <td>
        <table>
          <tr><td>nested</td></tr>
        </table>
      </td>
    </tr>
  </tbody>
</table>
```

## Correct Pattern

```tsx
// RIGHT — tables are siblings, not nested
<DataTable columns={summaryColumns} data={summaryData} />
<DataTable columns={detailColumns} data={detailData} />
```

```html
<!-- RIGHT — extract to a separate section -->
<table>
  <tbody>
    <tr><td>Top-level data</td></tr>
  </tbody>
</table>
<table>
  <tbody>
    <tr><td>Related data in a separate table</td></tr>
  </tbody>
</table>
```

## Completion Checklist
- No `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, or `<th>` element has a table element ancestor
- No `DataTable` is rendered inside a `<td>`, `<th>`, or another `DataTable`
- Extracted tables are siblings or placed in a separate section/component
