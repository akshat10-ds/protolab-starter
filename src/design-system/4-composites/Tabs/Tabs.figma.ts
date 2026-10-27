// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=875-21503
// source=src/design-system/4-composites/Tabs/Tabs.tsx
// component=Tabs
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const fullWidth = instance.getEnum('fullWidth', { True: true, False: false })
const extended = instance.getEnum('extended', { True: true, False: false })
const children = instance.findLayers(node => node.type === 'INSTANCE' && /^Item \d+|Tabs[.]Tab/.test(node.name))
let tabs = figma.code``
let selected
for (const [index, tab] of children.entries()) {
  if (tab.type !== 'INSTANCE') continue
  const id = `tab-${index + 1}`
  const label = tab.getString('label')
  const disabled = tab.getEnum('disabled', { True: true, False: false })
  const active = tab.getEnum('selected', { True: true, False: false })
  const iconOnly = tab.getEnum('❖ Icon only', { True: true, False: false }) || !tab.getBoolean('HasLabel?')
  const icon = tab.getBoolean('icon') ? tab.findInstance('Icon', { traverseInstances: true }) : null
  const badge = tab.getBoolean('badge') ? tab.findInstance('Alert.Badge', { traverseInstances: true }) : null
  const iconCode = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined
  const badgeCode = badge?.type === 'INSTANCE' ? badge.executeTemplate().example : undefined
  if (active) selected = id
  tabs = figma.code`${tabs}{ id: '${id}', label: ${JSON.stringify(label)}, disabled: ${disabled}, iconOnly: ${iconOnly}${iconCode ? figma.code`, icon: (${iconCode})` : ''}${badgeCode ? figma.code`, badge: (${badgeCode})` : ''} },`
}
export default {
  example: figma.code`<Tabs fullWidth={${fullWidth}} extended={${extended}}${selected ? figma.code` defaultTab="${selected}"` : ''} tabs={[${tabs}]} />`,
  imports: ["import { Tabs } from '@/design-system'"], id: 'tabs', metadata: { nestable: false },
}
