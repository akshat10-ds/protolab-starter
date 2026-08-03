// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=4-409
// source=src/design-system/3-primitives/AlertBadge/AlertBadge.tsx
// component=AlertBadge
// NOTE: Figma "BadgeWidth" single/double is derived from value in code — only "dot" maps (→ dot prop).
import figma from 'figma'
const instance = figma.selectedInstance

// Figma value is TEXT (e.g. "9", "99+") — code takes a number
const value = parseInt(instance.getString('value'), 10) || 1
const kind = instance.getEnum('kind', { emphasis: 'emphasis', subtle: 'subtle' })
const badgeWidth = instance.getEnum('BadgeWidth', {
  single: 'single',
  double: 'double',
  dot: 'dot',
})
const dot = badgeWidth === 'dot'

export default {
  example: figma.code`<AlertBadge value={${value}} kind="${kind}"${dot ? ' dot' : ''} />`,
  imports: ["import { AlertBadge } from '@/design-system'"],
  id: 'alert-badge',
  metadata: { nestable: true },
}
