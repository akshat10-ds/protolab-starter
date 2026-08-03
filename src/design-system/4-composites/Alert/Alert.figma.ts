// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=123-919
// source=src/design-system/4-composites/Alert/Alert.tsx
// component=Alert
// Mapped to "[INK] Inline Message" (123:919), not "[INK] Toast" (513:15900): the code Alert is a
// persistent in-flow surface (role="alert", title/action/close, no timeout) — an inline message.
// Toast is the transient pattern (has a "loading" kind, transient semantics) with no code counterpart here.
// Drift: Figma kind "Emphasis" has no code kind — mapped to "information". Code shape, bottomBorder,
// title, and icon have no Inline Message counterparts.
import figma from 'figma'
const instance = figma.selectedInstance

const kind = instance.getEnum('kind', {
  Information: 'information',
  Emphasis: 'information',
  Success: 'success',
  Warning: 'warning',
  Danger: 'danger',
  promo: 'promo',
})
const message = instance.getString('children')
const hasAction = instance.getBoolean('action')
const hasClose = instance.getBoolean('closeButton')

export default {
  example: figma.code`<Alert kind="${kind}"${hasAction ? " action={{ label: 'Action', onClick: () => {} }}" : ''}${hasClose ? ' onClose={() => {}}' : ''}>${message}</Alert>`,
  imports: ["import { Alert } from '@/design-system'"],
  id: 'alert',
  metadata: { nestable: false },
}
