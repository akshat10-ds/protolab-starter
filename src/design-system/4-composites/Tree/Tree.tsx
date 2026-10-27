import * as React from 'react';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';
import { cn } from '@/lib/utils';
import styles from './Tree.module.css';

export interface TreeNode { id: string; label: string; icon?: React.ReactNode; children?: TreeNode[]; disabled?: boolean; action?: React.ReactNode; draggable?: boolean; }
export interface TreeProps { items: TreeNode[]; label: string; title?: React.ReactNode; action?: React.ReactNode; selectedIds?: string[]; defaultSelectedIds?: string[]; onSelectionChange?: (ids: string[]) => void; expandedIds?: string[]; defaultExpandedIds?: string[]; onExpandedChange?: (ids: string[]) => void; selectionMode?: 'single' | 'multiple'; selectDescendants?: boolean; shape?: 'round' | 'square'; onMove?: (id: string, targetId: string, placement: 'before' | 'after' | 'inside') => void; className?: string; }
interface FlatNode { node: TreeNode; parent?: string; }
export const getSelectableTreeDescendantIds = (node: TreeNode): string[] => node.disabled ? [] : [node.id, ...(node.children ?? []).flatMap(getSelectableTreeDescendantIds)];
export const Tree: React.FC<TreeProps> = ({ items, label, title, action, selectedIds, defaultSelectedIds = [], onSelectionChange, expandedIds, defaultExpandedIds = [], onExpandedChange, selectionMode = 'single', selectDescendants = true, shape = 'round', onMove, className }) => {
  const [internalSelection, setInternalSelection] = React.useState(defaultSelectedIds);
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpandedIds);
  const selected = selectedIds ?? internalSelection;
  const expanded = expandedIds ?? internalExpanded;
  const all = new Map<string, FlatNode>();
  const visible: FlatNode[] = [];
  const walk = (nodes: TreeNode[], parent?: string, shown = true, ancestorDisabled = false) => nodes.forEach(node => { const disabled = ancestorDisabled || !!node.disabled; const entry = { node: disabled ? { ...node, disabled: true } : node, parent }; all.set(node.id, entry); if (shown && !disabled) visible.push(entry); if (node.children) walk(node.children, node.id, shown && expanded.includes(node.id), disabled); });
  walk(items);
  const [focused, setFocused] = React.useState(selected[0] ?? visible[0]?.node.id);
  const focusId = visible.some(entry => entry.node.id === focused) ? focused : visible[0]?.node.id;
  const refs = React.useRef(new Map<string, HTMLDivElement>());
  const search = React.useRef({ text: '', at: 0 });
  const focus = (id?: string) => { if (id) { setFocused(id); refs.current.get(id)?.focus(); } };
  const expand = (id: string, open: boolean) => { const next = open ? [...new Set([...expanded, id])] : expanded.filter(key => key !== id); if (expandedIds === undefined) setInternalExpanded(next); onExpandedChange?.(next); };
  const descendants = getSelectableTreeDescendantIds;
  const structuralIds = (node: TreeNode): string[] => [node.id, ...(node.children ?? []).flatMap(structuralIds)];
  const choose = (node: TreeNode) => {
    if (node.disabled) return;
    let next: string[];
    if (selectionMode === 'single') next = [node.id];
    else { const keys = selectDescendants ? descendants(node) : [node.id]; const remove = keys.every(key => selected.includes(key)); next = remove ? selected.filter(key => !keys.includes(key)) : [...new Set([...selected, ...keys])]; }
    if (selectedIds === undefined) setInternalSelection(next);
    onSelectionChange?.(next);
  };
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>, node: TreeNode) => {
    if (node.disabled || event.target !== event.currentTarget) return;
    const index = visible.findIndex(entry => entry.node.id === node.id);
    const parent = all.get(node.id)?.parent;
    const open = expanded.includes(node.id);
    let handled = true;
    if (event.altKey && onMove && node.draggable && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) { const invalidTargets = new Set(structuralIds(node)); const candidates = event.key === 'ArrowUp' ? visible.slice(0, index).reverse() : visible.slice(index + 1); const neighbor = candidates.find(entry => !invalidTargets.has(entry.node.id))?.node; if (neighbor) onMove(node.id, neighbor.id, event.key === 'ArrowUp' ? 'before' : 'after'); }
    else if (event.key === 'ArrowDown') focus(visible[index + 1]?.node.id);
    else if (event.key === 'ArrowUp') focus(visible[index - 1]?.node.id);
    else if (event.key === 'Home') focus(visible[0]?.node.id);
    else if (event.key === 'End') focus(visible[visible.length - 1]?.node.id);
    else if (event.key === 'ArrowRight') { if (node.children?.length) { if (!open) expand(node.id, true); else focus(node.children.find(child => !child.disabled)?.id); } }
    else if (event.key === 'ArrowLeft') { if (node.children?.length && open) expand(node.id, false); else focus(parent); }
    else if (event.key === ' ' || event.key === 'Enter') choose(node);
    else if (event.key === '*') { const siblings = parent ? all.get(parent)?.node.children ?? [] : items; const next = [...new Set([...expanded, ...siblings.filter(item => item.children?.length).map(item => item.id)])]; if (expandedIds === undefined) setInternalExpanded(next); onExpandedChange?.(next); }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { const now = Date.now(); const text = now - search.current.at > 700 ? event.key : search.current.text + event.key; search.current = { text: text.toLowerCase(), at: now }; const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)]; focus(ordered.find(entry => entry.node.label.toLowerCase().startsWith(search.current.text))?.node.id); }
    else handled = false;
    if (handled) event.preventDefault();
  };
  const render = (nodes: TreeNode[], level = 1, parentSelected = false, ancestorDisabled = false): React.ReactNode => nodes.map((node, index) => {
    const disabled = ancestorDisabled || !!node.disabled;
    const hasChildren = !!node.children?.length;
    const keys = selectDescendants ? descendants(node) : [node.id];
    const count = keys.filter(key => selected.includes(key)).length;
    const checked = count === keys.length && keys.length > 0;
    const mixed = count > 0 && !checked;
    const ownSelected = selected.includes(node.id);
    return <div key={node.id} ref={element => { if (element) refs.current.set(node.id, element); else refs.current.delete(node.id); }} role="treeitem" aria-label={node.label} aria-level={level} aria-posinset={index + 1} aria-setsize={nodes.length} aria-expanded={hasChildren ? expanded.includes(node.id) : undefined} aria-selected={selectionMode === 'single' ? ownSelected : undefined} aria-checked={selectionMode === 'multiple' ? mixed ? 'mixed' : checked : undefined} aria-disabled={disabled || undefined} tabIndex={!disabled && focusId === node.id ? 0 : -1} onFocus={event => { if (!disabled && event.target === event.currentTarget) setFocused(node.id); }} onKeyDown={event => keyDown(event, { ...node, disabled })} className={styles.item}>
      <div className={cn(styles.row, shape === 'square' && styles.square, ownSelected && styles.selected, parentSelected && styles.parentSelected, disabled && styles.disabled)} draggable={!!onMove && node.draggable && !disabled} onDragStart={event => { event.dataTransfer.setData('application/x-ink-tree-id', node.id); event.dataTransfer.effectAllowed = 'move'; }} onDragOver={event => { if (onMove && !disabled) event.preventDefault(); }} onDrop={event => { const id = event.dataTransfer.getData('application/x-ink-tree-id'); if (onMove && all.has(id) && id !== node.id && !disabled && !structuralIds(all.get(id)!.node).includes(node.id)) { event.preventDefault(); event.stopPropagation(); onMove(id, node.id, hasChildren ? 'inside' : 'after'); } }} onClick={() => { if (!disabled) { focus(node.id); choose(node); } }}>
        {hasChildren ? <IconButton icon={expanded.includes(node.id) ? 'chevron-down' : 'chevron-right'} size="small" variant="tertiary" aria-label={`${expanded.includes(node.id) ? 'Collapse' : 'Expand'} ${node.label}`} disabled={disabled} tabIndex={-1} onClick={event => { event.stopPropagation(); expand(node.id, !expanded.includes(node.id)); focus(node.id); }} /> : <span className={styles.placeholder} />}
        {selectionMode === 'multiple' && <span className={styles.check} aria-hidden="true">{(checked || mixed) && <Icon name={mixed ? 'minus' : 'check'} size="small" />}</span>}{node.icon}<span className={styles.label}>{node.label}</span>{node.action && <span className={styles.action} onClick={event => event.stopPropagation()}>{node.action}</span>}{node.draggable && <span aria-hidden="true"><Icon name="gripper-bar" size="small" /></span>}
      </div>{hasChildren && expanded.includes(node.id) && <div role="group" className={styles.group}>{render(node.children!, level + 1, parentSelected || ownSelected, disabled)}</div>}
    </div>;
  });
  return <div data-ink-component="Tree" className={className}>{(title || action) && <div className={styles.header}>{title}{action}</div>}<div role="tree" aria-label={label} aria-multiselectable={selectionMode === 'multiple' || undefined}>{render(items)}</div></div>;
};
Tree.displayName = 'Tree';
