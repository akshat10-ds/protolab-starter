// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=37058-15681
// source=src/design-system/4-composites/SelectTile/SelectTile.tsx
// component=SelectTileGroup
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const children = instance.getSlot('children')
const disabled = instance.getEnum('disabled', { False: false, True: true })
const hideLabel = !instance.getBoolean('HasLegend?')
const legend = !hideLabel ? instance.findText('Label string', { traverseInstances: true }) : null
const description = instance.getBoolean('HasDescription?') ? instance.findText('Description string', { traverseInstances: true }) : null
const error = instance.getBoolean('HasError?') ? instance.findText('Error Text', { traverseInstances: true }) : null
export default { example: figma.code`<SelectTileGroup label={${JSON.stringify(legend?.type === 'TEXT' ? legend.textContent : '')}} disabled={${disabled}} hideLabel={${hideLabel}}${description?.type === 'TEXT' ? figma.code` description={${JSON.stringify(description.textContent)}}` : ''}${error?.type === 'TEXT' ? figma.code` error={${JSON.stringify(error.textContent)}}` : ''}>${children}</SelectTileGroup>`, imports: ["import { SelectTileGroup } from '@/design-system'"], id: 'select-tile-group', metadata: { nestable: true } }
