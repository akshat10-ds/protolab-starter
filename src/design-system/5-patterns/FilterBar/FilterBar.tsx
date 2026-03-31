/**
 * FilterBar Pattern
 *
 * A horizontal action bar for filtering and searching data tables.
 * Typically placed above a DataTable to provide view selection, search,
 * and filter controls.
 *
 * @example
 * ```tsx
 * <FilterBar
 *   viewSelector={
 *     <Dropdown items={viewItems}>
 *       <Button kind="secondary" size="small" endElement={<Icon name="chevron-down" />}>
 *         Documents
 *       </Button>
 *     </Dropdown>
 *   }
 *   search={{
 *     value: searchValue,
 *     onChange: setSearchValue,
 *     placeholder: 'Try keywords, phrases, or a question',
 *   }}
 *   quickActions={[
 *     <IconButton key="bookmark" icon="bookmark" variant="secondary" size="small" />
 *   ]}
 *   filters={
 *     <Button kind="secondary" size="small" startElement={<Icon name="filter" />}>
 *       Filters
 *     </Button>
 *   }
 * />
 * ```
 */

import React from 'react';
import { Divider } from '../../3-primitives/Divider';
import { SearchInput } from '../../4-composites/SearchInput';
import styles from './FilterBar.module.css';

export interface FilterBarSearchConfig {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Callback when search is submitted (Enter key) */
  onSubmit?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Search suggestions */
  suggestions?: Array<{ id: string; label: string }>;
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: { id: string; label: string }) => void;
}

export interface FilterBarProps {
  /**
   * View selector element (typically a Dropdown with Button trigger)
   * Appears at the left of the filter bar
   */
  viewSelector?: React.ReactNode;

  /**
   * Search input configuration
   * If provided, renders a SearchInput with the specified props
   */
  search?: FilterBarSearchConfig;

  /**
   * Quick action elements (typically IconButtons)
   * Rendered after the search input
   */
  quickActions?: React.ReactNode[];

  /**
   * Filters element (typically a Button or Dropdown)
   * Appears at the right of the filter bar
   */
  filters?: React.ReactNode;

  /**
   * Show visual indicator on search input (like Navigator's blue dot)
   * Indicates AI-powered or special search capability
   */
  showSearchIndicator?: boolean;

  /**
   * Gap between elements
   * @default "small"
   */
  gap?: 'small' | 'medium';

  /** Additional class name */
  className?: string;

  /** Data QA attribute for testing */
  'data-qa'?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  viewSelector,
  search,
  quickActions,
  filters,
  showSearchIndicator = false,
  gap = 'small',
  className,
  'data-qa': dataQa,
}) => {
  const classes = [styles.filterBar, className].filter(Boolean).join(' ');

  return (
    <div data-ink-component="FilterBar" className={classes} data-qa={dataQa} data-gap={gap}>
      {/* View Selector */}
      {viewSelector && <div className={styles.viewSelector}>{viewSelector}</div>}

      {/* Divider between view selector and search */}
      {viewSelector && search && (
        <div className={styles.dividerWrapper}>
          <Divider orientation="vertical" />
        </div>
      )}

      {/* Search Input */}
      {search && (
        <div className={styles.searchWrapper}>
          {showSearchIndicator && <div className={styles.searchIndicator} />}
          <SearchInput
            placeholder={search.placeholder || 'Search...'}
            value={search.value}
            onChange={search.onChange}
            onSearch={search.onSubmit ? () => search.onSubmit?.() : undefined}
            suggestions={search.suggestions}
            onSuggestionSelect={search.onSuggestionSelect}
            size="small"
            className={styles.searchInput}
          />
        </div>
      )}

      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <div className={styles.quickActions}>
          {quickActions.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
        </div>
      )}

      {/* Filters */}
      {filters && <div className={styles.filters}>{filters}</div>}
    </div>
  );
};

FilterBar.displayName = 'FilterBar';
