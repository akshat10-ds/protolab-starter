import React from 'react';
import styles from './Divider.module.css';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 'medium',
  className,
  ...props
}) => {
  const dividerClasses = [
    styles.divider,
    styles[orientation],
    styles[`spacing-${spacing}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <hr data-ink-component="Divider" data-ink-prop-orientation={orientation} className={dividerClasses} {...props} />;
};

Divider.displayName = 'Divider';
