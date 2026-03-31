import React, { forwardRef } from 'react';
import styles from './Input.module.css';
import { Icon } from '../Icon';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  label: string;
  error?: string;
  description?: string;
  hideLabel?: boolean;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  size?: 'small' | 'medium';
  width?: string;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      error,
      description,
      hideLabel = false,
      required = false,
      multiline = false,
      rows = 4,
      size = 'medium',
      width,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    const ariaDescribedBy = [
      error ? errorId : null,
      description ? descriptionId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      styles.input,
      styles[size],
      error && styles.error,
      disabled && styles.disabled,
      multiline && styles.multiline,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const InputElement = multiline ? 'textarea' : 'input';

    return (
      <div data-ink-component="Input" data-ink-prop-size={size} className={styles.wrapper} style={{ width }}>
        <label
          htmlFor={inputId}
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

        <InputElement
          ref={ref as any}
          id={inputId}
          className={inputClasses}
          aria-describedby={ariaDescribedBy || undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          rows={multiline ? rows : undefined}
          {...(props as any)}
        />

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

Input.displayName = 'Input';
