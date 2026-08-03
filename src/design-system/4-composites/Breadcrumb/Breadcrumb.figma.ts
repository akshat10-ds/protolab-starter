// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=180-2159
// source=src/design-system/4-composites/Breadcrumb/Breadcrumb.tsx
// component=Breadcrumb
// Note: the ❖-prefixed Figma props here are NOT design-only — "❖ Root Icon", "❖ Show Current Page",
// and "❖ Overflow Menu" map directly to the code props rootIcon, showCurrentPage, overflowMenu.
// Drift: item labels live on nested Breadcrumb.Item instances (5:501) and are not extracted —
// a placeholder items array is emitted. Item-level "❖ State" / "❖ Current Page" are design-only
// (current is derived from item data in code).
import figma from 'figma'
const instance = figma.selectedInstance

const rootIcon = instance.getBoolean('❖ Root Icon')
const showCurrentPage = instance.getBoolean('❖ Show Current Page')
const overflowMenu = instance.getEnum('❖ Overflow Menu', { False: false, True: true })

export default {
  example: figma.code`<Breadcrumb${rootIcon ? ' rootIcon' : ''}${showCurrentPage ? '' : ' showCurrentPage={false}'}${overflowMenu ? ' overflowMenu' : ''} items={[
  { label: 'Home', href: '/' },
  { label: 'Section', href: '/section' },
  { label: 'Current page', current: true },
]} />`,
  imports: ["import { Breadcrumb } from '@/design-system'"],
  id: 'breadcrumb',
  metadata: { nestable: false },
}
