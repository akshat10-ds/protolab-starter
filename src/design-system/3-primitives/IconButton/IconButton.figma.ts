// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=14-953
// source=src/design-system/3-primitives/IconButton/IconButton.tsx
// component=IconButton
// NOTE: intentional prop drift — Figma "kind" → code "variant".
// The Figma "icon" INSTANCE_SWAP cannot be resolved to a code IconName string
// (Figma icon components are camelCase, code names are kebab-case) — icon emitted
// as a placeholder. aria-label is required in code with no Figma source — placeholder.
import figma from 'figma'
const instance = figma.selectedInstance

const variant = instance.getEnum('kind', {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  danger: 'danger',
  brand: 'brand',
})
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const disabled = instance.getEnum('disabled', { false: false, true: true })

const badge = instance.getBoolean('badge')
// Icon names and action labels are contextual application bindings.
// Dynamic SVG templates cannot safely be coerced into the icon-name string API.

export default {
  example: figma.code`<IconButton icon={iconName} badge={${badge}} variant="${variant}" size="${size}"${disabled ? ' disabled' : ''} aria-label={actionLabel} />`,
  imports: ["import { IconButton } from '@/design-system'"],
  id: 'icon-button',
  metadata: { nestable: true },
}
