// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=577-10373
// source=src/design-system/4-composites/WorkflowStepper/WorkflowStepper.tsx
// component=WorkflowStepper.Item
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const description = instance.getBoolean('❖ Description') ? instance.getString('description') : undefined
const status = instance.getEnum('status', { current: 'current', unvisited: 'unvisited', visited: 'visited' })
const isComplete = instance.getEnum('isComplete', { False: false, True: true })
const defaultExpanded = instance.getBoolean('❖ Expand children')
const before = instance.getBoolean('❖ Show Before Connector')
const end = instance.getBoolean('❖ Show End Connector')
const children = instance.getSlot('children')
const action = instance.getBoolean('callToAction') ? instance.findInstance('Button', { traverseInstances: true }) : null
const actionCode = action?.type === 'INSTANCE' ? action.executeTemplate().example : undefined
export default { example: figma.code`<WorkflowStepper.Item text={${JSON.stringify(text)}} status="${status}" isComplete={${isComplete}} defaultExpanded={${defaultExpanded}} showBeforeConnector={${before}} showEndConnector={${end}}${description ? figma.code` description={${JSON.stringify(description)}}` : ''}${actionCode ? figma.code` callToAction={<>${actionCode}</>}` : ''}>${children}</WorkflowStepper.Item>`, imports: ["import { WorkflowStepper } from '@/design-system'"], id: 'workflow-stepper-item', metadata: { nestable: true } }
