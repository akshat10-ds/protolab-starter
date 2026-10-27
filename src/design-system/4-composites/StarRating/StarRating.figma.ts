// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=313-2635
// source=src/design-system/4-composites/StarRating/StarRating.tsx
// component=StarRating
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const disabled = instance.getEnum('disabled', { False: false, True: true })
const value = instance.getEnum('❖ Rating', { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 })
const showLegend = instance.getBoolean('showLegend')
const showRatingLabels = instance.getBoolean('showRatingLabels')
const label = instance.findText('Label string', { traverseInstances: true })
const error = instance.getBoolean('HasError?') ? instance.findText('Error Text', { traverseInstances: true }) : null
export default { example: figma.code`<StarRating label={${JSON.stringify(label.type === 'TEXT' ? label.textContent : '')}} defaultValue={${value}} disabled={${disabled}} showLegend={${showLegend}} showRatingLabels={${showRatingLabels}}${error?.type === 'TEXT' ? figma.code` error={${JSON.stringify(error.textContent)}}` : ''} onChange={(value) => {}} />`, imports: ["import { StarRating } from '@/design-system'"], id: 'star-rating', metadata: { nestable: true } }
