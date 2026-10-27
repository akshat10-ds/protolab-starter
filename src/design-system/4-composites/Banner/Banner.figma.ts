// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1070-8230
// source=src/design-system/4-composites/Banner/Banner.tsx
// component=Banner
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const kind = instance.getEnum('kind', { subtle: 'subtle', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning', promo: 'promo', information: 'information' })
const shape = instance.getEnum('shape', { round: 'round', square: 'square' })
const lineWrap = instance.getEnum('LineWrap?', { false: false, true: true })
const hasBorder = instance.getEnum('border', { false: false, true: true })
const alignment = instance.getEnum('alignText', { center: 'center', start: 'start' })
const message = instance.getString('children')
const hasAction = instance.getBoolean('action')
const closable = instance.getBoolean('closeButton')
const action = hasAction ? instance.findInstance('Banner.Action', { traverseInstances: true }) : null
const actionLabel = action?.type === 'INSTANCE' ? action.findText('text', { traverseInstances: true }) : null
const start = instance.getBoolean('hasStartElement') ? instance.findInstance('startElement') : null
const startCode = start?.type === 'INSTANCE' ? start.executeTemplate().example : undefined
const rules = instance.findLayers(node => node.type === 'INSTANCE' && /BorderRule/.test(node.name))
const rule = rules[0]
const borderRule = hasBorder && rule?.type === 'INSTANCE' ? rule.getEnum('borderRule', { top: 'top', bottom: 'bottom', both: 'both' }) : hasBorder ? 'bottom' : 'none'
export default {
  example: figma.code`<Banner kind="${kind}" shape="${shape}" alignment="${alignment}" borderRule="${borderRule}" lineWrap={${lineWrap}}${startCode ? figma.code` customIcon={<>${startCode}</>}` : ''}${hasAction && actionLabel?.type === 'TEXT' ? figma.code` action={{ label: ${JSON.stringify(actionLabel.textContent)}, onClick: () => {} }}` : ''}${closable ? ' onClose={() => {}}' : ' closable={false}'}>${message}</Banner>`,
  imports: ["import { Banner } from '@/design-system'"], id: 'banner', metadata: { nestable: false },
}
