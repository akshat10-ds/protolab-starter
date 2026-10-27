import React from 'react';
import styles from './Banner.module.css';
import { Icon, IconButton, Button, Link } from '../../3-primitives';
import type { IconName } from '../../3-primitives/Icon';

export type BannerKind =
  | 'information'
  | 'danger'
  | 'success'
  | 'warning'
  | 'promo'
  | 'subtle'
  | 'neutral';
export type BannerShape = 'square' | 'round';
export type BannerAlignment = 'start' | 'center';
export type BannerBorderRule = 'none' | 'top' | 'bottom' | 'both';

export interface BannerAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface BannerProps {
  /** Message content */
  children: React.ReactNode;
  /** Banner kind/variant */
  kind?: BannerKind;
  /** Border shape */
  shape?: BannerShape;
  /** Enable text wrapping */
  lineWrap?: boolean;
  /** Show bottom border */
  bottomBorder?: boolean;
  borderRule?: BannerBorderRule;
  alignment?: BannerAlignment;
  /** Optional icon name from Icon component */
  icon?: IconName;
  /** Custom icon element (takes precedence over icon prop) */
  customIcon?: React.ReactNode;
  /** Optional action button */
  action?: BannerAction;
  /** Show close button */
  closable?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Additional className */
  className?: string;
}

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      children,
      kind = 'information',
      shape = 'square',
      lineWrap = false,
      bottomBorder = false,
      borderRule = bottomBorder ? 'bottom' : 'none',
      alignment = 'center',
      icon,
      customIcon,
      action,
      closable = true,
      onClose,
      className,
    },
    ref
  ) => {
    const containerClasses = [
      styles.banner,
      styles[`kind-${kind}`],
      styles[`shape-${shape}`],
      lineWrap && styles.lineWrap,
      (borderRule === 'bottom' || borderRule === 'both') && styles.bottomBorder,
      (borderRule === 'top' || borderRule === 'both') && styles.topBorder,
      styles[`align-${alignment}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div data-ink-component="Banner" data-ink-prop-kind={kind} ref={ref} className={containerClasses} role="status" aria-live="polite">
        <div className={styles.content}>
          <div className={styles.messageWrapper}>
            {(customIcon || icon) && (
              <div className={styles.iconWrapper}>
                {customIcon || <Icon name={icon!} size="small" />}
              </div>
            )}
            <p className={styles.message}>{children}</p>
          </div>
          {action && (
            <div className={styles.actionButton}>
              {action.href ? (
                <Link href={action.href} onClick={action.onClick} size="small">
                  {action.label}
                </Link>
              ) : (
                <Button kind="secondary" size="small" onClick={action.onClick}>
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
        {closable && (
          <div className={styles.closeButtonWrapper}>
            <IconButton
              icon="close"
              variant="tertiary"
              size="small"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
        )}
      </div>
    );
  }
);

Banner.displayName = 'Banner';
