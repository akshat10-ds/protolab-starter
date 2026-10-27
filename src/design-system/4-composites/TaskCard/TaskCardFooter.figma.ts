// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=580-18541
// source=src/design-system/4-composites/TaskCard/TaskCard.tsx
// component=TaskCard.Footer
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const hasChildren = instance.getBoolean('HasChildren?')
const childType = instance.getEnum('ChildType?', { metadata: 'metadata', custom: 'custom', AvatarGroup: 'AvatarGroup' })
const content = hasChildren ? instance.getSlot('children') : undefined
const action = instance.findInstance('callToAction', { traverseInstances: true })
const actionLabel = action.type === 'INSTANCE' ? action.findText('text', { traverseInstances: true }) : null
const metadata = instance.findText('text')
export default { example: childType === 'metadata' ? figma.code`<TaskCard.Footer showMetadata={${hasChildren}}${hasChildren && metadata.type === 'TEXT' ? figma.code` metadata={${JSON.stringify(metadata.textContent)}}` : ''}${actionLabel?.type === 'TEXT' ? figma.code` actionLabel={${JSON.stringify(actionLabel.textContent)}}` : ''} onActionClick={() => {}} />` : figma.code`<TaskCard.Footer>${content}${action.type === 'INSTANCE' ? action.executeTemplate().example : ''}</TaskCard.Footer>`, imports: ["import { TaskCard } from '@/design-system'"], id: 'task-card-footer', metadata: { nestable: true } }
