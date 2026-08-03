// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=16004-4399
// source=src/design-system/4-composites/Chip/Chip.tsx
// component=Chip
// Drift: Figma "closeButton" maps to the presence of the code "onRemove" handler.
// Code "selected" and "onClick" have no Figma counterparts.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const disabled = instance.getEnum('disabled', { True: true, False: false })
const hasClose = instance.getBoolean('closeButton')

// startElement (BOOLEAN) toggles visibility of the "startElement" child instance
const hasStart = instance.getBoolean('startElement')
let startCode
if (hasStart) {
  const start = instance.findInstance('startElement')
  if (start && start.type === 'INSTANCE') {
    startCode = start.executeTemplate().example
  }
}

// Figma-only properties intentionally omitted: "❖ State" (interaction state, no code prop)

export default {
  example: figma.code`<Chip${disabled ? ' disabled' : ''}${startCode ? figma.code` startElement={${startCode}}` : ''}${hasClose ? ' onRemove={() => {}}' : ''}>${text}</Chip>`,
  imports: ["import { Chip } from '@/design-system'"],
  id: 'chip',
  metadata: { nestable: true },
}
