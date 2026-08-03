// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=55-2626
// source=src/design-system/3-primitives/Link/Link.tsx
// component=Link
// NOTE: Figma "showIconForNewWindow" → code "external"; "text" → children.
// href has no Figma counterpart — code default "#" emitted.
import figma from 'figma'
const instance = figma.selectedInstance

const text = instance.getString('text')
const kind = instance.getEnum('kind', { default: 'default', subtle: 'subtle' })
// code also supports size "xs" — no Figma counterpart
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const discrete = instance.getEnum('discrete', { True: true, False: false })
const disabled = instance.getEnum('disabled', { True: true, False: false })
const external = instance.getBoolean('showIconForNewWindow')

// Figma-only property intentionally omitted: "❖ State" (interaction states, no code prop)

export default {
  example: figma.code`<Link href="#" kind="${kind}" size="${size}"${discrete ? ' discrete' : ''}${external ? ' external' : ''}${disabled ? ' disabled' : ''}>${text}</Link>`,
  imports: ["import { Link } from '@/design-system'"],
  id: 'link',
  metadata: { nestable: true },
}
