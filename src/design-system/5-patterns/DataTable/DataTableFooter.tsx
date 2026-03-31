import React from 'react';
import styles from './DataTableFooter.module.css';
import { Select } from '../../3-primitives/Select';
import { IconButton } from '../../3-primitives/IconButton';
import type { DataTableFooterProps, PageSizeOption } from './types';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

/**
 * DataTableFooter - Pagination controls
 *
 * Renders page size selector, page info, and navigation buttons.
 * Matches production pagination layout exactly.
 */
export function DataTableFooter({
  pagination,
  disabled = false,
  stickyFooter = false,
}: DataTableFooterProps) {
  const {
    page,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    variant = 'default',
    showInfo = true,
  } = pagination;

  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Navigation handlers
  const handlePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(e.target.value, 10) as PageSizeOption);
  };

  const footerClasses = [
    styles.footer,
    variant === 'simple' ? styles.simple : '',
    stickyFooter ? styles.sticky : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={footerClasses}>
      {/* Left side - Page size selector */}
      <div className={styles.left}>
        <div className={styles.pageSize}>
          <Select
            label="Items per page"
            hideLabel
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            size="small"
            disabled={disabled}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / Page
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Right side - Info and navigation */}
      <div className={styles.right}>
        {/* Page info */}
        {showInfo && totalItems > 0 && (
          <span className={styles.info}>
            {startItem}-{endItem} of {totalItems}
          </span>
        )}

        {/* Navigation */}
        <div className={styles.nav}>
          <IconButton
            icon="chevron-left"
            variant="tertiary"
            size="medium"
            onClick={handlePrevPage}
            disabled={disabled || page <= 1}
            aria-label="Previous page"
          />
          <IconButton
            icon="chevron-right"
            variant="tertiary"
            size="medium"
            onClick={handleNextPage}
            disabled={disabled || page >= totalPages}
            aria-label="Next page"
          />
        </div>
      </div>
    </div>
  );
}

DataTableFooter.displayName = 'DataTableFooter';
