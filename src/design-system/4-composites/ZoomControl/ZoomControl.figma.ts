// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=3638-3159
// source=src/design-system/4-composites/ZoomControl/ZoomControl.tsx
// component=ZoomControl
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const direction = instance.getEnum('direction', { row: 'row', column: 'column' })
const stripped = instance.getBoolean('stripped')
const value = parseFloat(instance.getString('value'))
const min = parseFloat(instance.getString('min'))
const max = parseFloat(instance.getString('max'))
export default { example: figma.code`<ZoomControl direction="${direction}" stripped={${stripped}} defaultValue={${value}} min={${min}} max={${max}} onChange={(value) => {}} />`, imports: ["import { ZoomControl } from '@/design-system'"], id: 'zoom-control', metadata: { nestable: true } }
