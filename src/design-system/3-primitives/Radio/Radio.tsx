import React, { forwardRef } from 'react';
import styles from './Radio.module.css';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  description?: string;
  hideLabel?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, description, hideLabel = false, className, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;
    const errorId = `${radioId}-error`;
    const descriptionId = `${radioId}-description`;

    const ariaDescribedBy = [error ? errorId : null, description ? descriptionId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="Radio" className={styles.wrapper}>
        <div className={`${styles.radioWrapper} ${disabled ? styles.disabled : ''}`}>
          {/* Control container for hover background effect */}
          <div className={styles.control}>
            <input
              ref={ref}
              id={radioId}
              type="radio"
              className={`${styles.input} ${className || ''}`}
              aria-describedby={ariaDescribedBy || undefined}
              aria-invalid={error ? true : undefined}
              disabled={disabled}
              {...props}
            />
          </div>
          <label
            htmlFor={radioId}
            className={`${styles.label} ${hideLabel ? styles.visuallyHidden : ''} ${
              disabled ? styles.disabled : ''
            } ${error ? styles.error : ''}`}
          >
            {label}
          </label>
        </div>

        {description && !error && (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        )}

        {error && (
          <div id={errorId} className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
