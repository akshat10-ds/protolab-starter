import React, { forwardRef, useRef, useEffect, useState } from 'react';
import styles from './TextArea.module.css';
import { Icon } from '../Icon';

export type ResizeValue = 'both' | 'horizontal' | 'vertical' | 'none';

export interface TextAreaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  /** The text label for the TextArea */
  label: string;
  /** Hide the TextArea label while allowing assistive devices to identify the control */
  hideLabel?: boolean;
  /** Error message to display */
  error?: string;
  /** Description/help text to display */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Number of visible text lines */
  rows?: number;
  /** Control how the textarea can be resized */
  resize?: ResizeValue;
  /** Display character count when maxLength is set */
  characterCount?: boolean;
  /** Allow typing over maxLength (shows warning instead of blocking) */
  allowOverLimit?: boolean;
  /** Vertically expand the TextArea to show all content */
  autoExpand?: boolean;
  /** Maximum height in pixels when autoExpand is enabled */
  autoExpandLimit?: number;
  /** Element rendered at the start of the text field. */
  startElement?: React.ReactNode;
  inputHelp?: React.ReactNode;
  /** Width of the textarea */
  width?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      startElement,
      inputHelp,
      hideLabel = false,
      error,
      description,
      required = false,
      rows = 4,
      resize = 'vertical',
      characterCount = false,
      allowOverLimit = true,
      autoExpand = false,
      autoExpandLimit,
      width,
      className,
      id,
      disabled,
      maxLength,
      value,
      defaultValue,
      'aria-describedby': describedBy,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const descriptionId = `${textareaId}-description`;
    const countId = `${textareaId}-count`;

    const internalRef = useRef<HTMLTextAreaElement>(null);
    const [charCount, setCharCount] = useState(String(defaultValue ?? '').length);

    const ariaDescribedBy = [
      describedBy,
      error ? errorId : null,
      description && !error ? descriptionId : null,
      characterCount && maxLength !== undefined ? countId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const isOverLimit = maxLength !== undefined ? charCount > maxLength : false;

    // Auto-expand functionality
    useEffect(() => {
      if (autoExpand && internalRef.current) {
        const textarea = internalRef.current;
        textarea.style.height = 'auto';
        const newHeight = textarea.scrollHeight;
        const maxHeight = autoExpandLimit || Infinity;
        textarea.style.height = `${Math.min(newHeight, maxHeight)}px`;
      }
    }, [value, charCount, autoExpand, autoExpandLimit]);

    // Track character count
    useEffect(() => {
      if (value !== undefined) {
        setCharCount(String(value).length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setCharCount(newValue.length);

      // Block input if over limit and allowOverLimit is false
      if (maxLength && !allowOverLimit && newValue.length > maxLength) {
        return;
      }

      onChange?.(e);
    };

    const textareaClasses = [
      styles.textarea,
      startElement && styles.hasStartElement,
      styles[`resize-${resize}`],
      error && styles.error,
      disabled && styles.disabled,
      autoExpand && styles.autoExpand,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = [styles.wrapper, disabled && styles.wrapperDisabled]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="TextArea" className={wrapperClasses} style={{ width }}>
        <label
          htmlFor={textareaId}
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

        <div className={styles.fieldRow}>
        <div className={styles.field}>
        {startElement && <span className={styles.startElement}>{startElement}</span>}
        <textarea
          ref={(node) => {
            // Merge refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }}
          id={textareaId}
          className={textareaClasses}
          aria-describedby={ariaDescribedBy || undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          required={required}
          defaultValue={defaultValue}
          rows={rows}
          maxLength={!allowOverLimit ? maxLength : undefined}
          value={value}
          onChange={handleChange}
          {...props}
        />

        </div>
        {inputHelp && <span className={styles.inputHelp}>{inputHelp}</span>}
        </div>

        {characterCount && maxLength !== undefined && (
          <div id={countId} className={`${styles.count} ${isOverLimit ? styles.countError : ''}`}>
            {charCount}/{maxLength}
            {isOverLimit && allowOverLimit && (
              <span className={styles.countOverMessage}> (Over character limit)</span>
            )}
          </div>
        )}

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

TextArea.displayName = 'TextArea';
