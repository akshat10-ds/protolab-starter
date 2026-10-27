// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=513-15900
// source=src/design-system/4-composites/Toast/Toast.tsx
// component=Toast
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const kind = instance.getEnum('kind', { information: 'information', success: 'success', warning: 'warning', danger: 'danger', loading: 'loading' })
const text = instance.getString('children')
const close = instance.getBoolean('closeButton')
const action = instance.getBoolean('action') ? instance.findInstance('action', { traverseInstances: true }) : null
const actionCode = action?.type === 'INSTANCE' ? action.executeTemplate().example : undefined
export default { example: figma.code`<Toast kind="${kind}" closeButton={${close}}${close ? ' onClose={() => {}}' : ''}${actionCode ? figma.code` action={<>${actionCode}</>}` : ''}>${text}</Toast>`, imports: ["import { Toast } from '@/design-system'"], id: 'toast', metadata: { nestable: true } }
