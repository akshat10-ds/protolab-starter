// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=2761-19350
// source=src/design-system/4-composites/SelectTile/SelectTile.tsx
// component=SelectTile
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const selected = instance.getEnum('selected', { False: false, True: true })
const direction = instance.getEnum('direction', { row: 'row', column: 'column' })
const imageFit = instance.getEnum('image', { fit: 'fit', fill: 'fill', none: 'none' })
const readOnly = instance.getEnum('readOnly', { False: false, True: true })
const disabled = instance.getEnum('disabled', { False: false, True: true })
const description = instance.getBoolean('HasDescription?') ? instance.getString('description') : undefined
const icon = instance.getEnum('HasIcon?', { False: false, True: true }) ? instance.getInstanceSwap('icon') : null
const iconCode = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined
const badge = instance.getBoolean('badge') ? instance.findInstance('Badge', { traverseInstances: true }) : null
const badgeCode = badge?.type === 'INSTANCE' ? badge.executeTemplate().example : undefined
const text = instance.findText('text', { traverseInstances: true })
// Figma's image fill is application data, distinct from the shared icon swap.
export default { example: figma.code`<SelectTile value={tileValue} label={${JSON.stringify(text.type === 'TEXT' ? text.textContent : '')}} defaultChecked={${selected}} direction="${direction}" imageFit="${imageFit}" readOnly={${readOnly}} disabled={${disabled}}${description ? figma.code` description={${JSON.stringify(description)}}` : ''}${iconCode ? figma.code` icon={<>${iconCode}</>}` : ''}${badgeCode ? figma.code` badge={<>${badgeCode}</>}` : ''}${imageFit !== 'none' ? ' image={tileImage}' : ''} onChange={(checked) => {}} />`, imports: ["import { SelectTile } from '@/design-system'"], id: 'select-tile', metadata: { nestable: true } }
