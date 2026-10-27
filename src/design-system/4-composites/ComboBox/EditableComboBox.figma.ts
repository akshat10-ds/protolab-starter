// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=5836-25700
// source=src/design-system/4-composites/ComboBox/ComboBox.tsx
// component=ComboBox
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const value = instance.getString('value')
const placeholder = instance.getString('placeholder')
const hideLabel = !instance.getBoolean('showLabel')
const disabled = instance.getEnum('disabled', { False: false, True: true })
const error = instance.getEnum('❖ Error', { False: false, True: true })
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const isPlaceholder = instance.getEnum('❖ Placeholder', { False: false, True: true })
const start = instance.getBoolean('HasStartElement?') ? instance.getSlot('startElement') : undefined
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode.type === 'TEXT' ? labelNode.textContent : ''
const help = instance.getBoolean('inputHelp') ? instance.findInstance('inputHelp', { traverseInstances: true }) : null
const helpCode = help?.type === 'INSTANCE' ? help.executeTemplate().example : undefined
const desc = instance.getBoolean('❖ Description') ? instance.findText('Description string', { traverseInstances: true }) : null
const clearable = instance.getEnum('onClear', { False: false, True: true })
const showTrigger = instance.getBoolean('showTrigger')
export default {
  example: figma.code`<ComboBox editable={true} label={${JSON.stringify(label)}} size="${size}"${hideLabel ? ' hideLabel' : ''}${disabled ? ' disabled' : ''}${error ? ' error="Error"' : ''}${start ? figma.code` startElement={<>${start}</>}` : ''}${helpCode ? figma.code` inputHelp={<>${helpCode}</>}` : ''}${desc?.type === 'TEXT' ? figma.code` description={${JSON.stringify(desc.textContent)}}` : ''} placeholder={${JSON.stringify(isPlaceholder ? value : placeholder)}} value={${JSON.stringify(isPlaceholder ? '' : value)}} onChange={(value) => {}} clearable={${clearable}} showTrigger={${showTrigger}} options={[${isPlaceholder ? '' : figma.code`{ value: ${JSON.stringify(value)}, label: ${JSON.stringify(value)} }`}]} />`,
  imports: ["import { ComboBox } from '@/design-system'"], id: 'editable-combobox', metadata: { nestable: true },
}
