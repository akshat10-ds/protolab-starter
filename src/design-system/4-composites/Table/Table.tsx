import React, { useState, useCallback, useMemo } from 'react';
import styles from './Table.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';
import { Checkbox } from '../../3-primitives/Checkbox';
import { TableActionBar } from './TableActionBar';
import { TableColumnControl } from './TableColumnControl';
import { TablePagination } from './TablePagination';
import type {
  TableProps,
  TableColumn,
  TableSize,
  TableVariant,
  TableAlign,
  SortDirection,
  ColumnControlSaveData,
} from './types';

// Re-export types for convenience
export type { TableProps, TableColumn, TableSize, TableVariant, TableAlign, SortDirection };

/**
 * Table - Production-ready data table component
 *
 * Features:
 * - Column sorting (ascending/descending/none cycle)
 * - Row selection with checkboxes
 * - Column visibility control via modal
 * - Selection action bar
 * - Pagination footer
 * - Favorite/star column (optional)
 * - Multiple visual variants
 * - Responsive mobile layout
 */
export function Table<T = any>({
  // Core props
  columns,
  data,
  variant = 'default',
  size = 'medium',
  hoverable = false,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  responsive = true,
  className = '',
  stickyHeader = false,
  maxHeight,
  // Selection props
  selectable = false,
  selectedRows,
  onSelectionChange,
  getRowKey = (row, index) => index,
  // Sorting props
  sortColumn,
  sortDirection,
  onSortChange,
  // Column control props (NEW)
  showColumnControl = false,
  onColumnControlSave,
  initialColumns,
  // Action bar props (NEW)
  selectionActions = [],
  actionBarContent,
  // Pagination props (NEW)
  pagination,
  // Favorite column props (NEW)
  showFavoriteColumn = false,
  favoriteRows,
  onFavoriteChange,
  // Testing props
  'data-qa': dataQa,
}: TableProps<T>) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [localSelectedRows, setLocalSelectedRows] = useState<Set<string | number>>(
    selectedRows || new Set()
  );
  const [columnControlOpen, setColumnControlOpen] = useState(false);
  const [workingColumns, setWorkingColumns] = useState<TableColumn<T>[]>(() =>
    columns.map((col, index) => ({
      ...col,
      order: col.order ?? index,
      isVisible: col.isVisible ?? true,
    }))
  );

  // Sync working columns when columns prop changes
  React.useEffect(() => {
    setWorkingColumns(
      columns.map((col, index) => ({
        ...col,
        order: col.order ?? index,
        isVisible: col.isVisible ?? true,
      }))
    );
  }, [columns]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  // Use controlled or uncontrolled selection
  const selection = onSelectionChange ? selectedRows || new Set() : localSelectedRows;
  const setSelection = onSelectionChange || setLocalSelectedRows;

  // Filter and sort visible columns
  const visibleColumns = useMemo(() => {
    return workingColumns
      .filter((col) => col.isVisible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [workingColumns]);

  // Sort data if needed
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column) return data;

    const sorted = [...data].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b);
      }

      const aVal = (a as any)[column.key];
      const bVal = (b as any)[column.key];

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, columns, sortColumn, sortDirection]);

  // Selection state
  const isAllSelected = selection.size > 0 && selection.size === data.length;
  const isIndeterminate = selection.size > 0 && selection.size < data.length;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selection.size === data.length) {
      setSelection(new Set());
    } else {
      const allKeys = data.map((row, index) => getRowKey(row, index));
      setSelection(new Set(allKeys));
    }
  }, [data, selection.size, setSelection, getRowKey]);

  // Handle row selection
  const handleRowSelect = useCallback(
    (rowKey: string | number) => {
      const newSelection = new Set(selection);
      if (newSelection.has(rowKey)) {
        newSelection.delete(rowKey);
      } else {
        newSelection.add(rowKey);
      }
      setSelection(newSelection);
    },
    [selection, setSelection]
  );

  // Handle sort
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSortChange) return;

      let newDirection: SortDirection = 'asc';
      if (sortColumn === columnKey) {
        if (sortDirection === 'asc') {
          newDirection = 'desc';
        } else if (sortDirection === 'desc') {
          newDirection = null;
        }
      }
      onSortChange(columnKey, newDirection);
    },
    [sortColumn, sortDirection, onSortChange]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (e: React.MouseEvent, rowKey: string | number) => {
      e.stopPropagation();
      if (onFavoriteChange) {
        const isFavorite = favoriteRows?.has(rowKey) ?? false;
        onFavoriteChange(rowKey, !isFavorite);
      }
    },
    [favoriteRows, onFavoriteChange]
  );

  // Handle column control save
  const handleColumnControlSave = useCallback(
    (newColumns: TableColumn<T>[]) => {
      setWorkingColumns(newColumns);
      setColumnControlOpen(false);

      if (onColumnControlSave) {
        const visibilityChanges = new Map<string, boolean>();
        const orderChanges = new Map<string, number>();

        newColumns.forEach((col, index) => {
          const original = columns.find((c) => c.key === col.key);
          if (original) {
            if ((col.isVisible !== false) !== (original.isVisible !== false)) {
              visibilityChanges.set(col.key, col.isVisible !== false);
            }
            if ((col.order ?? index) !== (original.order ?? index)) {
              orderChanges.set(col.key, col.order ?? index);
            }
          }
        });

        onColumnControlSave({
          columns: newColumns,
          visibilityChanges,
          orderChanges,
        });
      }
    },
    [columns, onColumnControlSave]
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const containerStyle: React.CSSProperties = maxHeight
    ? { maxHeight, overflow: 'auto' }
    : {};

  const tableClasses = `
    ${styles.table}
    ${styles[variant]}
    ${styles[size]}
    ${hoverable ? styles.hoverable : ''}
    ${stickyHeader ? styles.stickyHeader : ''}
  `.trim();

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={styles.tableWrapper} data-qa={dataQa}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}>Loading...</div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (data.length === 0) {
    return (
      <div className={styles.tableWrapper} data-qa={dataQa}>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyMessage}>{emptyMessage}</div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div data-ink-component="Table" className={styles.tableWrapper} data-qa={dataQa}>
      {/* Action Bar - visible when rows selected */}
      {selectable && (selectionActions.length > 0 || actionBarContent) && (
        <TableActionBar
          selectedCount={selection.size}
          actions={selectionActions}
          customContent={actionBarContent}
          visible={selection.size > 0}
          selectedRows={selection}
        />
      )}

      {/* Table container */}
      <div
        className={`
          ${styles.container}
          ${responsive ? styles.responsive : ''}
          ${className}
        `.trim()}
        style={containerStyle}
      >
        <table className={tableClasses}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              {/* Selection checkbox column */}
              {selectable && (
                <th className={`${styles.th} ${styles.checkboxCell}`}>
                  <Checkbox
                    label="Select all rows"
                    hideLabel
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                  />
                </th>
              )}

              {/* Favorite column */}
              {showFavoriteColumn && (
                <th className={`${styles.th} ${styles.favoriteCell}`}>
                  <Icon name="star" size="small" />
                </th>
              )}

              {/* Data columns */}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${styles.th}
                    ${column.align ? styles[`align-${column.align}`] : ''}
                    ${column.sortable ? styles.sortable : ''}
                  `.trim()}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  title={column.headerTooltip}
                >
                  <div className={styles.headerContent}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className={styles.sortIcon}>
                        {sortColumn === column.key && sortDirection === 'asc' && (
                          <Icon name="chevron-up" size="small" />
                        )}
                        {sortColumn === column.key && sortDirection === 'desc' && (
                          <Icon name="chevron-down" size="small" />
                        )}
                        {(sortColumn !== column.key || !sortDirection) && (
                          <Icon name="sort" size="small" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}

              {/* Column control trigger */}
              {showColumnControl && (
                <th className={`${styles.th} ${styles.columnControlCell}`}>
                  <IconButton
                    icon="boolean"
                    variant="tertiary"
                    size="small"
                    onClick={() => setColumnControlOpen(true)}
                    aria-label="Customize columns"
                    className={styles.columnControlButton}
                  />
                </th>
              )}
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {sortedData.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex);
              const isSelected = selection.has(rowKey);
              const isFavorite = favoriteRows?.has(rowKey) ?? false;

              return (
                <tr
                  key={rowKey}
                  className={`
                    ${styles.tr}
                    ${isSelected ? styles.selected : ''}
                    ${onRowClick ? styles.clickable : ''}
                  `.trim()}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {/* Selection checkbox */}
                  {selectable && (
                    <td className={`${styles.td} ${styles.checkboxCell}`}>
                      <Checkbox
                        label={`Select row ${rowIndex + 1}`}
                        hideLabel
                        checked={isSelected}
                        onChange={() => handleRowSelect(rowKey)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </td>
                  )}

                  {/* Favorite column */}
                  {showFavoriteColumn && (
                    <td className={`${styles.td} ${styles.favoriteCell}`}>
                      <button
                        className={`
                          ${styles.favoriteButton}
                          ${isFavorite ? styles.active : ''}
                        `.trim()}
                        onClick={(e) => handleFavoriteToggle(e, rowKey)}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Icon
                          name={isFavorite ? 'star-filled' : 'star'}
                          size="small"
                        />
                      </button>
                    </td>
                  )}

                  {/* Data cells */}
                  {visibleColumns.map((column) => {
                    const value = (row as any)[column.key];
                    const cellContent = column.cell
                      ? column.cell(row)
                      : column.render
                      ? column.render(value, row, rowIndex)
                      : value;

                    return (
                      <td
                        key={column.key}
                        className={`
                          ${styles.td}
                          ${column.align ? styles[`align-${column.align}`] : ''}
                        `.trim()}
                        data-label={column.header}
                      >
                        {cellContent}
                      </td>
                    );
                  })}

                  {/* Empty cell for column control alignment */}
                  {showColumnControl && (
                    <td className={`${styles.td} ${styles.columnControlCell}`} />
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && (
        <TablePagination
          config={pagination}
          disabled={loading}
        />
      )}

      {/* Column control modal */}
      {showColumnControl && (
        <TableColumnControl
          open={columnControlOpen}
          columns={workingColumns}
          initialColumns={initialColumns}
          onSave={handleColumnControlSave}
          onCancel={() => setColumnControlOpen(false)}
        />
      )}
    </div>
  );
}

Table.displayName = 'Table';
