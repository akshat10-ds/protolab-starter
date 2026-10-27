// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=32665-1131
// source=src/design-system/4-composites/SegmentedControl/SegmentedControl.tsx
// component=SegmentedControl
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const fullWidth = instance.getEnum('fullWidth', { False: false, True: true })
const children = instance.getSlot('children')
const options = instance.findLayers(node => node.type === 'INSTANCE' && /SegmentedControl[.]Option/.test(node.name))
let selected
for (const option of options) {
  if (option.type === 'INSTANCE' && option.getEnum('Selected', { False: false, True: true })) {
    const text = option.findText('Label')
    if (text.type === 'TEXT') selected = text.textContent
  }
}
const description = instance.getBoolean('showDescription') ? instance.findText('Description string', { traverseInstances: true }) : null
export default { example: figma.code`<SegmentedControl label={groupLabel} fullWidth={${fullWidth}}${selected ? figma.code` defaultValue={${JSON.stringify(selected)}}` : ''}${description?.type === 'TEXT' ? figma.code` description={${JSON.stringify(description.textContent)}}` : ''}>${children}</SegmentedControl>`, imports: ["import { SegmentedControl } from '@/design-system'"], id: 'segmented-control', metadata: { nestable: true } }
