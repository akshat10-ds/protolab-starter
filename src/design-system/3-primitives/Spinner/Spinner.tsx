import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large';
  /** Visual style variant */
  kind?: 'default' | 'subtle';
  /** Accessible label for screen readers */
  label?: string;
  /** Whether to show the label text visibly */
  showLabel?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'large',
  kind = 'default',
  label = 'Loading...',
  showLabel = false,
  className,
  ...props
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[kind],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-ink-component="Spinner" data-ink-prop-size={size} className={styles.wrapper} role="status" {...props}>
      <svg className={spinnerClasses} viewBox="0 0 50 50">
        {/* Background circle */}
        <circle
          className={styles.circleBackground}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        {/* Animated foreground circle */}
        <circle
          className={styles.circle}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <span className={showLabel ? styles.labelVisible : styles.label}>{label}</span>
    </div>
  );
};

Spinner.displayName = 'Spinner';
