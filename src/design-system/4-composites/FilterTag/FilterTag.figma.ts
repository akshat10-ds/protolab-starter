// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1674-3949
// source=src/design-system/4-composites/FilterTag/FilterTag.tsx
// component=FilterTag
// Drift: Figma "isActive"/"isDisabled" map to code "active"/"disabled". Figma "❖ Show Trigger"
// maps to code "showTrigger" (not design-only despite the ❖ prefix). Figma "startElement" has
// no code prop.
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('label')
const active = instance.getEnum('isActive', { false: false, true: true })
const dismissible = instance.getEnum('dismissible', { false: false, true: true })
const disabled = instance.getEnum('isDisabled', { false: false, true: true })
const showTrigger = instance.getBoolean('❖ Show Trigger')

// Figma-only properties intentionally omitted: "❖ State", "❖ Split State" (interaction states),
// "startElement" (no code prop)

export default {
  example: figma.code`<FilterTag label="${label}"${active ? ' active' : ''}${dismissible ? ' dismissible onDismiss={() => {}}' : ''}${disabled ? ' disabled' : ''}${showTrigger ? '' : ' showTrigger={false}'} onClick={() => {}} />`,
  imports: ["import { FilterTag } from '@/design-system'"],
  id: 'filter-tag',
  metadata: { nestable: true },
}
