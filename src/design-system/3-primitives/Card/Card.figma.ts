// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=12985-36285
// source=src/design-system/3-primitives/Card/Card.tsx
// component=Card
// drift: code Card maps to Figma "[INK] CardContainer"; Figma "backgroundFill" maps to code "variant"
import figma from 'figma'
const instance = figma.selectedInstance

const variant = instance.getEnum('backgroundFill', {
  light: 'light',
  dark: 'dark',
  secondary: 'secondary',
})
const disabled = instance.getEnum('disabled', { False: false, True: true })
const noPadding = instance.getEnum('noPadding', { False: false, True: true })
const imagePosition = instance.getEnum('imagePosition', {
  start: 'start',
  top: 'top',
})

// showImage (BOOLEAN) toggles the CardContainer.Image child
const hasImage = instance.getBoolean('showImage')
let imageCode
if (hasImage) {
  const image = instance.findInstance('CardContainer.Image')
  if (image && image.type === 'INSTANCE') {
    imageCode = image.executeTemplate().example
  }
}

// Code-only prop with no Figma counterpart: radius

export default {
  example: figma.code`<Card variant="${variant}"${disabled ? ' disabled' : ''}${noPadding ? ' noPadding' : ''}${imageCode ? figma.code` imagePosition="${imagePosition}"` : ''}>
  ${imageCode ? figma.code`${imageCode}
  ` : ''}{/* card content */}
</Card>`,
  imports: ["import { Card } from '@/design-system'"],
  id: 'card',
  metadata: { nestable: false },
}
