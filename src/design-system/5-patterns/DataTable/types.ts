/**
 * DataTable Types - Production Match
 *
 * Type definitions for the DataTable pattern that exactly matches
 * the DocuSign Navigator production table.
 */

import type { ReactNode } from 'react';

// =============================================================================
// Core Types
// =============================================================================

export type DataTableRowHeight = 'compact' | 'default' | 'tall';
export type DataTableAlignment = 'left' | 'center' | 'right';
export type DataTableSortDirection = 'ascending' | 'descending' | null;
export type ColumnVisibility = boolean | 'locked';

// =============================================================================
// Column Definition
// =============================================================================

export interface DataTableColumn<T = any> {
  /** Unique column identifier */
  key: string;

  /** Column header text or element */
  header: string | ReactNode;

  /** Custom cell renderer - receives the entire row */
  cell?: (row: T) => ReactNode;

  /** Alternative render function - receives value, row, and index */
  render?: (value: any, row: T, rowIndex: number) => ReactNode;

  /** Column width (CSS value) */
  width?: string;

  /** Column max width (CSS value) */
  maxWidth?: string;

  /** Text alignment */
  alignment?: DataTableAlignment;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Custom sort value extractor */
  sortValue?: (row: T) => string | number;

  /** Start with descending sort instead of ascending */
  startWithDescending?: boolean;

  /** Column visibility - true, false, or 'locked' (always visible) */
  isVisible?: ColumnVisibility;

  /** Column order for display */
  order?: number;

  /** Fixed position in column control (can't be reordered) */
  fixedPosition?: 'start' | 'end';

  /** Additional CSS class for this column's cells */
  className?: string;

  /** Tooltip for header */
  headerTooltip?: string;

  /** Make this column sticky (fixed position on horizontal scroll) */
  sticky?: boolean;
}

// =============================================================================
// Action Types
// =============================================================================

export interface DataTableAction {
  /** Unique action identifier */
  id: string;

  /** Action label */
  label: string;

  /** Icon name */
  icon?: string;

  /** Click handler - receives selected row keys */
  onClick: (selectedRows: Set<string | number>) => void;

  /** Whether action is disabled */
  disabled?: boolean;

  /** Action variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
}

// =============================================================================
// Pagination Config
// =============================================================================

export type PageSizeOption = 5 | 10 | 25 | 50;

export interface DataTablePaginationConfig {
  /** Current page (1-indexed) */
  page: number;

  /** Items per page */
  pageSize: PageSizeOption;

  /** Total number of items */
  totalItems: number;

  /** Page change handler */
  onPageChange: (page: number) => void;

  /** Page size change handler */
  onPageSizeChange: (size: PageSizeOption) => void;

  /** Pagination variant */
  variant?: 'default' | 'simple';

  /** Show page info (e.g., "1-25 of 100") */
  showInfo?: boolean;

  /** Disable pagination controls */
  disabled?: boolean;
}

// =============================================================================
// Main DataTable Props
// =============================================================================

export interface DataTableProps<T = any> {
  // Data
  /** Column definitions */
  columns: DataTableColumn<T>[];

  /** Data rows */
  data: T[];

  /** Function to get unique key for each row */
  getRowKey: (row: T, index: number) => string | number;

  // Appearance
  /** Row height variant */
  rowHeight?: DataTableRowHeight;

  /** Additional CSS class */
  className?: string;

  /** Test automation ID */
  'data-qa'?: string;

  // Selection
  /** Enable row selection */
  selectable?: boolean;

  /** Controlled selected rows */
  selectedRows?: Set<string | number>;

  /** Selection change handler */
  onSelectionChange?: (selection: Set<string | number>) => void;

  // Sorting
  /** Currently sorted column key */
  sortColumn?: string;

  /** Current sort direction */
  sortDirection?: DataTableSortDirection;

  /** Sort change handler */
  onSortChange?: (column: string, direction: DataTableSortDirection) => void;

  // Column Control
  /** Show column control button */
  showColumnControl?: boolean;

  /** Initial column configuration (for reset) */
  initialColumns?: DataTableColumn<T>[];

  /** Column control save handler */
  onColumnControlSave?: (columns: DataTableColumn<T>[]) => void;

  // Action Bar
  /** Actions to show when rows are selected */
  selectionActions?: DataTableAction[];

  /** Custom action bar content */
  actionBarContent?: ReactNode;

  // Pagination
  /** Pagination configuration */
  pagination?: DataTablePaginationConfig;

  // States
  /** Loading state */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: ReactNode;

  // Row Events
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;

  /** Render function for row actions (appears in column control cell, aligned with header icon) */
  renderRowActions?: (row: T, rowIndex: number) => ReactNode;

  // Sticky Behavior
  /** Sticky header */
  stickyHeader?: boolean;

  /** Sticky footer */
  stickyFooter?: boolean;
}

// =============================================================================
// Sub-Component Props
// =============================================================================

export interface DataTableHeaderProps<T = any> {
  columns: DataTableColumn<T>[];
  selectable?: boolean;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  onSelectAll?: () => void;
  sortColumn?: string;
  sortDirection?: DataTableSortDirection;
  onSort?: (columnKey: string) => void;
  showColumnControl?: boolean;
  onColumnControlClick?: () => void;
  stickyHeader?: boolean;
}

export interface DataTableBodyProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  rowHeight?: DataTableRowHeight;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onRowSelect?: (rowKey: string | number) => void;
  onRowClick?: (row: T, index: number) => void;
  showColumnControl?: boolean;
  /** Render function for row actions (appears in column control cell) */
  renderRowActions?: (row: T, rowIndex: number) => ReactNode;
}

export interface DataTableRowProps<T = any> {
  row: T;
  rowIndex: number;
  rowKey: string | number;
  columns: DataTableColumn<T>[];
  rowHeight?: DataTableRowHeight;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  showColumnControl?: boolean;
  /** Content to render in the column control cell */
  rowActions?: ReactNode;
}

export interface DataTableCellProps<T = any> {
  column: DataTableColumn<T>;
  row: T;
  rowIndex: number;
  value: any;
  /** Left offset for sticky columns (calculated from previous sticky columns) */
  stickyLeft?: number;
}

export interface DataTableFooterProps {
  pagination: DataTablePaginationConfig;
  disabled?: boolean;
  stickyFooter?: boolean;
}

export interface DataTableActionBarProps {
  selectedCount: number;
  actions: DataTableAction[];
  customContent?: ReactNode;
  visible: boolean;
  selectedRows: Set<string | number>;
}

export interface DataTableColumnControlProps<T = any> {
  open: boolean;
  columns: DataTableColumn<T>[];
  initialColumns?: DataTableColumn<T>[];
  onSave: (columns: DataTableColumn<T>[]) => void;
  onCancel: () => void;
}
