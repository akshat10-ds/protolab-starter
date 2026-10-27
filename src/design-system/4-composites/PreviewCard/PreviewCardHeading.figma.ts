// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1467-17894
// source=src/design-system/4-composites/PreviewCard/PreviewCard.tsx
// component=PreviewCard.Heading
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.findText('text', { traverseInstances: true, path: ['header'] })
const description = instance.getBoolean('HasDescription?') ? instance.getString('description') : undefined
const action = instance.getBoolean('action') ? instance.findInstance('PreviewCard.Action', { traverseInstances: true }) : null
const actionCode = action?.type === 'INSTANCE' ? action.executeTemplate().example : undefined
export default { example: figma.code`<PreviewCard.Heading text={${JSON.stringify(text.type === 'TEXT' ? text.textContent : '')}}${description ? figma.code` description={${JSON.stringify(description)}}` : ''}${actionCode ? figma.code` action={<>${actionCode}</>}` : ''} />`, imports: ["import { PreviewCard } from '@/design-system'"], id: 'preview-card-heading', metadata: { nestable: true } }
