// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=579-7398
// source=src/design-system/4-composites/WorkflowStepper/WorkflowStepper.tsx
// component=WorkflowStepper
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const children = instance.getSlot('children')
export default { example: figma.code`<WorkflowStepper variant="compact">${children}</WorkflowStepper>`, imports: ["import { WorkflowStepper } from '@/design-system'"], id: 'workflow-stepper-compact', metadata: { nestable: true } }
