// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=882-6745
// source=src/design-system/4-composites/Table/Table.tsx
// component=Text
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const contentType = instance.getEnum('❖ Content Type', { ActionGroup: 'actions', Slot: 'slot', Numeric: 'numeric', '◆ Text': 'text' })
const children = instance.getSlot('children')
const text = instance.findText('text', { traverseInstances: true })
const detail = instance.getBoolean('❖ Detail Text') ? instance.findText('detail', { traverseInstances: true }) : null
const start = instance.getBoolean('❖ Show startElement') ? instance.findInstance('startElement', { traverseInstances: true }) : null
const component = instance.getBoolean('⮑ Show Component') ? instance.findInstance('Component', { traverseInstances: true }) : null
const icon = instance.getBoolean('⮑ Show Icon') ? instance.findInstance('Icon', { traverseInstances: true }) : null
const ai = instance.getBoolean('⮑ Show AI') ? instance.findInstance('AiIcon', { traverseInstances: true }) : null
const startCode = start?.type === 'INSTANCE' ? start.executeTemplate().example : undefined
const componentCode = component?.type === 'INSTANCE' ? component.executeTemplate().example : undefined
const iconCode = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined
const aiCode = ai?.type === 'INSTANCE' ? ai.executeTemplate().example : undefined
export default { example: contentType === 'slot' || contentType === 'actions' ? figma.code`<>${children}</>` : figma.code`<Inline gap="small"><>${startCode}${componentCode}${iconCode}${aiCode}<Stack gap="none"><><Text size="sm">${text.type === 'TEXT' ? text.textContent : ''}</Text>${detail?.type === 'TEXT' ? figma.code`<Text size="xs" color="secondary">${detail.textContent}</Text>` : ''}</></Stack></></Inline>`, imports: ["import { Text, Stack, Inline } from '@/design-system'"], id: 'table-cell-content', metadata: { nestable: true } }
