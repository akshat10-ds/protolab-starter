// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=23-1062
// source=src/design-system/4-composites/Callout/Callout.tsx
// component=Callout
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const width = instance.getEnum('width', { xlarge: 'xlarge', large: 'large', medium: 'medium', small: 'small' })
const alignment = instance.getEnum('alignment', { start: 'start', center: 'center', end: 'end' })
const location = instance.getEnum('location', { above: 'above', below: 'below', before: 'before', after: 'after' })
const glass = instance.getEnum('glass', { glassFrost: 'glassFrost', glassTint: 'glassTint', None: 'None' })
const closeButton = instance.getBoolean('closeButton')
const enableArrow = instance.getBoolean('enableArrow')
const imagePosition = instance.getEnum('imagePosition', { start: 'start', top: 'top' })
const header = instance.findInstance('Header', { traverseInstances: true })
const headingNode = instance.findText('text', { traverseInstances: true, path: ['Header'] })
const heading = headingNode.type === 'TEXT' ? headingNode.textContent : ''
const bodyInstance = instance.findInstance('Body', { traverseInstances: true })
const body = bodyInstance.type === 'INSTANCE' ? bodyInstance.executeTemplate().example : instance.getSlot('children')
const image = instance.getBoolean('Image') ? instance.findInstance('Image', { traverseInstances: true }) : null
const imageCode = image?.type === 'INSTANCE' ? image.executeTemplate().example : undefined
const footer = instance.findInstance('Footer', { traverseInstances: true })
const footerCode = footer.type === 'INSTANCE' ? footer.executeTemplate().example : undefined
const start = header.type === 'INSTANCE' && header.getBoolean('startElement') ? header.findInstance('startElement', { traverseInstances: true }) : null
const status = header.type === 'INSTANCE' && header.getBoolean('statusBadge') ? header.findInstance('statusBadge', { traverseInstances: true }) : null
const startCode = start?.type === 'INSTANCE' ? start.executeTemplate().example : undefined
const statusCode = status?.type === 'INSTANCE' ? status.executeTemplate().example : undefined
export default {
  example: figma.code`<Callout heading={${JSON.stringify(heading)}} width="${width}" alignment="${alignment}" location="${location}" glass="${glass}" enableArrow={${enableArrow}} closeButton={${closeButton}}${closeButton ? ' onClose={() => {}}' : ''}${imageCode ? figma.code` image={<>${imageCode}</>} imagePosition="${imagePosition}"` : ''}${footerCode ? figma.code` footer={<>${footerCode}</>}` : ''}${startCode ? figma.code` startElement={<>${startCode}</>}` : ''}${statusCode ? figma.code` statusBadge={<>${statusCode}</>}` : ''}>${body}</Callout>`,
  imports: ["import { Callout } from '@/design-system'"], id: 'callout', metadata: { nestable: false },
}
