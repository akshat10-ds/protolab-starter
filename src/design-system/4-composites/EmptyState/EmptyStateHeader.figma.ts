// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=113-598
// source=src/design-system/4-composites/EmptyState/EmptyState.tsx
// component=EmptyState.Header
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.findText('text', { traverseInstances: true, path: ['heading'] })
export default { example: figma.code`<EmptyState.Header>${text.type === 'TEXT' ? text.textContent : ''}</EmptyState.Header>`, imports: ["import { EmptyState } from '@/design-system'"], id: 'empty-state-header', metadata: { nestable: true } }
