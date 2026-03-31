import React from 'react';
import styles from './DataTable.module.css';
import { Checkbox } from '../../3-primitives/Checkbox';
import { DataTableCell } from './DataTableCell';
import type { DataTableRowProps } from './types';

/**
 * DataTableRow - Individual table row
 *
 * Renders a row with optional selection checkbox, data cells,
 * and proper hover/selected styling matching production.
 */
export function DataTableRow<T = any>({
  row,
  rowIndex,
  rowKey,
  columns,
  rowHeight = 'default',
  selectable = false,
  isSelected = false,
  onSelect,
  onClick,
  showColumnControl = false,
  rowActions,
}: DataTableRowProps<T>) {
  // Handle checkbox click (stop propagation to prevent row click)
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle row click
  const handleRowClick = () => {
    onClick?.();
  };

  // Build row classes
  const rowClasses = [
    styles.tr,
    styles[`row${capitalize(rowHeight)}`],
    isSelected ? styles.selected : '',
    onClick ? styles.clickable : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Calculate sticky left positions for each column
  const getStickyLeft = (columnIndex: number): number | undefined => {
    const column = columns[columnIndex];
    if (!column.sticky) return undefined;

    // Start with checkbox width if selectable
    let left = selectable ? 56 : 0;

    // Add widths of all previous sticky columns
    for (let i = 0; i < columnIndex; i++) {
      if (columns[i].sticky && columns[i].isVisible !== false) {
        const width = columns[i].width;
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
    <tr className={rowClasses} onClick={handleRowClick}>
      {/* Selection checkbox */}
      {selectable && (
        <td className={`${styles.td} ${styles.checkboxCell}`}>
          <Checkbox
            label={`Select row ${rowIndex + 1}`}
            hideLabel
            checked={isSelected}
            onChange={() => onSelect?.()}
            onClick={handleCheckboxClick}
          />
        </td>
      )}

      {/* Data cells */}
      {columns.map((column, columnIndex) => {
        if (column.isVisible === false) return null;

        const value = (row as any)[column.key];

        return (
          <DataTableCell
            key={column.key}
            column={column}
            row={row}
            rowIndex={rowIndex}
            value={value}
            stickyLeft={getStickyLeft(columnIndex)}
          />
        );
      })}

      {/* Column control cell - renders row actions if provided */}
      {showColumnControl && (
        <td className={`${styles.td} ${styles.columnControlCell}`}>
          {rowActions}
        </td>
      )}
    </tr>
  );
}

// Helper to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

DataTableRow.displayName = 'DataTableRow';
