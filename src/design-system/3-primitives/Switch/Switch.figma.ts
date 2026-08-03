// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=171-3566
// source=src/design-system/3-primitives/Switch/Switch.tsx
// component=Switch
// NOTE: intentional prop drift — Figma "on" → code "checked". Code has no hideLabel;
// when Figma showLabel is false the label prop is simply omitted.
import figma from 'figma'
const instance = figma.selectedInstance

const checked = instance.getEnum('on', { True: true, False: false })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const showLabel = instance.getBoolean('showLabel')
const hasDescription = instance.getBoolean('HasDescription?')

let label
if (showLabel) {
  const labelNode = instance.findText('Label string', { traverseInstances: true })
  label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'
}

let description
if (hasDescription) {
  const descNode = instance.findText('Description string', { traverseInstances: true })
  description = descNode && descNode.type === 'TEXT' ? descNode.textContent : 'Description'
}

// Figma-only property intentionally omitted: "❖ State" (interaction states, no code prop)

export default {
  example: figma.code`<Switch${checked ? ' checked' : ''}${label ? figma.code` label="${label}"` : ''}${description ? figma.code` description="${description}"` : ''}${disabled ? ' disabled' : ''} />`,
  imports: ["import { Switch } from '@/design-system'"],
  id: 'switch',
  metadata: { nestable: true },
}
