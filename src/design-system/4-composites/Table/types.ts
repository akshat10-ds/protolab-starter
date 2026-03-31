import React from 'react';

// ============================================================================
// Base Types
// ============================================================================

export type TableSize = 'small' | 'medium' | 'large';
export type TableVariant = 'default' | 'bordered' | 'striped';
export type TableAlign = 'left' | 'center' | 'right';
export type SortDirection = 'asc' | 'desc' | null;

/** Column visibility state: true (visible), false (hidden), 'locked' (visible, cannot toggle) */
export type ColumnVisibility = boolean | 'locked';

// ============================================================================
// Column Definition
// ============================================================================

export interface TableColumn<T = any> {
  /** Unique key for the column */
  key: string;
  /** Display header for the column */
  header: React.ReactNode;
  /** Width of the column (CSS value) */
  width?: string;
  /** Text alignment */
  align?: TableAlign;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom cell render function (Figma pattern) - receives the row */
  cell?: (row: T) => React.ReactNode;
  /** Custom render function for cell (legacy pattern) - receives value, row, and index */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;
  /** Column visibility (true | false | 'locked') - defaults to true */
  isVisible?: ColumnVisibility;
  /** Column order for reordering (lower = earlier) */
  order?: number;
  /** Lock column to start or end position (won't appear in column control) */
  fixedPosition?: 'start' | 'end';
  /** Tooltip text for column header */
  headerTooltip?: string;
}

// ============================================================================
// Pagination Configuration
// ============================================================================

export interface TablePaginationConfig {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Available page size options (default: [5, 10, 25, 50]) */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Pagination variant */
  variant?: 'default' | 'simple';
  /** Show page info text (e.g., "1-25 of 100") */
  showInfo?: boolean;
}

// ============================================================================
// Action Bar Types
// ============================================================================

export interface TableAction {
  /** Action label/text */
  label: string;
  /** Icon name (from Icon component) */
  icon?: string;
  /** Click handler - receives set of selected row keys */
  onClick: (selectedRows: Set<string | number>) => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  /** Whether action is disabled */
  disabled?: boolean;
  /** Optional dropdown items for action menu */
  dropdownItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: string;
    disabled?: boolean;
  }>;
}

// ============================================================================
// Column Control Types
// ============================================================================

export interface ColumnControlSaveData<T = any> {
  /** Updated columns with visibility and order changes */
  columns: TableColumn<T>[];
  /** Map of column keys to visibility changes */
  visibilityChanges: Map<string, boolean>;
  /** Map of column keys to new order positions */
  orderChanges: Map<string, number>;
}

// ============================================================================
// Table Props
// ============================================================================

export interface TableProps<T = any> {
  // -------------------------------------------------------------------------
  // Core Props (existing)
  // -------------------------------------------------------------------------

  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Visual variant */
  variant?: TableVariant;
  /** Size variant */
  size?: TableSize;
  /** Whether to show row hover state */
  hoverable?: boolean;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: React.ReactNode;
  /** Whether table is responsive (stacks on mobile) */
  responsive?: boolean;
  /** Additional className */
  className?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrollable table */
  maxHeight?: string;

  // -------------------------------------------------------------------------
  // Selection Props (existing)
  // -------------------------------------------------------------------------

  /** Whether rows are selectable */
  selectable?: boolean;
  /** Selected row keys (controlled) */
  selectedRows?: Set<string | number>;
  /** Callback when selection changes */
  onSelectionChange?: (selected: Set<string | number>) => void;
  /** Row key extractor */
  getRowKey?: (row: T, index: number) => string | number;

  // -------------------------------------------------------------------------
  // Sorting Props (existing)
  // -------------------------------------------------------------------------

  /** Currently sorted column key */
  sortColumn?: string;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSortChange?: (column: string, direction: SortDirection) => void;

  // -------------------------------------------------------------------------
  // Column Control Props (NEW)
  // -------------------------------------------------------------------------

  /** Show column control icon in header */
  showColumnControl?: boolean;
  /** Callback when columns are saved from column control modal */
  onColumnControlSave?: (data: ColumnControlSaveData<T>) => void;
  /** Initial column definitions for reset functionality */
  initialColumns?: TableColumn<T>[];

  // -------------------------------------------------------------------------
  // Action Bar Props (NEW)
  // -------------------------------------------------------------------------

  /** Actions to show in selection action bar */
  selectionActions?: TableAction[];
  /** Custom content for the action bar (replaces default actions) */
  actionBarContent?: React.ReactNode;

  // -------------------------------------------------------------------------
  // Pagination Props (NEW)
  // -------------------------------------------------------------------------

  /** Pagination configuration */
  pagination?: TablePaginationConfig;

  // -------------------------------------------------------------------------
  // Favorite Column Props (NEW - Optional)
  // -------------------------------------------------------------------------

  /** Enable favorite/star column */
  showFavoriteColumn?: boolean;
  /** Set of favorited row keys */
  favoriteRows?: Set<string | number>;
  /** Callback when favorite state changes */
  onFavoriteChange?: (rowKey: string | number, isFavorite: boolean) => void;

  // -------------------------------------------------------------------------
  // Testing Props
  // -------------------------------------------------------------------------

  /** Data QA attribute for testing */
  'data-qa'?: string;
}

// ============================================================================
// Sub-component Props
// ============================================================================

export interface TableActionBarProps {
  /** Number of selected rows */
  selectedCount: number;
  /** Actions to display */
  actions: TableAction[];
  /** Custom content (replaces actions) */
  customContent?: React.ReactNode;
  /** Whether the bar is visible */
  visible: boolean;
  /** Selected row keys (for action callbacks) */
  selectedRows: Set<string | number>;
}

export interface TableColumnControlProps<T = any> {
  /** Whether modal is open */
  open: boolean;
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Initial columns for reset */
  initialColumns?: TableColumn<T>[];
  /** Save callback */
  onSave: (columns: TableColumn<T>[]) => void;
  /** Cancel callback */
  onCancel: () => void;
}

export interface TablePaginationProps {
  /** Pagination configuration */
  config: TablePaginationConfig;
  /** Whether pagination is disabled */
  disabled?: boolean;
  /** Data QA attribute */
  'data-qa'?: string;
}
