// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=274-4817
// source=src/design-system/3-primitives/Radio/Radio.tsx
// component=Radio
// NOTE: intentional name drift — this code component is "Radio"; the Figma
// component set is "[INK] Radio Button" on page "RadioButton". The mapping absorbs it.
// Figma "ShowLabel?" → code "hideLabel" (inverted).
import figma from 'figma'
const instance = figma.selectedInstance

// Label text lives in the nested _Label instance ("Label string" text node)
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'

const checked = instance.getEnum('checked', { true: true, false: false })
const hasError = instance.getEnum('HasError?', { true: true, false: false })
const disabled = instance.getEnum('disabled', { true: true, false: false })
const showLabel = instance.getBoolean('ShowLabel?')
const hasDescription = instance.getBoolean('HasDescription?')

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

// Figma-only property intentionally omitted: "❖ State" (interaction states, no code prop)

export default {
  example: figma.code`<Radio label="${label}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}${showLabel ? '' : ' hideLabel'}${description ? figma.code` description="${description}"` : ''}${error ? figma.code` error="${error}"` : ''} />`,
  imports: ["import { Radio } from '@/design-system'"],
  id: 'radio',
  metadata: { nestable: true },
}
