// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1108-6861
// source=src/design-system/3-primitives/Slider/Slider.tsx
// component=Slider
// NOTE: code "value"/"onChange" are required with no Figma counterpart — placeholders emitted.
// Figma startElement/endElement are IconButton instances; code takes IconName strings and
// the swapped icon can't be resolved to a name — 'zoom-out'/'zoom-in' placeholders emitted.
// Figma "showLabel" → code "hideLabel" (inverted).
import figma from 'figma'
const instance = figma.selectedInstance

// Label text lives in the nested _Label instance ("Label string" text node)
const labelNode = instance.findText('Label string', { traverseInstances: true })
const label = labelNode && labelNode.type === 'TEXT' ? labelNode.textContent : 'Label'

const showLabel = instance.getBoolean('showLabel')
const hasDescription = instance.getBoolean('❖ Description')
const hasStart = instance.getBoolean('startElement')
const hasEnd = instance.getBoolean('endElement')
const disabled = instance.getEnum('disabled', { True: true, False: false })

let description
if (hasDescription) {
  const descNode = instance.findText('Description string', { traverseInstances: true })
  description = descNode && descNode.type === 'TEXT' ? descNode.textContent : 'Description'
}

// Figma-only property intentionally omitted: "❖ State" (interaction states, no code prop)

export default {
  example: figma.code`<Slider label="${label}" value={50} onChange={() => {}}${showLabel ? '' : ' hideLabel'}${description ? figma.code` description="${description}"` : ''}${hasStart ? ' startElement="zoom-out"' : ''}${hasEnd ? ' endElement="zoom-in"' : ''}${disabled ? ' disabled' : ''} />`,
  imports: ["import { Slider } from '@/design-system'"],
  id: 'slider',
  metadata: { nestable: true },
}
