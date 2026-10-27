// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=113-620
// source=src/design-system/4-composites/EmptyState/EmptyState.tsx
// component=EmptyState
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const direction = instance.getEnum('direction', { row: 'row', column: 'column' })
const alignment = instance.getEnum('alignment', { start: 'start', center: 'center', end: 'end' })
const image = instance.getBoolean('image') ? instance.getSlot('imageSrc') : undefined
const header = instance.findInstance('EmptyState.Header', { traverseInstances: true })
const body = instance.findInstance('EmptyState.Body', { traverseInstances: true })
const footer = instance.getBoolean('footer') ? instance.findInstance('EmptyState.Footer', { traverseInstances: true }) : null
const headerCode = header.type === 'INSTANCE' ? header.executeTemplate().example : undefined
const bodyCode = body.type === 'INSTANCE' ? body.executeTemplate().example : undefined
const footerCode = footer?.type === 'INSTANCE' ? footer.executeTemplate().example : undefined
export default { example: figma.code`<EmptyState size="${size}" direction="${direction}" alignment="${alignment}"${headerCode ? figma.code` header={<>${headerCode}</>}` : ''}${footerCode ? figma.code` footer={<>${footerCode}</>}` : ''}${image ? figma.code` image={<>${image}</>}` : ''}>${bodyCode}</EmptyState>`, imports: ["import { EmptyState } from '@/design-system'"], id: 'empty-state', metadata: { nestable: true } }
