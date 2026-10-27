// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=36936-6079
// source=src/design-system/4-composites/DatePicker/DatePicker.tsx
// component=DatePicker
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const showMonthYearSelector = instance.getEnum('showMonthYearSelector', { False: false, True: true })
const mobile = instance.getEnum('❖ Mobile', { False: false, True: true })
export default { example: figma.code`<DatePicker standalone showMonthYearSelector={${showMonthYearSelector}} mobile={${mobile}} value={null} onChange={(date) => {}} />`, imports: ["import { DatePicker } from '@/design-system'"], id: 'standalone-calendar', metadata: { nestable: true } }
