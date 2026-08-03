// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=589-2910
// source=src/design-system/4-composites/Modal/Modal.tsx
// component=Modal
import figma from 'figma'
const instance = figma.selectedInstance

// Figma "width" variant maps to the code "size" prop
const size = instance.getEnum('width', {
  small: 'small',
  medium: 'medium',
  large: 'large',
  xlarge: 'xlarge',
})

// Title text lives in the nested Modal.Header instance: Header > header (_Heading) > "text" node.
// Path disambiguates from the footer buttons' "text" layers; the Header's own
// "[DEPRECATED] Title Text" layer is not the live title.
const titleNode = instance.findText('text', { traverseInstances: true, path: ['Header', 'header'] })
const title = titleNode && titleNode.type === 'TEXT' ? titleNode.textContent : 'Modal title'

// Figma-only properties intentionally omitted: "❖ Image", "imagePosition", "❖ Mobile" (no code props)

export default {
  example: figma.code`<Modal open title="${title}" size="${size}" onClose={() => {}}>
  {/* modal content */}
</Modal>`,
  imports: ["import { Modal } from '@/design-system'"],
  id: 'modal',
  metadata: { nestable: false },
}
