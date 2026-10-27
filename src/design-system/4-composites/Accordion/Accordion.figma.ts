// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=9238-26557
// source=src/design-system/4-composites/Accordion/Accordion.tsx
// component=Accordion
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const bordered = instance.getEnum('border', { False: false, True: true })
const children = instance.findLayers(node => node.type === 'INSTANCE' && /^Accordion[.]item/.test(node.name))
let items = figma.code``
const openIds = []
for (const [index, item] of children.entries()) {
  if (item.type !== 'INSTANCE') continue
  const id = `item-${index + 1}`
  const titleNode = item.findText('title', { traverseInstances: true })
  const title = titleNode.type === 'TEXT' ? titleNode.textContent : ''
  const open = item.getEnum('open', { False: false, True: true })
  if (open) openIds.push(id)
  const disabled = item.getEnum('disabled', { False: false, True: true })
  const border = item.getEnum('border', { False: false, True: true })
  const height = item.getEnum('itemHeight', { default: 'default', compact: 'compact', tall: 'tall' })
  const subtitle = item.getBoolean('❖ Show Subtitle') ? item.getString('subtitle') : undefined
  const metadata = item.getBoolean('❖ Show Metadata') ? item.getString('metadata') : undefined
  const start = item.getBoolean('❖ Show Start Element') ? item.getInstanceSwap('startElement') : null
  const startCode = start?.type === 'INSTANCE' ? start.executeTemplate().example : undefined
  const body = item.findInstance('body', { traverseInstances: true })
  const bodyCode = body.type === 'INSTANCE' ? body.executeTemplate().example : undefined
  const bodyText = item.findText('text', { traverseInstances: true })
  items = figma.code`${items}{ id: '${id}', title: ${JSON.stringify(title)}, disabled: ${disabled}, bordered: ${border}, itemHeight: '${height}'${subtitle ? figma.code`, subtitle: ${JSON.stringify(subtitle)}` : ''}${metadata ? figma.code`, metadata: ${JSON.stringify(metadata)}` : ''}${startCode ? figma.code`, startElement: (${startCode})` : ''}, content: ${bodyCode ? figma.code`(<>${bodyCode}</>)` : JSON.stringify(bodyText.type === 'TEXT' ? bodyText.textContent : '')} },`
}
export default {
  example: figma.code`<Accordion bordered={${bordered}} allowMultiple defaultOpenItems={${JSON.stringify(openIds)}} items={[${items}]} />`,
  imports: ["import { Accordion } from '@/design-system'"], id: 'accordion', metadata: { nestable: false },
}
