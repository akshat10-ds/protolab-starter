import React from 'react';
import { Icon } from '../../3-primitives';
import { cn } from '@/lib/utils';
import styles from './Chip.module.css';

export interface ChipProps {
  /** The text content of the chip */
  children: React.ReactNode;
  /** Optional element to display before the text (e.g., Avatar, Icon) */
  startElement?: React.ReactNode;
  /** Show the close/remove button */
  onRemove?: () => void;
  /** Click handler for the chip */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Selected state for selectable chips */
  selected?: boolean;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ children, startElement, onRemove, onClick, className, disabled = false, selected = false }, ref) => {
    const isClickable = !disabled && (onClick || onRemove);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onClick?.(e);
    };

    const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (disabled) return;
      onRemove?.();
    };

    return (
      <div
        data-ink-component="Chip"
        ref={ref}
        className={cn(
          styles.chip,
          isClickable && styles.clickable,
          disabled && styles.disabled,
          selected && styles.selected,
          className
        )}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(e as any);
          }
        }}
      >
        {startElement && <span className={styles.startElement}>{startElement}</span>}

        <span className={styles.text}>{children}</span>

        {onRemove && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemoveClick}
            disabled={disabled}
            aria-label="Remove"
          >
            <Icon name="close" size="small" />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';
