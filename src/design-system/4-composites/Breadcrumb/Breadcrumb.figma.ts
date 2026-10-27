// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=180-2159
// source=src/design-system/4-composites/Breadcrumb/Breadcrumb.tsx
// component=Breadcrumb
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const overflowMenu = instance.getEnum('❖ Overflow Menu', { False: false, True: true })
const crumbs = instance.findLayers(node => node.type === 'INSTANCE' && /Breadcrumb[.]Item|Breadcrumb Item|^Item \d+$|^Current Page$/.test(node.name))
let items = figma.code``
for (const [index, item] of crumbs.entries()) {
  if (item.type !== 'INSTANCE') continue
  const label = item.getString('text')
  const current = item.getEnum('❖ Current Page', { False: false, True: true })
  items = figma.code`${items}{ label: ${JSON.stringify(label)}, current: ${current} },`
}
const root = instance.findInstance('Breadcrumb.Icon')
if (root.type === 'INSTANCE') items = figma.code`{ label: rootLabel },${items}`
export default {
  example: figma.code`<Breadcrumb${root.type === 'INSTANCE' ? ' rootIcon' : ''}${overflowMenu ? ' overflowMenu' : ''} items={[${items}]} />`,
  imports: ["import { Breadcrumb } from '@/design-system'"], id: 'breadcrumb', metadata: { nestable: false },
}
