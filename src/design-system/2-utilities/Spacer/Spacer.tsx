import React from 'react';
import styles from './Spacer.module.css';

/**
 * Spacer - Spacing Utility
 *
 * Layer 2: Utilities
 * Dependencies: Only Layer 1 (Tokens)
 *
 * Adds flexible or fixed spacing between elements.
 */

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the spacer */
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl' | '2xl' | '3xl';
  /** Direction of the spacer */
  direction?: 'horizontal' | 'vertical';
  /** Use flex-grow to fill available space */
  flexible?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'medium',
  direction = 'vertical',
  flexible = false,
  className,
  style,
  ...props
}) => {
  const spacerClasses = [
    styles.spacer,
    flexible ? styles.flexible : styles[`size-${size}`],
    styles[direction],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div data-ink-component="Spacer" className={spacerClasses} style={style} {...props} aria-hidden="true" />;
};

Spacer.displayName = 'Spacer';
