import React from 'react';
import styles from './DataTable.module.css';
import { Checkbox } from '../../3-primitives/Checkbox';
import { IconButton } from '../../3-primitives/IconButton';
import { Icon } from '../../3-primitives/Icon';
import type { DataTableHeaderProps } from './types';

/**
 * DataTableHeader - Table header with sorting
 *
 * Renders column headers with sort indicators, optional select-all
 * checkbox, and column control button.
 */
export function DataTableHeader<T = any>({
  columns,
  selectable = false,
  isAllSelected = false,
  isIndeterminate = false,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  showColumnControl = false,
  onColumnControlClick,
  stickyHeader = false,
}: DataTableHeaderProps<T>) {
  // Filter to visible columns
  const visibleColumns = columns.filter((col) => col.isVisible !== false);

  // Handle header click for sorting
  const handleHeaderClick = (column: typeof columns[0]) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  // Calculate sticky left positions for each column
  const getStickyLeft = (columnIndex: number): number | undefined => {
    const column = visibleColumns[columnIndex];
    if (!column.sticky) return undefined;

    // Start with checkbox width if selectable
    let left = selectable ? 56 : 0;

    // Add widths of all previous sticky columns
    for (let i = 0; i < columnIndex; i++) {
      if (visibleColumns[i].sticky) {
        const width = visibleColumns[i].width;
        if (width) {
          // Parse width string (e.g., "40px" -> 40)
          const parsed = parseInt(width, 10);
          if (!isNaN(parsed)) {
            left += parsed;
          }
        }
      }
    }

    return left;
  };

  return (
    <thead className={`${styles.thead} ${stickyHeader ? styles.stickyHeader : ''}`}>
      <tr className={styles.tr}>
        {/* Select all checkbox */}
        {selectable && (
          <th className={`${styles.th} ${styles.checkboxCell}`}>
            <Checkbox
              label="Select all rows"
              hideLabel
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={() => onSelectAll?.()}
            />
          </th>
        )}

        {/* Column headers */}
        {visibleColumns.map((column, columnIndex) => {
          const isSorted = sortColumn === column.key && sortDirection;
          const alignClass = column.alignment
            ? styles[`align${capitalize(column.alignment)}`]
            : '';
          const sortableClass = column.sortable ? styles.sortable : '';
          const sortedClass = isSorted ? styles.sorted : '';
          const stickyClass = column.sticky ? styles.stickyColumn : '';
          const stickyLeft = getStickyLeft(columnIndex);

          return (
            <th
              key={column.key}
              className={`${styles.th} ${alignClass} ${sortableClass} ${sortedClass} ${stickyClass} ${column.className || ''}`.trim()}
              style={{
                width: column.width,
                maxWidth: column.maxWidth,
                ...(column.sticky && stickyLeft !== undefined ? { left: stickyLeft } : {}),
              }}
              onClick={() => handleHeaderClick(column)}
              title={column.headerTooltip}
            >
              <div className={styles.headerContent}>
                <span>{column.header}</span>
                {column.sortable && (
                  <div className={styles.sortIcon}>
                    {isSorted && sortDirection === 'ascending' && (
                      <Icon name="chevron-up" size="small" />
                    )}
                    {isSorted && sortDirection === 'descending' && (
                      <Icon name="chevron-down" size="small" />
                    )}
                    {!isSorted && <Icon name="sort" size="small" />}
                  </div>
                )}
              </div>
            </th>
          );
        })}

        {/* Column control trigger */}
        {showColumnControl && (
          <th className={`${styles.th} ${styles.columnControlCell}`}>
            <IconButton
              icon="boolean"
              variant="tertiary"
              size="medium"
              onClick={onColumnControlClick}
              aria-label="Customize columns"
              className={styles.columnControlButton}
            />
          </th>
        )}
      </tr>
    </thead>
  );
}

// Helper to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

DataTableHeader.displayName = 'DataTableHeader';
