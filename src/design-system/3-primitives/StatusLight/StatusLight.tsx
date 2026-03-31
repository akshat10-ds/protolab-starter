import React from 'react';
import styles from './StatusLight.module.css';

export type StatusLightKind = 'neutral' | 'success' | 'warning' | 'alert';

export interface StatusLightProps {
  /** The status type/variant - color of the StatusLight */
  kind?: StatusLightKind;
  /** Text to display for the StatusLight */
  text?: string;
  /** Shows/hides the StatusLight text */
  showText?: boolean;
  /** Disables background fill on StatusLight */
  noFill?: boolean;
  /**
   * Change the transparency of the StatusLight fill.
   * When false (default for neutral), uses semi-transparent background.
   * When true (default), uses solid/opaque background color.
   */
  opaque?: boolean;
  /** Additional className */
  className?: string;
  /** @deprecated Use `text` prop instead. Optional text label for backwards compatibility */
  children?: React.ReactNode;
  /** @deprecated Use `noFill` prop instead (inverted logic). Show background fill */
  filled?: boolean;
}

export const StatusLight = React.forwardRef<HTMLDivElement, StatusLightProps>(
  (
    { kind = 'neutral', text, showText = true, noFill, opaque = true, className, children, filled },
    ref
  ) => {
    // Support both new `text` prop and legacy `children` prop
    const displayText = text ?? children;
    const shouldShowText = showText && displayText;

    // Handle backwards compatibility: `filled` prop (deprecated) inverts `noFill`
    // If filled is explicitly set, use its inverse; otherwise use noFill (default false)
    const shouldNotFill = filled !== undefined ? !filled : (noFill ?? false);

    const containerClasses = [
      styles.statusLight,
      styles[kind],
      !shouldNotFill && styles.filled,
      !shouldNotFill && opaque && styles.opaque,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} data-ink-component="StatusLight" data-ink-prop-kind={kind} className={containerClasses}>
        <div className={styles.dotContainer}>
          <div className={styles.dot} />
        </div>
        {shouldShowText && <span className={styles.text}>{displayText}</span>}
      </div>
    );
  }
);

StatusLight.displayName = 'StatusLight';
