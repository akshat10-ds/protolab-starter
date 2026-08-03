// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=83-2801
// source=src/design-system/3-primitives/Badge/Badge.tsx
// component=Badge
// NOTE: intentional name drift — this code component is "Badge"; the Figma
// component set is "[INK] Status Badge" on page "StatusBadge". The mapping absorbs it.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const startElement = instance.getBoolean('startElement')
const kind = instance.getEnum('kind', {
  subtle: 'subtle',
  emphasis: 'emphasis',
  success: 'success',
  warning: 'warning',
  alert: 'alert',
  promo: 'promo',
  promoSubtle: 'promoSubtle',
})

export default {
  example: figma.code`<Badge text="${text}" kind="${kind}"${startElement ? ' startElement' : ''} />`,
  imports: ["import { Badge } from '@/design-system'"],
  id: 'badge',
  metadata: { nestable: true },
}
