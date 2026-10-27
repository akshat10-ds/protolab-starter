// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=113-597
// source=src/design-system/4-composites/EmptyState/EmptyState.tsx
// component=EmptyState.Body
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const body = instance.getString('body')
export default { example: figma.code`<EmptyState.Body>${body}</EmptyState.Body>`, imports: ["import { EmptyState } from '@/design-system'"], id: 'empty-state-body', metadata: { nestable: true } }
