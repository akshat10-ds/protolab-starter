// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=16004-4399
// source=src/design-system/4-composites/Chip/Chip.tsx
// component=Chip
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const disabled = instance.getEnum('disabled', { True: true, False: false })
const selected = instance.getEnum('selected', { True: true, False: false })
const kind = instance.getEnum('kind', { default: 'default', AI: 'AI' })
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const hasClose = instance.getBoolean('closeButton')
const start = instance.getBoolean('HasStartElement?') ? instance.getSlot('startElement') : undefined
export default {
  example: figma.code`<Chip kind="${kind}" size="${size}"${selected ? ' selected onClick={() => {}}' : ''}${disabled ? ' disabled' : ''}${start ? figma.code` startElement={<>${start}</>}` : ''}${hasClose ? ' onRemove={() => {}}' : ''}>${text}</Chip>`,
  imports: ["import { Chip } from '@/design-system'"], id: 'chip', metadata: { nestable: true },
}
