// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=28226-6401
// source=src/design-system/4-composites/DatePicker/DatePicker.tsx
// component=DatePicker
// Mapped to "[INK] DateInput" (28226:6401), NOT "[INK] DatePicker" (36936:6079): the code
// DatePicker is an input field with a calendar popup — that is Figma's DateInput (usePicker=True).
// Figma's "[INK] DatePicker" set is only the standalone calendar surface (showMonthYearSelector,
// ❖ Mobile) and has no matching code component.
// Drift: Figma "❖ Formatting Instructions" text maps to code "helperText". Figma "usePicker=False"
// (input without picker) and "size" have no code equivalents — code always renders the picker.
// Figma "readOnly" has no mapping: the code input is always readOnly (typed entry unsupported).
import figma from 'figma'
const instance = figma.selectedInstance

const error = instance.getEnum('error', { False: false, True: true })
const showHelper = instance.getBoolean('showFormattingInstructions')
const helperText = instance.getString('❖ Formatting Instructions')

// Figma-only properties intentionally omitted: "❖ State", "size", "usePicker", "readOnly" (no code props)

export default {
  example: figma.code`<DatePicker label="Label" value={null} onChange={(date) => {}}${error ? ' error' : ''}${showHelper ? figma.code` helperText="${helperText}"` : ''} />`,
  imports: ["import { DatePicker } from '@/design-system'"],
  id: 'datepicker',
  metadata: { nestable: false },
}
