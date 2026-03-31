import React from 'react';
import styles from './AlertBadge.module.css';

export type AlertBadgeKind = 'emphasis' | 'subtle';

export interface AlertBadgeProps {
  /** Number to display in the badge (1-99+) */
  value?: number;
  /** Visual style of the badge */
  kind?: AlertBadgeKind;
  /** Show as a dot indicator instead of number */
  dot?: boolean;
  /** Additional className */
  className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  value = 1,
  kind = 'emphasis',
  dot = false,
  className,
}) => {
  const displayValue = value > 99 ? '99+' : value.toString();
  const isMultipleDigits = value >= 10;

  const badgeClasses = [
    styles.badge,
    styles[kind],
    dot ? styles.dot : isMultipleDigits ? styles.multipleDigits : styles.number,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (dot) {
    return <div data-ink-component="AlertBadge" data-ink-prop-kind={kind} className={badgeClasses} aria-label="Alert indicator" />;
  }

  return (
    <div data-ink-component="AlertBadge" data-ink-prop-kind={kind} className={badgeClasses} aria-label={`${value} alerts`}>
      {displayValue}
    </div>
  );
};

AlertBadge.displayName = 'AlertBadge';
