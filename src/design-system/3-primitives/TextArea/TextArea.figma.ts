// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=261-2190
// source=src/design-system/3-primitives/TextArea/TextArea.tsx
// component=TextArea
// NOTE: Figma "showLabel" → code "hideLabel" (inverted). Figma "placeholder" variant
// flags whether the shown value is placeholder text. Code characterCount requires
// maxLength, which has no Figma counterpart — maxLength={200} placeholder emitted.
import figma from 'figma'
const instance = figma.selectedInstance

// Label text lives in the nested _Label instance ("Label string" text node)
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'

const value = instance.getString('value')
const isPlaceholder = instance.getEnum('placeholder', { True: true, False: false })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const readOnly = instance.getEnum('readOnly', { True: true, False: false })
const hasError = instance.getEnum('HasError?', { True: true, False: false })
const showLabel = instance.getBoolean('showLabel')
const hasDescription = instance.getBoolean('HasDescription?')
const characterCount = instance.getBoolean('characterCount')

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

// Figma-only properties intentionally omitted: "❖ State" (interaction states),
// "startElement" (no code prop on TextArea)

export default {
  example: figma.code`<TextArea label="${label}"${isPlaceholder ? figma.code` placeholder="${value}"` : figma.code` defaultValue="${value}"`}${showLabel ? '' : ' hideLabel'}${disabled ? ' disabled' : ''}${readOnly ? ' readOnly' : ''}${error ? figma.code` error="${error}"` : ''}${description ? figma.code` description="${description}"` : ''}${characterCount ? ' characterCount maxLength={200}' : ''} />`,
  imports: ["import { TextArea } from '@/design-system'"],
  id: 'text-area',
  metadata: { nestable: true },
}
