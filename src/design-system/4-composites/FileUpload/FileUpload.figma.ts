// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=846-7730
// source=src/design-system/4-composites/FileUpload/FileUpload.tsx
// component=FileUpload
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const placeholder = instance.getString('text')
const disabled = instance.getEnum('disabled', { False: false, True: true })
const small = instance.getEnum('❖ Small', { False: false, True: true })
const background = instance.getEnum('background', { False: false, True: true })
const showBodyText = instance.getBoolean('❖ Show Body Text')
const showSecondaryActionButton = instance.getBoolean('❖ Show Secondary Action Button')
const helperText = instance.getBoolean('HasFormats?') ? instance.getString('formats') : ''
const limits = instance.getBoolean('HasMaxFileSize?') ? instance.getString('maxFileSize') : ''
const match = limits.match(/([\d.]+)\s*(KB|MB|GB)/i)
const maxSize = match ? Number(match[1]) * ({ KB: 1024, MB: 1048576, GB: 1073741824 }[match[2].toUpperCase()] || 1) : undefined
const primary = instance.findInstance('Primary Action', { traverseInstances: true })
const primaryLabel = primary.type === 'INSTANCE' ? primary.findText('text', { traverseInstances: true }) : null
const secondary = showSecondaryActionButton ? instance.findInstance('Secondary Action', { traverseInstances: true }) : null
const secondaryCode = secondary?.type === 'INSTANCE' ? secondary.executeTemplate().example : undefined
// Primary remains the component's functional native file-picker action. Its label comes from Figma.
export default {
  example: figma.code`<FileUpload placeholder={${JSON.stringify(placeholder)}} small={${small}} background={${background}} showBodyText={${showBodyText}} showSecondaryActionButton={${showSecondaryActionButton}}${helperText ? figma.code` helperText={${JSON.stringify(helperText)}}` : ''}${maxSize !== undefined ? figma.code` maxSize={${maxSize}}` : ''}${primaryLabel?.type === 'TEXT' ? figma.code` primaryActionLabel={${JSON.stringify(primaryLabel.textContent)}}` : ''}${secondaryCode ? figma.code` secondaryAction={${secondaryCode}}` : ''}${disabled ? ' disabled' : ''} onFilesSelect={(files) => {}} />`,
  imports: ["import { FileUpload } from '@/design-system'"], id: 'file-upload', metadata: { nestable: false },
}
