// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=11096-32089
// source=src/design-system/4-composites/Dropdown/Dropdown.tsx
// component=Dropdown
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const variant = instance.getEnum('glass', { True: 'glass', False: 'solid' })
const children = instance.findLayers(node => node.type === 'INSTANCE' && /Item \d+|Menu[.]Item|Menu[.]Group|Menu[.]Divider|^Title \d+$|^Divider$/.test(node.name))
let items = figma.code``
for (const item of children) {
  if (item.type !== 'INSTANCE') continue
  if (/Divider/.test(item.name)) { items = figma.code`${items}{ divider: true },`; continue }
  if (/Group|^Title \d+$/.test(item.name)) { items = figma.code`${items}{ section: ${JSON.stringify(item.getString('title'))} },`; continue }
  const label = item.getString('text')
  const disabled = item.getEnum('disabled', { True: true, False: false })
  const selected = item.getEnum('selected', { True: true, False: false })
  const kind = item.getEnum('kind', { Default: 'default', Alert: 'alert' })
  const description = item.getBoolean('HasDescription?') ? item.getString('description') : undefined
  const start = item.getBoolean('HasStartElement?') ? item.getSlot('startElement') : undefined
  const end = item.getBoolean('HasEndElement?') ? item.getSlot('endElement') : undefined
  const shortcut = item.findText('Shortcut Text', { traverseInstances: true })
  items = figma.code`${items}{ label: ${JSON.stringify(label)}, disabled: ${disabled}, selected: ${selected}, kind: '${kind}', onClick: () => {}${description ? figma.code`, description: ${JSON.stringify(description)}` : ''}${start ? figma.code`, icon: (<>${start}</>)` : ''}${end ? figma.code`, endElement: (<>${end}</>)` : ''}${shortcut.type === 'TEXT' ? figma.code`, shortcut: ${JSON.stringify(shortcut.textContent)}` : ''} },`
}
export default {
  example: figma.code`<Dropdown variant="${variant}" items={[${items}]}><Button kind="secondary" menuTrigger>Open menu</Button></Dropdown>`,
  imports: ["import { Dropdown, Button } from '@/design-system'"], id: 'menusections', metadata: { nestable: false },
}
