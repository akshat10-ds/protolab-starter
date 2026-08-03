// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=33703-4948
// source=src/design-system/4-composites/Table/Table.tsx
// component=Table
// drift: Figma "[INK] Table" is column-composed (Table.Col children, per-column booleans);
// code Table is data-driven (columns + data props). Figma "borderRule" maps lossily to code
// "variant": none -> 'default', any border rule -> 'bordered' (code has no rows/columns split).
// Figma "❖ Show Selection Col" maps to code "selectable".
import figma from 'figma'
const instance = figma.selectedInstance

const selectable = instance.getBoolean('❖ Show Selection Col')
const variant = instance.getEnum('borderRule', {
  none: 'default',
  rows: 'bordered',
  columns: 'bordered',
  both: 'bordered',
})

// Figma-only properties intentionally omitted: "❖ Show Col 4".."❖ Show Col 7",
// "❖ Show End Col" (column count comes from the code columns array),
// "◇ Draggable Rows" (no code prop)

export default {
  example: figma.code`<Table
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ]}
  data={[]}
  variant="${variant}"${selectable ? figma.code`
  selectable` : ''}
/>`,
  imports: ["import { Table } from '@/design-system'"],
  id: 'table',
  metadata: { nestable: false },
}
