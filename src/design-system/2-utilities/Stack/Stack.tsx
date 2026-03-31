import React from 'react';
import styles from './Stack.module.css';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  gap?: 'none' | 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'vertical',
  gap = 'medium',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  style,
  ...props
}) => {
  const stackClasses = [
    styles.stack,
    styles[direction],
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    wrap && styles.wrap,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-ink-component="Stack" data-ink-prop-direction={direction} data-ink-prop-gap={gap} className={stackClasses} style={style} {...props}>
      {children}
    </div>
  );
};

Stack.displayName = 'Stack';
