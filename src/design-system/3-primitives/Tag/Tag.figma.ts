// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=2590-1814
// source=src/design-system/3-primitives/Tag/Tag.tsx
// component=Tag
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const disabled = instance.getEnum('disabled', { False: false, True: true })
const close = instance.getBoolean('closeButton')
const start = instance.getBoolean('startElement') ? instance.findInstance('startElement') : null
const startCode = start?.type === 'INSTANCE' ? start.executeTemplate().example : undefined
export default { example: figma.code`<Tag text={${JSON.stringify(text)}} disabled={${disabled}}${close ? ' onRemove={() => {}}' : ''}${startCode ? figma.code` startElement={<>${startCode}</>}` : ''} />`, imports: ["import { Tag } from '@/design-system'"], id: 'tag', metadata: { nestable: true } }
