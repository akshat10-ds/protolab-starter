import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './EmptyState.module.css';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  image?: React.ReactNode;
  footer?: React.ReactNode;
  callToAction?: React.ReactNode;
  size?: 'small' | 'medium';
  direction?: 'row' | 'column';
  alignment?: 'start' | 'center' | 'end';
}
export interface EmptyStateHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> { level?: 1 | 2 | 3 | 4 | 5 | 6; text?: string; }
const Header: React.FC<EmptyStateHeaderProps> = ({ level = 2, text, children, className, ...props }) => {
  const Element = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Element {...props} className={cn(styles.heading, className)}>{children ?? text}</Element>;
};
const Body: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => <div {...props} className={cn(styles.body, className)} />;
const Footer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => <div {...props} className={cn(styles.footer, className)} />;
const EmptyStateRoot: React.FC<EmptyStateProps> = ({ header, image, footer, callToAction, children, size = 'medium', direction = 'row', alignment = 'start', className, ...props }) => (
  <div {...props} data-ink-component="EmptyState" className={cn(styles.empty, styles[size], styles[direction], styles[alignment], className)}>
    {image && <div className={styles.image}>{image}</div>}
    <div className={styles.content}>{header}{children && <Body>{children}</Body>}{callToAction && <div className={styles.actions}>{callToAction}</div>}{footer}</div>
  </div>
);
export const EmptyState = Object.assign(EmptyStateRoot, { Header, Body, Footer });
EmptyState.displayName = 'EmptyState';
