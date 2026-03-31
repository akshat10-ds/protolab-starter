import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Breadcrumb.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export interface BreadcrumbItem {
  /** Label for the breadcrumb */
  label: string;
  /** URL to navigate to (optional - items without href are text-only) */
  href?: string;
  /** Is this the current page (styled with medium weight, no hover/active) */
  current?: boolean;
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon as first item instead of text */
  rootIcon?: boolean;
  /** Show or hide the current page item */
  showCurrentPage?: boolean;
  /** Enable overflow menu - collapses to: Root > ... > Current (max 3 items) */
  overflowMenu?: boolean;
  /** Additional className */
  className?: string;
  /** Callback when item is clicked */
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
  /** Callback when overflow menu is clicked */
  onOverflowClick?: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  rootIcon = false,
  showCurrentPage = true,
  overflowMenu = false,
  className,
  onItemClick,
  onOverflowClick,
}) => {
  // Separator is always chevron-right per Figma spec
  const renderSeparator = (key: string | number) => (
    <span className={styles.separator} key={`sep-${key}`} aria-hidden="true">
      <Icon name="chevron-right" size="small" />
    </span>
  );

  const renderItems = () => {
    // Guard against undefined or empty items
    if (!items || items.length === 0) {
      return null;
    }

    // Filter out current page if showCurrentPage is false
    let displayItems = showCurrentPage
      ? [...items]
      : items.filter((item, idx) => idx !== items.length - 1 && !item.current);

    // Overflow menu mode: Root > Overflow Icon > Current Page (max 3 crumbs per Figma)
    if (overflowMenu && displayItems.length > 2) {
      const firstItem = displayItems[0];
      const lastItem = displayItems[displayItems.length - 1];

      return (
        <>
          <React.Fragment key="first-item">
            {renderItem(firstItem, 0, false)}
            {renderSeparator(0)}
          </React.Fragment>

          <React.Fragment key="overflow">
            <li className={styles.item}>
              <IconButton
                icon="overflow-horizontal"
                size="small"
                kind="tertiary"
                aria-label="Show more breadcrumbs"
                onClick={onOverflowClick}
                className={styles.overflowButton}
              />
            </li>
            {renderSeparator('overflow')}
          </React.Fragment>

          <React.Fragment key="current">
            {renderItem(lastItem, displayItems.length - 1, true)}
          </React.Fragment>
        </>
      );
    }

    return displayItems.map((item, index) => {
      const isLast = index === displayItems.length - 1;
      const isCurrent = item.current || isLast;

      return (
        <React.Fragment key={`${item.label}-${index}`}>
          {renderItem(item, index, isCurrent)}
          {!isLast && renderSeparator(index)}
        </React.Fragment>
      );
    });
  };

  const renderItem = (item: BreadcrumbItem, index: number, isCurrent: boolean) => {
    const isFirst = index === 0;
    const showAsRootIcon = rootIcon && isFirst;

    const handleClick = (e: React.MouseEvent) => {
      if (onItemClick && !isCurrent) {
        e.preventDefault();
        onItemClick(item, index);
      }
    };

    // Root icon for first item (home/folder icon per Figma)
    if (showAsRootIcon) {
      return (
        <li className={styles.item}>
          <IconButton
            icon="folder"
            size="small"
            kind="tertiary"
            aria-label={item.label}
            onClick={handleClick}
            className={styles.rootIconButton}
            href={item.href}
          />
        </li>
      );
    }

    // Regular item - current page has medium weight, no hover/active states
    return (
      <li className={styles.item}>
        {item.href && !isCurrent ? (
          <a href={item.href} className={styles.link} onClick={handleClick}>
            <span className={styles.itemText}>{item.label}</span>
          </a>
        ) : (
          <span
            className={cn(styles.text, isCurrent && styles.current)}
            aria-current={isCurrent ? 'page' : undefined}
          >
            <span className={styles.itemText}>{item.label}</span>
          </span>
        )}
      </li>
    );
  };

  return (
    <nav data-ink-component="Breadcrumb" aria-label="Breadcrumb" className={cn(styles.breadcrumb, className)}>
      <ol className={styles.list}>{renderItems()}</ol>
    </nav>
  );
};

Breadcrumb.displayName = 'InkBreadcrumb';

export { Breadcrumb };
