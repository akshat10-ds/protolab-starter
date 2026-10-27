// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1467-14574
// source=src/design-system/4-composites/PreviewCard/PreviewCard.tsx
// component=PreviewCard
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const selected = instance.getEnum('❖ State', { Default: false, Hover: false, Active: false, 'Selected [PR]': true })
const heading = instance.findInstance('PreviewCard.Heading', { traverseInstances: true })
const image = instance.findInstance('PreviewCard.Image', { traverseInstances: true })
const headingCode = heading.type === 'INSTANCE' ? heading.executeTemplate().example : undefined
const imageCode = image.type === 'INSTANCE' ? image.executeTemplate().example : undefined
export default { example: figma.code`<PreviewCard heading={<>${headingCode}</>} selected={${selected}} onOpen={() => {}} openLabel={previewLabel}>${imageCode}</PreviewCard>`, imports: ["import { PreviewCard } from '@/design-system'"], id: 'preview-card', metadata: { nestable: true } }
