import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import styles from './DataTable.module.css';
import { DataTableHeader } from './DataTableHeader';
import { DataTableBody } from './DataTableBody';
import { DataTableFooter } from './DataTableFooter';
import { DataTableActionBar } from './DataTableActionBar';
import { DataTableColumnControl } from './DataTableColumnControl';
import type {
  DataTableProps,
  DataTableColumn,
  DataTableSortDirection,
} from './types';

/**
 * DataTable - Production-grade data table pattern
 *
 * Exact visual and UX match to DocuSign Navigator production table.
 *
 * Features:
 * - Column sorting (ascending/descending/none cycle)
 * - Row selection with checkboxes
 * - Column visibility control via modal
 * - Selection action bar
 * - Pagination footer
 * - Multiple row height variants
 * - Sticky header/footer support
 */
export function DataTable<T = any>({
  // Data
  columns,
  data,
  getRowKey,

  // Appearance
  rowHeight = 'default',
  className = '',
  'data-qa': dataQa,

  // Selection
  selectable = false,
  selectedRows,
  onSelectionChange,

  // Sorting
  sortColumn,
  sortDirection,
  onSortChange,

  // Column Control
  showColumnControl = false,
  initialColumns,
  onColumnControlSave,

  // Action Bar
  selectionActions = [],
  actionBarContent,

  // Pagination
  pagination,

  // States
  loading = false,
  emptyMessage = 'No data available',

  // Row Events
  onRowClick,
  renderRowActions,

  // Sticky
  stickyHeader = false,
  stickyFooter = false,
}: DataTableProps<T>) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [localSelectedRows, setLocalSelectedRows] = useState<Set<string | number>>(
    selectedRows || new Set()
  );
  const [columnControlOpen, setColumnControlOpen] = useState(false);
  const [workingColumns, setWorkingColumns] = useState<DataTableColumn<T>[]>(() =>
    columns.map((col, index) => ({
      ...col,
      order: col.order ?? index,
      isVisible: col.isVisible ?? true,
    }))
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle horizontal scroll for sticky column shadow
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setIsScrolled(containerRef.current.scrollLeft > 0);
    }
  }, []);

  // Sync working columns when columns prop changes
  useEffect(() => {
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
      // Use custom sortValue if provided
      const aVal = column.sortValue
        ? column.sortValue(a)
        : (a as any)[column.key];
      const bVal = column.sortValue
        ? column.sortValue(b)
        : (b as any)[column.key];

      if (aVal < bVal) return sortDirection === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'ascending' ? 1 : -1;
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

      const column = columns.find((c) => c.key === columnKey);
      const startDesc = column?.startWithDescending ?? false;

      let newDirection: DataTableSortDirection;

      if (sortColumn === columnKey) {
        // Cycle through: current -> next -> null
        if (startDesc) {
          // desc -> asc -> null
          if (sortDirection === 'descending') {
            newDirection = 'ascending';
          } else if (sortDirection === 'ascending') {
            newDirection = null;
          } else {
            newDirection = 'descending';
          }
        } else {
          // asc -> desc -> null
          if (sortDirection === 'ascending') {
            newDirection = 'descending';
          } else if (sortDirection === 'descending') {
            newDirection = null;
          } else {
            newDirection = 'ascending';
          }
        }
      } else {
        // New column, start with default direction
        newDirection = startDesc ? 'descending' : 'ascending';
      }

      onSortChange(columnKey, newDirection);
    },
    [sortColumn, sortDirection, onSortChange, columns]
  );

  // Handle column control save
  const handleColumnControlSave = useCallback(
    (newColumns: DataTableColumn<T>[]) => {
      setWorkingColumns(newColumns);
      setColumnControlOpen(false);
      onColumnControlSave?.(newColumns);
    },
    [onColumnControlSave]
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const tableClasses = [
    styles.table,
    stickyHeader ? styles.stickyHeader : '',
  ]
    .filter(Boolean)
    .join(' ');

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={`${styles.wrapper} ${className}`} data-qa={dataQa}>
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
      <div className={`${styles.wrapper} ${className}`} data-qa={dataQa}>
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
    <div data-ink-component="DataTable" className={`${styles.wrapper} ${className}`} data-qa={dataQa}>
      {/* Action Bar - visible when rows selected */}
      {selectable && (selectionActions.length > 0 || actionBarContent) && (
        <DataTableActionBar
          selectedCount={selection.size}
          actions={selectionActions}
          customContent={actionBarContent}
          visible={selection.size > 0}
          selectedRows={selection}
        />
      )}

      {/* Table container */}
      <div
        ref={containerRef}
        className={`${styles.container} ${isScrolled ? styles.isScrolled : ''}`}
        onScroll={handleScroll}
      >
        <table className={tableClasses}>
          <DataTableHeader
            columns={visibleColumns}
            selectable={selectable}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            showColumnControl={showColumnControl}
            onColumnControlClick={() => setColumnControlOpen(true)}
            stickyHeader={stickyHeader}
          />

          <DataTableBody
            columns={visibleColumns}
            data={sortedData}
            getRowKey={getRowKey}
            rowHeight={rowHeight}
            selectable={selectable}
            selectedRows={selection}
            onRowSelect={handleRowSelect}
            onRowClick={onRowClick}
            showColumnControl={showColumnControl}
            renderRowActions={renderRowActions}
          />
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && (
        <DataTableFooter
          pagination={pagination}
          disabled={loading}
          stickyFooter={stickyFooter}
        />
      )}

      {/* Column control modal */}
      {showColumnControl && (
        <DataTableColumnControl
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

DataTable.displayName = 'DataTable';
