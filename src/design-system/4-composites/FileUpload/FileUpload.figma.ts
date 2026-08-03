// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=846-7730
// source=src/design-system/4-composites/FileUpload/FileUpload.tsx
// component=FileUpload
// drift: code FileUpload maps to Figma "[INK] File Drop" (note: the Figma set carries a hidden
// _Component Deprecation Warning layer). Figma "text" (drop-zone title) maps to code
// "placeholder"; Figma "formats" / "maxFileSize" texts combine into code "helperText".
import figma from 'figma'
const instance = figma.selectedInstance

const placeholder = instance.getString('text')
const disabled = instance.getEnum('disabled', { False: false, True: true })

// HasFormats? / HasMaxFileSize? gate the two helper text lines; code has a single helperText
const hasFormats = instance.getBoolean('HasFormats?')
const formats = instance.getString('formats')
const hasMaxFileSize = instance.getBoolean('HasMaxFileSize?')
const maxFileSize = instance.getString('maxFileSize')
const helperParts = []
if (hasFormats) helperParts.push(formats)
if (hasMaxFileSize) helperParts.push(maxFileSize)
const helperText = helperParts.join(' · ')

// Figma-only properties intentionally omitted: "❖ State" (interaction state), "❖ Small",
// "background", "❖ Show Secondary Action Button", "❖ Show Body Text" (no code props)

export default {
  example: figma.code`<FileUpload placeholder="${placeholder}"${helperText ? figma.code` helperText="${helperText}"` : ''}${disabled ? ' disabled' : ''} onFilesSelect={(files) => {}} />`,
  imports: ["import { FileUpload } from '@/design-system'"],
  id: 'file-upload',
  metadata: { nestable: false },
}
