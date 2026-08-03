// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=1070-8230
// source=src/design-system/4-composites/Banner/Banner.tsx
// component=Banner
// Drift: Figma "LineWrap?" maps to code "lineWrap"; Figma "border" maps to code "bottomBorder"
// (the page's _<Kind>.BorderRule sets are the bottom border rules). Figma "alignText" has no
// code prop. Figma "hasStartElement" toggles a swappable start instance — mapped to code
// "customIcon" via the nested "startElement" layer.
import figma from 'figma'
const instance = figma.selectedInstance

const kind = instance.getEnum('kind', {
  subtle: 'subtle',
  neutral: 'neutral',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
  promo: 'promo',
  information: 'information',
})
const shape = instance.getEnum('shape', { round: 'round', square: 'square' })
const lineWrap = instance.getEnum('LineWrap?', { false: false, true: true })
const bottomBorder = instance.getEnum('border', { false: false, true: true })
const message = instance.getString('children')
const hasAction = instance.getBoolean('action')
const closable = instance.getBoolean('closeButton')

const hasStart = instance.getBoolean('hasStartElement')
let startCode
if (hasStart) {
  const start = instance.findInstance('startElement')
  if (start && start.type === 'INSTANCE') {
    startCode = start.executeTemplate().example
  }
}

// Figma-only properties intentionally omitted: "alignText" (no code prop)

export default {
  example: figma.code`<Banner kind="${kind}" shape="${shape}"${lineWrap ? ' lineWrap' : ''}${bottomBorder ? ' bottomBorder' : ''}${startCode ? figma.code` customIcon={${startCode}}` : ''}${hasAction ? " action={{ label: 'Action', onClick: () => {} }}" : ''}${closable ? ' onClose={() => {}}' : ' closable={false}'}>${message}</Banner>`,
  imports: ["import { Banner } from '@/design-system'"],
  id: 'banner',
  metadata: { nestable: false },
}
