// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=12670-16543
// source=src/design-system/4-composites/Panel/Panel.tsx
// component=Rail
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const floating = instance.getBoolean('floating')
const background = instance.getEnum('backgroundColor', { Default: 'default', Secondary: 'secondary' })
const noPadding = instance.getEnum('noPadding', { False: false, True: true })
const left = instance.getBoolean('❖ Left Border')
const right = instance.getBoolean('❖ Right Border')
const children = instance.getSlot('children')
export default {
  example: figma.code`<Rail aria-label="Supplemental tools" floating={${floating}} background="${background}" noPadding={${noPadding}} leftBorder={${left}} rightBorder={${right}}>${children}</Rail>`,
  imports: ["import { Rail } from '@/design-system'"], id: 'rail', metadata: { nestable: true },
}
