// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=580-18644
// source=src/design-system/4-composites/TaskCard/TaskCard.tsx
// component=TaskCard.Header
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const showIcon = instance.getBoolean('HasIcon?')
const heading = instance.findText('text', { traverseInstances: true })
export default { example: figma.code`<TaskCard.Header heading={${JSON.stringify(heading.type === 'TEXT' ? heading.textContent : '')}} showIcon={${showIcon}}${showIcon ? ' onIconClick={() => {}}' : ''} />`, imports: ["import { TaskCard } from '@/design-system'"], id: 'task-card-header', metadata: { nestable: true } }
