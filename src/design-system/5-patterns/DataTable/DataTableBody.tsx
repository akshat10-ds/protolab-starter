import React from 'react';
import styles from './DataTable.module.css';
import { DataTableRow } from './DataTableRow';
import type { DataTableBodyProps } from './types';

/**
 * DataTableBody - Table body container
 *
 * Maps data rows to DataTableRow components with proper
 * selection and click handling.
 */
export function DataTableBody<T = any>({
  columns,
  data,
  getRowKey,
  rowHeight = 'default',
  selectable = false,
  selectedRows,
  onRowSelect,
  onRowClick,
  showColumnControl = false,
  renderRowActions,
}: DataTableBodyProps<T>) {
  // Filter to visible columns
  const visibleColumns = columns.filter((col) => col.isVisible !== false);

  return (
    <tbody className={styles.tbody}>
      {data.map((row, rowIndex) => {
        const rowKey = getRowKey(row, rowIndex);
        const isSelected = selectedRows?.has(rowKey) ?? false;

        return (
          <DataTableRow
            key={rowKey}
            row={row}
            rowIndex={rowIndex}
            rowKey={rowKey}
            columns={visibleColumns}
            rowHeight={rowHeight}
            selectable={selectable}
            isSelected={isSelected}
            onSelect={() => onRowSelect?.(rowKey)}
            onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
            showColumnControl={showColumnControl}
            rowActions={renderRowActions?.(row, rowIndex)}
          />
        );
      })}
    </tbody>
  );
}

DataTableBody.displayName = 'DataTableBody';
