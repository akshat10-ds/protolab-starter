// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=12985-36368
// source=src/design-system/3-primitives/Card/Card.tsx
// component=Card.Image
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const ratio = instance.getEnum('ratio', { '16:9': '16:9', '3:2': '3:2', '1:1': '1:1' })
const spacing = instance.getEnum('imageSpacing', { 'full-width': 'full-width', 'document-preview': 'document-preview', floating: 'floating' })
// Raster source and alternative text are application data, not Figma component properties.
export default { example: figma.code`<Card.Image src={imageSrc} alt={imageAlt} ratio="${ratio}" imageSpacing="${spacing}" />`, imports: ["import { Card } from '@/design-system'"], id: 'card-image', metadata: { nestable: true, props: { assetBinding: 'Supply imageSrc and imageAlt from the application asset/data binding.' } } }
