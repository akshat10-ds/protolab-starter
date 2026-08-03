// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=9238-26557
// source=src/design-system/4-composites/Accordion/Accordion.tsx
// component=Accordion
// Drift: Figma models per-item props (itemHeight, open, subtitle, metadata, startElement,
// disabled) on the nested Accordion.item set (9209:22534); code takes items as a data array
// and itemHeight on the container. Item-level values are not extracted — placeholder items emitted.
// Figma "border" variant maps to the code "bordered" prop.
import figma from 'figma'
const instance = figma.selectedInstance

const bordered = instance.getEnum('border', { False: false, True: true })

// Figma-only properties intentionally omitted: "❖ State" on Accordion.item (interaction state, no code prop)

export default {
  example: figma.code`<Accordion${bordered ? '' : ' bordered={false}'} items={[
  { id: 'item-1', title: 'Accordion item', content: 'Content' },
]} />`,
  imports: ["import { Accordion } from '@/design-system'"],
  id: 'accordion',
  metadata: { nestable: false },
}
