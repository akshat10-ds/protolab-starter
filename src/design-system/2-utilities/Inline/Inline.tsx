import React from 'react';
import styles from './Inline.module.css';

/**
 * Inline - Horizontal Layout Utility
 *
 * Layer 2: Utilities
 * Dependencies: Only Layer 1 (Tokens)
 *
 * Optimized for horizontal layouts with common patterns.
 */

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Spacing between items */
  gap?: 'none' | 'xs' | 'small' | 'medium' | 'large' | 'xl';
  /** Vertical alignment */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  /** Horizontal distribution */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Allow items to wrap */
  wrap?: boolean;
}

export const Inline: React.FC<InlineProps> = ({
  children,
  gap = 'medium',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
  style,
  ...props
}) => {
  const inlineClasses = [
    styles.inline,
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    wrap && styles.wrap,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-ink-component="Inline" className={inlineClasses} style={style} {...props}>
      {children}
    </div>
  );
};

Inline.displayName = 'Inline';
