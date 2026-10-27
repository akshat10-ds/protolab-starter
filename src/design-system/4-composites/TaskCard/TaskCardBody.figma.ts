// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=580-18643
// source=src/design-system/4-composites/TaskCard/TaskCard.tsx
// component=TaskCard.Body
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
export default { example: figma.code`<TaskCard.Body>${text}</TaskCard.Body>`, imports: ["import { TaskCard } from '@/design-system'"], id: 'task-card-body', metadata: { nestable: true } }
