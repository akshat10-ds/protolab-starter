// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=15330-36710
// source=src/design-system/4-composites/List/List.tsx
// component=List.Item
// Mapped to "Child/[INK] List.Item" (15330:36710) — the List page has NO parent "[INK] List"
// component set (only List.Item and List.Heading), so the item is the primary mapping. The code
// List container (variant/size/ordered/hoverable) therefore has no Figma counterpart.
// Drift: Figma "text" maps to children; "HasDescription?" + "description" map to the code
// "description" prop. Code "meta", "clickable", "align" have no Figma props.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const hasDescription = instance.getBoolean('HasDescription?')
const description = instance.getString('description')
const selected = instance.getEnum('selected', { True: true, False: false })
const disabled = instance.getEnum('disabled', { True: true, False: false })

// startElement / endElement (BOOLEAN) toggle visibility of same-named child instances
const hasStart = instance.getBoolean('startElement')
let startCode
if (hasStart) {
  const start = instance.findInstance('startElement')
  if (start && start.type === 'INSTANCE') {
    startCode = start.executeTemplate().example
  }
}
const hasEnd = instance.getBoolean('endElement')
let endCode
if (hasEnd) {
  const end = instance.findInstance('endElement')
  if (end && end.type === 'INSTANCE') {
    endCode = end.executeTemplate().example
  }
}

// Figma-only properties intentionally omitted: "❖ State" (interaction state, no code prop)

export default {
  example: figma.code`<List.Item${hasDescription ? figma.code` description="${description}"` : ''}${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}${startCode ? figma.code` startElement={${startCode}}` : ''}${endCode ? figma.code` endElement={${endCode}}` : ''}>${text}</List.Item>`,
  imports: ["import { List } from '@/design-system'"],
  id: 'list-item',
  metadata: { nestable: true },
}
