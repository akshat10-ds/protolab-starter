// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=512-17528
// source=src/design-system/4-composites/Pagination/Pagination.tsx
// component=Pagination
// Drift: Figma "variant" (default/simple) maps to code "mode" (full/simple).
// "hasPerPageControl" maps to code "showItemsPerPage". Figma "hasInfoControl" ("1-10 of 100"
// readout) and "size" have no code counterparts. "❖ Truncation" is automatic in code via
// maxPageButtons. Code currentPage/totalPages/onPageChange are required — placeholders emitted.
import figma from 'figma'
const instance = figma.selectedInstance

const mode = instance.getEnum('variant', { default: 'full', simple: 'simple' })
const showItemsPerPage = instance.getBoolean('hasPerPageControl')
const disabled = instance.getEnum('disabled', { False: false, True: true })

// Figma-only properties intentionally omitted: "❖ Long", "❖ Truncation" (layout/derived states),
// "hasInfoControl", "size" (no code props)

export default {
  example: figma.code`<Pagination currentPage={1} totalPages={10} onPageChange={(page) => {}}${mode === 'simple' ? ' mode="simple"' : ''}${showItemsPerPage ? ' showItemsPerPage' : ''}${disabled ? ' disabled' : ''} />`,
  imports: ["import { Pagination } from '@/design-system'"],
  id: 'pagination',
  metadata: { nestable: false },
}
