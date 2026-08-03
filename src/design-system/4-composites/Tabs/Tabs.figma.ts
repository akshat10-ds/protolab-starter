// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=875-21503
// source=src/design-system/4-composites/Tabs/Tabs.tsx
// component=Tabs
// drift: Figma "[INK] Tabs" variants "fullWidth" and "extended" have no code props — both
// omitted. Tab items are child Tabs.Tab instances (Item 01..Item 05); their labels feed the
// code "tabs" array.
import figma from 'figma'
const instance = figma.selectedInstance

const labelNodes = [
  instance.findText('label', { traverseInstances: true, path: ['Item 01'] }),
  instance.findText('label', { traverseInstances: true, path: ['Item 02'] }),
  instance.findText('label', { traverseInstances: true, path: ['Item 03'] }),
  instance.findText('label', { traverseInstances: true, path: ['Item 04'] }),
  instance.findText('label', { traverseInstances: true, path: ['Item 05'] }),
]
const labels = labelNodes
  .filter((node) => node && node.type === 'TEXT')
  .map((node) => node.textContent)
const tabsCode = labels.length > 0
  ? labels.map((label, i) => `{ id: 'tab-${i + 1}', label: '${label}', content: null }`).join(',\n    ')
  : "{ id: 'tab-1', label: 'Tab', content: null }"

// Per-item Figma props (selected, disabled, icon, badge, "❖ State", "❖ Icon only") are
// per-instance interaction/visual axes with no counterpart in the code TabItem model.

export default {
  example: figma.code`<Tabs
  tabs={[
    ${tabsCode}
  ]}
/>`,
  imports: ["import { Tabs } from '@/design-system'"],
  id: 'tabs',
  metadata: { nestable: false },
}
