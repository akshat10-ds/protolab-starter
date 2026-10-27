// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=19-484
// source=src/design-system/3-primitives/ToggleButton/ToggleButton.tsx
// component=ToggleButton
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const selected = instance.getEnum('selected', { False: false, True: true })
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
const inactive = instance.getEnum('inactive', { False: false, True: true })
const text = instance.getString('text')
const showText = instance.getBoolean('showText')
const hasIcon = instance.getBoolean('HasIcon?')
const icon = hasIcon ? instance.getInstanceSwap('icon') : null
const small = hasIcon ? instance.getInstanceSwap('icon (Small)') : null
const iconCode = icon?.type === 'INSTANCE' ? icon.executeTemplate().example : undefined
const smallCode = small?.type === 'INSTANCE' ? small.executeTemplate().example : undefined
export default { example: figma.code`<ToggleButton text={${JSON.stringify(text)}} showText={${showText}} hasIcon={${hasIcon}} size="${size}" defaultSelected={${selected}} inactive={${inactive}}${iconCode ? figma.code` icon={<>${iconCode}</>}` : ''}${smallCode ? figma.code` iconSmall={<>${smallCode}</>}` : ''} onSelectedChange={(selected) => {}} />`, imports: ["import { ToggleButton } from '@/design-system'"], id: 'toggle-button', metadata: { nestable: true } }
