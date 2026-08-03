// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=196-1439
// source=src/design-system/3-primitives/Tooltip/Tooltip.tsx
// component=Tooltip
// NOTE: code "children" (the trigger element) is required and has no Figma
// counterpart — a placeholder comment is emitted.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const location = instance.getEnum('location', {
  above: 'above',
  below: 'below',
  before: 'before',
  after: 'after',
})
const alignment = instance.getEnum('alignment', {
  start: 'start',
  center: 'center',
  end: 'end',
})

export default {
  example: figma.code`<Tooltip text="${text}" location="${location}" alignment="${alignment}">{/* trigger element */}</Tooltip>`,
  imports: ["import { Tooltip } from '@/design-system'"],
  id: 'tooltip',
  metadata: { nestable: true },
}
