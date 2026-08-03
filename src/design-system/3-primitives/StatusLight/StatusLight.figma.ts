// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=166-2875
// source=src/design-system/3-primitives/StatusLight/StatusLight.tsx
// component=StatusLight
// NOTE: Figma "HasText?" → code "showText". Code default opaque=true; Figma default
// opaque=False — opaque={false} emitted when the Figma variant is False.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const showText = instance.getBoolean('HasText?')
const kind = instance.getEnum('kind', {
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  alert: 'alert',
})
const noFill = instance.getEnum('noFill', { True: true, False: false })
const opaque = instance.getEnum('opaque', { True: true, False: false })

export default {
  example: figma.code`<StatusLight kind="${kind}" text="${text}"${showText ? '' : ' showText={false}'}${noFill ? ' noFill' : ''}${opaque ? '' : ' opaque={false}'} />`,
  imports: ["import { StatusLight } from '@/design-system'"],
  id: 'status-light',
  metadata: { nestable: true },
}
