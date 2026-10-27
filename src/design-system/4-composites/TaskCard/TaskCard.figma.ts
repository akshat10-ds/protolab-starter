// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=582-3894
// source=src/design-system/4-composites/TaskCard/TaskCard.tsx
// component=TaskCard
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const children = instance.getSlot('children')
export default { example: figma.code`<TaskCard>${children}</TaskCard>`, imports: ["import { TaskCard } from '@/design-system'"], id: 'task-card', metadata: { nestable: false } }
