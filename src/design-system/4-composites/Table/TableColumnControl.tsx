import React, { useState, useMemo, useCallback } from 'react';
import styles from './TableColumnControl.module.css';
import { Modal } from '../Modal';
import { SearchInput } from '../SearchInput';
import { Switch } from '../../3-primitives/Switch';
import { Button } from '../../3-primitives/Button';
import { Icon } from '../../3-primitives/Icon';
import type { TableColumn, TableColumnControlProps } from './types';

/**
 * TableColumnControl - Modal for managing column visibility and order
 *
 * Features:
 * - Search input to filter columns
 * - Toggle switches for column visibility
 * - Drag handles for reordering columns
 * - Cancel/Save buttons
 * - Reset to initial state
 */
export function TableColumnControl<T = any>({
  open,
  columns,
  initialColumns,
  onSave,
  onCancel,
}: TableColumnControlProps<T>) {
  // Local state for working with columns
  const [workingColumns, setWorkingColumns] = useState<TableColumn<T>[]>(() =>
    columns.map((col, index) => ({
      ...col,
      order: col.order ?? index,
      isVisible: col.isVisible ?? true,
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Reset working columns when modal opens with new columns
  React.useEffect(() => {
    if (open) {
      setWorkingColumns(
        columns.map((col, index) => ({
          ...col,
          order: col.order ?? index,
          isVisible: col.isVisible ?? true,
        }))
      );
      setSearchQuery('');
    }
  }, [open, columns]);

  // Filter columns that can be controlled (not fixed position)
  const controllableColumns = useMemo(() => {
    return workingColumns
      .filter((col) => !col.fixedPosition)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [workingColumns]);

  // Filter by search query
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return controllableColumns;
    const query = searchQuery.toLowerCase();
    return controllableColumns.filter((col) => {
      const headerText = typeof col.header === 'string' ? col.header : col.key;
      return headerText.toLowerCase().includes(query);
    });
  }, [controllableColumns, searchQuery]);

  // Handle visibility toggle
  const handleVisibilityChange = useCallback((columnKey: string, isVisible: boolean) => {
    setWorkingColumns((prev) =>
      prev.map((col) =>
        col.key === columnKey ? { ...col, isVisible } : col
      )
    );
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const sourceColumn = filteredColumns[draggedIndex];
    const targetColumn = filteredColumns[targetIndex];

    if (!sourceColumn || !targetColumn) return;

    // Reorder the columns
    setWorkingColumns((prev) => {
      const newColumns = [...prev];
      const sourceOrder = sourceColumn.order ?? draggedIndex;
      const targetOrder = targetColumn.order ?? targetIndex;

      return newColumns.map((col) => {
        if (col.key === sourceColumn.key) {
          return { ...col, order: targetOrder };
        }
        if (col.key === targetColumn.key) {
          return { ...col, order: sourceOrder };
        }
        return col;
      });
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, filteredColumns]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    onSave(workingColumns);
  }, [workingColumns, onSave]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (initialColumns) {
      setWorkingColumns(
        initialColumns.map((col, index) => ({
          ...col,
          order: col.order ?? index,
          isVisible: col.isVisible ?? true,
        }))
      );
    }
  }, [initialColumns]);

  // Check if there are changes from initial
  const hasChanges = useMemo(() => {
    if (!initialColumns) return false;
    return JSON.stringify(workingColumns) !== JSON.stringify(
      initialColumns.map((col, index) => ({
        ...col,
        order: col.order ?? index,
        isVisible: col.isVisible ?? true,
      }))
    );
  }, [workingColumns, initialColumns]);

  // Render footer
  const footer = (
    <div className={styles.footer}>
      {initialColumns && hasChanges && (
        <Button variant="tertiary" onClick={handleReset}>
          Reset
        </Button>
      )}
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Customize columns"
      size="small"
      footer={footer}
    >
      {/* Search */}
      <div className={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Find columns"
          clearable
        />
      </div>

      {/* Column list */}
      <div className={styles.columnList}>
        {filteredColumns.length === 0 ? (
          <div className={styles.emptyState}>No columns found</div>
        ) : (
          filteredColumns.map((column, index) => {
            const headerText = typeof column.header === 'string' ? column.header : column.key;
            const isLocked = column.isVisible === 'locked';
            const isVisible = column.isVisible !== false;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const canDrag = !searchQuery && !isLocked;

            return (
              <div
                key={column.key}
                className={`
                  ${styles.columnItem}
                  ${isDragging ? styles.dragging : ''}
                  ${isDragOver ? styles.dragOver : ''}
                `.trim()}
                draggable={canDrag}
                onDragStart={() => canDrag && handleDragStart(index)}
                onDragOver={(e) => canDrag && handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={() => canDrag && handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                <div className={styles.columnItemLeft}>
                  {/* Drag handle */}
                  <div
                    className={`
                      ${styles.dragHandle}
                      ${!canDrag ? styles.disabled : ''}
                    `.trim()}
                  >
                    <Icon name="gripper-bar" size="small" />
                  </div>

                  {/* Column label */}
                  <span className={styles.columnLabel}>{headerText}</span>
                </div>

                <div className={styles.columnItemRight}>
                  {isLocked ? (
                    <span className={styles.lockedBadge}>Locked</span>
                  ) : (
                    <Switch
                      checked={isVisible}
                      onChange={(checked) => handleVisibilityChange(column.key, checked)}
                      aria-label={`Toggle ${headerText} visibility`}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

TableColumnControl.displayName = 'TableColumnControl';
