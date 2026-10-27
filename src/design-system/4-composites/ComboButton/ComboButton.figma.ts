// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=17-168
// source=src/design-system/4-composites/ComboButton/ComboButton.tsx
// component=ComboButton
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const kind = instance.getEnum('kind', { primary: 'primary', secondary: 'secondary', tertiary: 'tertiary', brand: 'brand' })
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const disabled = instance.getEnum('disabled', { False: false, True: true })
const compact = instance.getEnum('compact', { False: false, True: true })
const button = instance.findInstance('Button', { traverseInstances: true })
const labelNode = instance.findText('text', { traverseInstances: true })
const label = labelNode.type === 'TEXT' ? labelNode.textContent : ''
export default { example: figma.code`<ComboButton variant="${kind}" size="${size}" compact={${compact}} disabled={${disabled}} accessibilityText={actionLabel} dropdownLabel={menuLabel} onClick={() => {}} onDropdownClick={() => {}}>${label}</ComboButton>`, imports: ["import { ComboButton } from '@/design-system'"], id: 'combo-button', metadata: { nestable: true } }
