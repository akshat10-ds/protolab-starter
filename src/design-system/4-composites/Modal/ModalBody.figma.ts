// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=567-4661
// source=src/design-system/4-composites/Modal/Modal.tsx
// component=Text
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const body = instance.findText('Body Text', { traverseInstances: true })
export default { example: figma.code`<Text size="sm">${body.type === 'TEXT' ? body.textContent : ''}</Text>`, imports: ["import { Text } from '@/design-system'"], id: 'modal-body', metadata: { nestable: true } }
