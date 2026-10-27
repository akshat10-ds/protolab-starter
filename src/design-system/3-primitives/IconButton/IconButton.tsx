import React, { forwardRef } from 'react';
import { Icon } from '../Icon';
import { AlertBadge } from '../AlertBadge';
import styles from './IconButton.module.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon name from the icon set */
  icon: string;
  /** Button variant/kind */
  variant?: 'primary' | 'brand' | 'secondary' | 'tertiary' | 'danger';
  /** Button size */
  size?: 'small' | 'medium';
  /** Optional alert dot, or a numeric alert count. */
  badge?: boolean | number;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label for the button */
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'tertiary',
      size = 'medium',
      disabled = false,
      badge = false,
      className,
      ...props
    },
    ref
  ) => {
    const buttonClasses = [
      styles.iconButton,
      styles[variant],
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        data-ink-component="IconButton"
        data-ink-prop-kind={variant}
        data-ink-prop-size={size}
        ref={ref}
        type="button"
        className={buttonClasses}
        disabled={disabled}
        {...props}
      >
        <Icon name={icon} size={size === 'small' ? 20 : 24} />
        {badge !== false && <span className={styles.badge}><AlertBadge dot={badge === true} value={typeof badge === 'number' ? badge : undefined} /></span>}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
