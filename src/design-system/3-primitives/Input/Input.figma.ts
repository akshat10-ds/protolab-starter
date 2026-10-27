// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=144-17002
// source=src/design-system/3-primitives/Input/Input.tsx
// component=Input
// NOTE: intentional name drift — this code component is "Input"; the Figma
// component set is "[INK] Text Box" on page "TextBox". The mapping absorbs it.
import figma from 'figma'
const instance = figma.selectedInstance

// Label text lives in the nested _Label instance ("Label string" text node)
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'

const value = instance.getString('value')
// Figma "placeholder" variant flags whether the shown value is placeholder text
const isPlaceholder = instance.getEnum('placeholder', { True: true, False: false })

const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const readOnly = instance.getEnum('readOnly', { True: true, False: false })
const hasError = instance.getEnum('HasError?', { True: true, False: false })
const showLabel = instance.getBoolean('showLabel')
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

const startElement = instance.getBoolean('startElement') ? instance.findInstance('startElement', { traverseInstances: true }) : null
const startElementCode = startElement?.type === 'INSTANCE' ? startElement.executeTemplate().example : undefined
const endElement = instance.getBoolean('endElement') ? instance.findInstance('endElement', { traverseInstances: true }) : null
const endElementCode = endElement?.type === 'INSTANCE' ? endElement.executeTemplate().example : undefined
const inputHelp = instance.getBoolean('inputHelp') ? instance.findInstance('inputHelp', { traverseInstances: true }) : null
const inputHelpCode = inputHelp?.type === 'INSTANCE' ? inputHelp.executeTemplate().example : undefined
const characterCount = instance.getBoolean('characterCount')

export default {
  example: figma.code`<Input label="${label}" size="${size}"${isPlaceholder ? figma.code` placeholder="${value}"` : figma.code` defaultValue="${value}"`}${disabled ? ' disabled' : ''}${readOnly ? ' readOnly' : ''}${error ? figma.code` error="${error}"` : ''}${description ? figma.code` description="${description}"` : ''}${showLabel ? '' : ' hideLabel'}${startElementCode ? figma.code` startElement={<>${startElementCode}</>}` : ''}${endElementCode ? figma.code` endElement={<>${endElementCode}</>}` : ''}${inputHelpCode ? figma.code` inputHelp={<>${inputHelpCode}</>}` : ''}${characterCount ? ' characterCount maxLength={maxLength}' : ''} />`,
  imports: ["import { Input } from '@/design-system'"],
  id: 'input',
  metadata: { nestable: true },
}
