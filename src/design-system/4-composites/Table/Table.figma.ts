// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=33703-4948
// source=src/design-system/4-composites/Table/Table.tsx
// component=Table
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const borderRule = instance.getEnum('borderRule', { none: 'none', rows: 'rows', columns: 'columns', both: 'both' })
const columnNodes = instance.findLayers(node => node.type === 'INSTANCE' && /^table-col-/.test(node.name))
let columns = figma.code``
const cells: ReturnType<typeof figma.code>[] = []
let selectable = false
let sortColumn
let sortDirection
for (const [index, column] of columnNodes.entries()) {
  if (column.type !== 'INSTANCE') continue
  const variant = column.getEnum('❖ Col Variant', { Standard: 'standard', Numeric: 'numeric', Actions: 'actions', Component: 'component', 'Row Controls': 'selection' })
  if (variant === 'selection') { selectable = true; continue }
  const key = `column${index}`
  const header = column.findText('Header Text', { traverseInstances: true })
  const headerCell = column.findInstance('tr-header', { traverseInstances: true })
  const sort = headerCell.type === 'INSTANCE' ? headerCell.getEnum('sortDirection', { none: 'none', sortable: 'sortable', ascending: 'asc', descending: 'desc' }) : 'none'
  if (sort === 'asc' || sort === 'desc') { sortColumn = key; sortDirection = sort }
  columns = figma.code`${columns}{ key: '${key}', header: ${JSON.stringify(header.type === 'TEXT' ? header.textContent : '')}${variant === 'numeric' ? ", align: 'right'" : ''}${sort !== 'none' ? ', sortable: true' : ''} },`
  for (let row = 1; row <= 12; row++) {
    const number = row < 10 ? `0${row}` : `${row}`
    if (!column.getBoolean(`⮑ Row ${number}`)) continue
    const cell = column.findInstance(`tr${number}`, { traverseInstances: true })
    if (cell.type !== 'INSTANCE') continue
    const content = cell.findInstance('content', { traverseInstances: true })
    const code = content.type === 'INSTANCE' ? content.executeTemplate().example : undefined
    const text = cell.findText('text', { traverseInstances: true })
    cells[row - 1] = figma.code`${cells[row - 1]}${key}: ${code ? figma.code`(<>${code}</>)` : JSON.stringify(text.type === 'TEXT' ? text.textContent : '')},`
  }
}
let rows = figma.code``
for (const [index, cellsCode] of cells.entries()) { if (cellsCode) rows = figma.code`${rows}{ id: ${index}, ${cellsCode} },` }
export default {
  example: figma.code`<Table borderRule="${borderRule}" selectable={${selectable}} getRowKey={(row) => row.id}${sortColumn ? figma.code` sortColumn="${sortColumn}" sortDirection="${sortDirection}" onSortChange={(column, direction) => {}}` : ''} columns={[${columns}]} data={[${rows}]} />`,
  imports: ["import { Table } from '@/design-system'"], id: 'table', metadata: { nestable: false },
}
