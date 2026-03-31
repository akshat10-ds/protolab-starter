import React from 'react';
import styles from './Badge.module.css';
import { Icon, IconName } from '../Icon';

export type BadgeKind =
  | 'subtle'
  | 'emphasis'
  | 'success'
  | 'warning'
  | 'alert'
  | 'promo'
  | 'promoSubtle';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text content of the badge */
  text?: string;
  /** Show start element icon based on kind */
  startElement?: boolean;
  /** The kind/variant of the badge */
  kind?: BadgeKind;
  /** @deprecated Use `text` prop instead */
  children?: React.ReactNode;
  /** @deprecated Use `kind` prop instead */
  variant?: BadgeKind;
}

// Map each kind to its corresponding icon
const kindToIcon: Record<BadgeKind, IconName> = {
  subtle: 'status-info',
  emphasis: 'status-info',
  success: 'status-check',
  warning: 'status-warn',
  alert: 'status-error',
  promo: 'megaphone',
  promoSubtle: 'megaphone',
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  startElement = false,
  kind,
  children,
  variant,
  className,
  ...props
}) => {
  // Support both new `kind` prop and legacy `variant` prop
  const badgeKind = kind ?? variant ?? 'subtle';
  // Support both new `text` prop and legacy `children` prop
  const displayText = text ?? children;

  const badgeClasses = [styles.badge, styles[badgeKind], className].filter(Boolean).join(' ');

  return (
    <span data-ink-component="Badge" data-ink-prop-kind={badgeKind} className={badgeClasses} {...props}>
      {startElement && (
        <span className={styles.icon}>
          <Icon name={kindToIcon[badgeKind]} size="small" />
        </span>
      )}
      <span className={styles.text}>{displayText}</span>
    </span>
  );
};

Badge.displayName = 'Badge';
