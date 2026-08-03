// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=474-12179
// source=src/design-system/3-primitives/Spinner/Spinner.tsx
// component=Spinner
// NOTE: intentional name drift — this code component is "Spinner"; the Figma
// component set is "[INK] Progress Circle" on page "ProgressCircle". The mapping
// absorbs it (props line up exactly: size, kind, text → label, HasText? → showLabel).
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('text')
const showLabel = instance.getBoolean('HasText?')
const size = instance.getEnum('size', {
  small: 'small',
  medium: 'medium',
  large: 'large',
})
const kind = instance.getEnum('kind', { default: 'default', subtle: 'subtle' })

export default {
  example: figma.code`<Spinner size="${size}" kind="${kind}"${label ? figma.code` label="${label}"` : ''}${showLabel ? ' showLabel' : ''} />`,
  imports: ["import { Spinner } from '@/design-system'"],
  id: 'spinner',
  metadata: { nestable: true },
}
