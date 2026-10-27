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

export interface BadgeProps extends React.HTMLAttributes<HTMLElement> {
  /** Text content of the badge */
  text?: string;
  /** Show start element icon based on kind */
  startElement?: boolean;
  /** Render an accessible menu trigger with the status text as its name. */
  menuTrigger?: boolean;
  disabled?: boolean;
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

// Figma binds a distinct per-kind icon variable; subtle/promoSubtle inherit text color
const kindToIconColor: Partial<Record<BadgeKind, string>> = {
  emphasis: 'var(--ink-icon-color-inverse)',
  success: 'var(--ink-icon-color-success-emphasis)',
  warning: 'var(--ink-icon-color-warning)',
  alert: 'var(--ink-icon-color-error)',
  promo: 'var(--ink-icon-color-inverse)',
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  startElement = false,
  menuTrigger = false,
  disabled = false,
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

  const Element = menuTrigger ? 'button' : 'span';
  return (
    <Element type={menuTrigger ? 'button' : undefined} disabled={menuTrigger ? disabled : undefined} aria-haspopup={menuTrigger ? 'menu' : undefined} data-ink-component="Badge" data-ink-prop-kind={badgeKind} className={`${badgeClasses} ${menuTrigger ? styles.menuTrigger : ''}`} {...props}>
      {startElement && (
        <span className={styles.icon}>
          <Icon name={kindToIcon[badgeKind]} size="small" color={kindToIconColor[badgeKind]} />
        </span>
      )}
      <span className={styles.text}>{displayText}</span>
      {menuTrigger && <Icon name="chevron-down" size={12} className={styles.chevron} />}
    </Element>
  );
};

Badge.displayName = 'Badge';
