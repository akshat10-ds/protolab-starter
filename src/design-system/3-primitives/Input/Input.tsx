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
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
  /** A help control or Tooltip rendered beside the field. */
  inputHelp?: React.ReactNode;
  characterCount?: boolean;
  allowOverLimit?: boolean;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, description, hideLabel = false, required = false, multiline = false,
    rows = 4, size = 'medium', width, startElement, endElement, inputHelp,
    characterCount = false, allowOverLimit = true, className, id, disabled, readOnly,
    value, defaultValue, maxLength, onChange, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;
    const countId = `${inputId}-count`;
    const [uncontrolledCount, setUncontrolledCount] = React.useState(String(defaultValue ?? '').length);
    const count = value !== undefined ? String(value).length : uncontrolledCount;
    const hasCount = characterCount && maxLength !== undefined;
    const ariaDescribedBy = [describedBy, error ? errorId : description ? descriptionId : null, hasCount ? countId : null].filter(Boolean).join(' ') || undefined;
    const setRef = (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (typeof ref === 'function') return ref(element);
      if (ref) ref.current = element;
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setUncontrolledCount(event.currentTarget.value.length);
      onChange?.(event);
    };
    const sharedProps = {
      ...props, id: inputId,
      className: [styles.input, styles[size], multiline && styles.multiline, className].filter(Boolean).join(' '),
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': error ? true : undefined,
      required, disabled, readOnly, value, defaultValue,
      maxLength: allowOverLimit ? undefined : maxLength,
      onChange: handleChange,
    };
    return (
      <div data-ink-component="Input" data-ink-prop-size={size} className={[styles.wrapper, disabled && styles.wrapperDisabled].filter(Boolean).join(' ')} style={{ width }}>
        <label htmlFor={inputId} className={`${styles.label} ${hideLabel ? styles.visuallyHidden : ''}`}>
          {label}{required && <span className={styles.required}> *</span>}
        </label>
        {description && !error && <div id={descriptionId} className={styles.description}>{description}</div>}
        <div className={styles.fieldRow}>
          <div className={[styles.field, styles[size], error && styles.error, readOnly && styles.readOnly, disabled && styles.disabled].filter(Boolean).join(' ')}>
            {startElement && <span className={styles.slot}>{startElement}</span>}
            {multiline ? <textarea {...sharedProps} ref={setRef} rows={rows} /> : <input {...sharedProps} ref={setRef} />}
            {endElement && <span className={styles.slot}>{endElement}</span>}
          </div>
          {inputHelp && <span className={styles.inputHelp}>{inputHelp}</span>}
        </div>
        {hasCount && <div id={countId} className={`${styles.count} ${maxLength !== undefined && count > maxLength ? styles.countError : ''}`}>{count}/{maxLength}</div>}
        {error && <div id={errorId} className={styles.errorMessage}><Icon name="status-error" size="small" /><span>{error}</span></div>}
      </div>
    );
  }
);
Input.displayName = 'Input';
