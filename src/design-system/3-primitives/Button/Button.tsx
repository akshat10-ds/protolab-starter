import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Button.module.css';

// Simplified Button types for prototyping
export type ButtonKind = 'brand' | 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  /** The kind/variant of the Button */
  kind?: ButtonKind;
  /** Size of the button */
  size?: ButtonSize;
  /** Forces full width */
  fullWidth?: boolean;
  /** Display loading state */
  loading?: boolean;
  /** URL for navigation (renders as anchor) */
  href?: string;
  /** Target for anchor links */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** Makes button pill-shaped */
  rounded?: boolean;
  /** Inverts colors for dark backgrounds */
  inverted?: boolean;
  /** Element to display at start */
  startElement?: React.ReactNode;
  /** Element to display at end */
  endElement?: React.ReactNode;
  /** Shows menu trigger arrow */
  menuTrigger?: boolean;
  /** Active state */
  active?: boolean;
  /** Accessibility text for screen readers */
  accessibilityText?: string;
  /** Children content */
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      kind = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      href,
      target,
      rounded = false,
      inverted = false,
      startElement,
      endElement,
      menuTrigger = false,
      active = false,
      accessibilityText,
      children,
      className,
      disabled = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const buttonClasses = cn(
      styles.button,
      styles[kind],
      styles[size],
      fullWidth && styles.fullWidth,
      rounded && styles.rounded,
      inverted && styles.inverted,
      active && styles.active,
      loading && styles.loading,
      disabled && styles.disabled,
      className
    );

    const content = (
      <>
        {loading && (
          <span className={styles.spinner}>
            <svg
              className={styles.spinnerIcon}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className={styles.spinnerTrack}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={styles.spinnerPath}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {startElement && <span className={styles.startElement}>{startElement}</span>}
        {children && (
          <span className={styles.text}>
            {accessibilityText ? (
              <>
                <span className="sr-only">{accessibilityText}</span>
                <span aria-hidden="true">{children}</span>
              </>
            ) : (
              children
            )}
          </span>
        )}
        {endElement && <span className={styles.endElement}>{endElement}</span>}
        {menuTrigger && (
          <span className={styles.menuTrigger}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8.5L2 4.5h8L6 8.5z" />
            </svg>
          </span>
        )}
      </>
    );

    if (href && !disabled) {
      return (
        <a
          data-ink-component="Button"
          data-ink-prop-kind={kind}
          data-ink-prop-size={size}
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          className={buttonClasses}
          aria-haspopup={menuTrigger ? 'true' : undefined}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        data-ink-component="Button"
        data-ink-prop-kind={kind}
        data-ink-prop-size={size}
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type as 'button' | 'submit' | 'reset'}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-haspopup={menuTrigger ? 'true' : undefined}
        aria-pressed={active ? 'true' : undefined}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'InkButton';

export { Button };