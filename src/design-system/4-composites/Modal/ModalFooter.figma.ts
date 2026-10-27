// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=424-6144
// source=src/design-system/4-composites/Modal/Modal.tsx
// component=Inline
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const stacked = instance.getEnum('Stacked', { False: false, True: true })
const secondary = instance.getBoolean('❖ Secondary Action') ? instance.findInstance('Secondary Action', { traverseInstances: true }) : null
const primary = instance.findInstance('Primary Action', { traverseInstances: true })
const secondaryCode = secondary?.type === 'INSTANCE' ? secondary.executeTemplate().example : undefined
const primaryCode = primary.type === 'INSTANCE' ? primary.executeTemplate().example : undefined
export default { example: stacked ? figma.code`<Stack gap="small"><>${primaryCode}${secondaryCode}</></Stack>` : figma.code`<Inline gap="large"><>${secondaryCode}${primaryCode}</></Inline>`, imports: ["import { Inline, Stack } from '@/design-system'"], id: 'modal-footer', metadata: { nestable: true } }
