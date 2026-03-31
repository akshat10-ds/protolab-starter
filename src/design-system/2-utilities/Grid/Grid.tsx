import React from 'react';
import styles from './Grid.module.css';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: number | 'auto';
  gap?: 'none' | 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'stretch';
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 'auto',
  gap = 'medium',
  align = 'stretch',
  justify = 'stretch',
  className,
  style,
  ...props
}) => {
  const gridClasses = [
    styles.grid,
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const gridStyle: React.CSSProperties = {
    ...style,
    gridTemplateColumns: columns === 'auto' ? 'repeat(auto-fit, minmax(200px, 1fr))' : `repeat(${columns}, 1fr)`,
  };

  return (
    <div data-ink-component="Grid" className={gridClasses} style={gridStyle} {...props}>
      {children}
    </div>
  );
};

Grid.displayName = 'Grid';
