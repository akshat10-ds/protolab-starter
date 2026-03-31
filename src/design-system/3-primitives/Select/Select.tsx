import React, { forwardRef } from 'react';
import styles from './Select.module.css';
import { Icon } from '../Icon';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  error?: string;
  description?: string;
  hideLabel?: boolean;
  required?: boolean;
  size?: 'small' | 'medium';
  width?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      description,
      hideLabel = false,
      required = false,
      size = 'medium',
      width,
      className,
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const descriptionId = `${selectId}-description`;

    const ariaDescribedBy = [
      error ? errorId : null,
      description ? descriptionId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const selectClasses = [
      styles.select,
      styles[size],
      error && styles.error,
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="Select" data-ink-prop-size={size} className={styles.wrapper} style={{ width }}>
        <label
          htmlFor={selectId}
          className={`${styles.label} ${hideLabel ? styles.visuallyHidden : ''} ${
            disabled ? styles.disabled : ''
          }`}
        >
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>

        {description && !error && (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        )}

        <div className={styles.selectContainer}>
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            aria-describedby={ariaDescribedBy || undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            disabled={disabled}
            {...props}
          >
            {children}
          </select>
          <div className={styles.icon}>
            <Icon name="chevron-down" size="small" />
          </div>
        </div>

        {error && (
          <div id={errorId} className={styles.errorMessage}>
            <span className={styles.errorIcon}>
              <Icon name="status-error" size="small" />
            </span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
