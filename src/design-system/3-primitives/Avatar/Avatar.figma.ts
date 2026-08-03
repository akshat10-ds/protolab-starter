// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=871-18543
// source=src/design-system/3-primitives/Avatar/Avatar.tsx
// component=Avatar
// NOTE: the Figma image fill (image=True) is not extractable — src emitted as a placeholder.
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('size', {
  XSmall: 'xsmall',
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
})
const shape = instance.getEnum('shape', { round: 'circle', square: 'square' })
// numeric indexes emit as numbers; 'sign' emits as a string literal inside {}
const colorIndex = instance.getEnum('colorIndex', {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  sign: "'sign'",
})
const hasImage = instance.getEnum('image', { True: true, False: false })
const hasInitials = instance.getEnum('initials', { True: true, False: false })

let initials
if (hasInitials) {
  const initialsNode = instance.findText('Avatar Initials', { traverseInstances: true })
  initials = initialsNode && initialsNode.type === 'TEXT' ? initialsNode.textContent : 'AB'
}

// Figma-only properties intentionally omitted: "shadow", "badge", "border" (no code props)

export default {
  example: figma.code`<Avatar size="${size}" shape="${shape}" colorIndex={${colorIndex}}${hasImage ? ' src="image-url" alt=""' : ''}${initials ? figma.code` initials="${initials}"` : ''} />`,
  imports: ["import { Avatar } from '@/design-system'"],
  id: 'avatar',
  metadata: { nestable: true },
}
