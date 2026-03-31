import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Pagination.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export type PaginationMode = 'full' | 'simple';

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Display mode */
  mode?: PaginationMode;
  /** Show items per page selector */
  showItemsPerPage?: boolean;
  /** Items per page options */
  itemsPerPageOptions?: number[];
  /** Current items per page */
  itemsPerPage?: number;
  /** Callback when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Max page buttons to show (only in full mode) */
  maxPageButtons?: number;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  mode = 'full',
  showItemsPerPage = false,
  itemsPerPageOptions = [10, 25, 50, 100],
  itemsPerPage = 10,
  onItemsPerPageChange,
  maxPageButtons = 7,
  showFirstLast = true,
  disabled = false,
  className,
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  const renderPageButtons = () => {
    if (totalPages <= maxPageButtons) {
      // Show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={cn(
            styles.pageButton,
            page === currentPage && styles.active
          )}
          onClick={() => handlePageChange(page)}
          disabled={disabled}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ));
    }

    // Show truncated pages
    const pages: (number | string)[] = [];
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    // Always show first page
    pages.push(1);

    if (showLeftDots) {
      pages.push('left-dots');
    }

    // Show pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (showRightDots) {
      pages.push('right-dots');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (typeof page === 'string') {
        return (
          <span key={page} className={styles.dots}>
            ...
          </span>
        );
      }

      return (
        <button
          key={page}
          type="button"
          className={cn(
            styles.pageButton,
            page === currentPage && styles.active
          )}
          onClick={() => handlePageChange(page)}
          disabled={disabled}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div data-ink-component="Pagination" className={cn(styles.container, className)}>
      <nav className={cn(styles.pagination, disabled && styles.disabled)} aria-label="Pagination">
        {mode === 'simple' ? (
          <>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={disabled || !canGoPrevious}
              aria-label="Previous page"
            >
              <Icon name="chevron-left" size="small" />
              <span>Previous</span>
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={disabled || !canGoNext}
              aria-label="Next page"
            >
              <span>Next</span>
              <Icon name="chevron-right" size="small" />
            </button>
          </>
        ) : (
          <>
            {showFirstLast && (
              <IconButton
                icon="chevron-left"
                size="small"
                variant="tertiary"
                onClick={() => handlePageChange(1)}
                disabled={disabled || !canGoPrevious}
                aria-label="First page"
              />
            )}
            <IconButton
              icon="chevron-left"
              size="small"
              variant="tertiary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={disabled || !canGoPrevious}
              aria-label="Previous page"
            />

            <div className={styles.pages}>{renderPageButtons()}</div>

            <IconButton
              icon="chevron-right"
              size="small"
              variant="tertiary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={disabled || !canGoNext}
              aria-label="Next page"
            />
            {showFirstLast && (
              <IconButton
                icon="chevron-right"
                size="small"
                variant="tertiary"
                onClick={() => handlePageChange(totalPages)}
                disabled={disabled || !canGoNext}
                aria-label="Last page"
              />
            )}
          </>
        )}
      </nav>

      {showItemsPerPage && (
        <div className={styles.itemsPerPage}>
          <label htmlFor="items-per-page" className={styles.label}>
            Items per page:
          </label>
          <select
            id="items-per-page"
            className={styles.select}
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
            disabled={disabled}
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

Pagination.displayName = 'InkPagination';

export { Pagination };
