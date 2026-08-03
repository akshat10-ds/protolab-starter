// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=582-3894
// source=src/design-system/4-composites/TaskCard/TaskCard.tsx
// component=TaskCard
// drift: Figma "[INK] Task Card" is a plain component (no properties); its
// TaskCard.Header/Body/Footer children map to the code compound parts. Header "HasIcon?",
// Footer "HasChildren?"/"ChildType?" are child-instance props not readable from the parent.
import figma from 'figma'
const instance = figma.selectedInstance

// Heading text lives in the nested _Heading inside TaskCard.Header
const headingNode = instance.findText('text', { traverseInstances: true, path: ['TaskCard.Header'] })
const heading = headingNode && headingNode.type === 'TEXT' ? headingNode.textContent : 'Task card heading'

const bodyNode = instance.findText('text', { traverseInstances: true, path: ['TaskCard.Body'] })
const body = bodyNode && bodyNode.type === 'TEXT' ? bodyNode.textContent : 'Task card body'

// Footer metadata is the direct text layer; the action label sits inside the callToAction Button
const metadataNode = instance.findText('text', { traverseInstances: true, path: ['TaskCard.Footer'] })
const metadata = metadataNode && metadataNode.type === 'TEXT' ? metadataNode.textContent : 'Metadata'

const actionNode = instance.findText('text', { traverseInstances: true, path: ['callToAction'] })
const actionLabel = actionNode && actionNode.type === 'TEXT' ? actionNode.textContent : 'Button'

export default {
  example: figma.code`<TaskCard>
  <TaskCard.Header heading="${heading}" />
  <TaskCard.Body>${body}</TaskCard.Body>
  <TaskCard.Footer metadata="${metadata}" actionLabel="${actionLabel}" />
</TaskCard>`,
  imports: ["import { TaskCard } from '@/design-system'"],
  id: 'task-card',
  metadata: { nestable: false },
}
