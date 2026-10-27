// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=113-589
// source=src/design-system/4-composites/EmptyState/EmptyState.tsx
// component=EmptyState.Footer
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const action = instance.getBoolean('HasButton?') ? instance.findInstance('Primary Action', { traverseInstances: true }) : null
const link = instance.getBoolean('HasLink?') ? instance.findInstance('Link', { traverseInstances: true }) : null
const actionCode = action?.type === 'INSTANCE' ? action.executeTemplate().example : undefined
const linkCode = link?.type === 'INSTANCE' ? link.executeTemplate().example : undefined
export default { example: figma.code`<EmptyState.Footer>${actionCode}${linkCode}</EmptyState.Footer>`, imports: ["import { EmptyState } from '@/design-system'"], id: 'empty-state-footer', metadata: { nestable: true } }
