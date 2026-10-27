// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1109-4043
// source=src/design-system/4-composites/Timeline/Timeline.tsx
// component=Timeline
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const children = instance.findLayers(node => node.type === 'INSTANCE' && /^Step \d+$/.test(node.name))
let items = figma.code``
const opened = []
for (const [index, step] of children.entries()) {
  if (step.type !== 'INSTANCE') continue
  const id = `event-${index + 1}`
  const label = step.getString('label')
  let status = step.getEnum('status', { other: 'current', complete: 'complete', incomplete: 'incomplete' })
  const indicators = step.findLayers(node => node.type === 'INSTANCE' && /Event Indicator/.test(node.name))
  const indicator = indicators[0]
  if (status === 'current' && indicator?.type === 'INSTANCE') status = indicator.getEnum('status', { current: 'current', error: 'error', success: 'success', warning: 'warning' })
  const collapsible = step.getEnum('collapsible', { False: false, True: true })
  const open = step.getEnum('open', { False: false, True: true })
  if (open) opened.push(id)
  const description = step.getBoolean('HasDescription?') ? step.getSlot('description') : undefined
  const action = step.getBoolean('callToAction') ? step.findInstance('callToAction', { traverseInstances: true }) : null
  const actionCode = action?.type === 'INSTANCE' ? action.executeTemplate().example : undefined
  const timestamp = step.findText('text', { traverseInstances: true, path: ['timestamp.position'] })
  const icon = step.getBoolean('icon') ? step.findInstance('Icon', { traverseInstances: true }) : null
  const iconCode = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined
  items = figma.code`${items}{ id: '${id}', label: ${JSON.stringify(label)}, status: '${status}', collapsible: ${collapsible}${timestamp.type === 'TEXT' ? figma.code`, timestamp: ${JSON.stringify(timestamp.textContent)}` : ''}${description ? figma.code`, description: (<>${description}</>)` : ''}${actionCode ? figma.code`, actions: (${actionCode})` : ''}${iconCode ? figma.code`, iconElement: (${iconCode})` : ''} },`
}
export default {
  example: figma.code`<Timeline defaultOpenIds={${JSON.stringify(opened)}} items={[${items}]} />`,
  imports: ["import { Timeline } from '@/design-system'"], id: 'timeline', metadata: { nestable: false },
}
