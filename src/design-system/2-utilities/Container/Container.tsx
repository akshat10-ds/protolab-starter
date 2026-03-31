import React from 'react';
import styles from './Container.module.css';

/**
 * Container - Content Width Utility
 *
 * Layer 2: Utilities
 * Dependencies: Only Layer 1 (Tokens)
 *
 * Centers content and applies max-width constraints.
 */

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Maximum width of the container */
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full';
  /** Add horizontal padding */
  padded?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'large',
  padded = true,
  className,
  style,
  ...props
}) => {
  const containerClasses = [
    styles.container,
    styles[`size-${size}`],
    padded && styles.padded,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-ink-component="Container" className={containerClasses} style={style} {...props}>
      {children}
    </div>
  );
};

Container.displayName = 'Container';
