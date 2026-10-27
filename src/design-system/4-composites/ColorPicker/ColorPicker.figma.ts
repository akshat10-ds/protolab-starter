// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=2923-13579
// source=src/design-system/4-composites/ColorPicker/ColorPicker.tsx
// component=ColorPicker
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const mode = instance.getEnum('❖ Type', { Gradient: 'gradient', Image: 'image', 'Image Upload': 'image-upload' })
export default { example: figma.code`<ColorPicker mode="${mode}"${mode === 'image' ? ' imageSrc={imageSrc}' : ''} onChange={(hex) => {}}${mode !== 'gradient' ? ' onImageChange={(file) => {}}' : ''} />`, imports: ["import { ColorPicker } from '@/design-system'"], id: 'color-picker', metadata: { nestable: true } }
