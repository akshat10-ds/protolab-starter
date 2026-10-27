// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=12670-16542
// source=src/design-system/4-composites/Panel/Panel.tsx
// component=Panel
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const floating = instance.getEnum('floating', { False: false, True: true })
const background = instance.getEnum('backgroundColor', { Default: 'default', Secondary: 'secondary' })
const noPadding = instance.getEnum('noPadding', { False: false, True: true })
const left = instance.getBoolean('❖ Left Border')
const right = instance.getBoolean('❖ Right Border')
const close = instance.getBoolean('closeButton')
const collapsible = instance.getBoolean('collapsible')
const header = instance.getSlot('Panel.Header')
const body = instance.getSlot('Panel.Body')
const footer = instance.getSlot('Panel.Footer')
export default {
  example: figma.code`<Panel aria-label="Supplemental panel" floating={${floating}} background="${background}" noPadding={${noPadding}} leftBorder={${left}} rightBorder={${right}} closeButton={${close}} collapsible={${collapsible}}${close ? ' onClose={() => {}}' : ''}${header ? figma.code` header={<>${header}</>}` : ''}${footer ? figma.code` footer={<>${footer}</>}` : ''}>${body}</Panel>`,
  imports: ["import { Panel } from '@/design-system'"], id: 'panel', metadata: { nestable: false },
}
