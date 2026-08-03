// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=377-23064
// source=src/design-system/3-primitives/Checkbox/Checkbox.tsx
// component=Checkbox
import figma from 'figma'
const instance = figma.selectedInstance

// Label text lives in the nested _Label instance ("Label string" text node)
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'

const checked = instance.getEnum('checked', { True: true, False: false })
const indeterminate = instance.getEnum('indeterminate', { True: true, False: false })
const error = instance.getEnum('❖ Error', { True: true, False: false })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const showLabel = instance.getBoolean('showLabel')
const showErrorMessage = instance.getBoolean('❖ Show Error Message')
const hasDescription = instance.getBoolean('❖ Description')

let description
if (hasDescription) {
  const descNode = instance.findText('Description string', { traverseInstances: true })
  description = descNode && descNode.type === 'TEXT' ? descNode.textContent : 'Description'
}

let errorMessage
if (error) {
  const errNode = instance.findText('Error Text', { traverseInstances: true })
  errorMessage = errNode && errNode.type === 'TEXT' ? errNode.textContent : 'Error message'
}

// startElement / endElement (BOOLEAN) toggle visibility of same-named icon children
const hasStart = instance.getBoolean('startElement')
let startCode
if (hasStart) {
  const start = instance.findInstance('startElement')
  if (start && start.type === 'INSTANCE') {
    startCode = start.executeTemplate().example
  }
}
const hasEnd = instance.getBoolean('endElement')
let endCode
if (hasEnd) {
  const end = instance.findInstance('endElement')
  if (end && end.type === 'INSTANCE') {
    endCode = end.executeTemplate().example
  }
}

// Figma-only property intentionally omitted: "❖ State" (interaction states, no code prop)

export default {
  example: figma.code`<Checkbox label="${label}"${checked ? ' checked' : ''}${indeterminate ? ' indeterminate' : ''}${disabled ? ' disabled' : ''}${error ? ' error' : ''}${errorMessage ? figma.code` errorMessage="${errorMessage}"` : ''}${showErrorMessage ? '' : ' showErrorMessage={false}'}${showLabel ? '' : ' showLabel={false}'}${description ? figma.code` description="${description}"` : ''}${startCode ? figma.code` startElement={${startCode}}` : ''}${endCode ? figma.code` endElement={${endCode}}` : ''} />`,
  imports: ["import { Checkbox } from '@/design-system'"],
  id: 'checkbox',
  metadata: { nestable: true },
}
