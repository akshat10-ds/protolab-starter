// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=28226-6401
// source=src/design-system/4-composites/DatePicker/DatePicker.tsx
// component=DatePicker
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const error = instance.getEnum('error', { False: false, True: true })
const showFormattingInstructions = instance.getBoolean('showFormattingInstructions')
const formattingInstructions = instance.getString('❖ Formatting Instructions')
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const readOnly = instance.getEnum('readOnly', { False: false, True: true })
const usePicker = instance.getEnum('usePicker', { False: false, True: true })
const label = instance.findText('Label string', { traverseInstances: true })
export default { example: figma.code`<DatePicker label={${JSON.stringify(label.type === 'TEXT' ? label.textContent : '')}} value={null} onChange={(date) => {}} size="${size}" readOnly={${readOnly}} usePicker={${usePicker}} error={${error}} showFormattingInstructions={${showFormattingInstructions}} formattingInstructions={${JSON.stringify(formattingInstructions)}} />`, imports: ["import { DatePicker } from '@/design-system'"], id: 'datepicker', metadata: { nestable: true } }
