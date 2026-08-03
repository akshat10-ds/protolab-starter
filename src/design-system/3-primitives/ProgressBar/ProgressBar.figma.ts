// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=471-9459
// source=src/design-system/3-primitives/ProgressBar/ProgressBar.tsx
// component=ProgressBar
// NOTE: Figma "HasLabel?" → code "showLabel", "HasContent?" → "showContent".
// code "value" has no Figma counterpart — derived from the content text when it parses
// (Figma content defaults to "100%").
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('label')
const content = instance.getString('content')
const showLabel = instance.getBoolean('HasLabel?')
const showContent = instance.getBoolean('HasContent?')
const kind = instance.getEnum('kind', { info: 'info', success: 'success' })
const variant = instance.getEnum('❖ Variant', {
  determinate: 'determinate',
  indeterminate: 'indeterminate',
})

const value = parseInt(content, 10)
const hasValue = variant === 'determinate' && !isNaN(value)

export default {
  example: figma.code`<ProgressBar kind="${kind}" variant="${variant}"${hasValue ? figma.code` value={${value}}` : ''} label="${label}"${showLabel ? '' : ' showLabel={false}'}${content ? figma.code` content="${content}"` : ''}${showContent ? '' : ' showContent={false}'} />`,
  imports: ["import { ProgressBar } from '@/design-system'"],
  id: 'progress-bar',
  metadata: { nestable: true },
}
