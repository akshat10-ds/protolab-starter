// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=259-5197
// source=src/design-system/3-primitives/Select/Select.tsx
// component=Select
import figma from 'figma'
const instance = figma.selectedInstance

// Label text lives in the nested _Label instance ("Label string" text node)
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'

// Figma "value" is the selected option's text; code renders options as children
const value = instance.getString('value')

const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const hasError = instance.getEnum('❖ Error', { True: true, False: false })
const showLabel = instance.getBoolean('showLabel')
const hasDescription = instance.getBoolean('❖ Description')

let description
if (hasDescription) {
  const descNode = instance.findText('Description string', { traverseInstances: true })
  description = descNode && descNode.type === 'TEXT' ? descNode.textContent : 'Description'
}

let error
if (hasError) {
  const errNode = instance.findText('Error Text', { traverseInstances: true })
  error = errNode && errNode.type === 'TEXT' ? errNode.textContent : 'Error message'
}

// Figma-only properties intentionally omitted: "❖ State" (interaction states), "inputHelp" (no code prop)

export default {
  example: figma.code`<Select label="${label}" size="${size}"${disabled ? ' disabled' : ''}${error ? figma.code` error="${error}"` : ''}${description ? figma.code` description="${description}"` : ''}${showLabel ? '' : ' hideLabel'}>
  <option>${value}</option>
</Select>`,
  imports: ["import { Select } from '@/design-system'"],
  id: 'select',
  metadata: { nestable: true },
}
