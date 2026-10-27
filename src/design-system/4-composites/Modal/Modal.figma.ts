// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=589-2910
// source=src/design-system/4-composites/Modal/Modal.tsx
// component=Modal
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('width', { small: 'small', medium: 'medium', large: 'large', xlarge: 'xlarge' })
const position = instance.getEnum('imagePosition', { Top: 'top', Start: 'start', End: 'end' })
const titleNode = instance.findText('text', { traverseInstances: true, path: ['headerTitle'] })
const title = titleNode.type === 'TEXT' ? titleNode.textContent : ''
const body = instance.findInstance('Modal.Body', { traverseInstances: true })
const bodyText = instance.findText('Body Text', { traverseInstances: true })
const content = body.type === 'INSTANCE' ? body.executeTemplate().example : bodyText.type === 'TEXT' ? figma.code`<Text size="sm">${bodyText.textContent}</Text>` : undefined
const footer = instance.findInstance('Modal.Footer', { traverseInstances: true })
const primary = instance.findInstance('Primary Action', { traverseInstances: true })
const secondary = instance.findInstance('Secondary Action', { traverseInstances: true })
const primaryCode = primary.type === 'INSTANCE' ? primary.executeTemplate().example : undefined
const secondaryCode = secondary.type === 'INSTANCE' ? secondary.executeTemplate().example : undefined
const footerCode = footer.type === 'INSTANCE' ? footer.executeTemplate().example : size === 'small' ? figma.code`<Stack gap="small"><>${primaryCode}${secondaryCode}</></Stack>` : figma.code`<Inline gap="large"><>${secondaryCode}${primaryCode}</></Inline>`
const header = instance.findInstance('Modal.Header', { traverseInstances: true })
const badge = header.type === 'INSTANCE' && header.getBoolean('statusBadge') ? header.findInstance('statusBadge', { traverseInstances: true }) : null
const badgeCode = badge?.type === 'INSTANCE' ? badge.executeTemplate().example : undefined
const image = instance.getBoolean('❖ Image') ? instance.findInstance('Image', { traverseInstances: true }) : null
const imageCode = image?.type === 'INSTANCE' ? image.executeTemplate().example : undefined
// Child templates preserve custom content, status badges and both footer actions.
export default {
  example: figma.code`<Modal open title={${JSON.stringify(title)}} size="${size}" onClose={() => {}}${imageCode ? figma.code` image={<>${imageCode}</>} imagePosition="${position}"` : ''}${footerCode ? figma.code` footer={<>${footerCode}</>}` : ''}${badgeCode ? figma.code` statusBadge={<>${badgeCode}</>}` : ''}><>${content}</></Modal>`,
  imports: ["import { Modal, Text, Inline, Stack } from '@/design-system'"], id: 'modal', metadata: { nestable: false },
}
