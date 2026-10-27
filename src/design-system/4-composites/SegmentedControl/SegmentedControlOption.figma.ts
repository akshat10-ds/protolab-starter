// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=32656-625
// source=src/design-system/4-composites/SegmentedControl/SegmentedControl.tsx
// component=SegmentedControl.Option
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const labelNode = instance.findText('Label')
const label = labelNode.type === 'TEXT' ? labelNode.textContent : ''
const selected = instance.getEnum('Selected', { False: false, True: true })
const showLabel = instance.getBoolean('showLabel')
const icon = instance.getBoolean('showIcon') ? instance.findInstance('Icon', { traverseInstances: true }) : null
const iconCode = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined
// Selection belongs to the containing control's value/defaultValue.
export default { example: figma.code`<SegmentedControl.Option value={${JSON.stringify(label)}} label={${JSON.stringify(label)}} iconOnly={${!showLabel}}${iconCode ? figma.code` icon={<>${iconCode}</>}` : ''} />`, imports: ["import { SegmentedControl } from '@/design-system'"], id: 'segmented-control-option', metadata: { nestable: true, props: { selected: String(selected), value: label } } }
