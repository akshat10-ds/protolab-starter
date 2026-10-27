// url=https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=15930-5857
// source=src/design-system/4-composites/Tree/Tree.tsx
// component=Tree
// Based on accepted current 2026-10-20 owner metadata; interaction states render through native behavior.
import figma from 'figma'
const instance = figma.selectedInstance

const hasTitle = instance.getBoolean('title')
const section = hasTitle ? instance.findInstance('Child/[INK] Section Header', { traverseInstances: true }) : null
const title = section?.type === 'INSTANCE' ? section.getString('title') : undefined
// TreeNode hierarchy/ids are domain data. Figma's children slot contains layout rows,
// which cannot safely establish semantic parent/child relationships from node order.
export default { example: figma.code`<Tree label={treeLabel} items={treeItems} selectDescendants={true}${title ? figma.code` title={${JSON.stringify(title)}}` : ''} />`, imports: ["import { Tree } from '@/design-system'"], id: 'treedeepnested', metadata: { nestable: false, props: { binding: 'Bind treeItems to actual TreeNode[] domain hierarchy; do not infer parents from a flat Figma row list.' } } }
