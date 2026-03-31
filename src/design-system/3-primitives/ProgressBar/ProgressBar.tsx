import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './ProgressBar.module.css';

export type ProgressBarKind = 'info' | 'success';
export type ProgressBarVariant = 'determinate' | 'indeterminate';

export interface ProgressBarProps {
  /** Current progress value (0-100) */
  value?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether the Progress Bar shows info or success */
  kind?: ProgressBarKind;
  /** Whether the Progress Bar is determinate or indeterminate */
  variant?: ProgressBarVariant;
  /** Show the label and content of the Progress Bar */
  showLabel?: boolean;
  /** Label to display for the Progress Bar */
  label?: string;
  /** Text at the end of the Progress Bar (percentage display) */
  content?: string;
  /** Shows the content/percentage of the Progress Bar */
  showContent?: boolean;
  /** Additional className */
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  kind = 'info',
  variant = 'determinate',
  showLabel = true,
  label = 'Label',
  content,
  showContent = true,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayContent = content || `${Math.round(percentage)}%`;
  const isIndeterminate = variant === 'indeterminate';

  return (
    <div data-ink-component="ProgressBar" className={cn(styles.container, className)}>
      {/* Label row - shows for both determinate and indeterminate when showLabel is true */}
      {showLabel && (
        <div className={styles.labelRow}>
          <span className={styles.labelText}>{label}</span>
          {/* Only show percentage for determinate variant */}
          {!isIndeterminate && showContent && (
            <span className={styles.percentageText}>{displayContent}</span>
          )}
        </div>
      )}

      {/* Determinate progress bar */}
      {!isIndeterminate && (
        <div
          className={cn(styles.track, styles[kind])}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          <div className={styles.fill} style={{ width: `${percentage}%` }} />
          {/* Stop indicator at the end of track */}
          <div className={styles.stopIndicator} />
        </div>
      )}

      {/* Indeterminate progress bar */}
      {isIndeterminate && (
        <div
          className={cn(styles.trackIndeterminate, styles[kind])}
          role="progressbar"
          aria-label={label}
        >
          <div className={styles.trackIndeterminateBackground} />
          <div className={styles.fillIndeterminate}>
            <div className={styles.fillIndeterminateBar} />
          </div>
        </div>
      )}
    </div>
  );
};

ProgressBar.displayName = 'InkProgressBar';

export { ProgressBar };
