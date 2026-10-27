// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=512-17528
// source=src/design-system/4-composites/Pagination/Pagination.tsx
// component=Pagination
// Figma variant maps to mode; info, small/medium and per-page controls are represented.
// Counts and page callbacks bind to actual application data; specimen values demonstrate the API.
import figma from 'figma'
const instance = figma.selectedInstance

const mode = instance.getEnum('variant', { default: 'full', simple: 'simple' })
const showItemsPerPage = instance.getBoolean('hasPerPageControl')
const disabled = instance.getEnum('disabled', { False: false, True: true })

const showInfo = instance.getBoolean('hasInfoControl')
const size = instance.getEnum('size', { small: 'small', medium: 'medium' })
// Long/truncation are derived from count, current page and maxPageButtons.

export default {
  example: figma.code`<Pagination currentPage={1} totalPages={10} onPageChange={(page) => {}} showFirstLast={false} hideItemsPerPageLabel itemsPerPageFormat="per-page" size="${size}" showInfo={${showInfo}} totalItems={100}${mode === 'simple' ? ' mode="simple"' : ''}${showItemsPerPage ? ' showItemsPerPage itemsPerPage={10} onItemsPerPageChange={(size) => {}}' : ''}${disabled ? ' disabled' : ''} />`,
  imports: ["import { Pagination } from '@/design-system'"],
  id: 'pagination',
  metadata: { nestable: false },
}
