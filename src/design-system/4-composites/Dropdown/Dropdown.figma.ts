// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=11096-31227
// source=src/design-system/4-composites/Dropdown/Dropdown.tsx
// component=Dropdown
// drift: code Dropdown maps to Figma "[INK] Menu (Basic)" (Menu page holds six sets — Basic,
// Shortcuts, Icon, Section titles + Divider, Nested, Selectable; Basic is the primary set).
// Figma "glass" variant maps to code "variant" ('glass' | 'solid').
import figma from 'figma'
const instance = figma.selectedInstance

const variant = instance.getEnum('glass', { True: 'glass', False: 'solid' })

// Menu items are child Menu.Item instances (Item 1..Item 6); read their text into the items array
const itemNodes = [
  instance.findText('text', { traverseInstances: true, path: ['Item 1'] }),
  instance.findText('text', { traverseInstances: true, path: ['Item 2'] }),
  instance.findText('text', { traverseInstances: true, path: ['Item 3'] }),
  instance.findText('text', { traverseInstances: true, path: ['Item 4'] }),
  instance.findText('text', { traverseInstances: true, path: ['Item 5'] }),
  instance.findText('text', { traverseInstances: true, path: ['Item 6'] }),
]
const labels = itemNodes
  .filter((node) => node && node.type === 'TEXT')
  .map((node) => node.textContent)
const itemsCode = labels.length > 0
  ? labels.map((label) => `{ label: '${label}', onClick: () => {} }`).join(',\n    ')
  : "{ label: 'Menu item', onClick: () => {} }"

// Figma-only property intentionally omitted: none. Per-item Figma props (selected, disabled,
// startElement, description, shortcut hint) are per-instance, not readable from the set.

export default {
  example: figma.code`<Dropdown
  variant="${variant}"
  items={[
    ${itemsCode}
  ]}
>
  <button>Open menu</button>
</Dropdown>`,
  imports: ["import { Dropdown } from '@/design-system'"],
  id: 'dropdown',
  metadata: { nestable: false },
}
