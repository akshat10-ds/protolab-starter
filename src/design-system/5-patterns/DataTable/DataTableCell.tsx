import React from 'react';
import styles from './DataTable.module.css';
import type { DataTableCellProps } from './types';

/**
 * DataTableCell - Individual table cell
 *
 * Renders cell content with proper alignment and styling.
 * Supports custom cell renderers via column.cell or column.render.
 */
export function DataTableCell<T = any>({
  column,
  row,
  rowIndex,
  value,
  stickyLeft,
}: DataTableCellProps<T>) {
  // Determine cell content
  let content: React.ReactNode = value;

  if (column.cell) {
    content = column.cell(row);
  } else if (column.render) {
    content = column.render(value, row, rowIndex);
  }

  // Build class names
  const cellClasses = [
    styles.td,
    column.alignment ? styles[`align${capitalize(column.alignment)}`] : '',
    column.sticky ? styles.stickyColumn : '',
    column.className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td
      className={cellClasses}
      style={{
        width: column.width,
        maxWidth: column.maxWidth,
        ...(column.sticky && stickyLeft !== undefined ? { left: stickyLeft } : {}),
      }}
      data-label={typeof column.header === 'string' ? column.header : undefined}
    >
      {content}
    </td>
  );
}

// Helper to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

DataTableCell.displayName = 'DataTableCell';
