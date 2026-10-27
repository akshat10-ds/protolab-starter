// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=15330-36710
// source=src/design-system/4-composites/List/List.tsx
// component=List.Item
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const description = instance.getBoolean('HasDescription?') ? instance.getString('description') : undefined
const selected = instance.getEnum('selected', { True: true, False: false })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const start = instance.getBoolean('HasStartElement?') ? instance.getSlot('startElement') : undefined
const end = instance.getBoolean('HasEndElement?') ? instance.getSlot('endElement') : undefined
export default {
  example: figma.code`<List.Item${description ? figma.code` description={${JSON.stringify(description)}}` : ''}${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}${start ? figma.code` startElement={<>${start}</>}` : ''}${end ? figma.code` endElement={<>${end}</>}` : ''}>${text}</List.Item>`,
  imports: ["import { List } from '@/design-system'"], id: 'list-item', metadata: { nestable: true },
}
