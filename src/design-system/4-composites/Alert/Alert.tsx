import React from 'react';
import styles from './Alert.module.css';
import { Button } from '../../3-primitives/Button';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Alert kind/variant */
  kind?: 'information' | 'danger' | 'success' | 'warning' | 'promo' | 'subtle' | 'neutral' | 'neutralDark';
  /** Shape style */
  shape?: 'square' | 'round';
  /** Show bottom border accent */
  bottomBorder?: boolean;
  /** Optional title */
  title?: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Close handler */
  onClose?: () => void;
}

// Default icons for each kind
const defaultIcons: Record<string, React.ReactNode> = {
  information: <Icon name="status-info" size="medium" />,
  danger: <Icon name="status-error" size="medium" />,
  success: <Icon name="status-check" size="medium" />,
  warning: <Icon name="status-warn" size="medium" />,
  promo: <Icon name="star" size="medium" />,
  subtle: <Icon name="status-info" size="medium" />,
  neutral: <Icon name="status-info" size="medium" />,
  neutralDark: <Icon name="status-info" size="medium" />,
};

export const Alert: React.FC<AlertProps> = ({
  children,
  kind = 'information',
  shape = 'square',
  bottomBorder = false,
  title,
  icon,
  action,
  onClose,
  className,
  ...props
}) => {
  const alertClasses = [
    styles.alert,
    styles[kind],
    styles[shape],
    bottomBorder && styles.bottomBorder,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const displayIcon = icon !== undefined ? icon : defaultIcons[kind];

  return (
    <div data-ink-component="Alert" data-ink-prop-kind={kind} className={alertClasses} role="alert" {...props}>
      {displayIcon && <div className={styles.icon}>{displayIcon}</div>}

      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>

      {action && (
        <Button
          size="small"
          kind="tertiary"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}

      {onClose && (
        <IconButton
          icon="close"
          variant="tertiary"
          size="small"
          onClick={onClose}
          aria-label="Close alert"
          className={styles.closeButton}
        />
      )}
    </div>
  );
};

Alert.displayName = 'Alert';
