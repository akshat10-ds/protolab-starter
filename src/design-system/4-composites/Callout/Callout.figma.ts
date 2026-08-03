// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=23-1062
// source=src/design-system/4-composites/Callout/Callout.tsx
// component=Callout
// Heading text lives in the nested "Header" instance's "text" layer (Child/[INK] Callout.Header).
// Drift: Figma "Image" is a boolean toggle; code "image" takes a ReactNode — not emitted, only
// imagePosition is passed through when the toggle is on. Code actions/primaryAction/secondaryAction
// have no parent-level Figma prop (the Callout.Footer child set is not exposed as a property).
import figma from 'figma'
const instance = figma.selectedInstance

const width = instance.getEnum('width', {
  xlarge: 'xlarge',
  large: 'large',
  medium: 'medium',
  small: 'small',
})
const alignment = instance.getEnum('alignment', {
  start: 'start',
  center: 'center',
  end: 'end',
})
const location = instance.getEnum('location', {
  above: 'above',
  below: 'below',
  before: 'before',
  after: 'after',
})
const glass = instance.getEnum('glass', {
  glassFrost: 'glassFrost',
  glassTint: 'glassTint',
  None: 'None',
})
const closeButton = instance.getBoolean('closeButton')
const enableArrow = instance.getBoolean('enableArrow')
const hasImage = instance.getBoolean('Image')
const imagePosition = instance.getEnum('imagePosition', { start: 'start', top: 'top' })

const headingNode = instance.findText('text', { traverseInstances: true, path: ['Header'] })
const heading = headingNode && headingNode.type === 'TEXT' ? headingNode.textContent : 'Callout heading'

export default {
  example: figma.code`<Callout heading="${heading}" width="${width}" alignment="${alignment}" location="${location}"${glass !== 'None' ? figma.code` glass="${glass}"` : ''}${hasImage ? figma.code` imagePosition="${imagePosition}"` : ''}${enableArrow ? '' : ' enableArrow={false}'}${closeButton ? ' onClose={() => {}}' : ' closeButton={false}'}>
  {/* callout content */}
</Callout>`,
  imports: ["import { Callout } from '@/design-system'"],
  id: 'callout',
  metadata: { nestable: false },
}
