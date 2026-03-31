import * as React from 'react';
import { Icon } from '../../3-primitives/Icon';
import { cn } from '@/lib/utils';
import styles from './ComboButton.module.css';

export type ComboButtonVariant = 'brand' | 'primary' | 'secondary' | 'tertiary';
export type ComboButtonSize = 'small' | 'medium';

export interface ComboButtonProps {
  /** The variant/kind of the ComboButton */
  variant?: ComboButtonVariant;
  /** Size of the combo button */
  size?: ComboButtonSize;
  /** Main button text (ignored for tertiary which is icon-only) */
  children?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler for main button */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Click handler for dropdown trigger */
  onDropdownClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Icon to display in main button (required for tertiary variant) */
  startIcon?: string;
  /** Custom className */
  className?: string;
  /** Compact mode (icon-only). Note: tertiary variant is always compact per Figma spec */
  compact?: boolean;
  /** Inverts colors for dark backgrounds */
  inverted?: boolean;
}

export const ComboButton = React.forwardRef<HTMLDivElement, ComboButtonProps>(
  (
    {
      variant = 'brand',
      size = 'medium',
      children,
      disabled = false,
      onClick,
      onDropdownClick,
      startIcon,
      className,
      compact: compactProp = false,
      inverted = false,
    },
    ref
  ) => {
    // Tertiary variant is always compact (icon-only) per Figma spec
    const compact = variant === 'tertiary' ? true : compactProp;

    const wrapperClasses = cn(
      styles.comboButton,
      styles[variant],
      styles[size],
      disabled && styles.disabled,
      compact && styles.compact,
      inverted && styles.inverted,
      className
    );

    const mainButtonClasses = cn(styles.mainButton, styles[variant], styles[size]);

    const dropdownButtonClasses = cn(styles.dropdownButton, styles[variant], styles[size]);

    return (
      <div data-ink-component="ComboButton" data-ink-prop-kind={variant} data-ink-prop-size={size} ref={ref} className={wrapperClasses}>
        <button type="button" className={mainButtonClasses} onClick={onClick} disabled={disabled}>
          {startIcon && !compact && (
            <Icon name={startIcon} size={size === 'small' ? 'small' : 'medium'} />
          )}
          {compact && startIcon ? (
            <Icon name={startIcon} size={size === 'small' ? 'small' : 'medium'} />
          ) : (
            <span className={styles.text}>{children}</span>
          )}
        </button>
        <button
          type="button"
          className={dropdownButtonClasses}
          onClick={onDropdownClick}
          disabled={disabled}
          aria-label="Show options"
        >
          <Icon name="chevron-down" size="small" />
        </button>
      </div>
    );
  }
);

ComboButton.displayName = 'ComboButton';
