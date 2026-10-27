// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=473-11943
// source=src/design-system/3-primitives/Meter/Meter.tsx
// component=Meter
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('label')
const content = instance.getString('content')
const kind = instance.getEnum('kind', { info: 'info', 'semantic - high': 'semantic-high', 'semantic - medium': 'semantic-medium', 'semantic - low': 'semantic-low' })
// The semantic value is supplied from application data; Figma exposes its verbal content.
export default { example: figma.code`<Meter label={${JSON.stringify(label)}} content={${JSON.stringify(content)}} kind="${kind}" />`, imports: ["import { Meter } from '@/design-system'"], id: 'meter', metadata: { nestable: true } }
