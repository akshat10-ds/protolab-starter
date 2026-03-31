import React, { useCallback, useMemo } from 'react';
import styles from './Table.module.css';
import { Select } from '../../3-primitives/Select';
import { IconButton } from '../../3-primitives/IconButton';
import type { TablePaginationProps } from './types';

/**
 * TablePagination - Enhanced pagination footer for the Table component
 *
 * Features:
 * - Page size dropdown (5, 10, 25, 50)
 * - "X / Page" display
 * - "1-25 of 100" info text
 * - Previous/Next navigation
 */
export function TablePagination({
  config,
  disabled = false,
  'data-qa': dataQa,
}: TablePaginationProps) {
  const {
    currentPage,
    pageSize,
    totalItems,
    pageSizeOptions = [5, 10, 25, 50],
    onPageChange,
    onPageSizeChange,
    showInfo = true,
  } = config;

  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = parseInt(e.target.value, 10);
      onPageSizeChange?.(newPageSize);
      // Reset to page 1 when page size changes
      onPageChange(1);
    },
    [onPageSizeChange, onPageChange]
  );

  // Handle navigation
  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  }, [canGoPrevious, currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  }, [canGoNext, currentPage, onPageChange]);

  // Don't render if no items
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={styles.paginationFooter} data-qa={dataQa}>
      {/* Left side - Page size selector */}
      <div className={styles.paginationLeft}>
        <div className={styles.paginationPageSize}>
          <Select
            label="Items per page"
            hideLabel
            size="small"
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            disabled={disabled}
            width="100px"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / Page
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Right side - Info and navigation */}
      <div className={styles.paginationRight}>
        {showInfo && (
          <span className={styles.paginationInfo}>
            {startItem} - {endItem} of {totalItems}
          </span>
        )}

        <div className={styles.paginationNav}>
          <IconButton
            icon="chevron-left"
            variant="tertiary"
            size="small"
            onClick={handlePrevious}
            disabled={disabled || !canGoPrevious}
            aria-label="Previous page"
          />
          <IconButton
            icon="chevron-right"
            variant="tertiary"
            size="small"
            onClick={handleNext}
            disabled={disabled || !canGoNext}
            aria-label="Next page"
          />
        </div>
      </div>
    </div>
  );
}

TablePagination.displayName = 'TablePagination';
