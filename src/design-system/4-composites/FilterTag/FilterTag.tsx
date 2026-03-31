import React from 'react';
import styles from './FilterTag.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export interface FilterTagProps {
  /** Label text */
  label: string;
  /** Whether the filter is active */
  active?: boolean;
  /** Whether the tag can be dismissed/removed */
  dismissible?: boolean;
  /** Whether the tag is disabled */
  disabled?: boolean;
  /** Show dropdown trigger icon */
  showTrigger?: boolean;
  /** Click handler for the tag */
  onClick?: () => void;
  /** Dismiss handler (only used when dismissible=true) */
  onDismiss?: () => void;
  /** Additional className */
  className?: string;
}

export const FilterTag = React.forwardRef<HTMLDivElement, FilterTagProps>(
  (
    {
      label,
      active = false,
      dismissible = false,
      disabled = false,
      showTrigger = true,
      onClick,
      onDismiss,
      className,
    },
    ref
  ) => {
    const containerClasses = [
      styles.filterTag,
      active && styles.active,
      dismissible && styles.dismissible,
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleTagClick = (e: React.MouseEvent) => {
      if (disabled) return;
      onClick?.();
    };

    const handleDismissClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onDismiss?.();
    };

    if (dismissible) {
      return (
        <div data-ink-component="FilterTag" ref={ref} className={containerClasses}>
          <button
            className={styles.tagButton}
            onClick={handleTagClick}
            disabled={disabled}
            type="button"
          >
            <span className={styles.label}>{label}</span>
          </button>
          <IconButton
            icon="close"
            size="small"
            variant="tertiary"
            onClick={handleDismissClick}
            disabled={disabled}
            aria-label="Remove filter"
            className={styles.dismissButton}
          />
        </div>
      );
    }

    return (
      <button
        data-ink-component="FilterTag"
        ref={ref}
        className={containerClasses}
        onClick={handleTagClick}
        disabled={disabled}
        type="button"
      >
        <span className={styles.label}>{label}</span>
        {showTrigger && (
          <Icon name="chevron-down" size="small" className={styles.trigger} />
        )}
      </button>
    );
  }
);

FilterTag.displayName = 'FilterTag';
