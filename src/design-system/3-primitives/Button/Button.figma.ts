// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=10-557
// source=src/design-system/3-primitives/Button/Button.tsx
// component=Button
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('text')
const kind = instance.getEnum('kind', {
  brand: 'brand',
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  danger: 'danger',
})
const size = instance.getEnum('size', {
  small: 'small',
  medium: 'medium',
})
const disabled = instance.getEnum('disabled', { false: false, true: true })
const loading = instance.getBoolean('loading')
const menuTrigger = instance.getBoolean('menuTrigger')

// startElement (BOOLEAN) toggles visibility of the "startElement" icon child
const hasStart = instance.getBoolean('startElement')
let startCode
if (hasStart) {
  const start = instance.findInstance('startElement')
  if (start && start.type === 'INSTANCE') {
    startCode = start.executeTemplate().example
  }
}

// Figma-only properties intentionally omitted: "❖ State", "❖ Focus" (interaction states, no code prop)

export default {
  example: figma.code`<Button kind="${kind}" size="${size}"${disabled ? ' disabled' : ''}${loading ? ' loading' : ''}${menuTrigger ? ' menuTrigger' : ''}${startCode ? figma.code` startElement={${startCode}}` : ''}>${label}</Button>`,
  imports: ["import { Button } from '@/design-system'"],
  id: 'button',
  metadata: { nestable: true },
}
