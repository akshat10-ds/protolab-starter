// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=872-18918
// source=src/design-system/3-primitives/Avatar/AvatarGroup.tsx
// component=AvatarGroup
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('size', { xsmall: 'xsmall', small: 'small', medium: 'medium', large: 'large' })
const hasImage = instance.getEnum('❖ Image', { False: false, True: true })
const avatars = instance.findLayers(node => node.type === 'INSTANCE' && /^Avatar \d+$|^\[INK\] Avatar$/.test(node.name))
let items = figma.code``
for (const [index, avatar] of avatars.entries()) {
  if (avatar.type !== 'INSTANCE') continue
  const initials = avatar.findText('Avatar Initials', { traverseInstances: true })
  const colorIndex = avatar.getEnum('colorIndex', { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, sign: 'sign' })
  items = figma.code`${items}{ colorIndex: ${JSON.stringify(colorIndex)}${initials.type === 'TEXT' ? figma.code`, initials: ${JSON.stringify(initials.textContent)}` : ''}${hasImage ? figma.code`, src: avatarImages[${index}], alt: avatarLabels[${index}]` : ''} },`
}
const overflow = instance.findText('Overflow Count', { traverseInstances: true })
// Hidden people are domain data; preserve an overflow binding rather than fabricate identities.
export default { example: figma.code`<AvatarGroup size="${size}" max={${avatars.length}} avatars={[${items}${overflow.type === 'TEXT' ? '...overflowAvatars' : ''}]} />`, imports: ["import { AvatarGroup } from '@/design-system'"], id: 'avatar-group', metadata: { nestable: true } }
