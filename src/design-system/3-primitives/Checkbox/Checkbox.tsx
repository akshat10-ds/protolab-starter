import React, { forwardRef, useEffect, useRef, useState } from 'react';
import styles from './Checkbox.module.css';
import { Icon } from '../Icon';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The checkbox label text */
  label: string;
  /** Whether the checkbox is in an error state (Figma: Error) */
  error?: boolean;
  /** Error message text to display */
  errorMessage?: string;
  /** Description/helper text */
  description?: string;
  /** Whether to show the label (Figma: showLabel) */
  showLabel?: boolean;
  /** Whether to show the error message (Figma: showErrorMessage) */
  showErrorMessage?: boolean;
  /** Indeterminate state for partial selection (Figma: indeterminate) */
  indeterminate?: boolean;
  /** Element to display before the label (Figma: startElement) */
  startElement?: React.ReactNode;
  /** Element to display after the label (Figma: endElement) */
  endElement?: React.ReactNode;
  /** @deprecated Use showLabel={false} instead */
  hideLabel?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error = false,
      errorMessage,
      description,
      showLabel = true,
      showErrorMessage = true,
      indeterminate = false,
      startElement,
      endElement,
      hideLabel, // deprecated - for backward compatibility
      className,
      id,
      disabled,
      checked,
      defaultChecked,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;
    const descriptionId = `${checkboxId}-description`;
    const internalRef = useRef<HTMLInputElement>(null);

    // Track internal checked state for uncontrolled usage
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);

    // Use controlled value if provided, otherwise use internal state
    const isChecked = isControlled ? checked : internalChecked;

    // Handle deprecated hideLabel prop
    const labelVisible = hideLabel !== undefined ? !hideLabel : showLabel;

    React.useImperativeHandle(ref, () => internalRef.current!);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Handle change for both controlled and uncontrolled modes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
    };

    const hasError = error || !!errorMessage;
    const showError = hasError && showErrorMessage && errorMessage;

    const ariaDescribedBy = [showError ? errorId : null, description ? descriptionId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="Checkbox" className={styles.wrapper}>
        <div className={styles.checkboxWrapper}>
          {/* Hidden input - visually hidden but accessible */}
          <input
            ref={internalRef}
            id={checkboxId}
            type="checkbox"
            className={styles.input}
            aria-describedby={ariaDescribedBy || undefined}
            aria-invalid={hasError ? true : undefined}
            disabled={disabled}
            checked={isControlled ? checked : undefined}
            defaultChecked={!isControlled ? defaultChecked : undefined}
            onChange={handleChange}
            {...props}
          />

          {/* Label with visual checkbox */}
          <label
            htmlFor={checkboxId}
            className={`${styles.label} ${!labelVisible ? styles.visuallyHidden : ''} ${
              disabled ? styles.disabled : ''
            } ${hasError ? styles.error : ''} ${isChecked ? styles.checked : ''} ${
              indeterminate ? styles.indeterminate : ''
            }`}
          >
            {/* Checkbox icon container */}
            <span className={styles.checkboxIcon}>
              {isChecked && !indeterminate && (
                <Icon name="check" size="small" className={styles.checkIcon} />
              )}
              {indeterminate && <Icon name="minus" size="small" className={styles.minusIcon} />}
            </span>

            <span className={styles.labelContent}>
              {startElement && <span className={styles.startElement}>{startElement}</span>}
              <span className={styles.labelText}>{label}</span>
              {endElement && <span className={styles.endElement}>{endElement}</span>}
            </span>
          </label>
        </div>

        {description && !hasError && (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        )}

        {showError && (
          <div id={errorId} className={styles.errorMessage}>
            <Icon name="status-error" size="small" className={styles.errorIcon} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
