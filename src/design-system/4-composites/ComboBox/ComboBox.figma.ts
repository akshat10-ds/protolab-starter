// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=5517-2448
// source=src/design-system/4-composites/ComboBox/ComboBox.tsx
// component=ComboBox
// Mapped to "[INK] Combobox" (5517:2448) — the primary set; "[INK] Editable Combobox" and
// "[INK] Combobox Listbox" are variants/parts without a distinct code component.
// Drift: Figma "showLabel" is the inverse of code "hideLabel". Figma "value" is the displayed
// option label, code "value" is the option value — passed through as-is. "❖ Error" (variant)
// maps to the code "error" string with placeholder text. "inputHelp" maps to code "description".
// Figma "size" and "startElement" have no code props. Code label/options/onChange are required
// and emitted as placeholders.
import figma from 'figma'
const instance = figma.selectedInstance

const value = instance.getString('value')
const placeholder = instance.getString('placeholder')
const hideLabel = instance.getBoolean('showLabel', { true: false, false: true })
const hasHelp = instance.getBoolean('inputHelp')
const disabled = instance.getEnum('disabled', { False: false, True: true })
const hasError = instance.getEnum('❖ Error', { False: false, True: true })

// Figma-only properties intentionally omitted: "❖ State", "❖ Placeholder", "❖ Description",
// "size", "startElement" (no code props)

export default {
  example: figma.code`<ComboBox
  label="Label"${hideLabel ? '\n  hideLabel' : ''}${hasHelp ? "\n  description=\"Helper text\"" : ''}${hasError ? "\n  error=\"Error message\"" : ''}${disabled ? '\n  disabled' : ''}
  placeholder="${placeholder}"
  value="${value}"
  onChange={(value) => {}}
  options={[{ value: 'option-a', label: 'Option A' }]}
/>`,
  imports: ["import { ComboBox } from '@/design-system'"],
  id: 'combobox',
  metadata: { nestable: false },
}
