// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=28-1102
// source=src/design-system/4-composites/Callout/Callout.tsx
// component=Text
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
export default { example: figma.code`<Text size="sm">${text}</Text>`, imports: ["import { Text } from '@/design-system'"], id: 'callout-body', metadata: { nestable: true } }
