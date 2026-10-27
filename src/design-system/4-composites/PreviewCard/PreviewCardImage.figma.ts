// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1467-17881
// source=src/design-system/4-composites/PreviewCard/PreviewCard.tsx
// component=PreviewCard.Image
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const kind = instance.getEnum('kind', { document: 'document', image: 'image' })
const ratio = instance.getEnum('ratio', { '16:9': '16:9', '3:2': '3:2', '1:1': '1:1' })
const badge = instance.getBoolean('badge') ? instance.findInstance('StatusBadge', { traverseInstances: true }) : null
const badgeCode = badge?.type === 'INSTANCE' ? badge.executeTemplate().example : undefined
export default { example: figma.code`<PreviewCard.Image src={imageSrc} alt={imageAlt} kind="${kind}" ratio="${ratio}"${badgeCode ? figma.code` badge={<>${badgeCode}</>}` : ''} />`, imports: ["import { PreviewCard } from '@/design-system'"], id: 'preview-card-image', metadata: { nestable: true } }
