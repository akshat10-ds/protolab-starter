// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=851-8080
// source=src/design-system/4-composites/Stepper/Stepper.tsx
// component=Stepper
// drift: code Stepper maps to Figma "[INK] Progress Stepper" (37:2522), not
// "[INK] Workflow Stepper" (37:2540). Chosen because Progress Stepper's "direction"
// (row | column) maps 1:1 to code "orientation" (horizontal | vertical) and its items are
// plain title+status steps like the code Step model; Workflow Stepper is two standalone
// components whose items carry callToAction buttons and expandable content the code
// component does not have. Figma "direction" maps to code "orientation".
import figma from 'figma'
const instance = figma.selectedInstance

const orientation = instance.getEnum('direction', {
  row: 'horizontal',
  column: 'vertical',
})

// Steps are child ProgressStepper.Item instances (Step 1..Step 3); read their titles
const stepNodes = [
  instance.findText('text', { traverseInstances: true, path: ['Step 1'] }),
  instance.findText('text', { traverseInstances: true, path: ['Step 2'] }),
  instance.findText('text', { traverseInstances: true, path: ['Step 3'] }),
]
const titles = stepNodes
  .filter((node) => node && node.type === 'TEXT')
  .map((node) => node.textContent)
const stepsCode = titles.length > 0
  ? titles.map((title, i) => `{ id: 'step-${i + 1}', title: '${title}' }`).join(',\n    ')
  : "{ id: 'step-1', title: 'Step 1' }"

// Figma-only property intentionally omitted: "isCompact" (no code prop). Per-item status
// (current/visited/unvisited) is per-instance, not readable from the set.

export default {
  example: figma.code`<Stepper
  orientation="${orientation}"
  activeStep={0}
  steps={[
    ${stepsCode}
  ]}
/>`,
  imports: ["import { Stepper } from '@/design-system'"],
  id: 'stepper',
  metadata: { nestable: false },
}
