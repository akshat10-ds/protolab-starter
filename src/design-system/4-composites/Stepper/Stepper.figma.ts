// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=851-8080
// source=src/design-system/4-composites/Stepper/Stepper.tsx
// component=Stepper
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const orientation = instance.getEnum('direction', { row: 'horizontal', column: 'vertical' })
const compact = instance.getEnum('isCompact', { False: false, True: true })
const children = instance.findLayers(node => node.type === 'INSTANCE' && /^Step \d+$/.test(node.name))
let steps = figma.code``
let active = 0
for (const [index, step] of children.entries()) {
  if (step.type !== 'INSTANCE') continue
  const text = step.findText('Step Text', { traverseInstances: true })
  const status = step.getEnum('status', { current: 'active', visited: 'visited', unvisited: 'upcoming' })
  const completed = step.getEnum('isComplete', { False: false, True: true })
  const before = step.getBoolean('❖ Show Before Connector')
  const end = step.getBoolean('❖ Show End Connector')
  if (status === 'active') active = index
  steps = figma.code`${steps}{ id: 'step-${index + 1}', title: ${JSON.stringify(text.type === 'TEXT' ? text.textContent : '')}, status: '${status}', completed: ${completed}, showBeforeConnector: ${before}, showEndConnector: ${end} },`
}
// Compact-only instances do not expose the full step collection: keep live summary text.
const counter = instance.findText('Counter', { traverseInstances: true })
const counts = counter.type === 'TEXT' ? counter.textContent.match(/(\d+)\s*\/\s*(\d+)/) : null
const compactTitle = instance.findText('Step Title', { traverseInstances: true })
const compactDetail = instance.findText('Step Detail', { traverseInstances: true })
export default {
  example: figma.code`<Stepper orientation="${orientation}" compact={${compact}}${compact && counts ? figma.code` compactCurrent={${Number(counts[1])}} compactTotal={${Number(counts[2])}}` : ''} activeStep={${active}} steps={[${steps}]}${compact && compactTitle.type === 'TEXT' ? figma.code` compactTitle={${JSON.stringify(compactTitle.textContent)}}` : ''}${compact && compactDetail.type === 'TEXT' ? figma.code` compactDetail={${JSON.stringify(compactDetail.textContent)}}` : ''} />`,
  imports: ["import { Stepper } from '@/design-system'"], id: 'stepper', metadata: { nestable: false },
}
