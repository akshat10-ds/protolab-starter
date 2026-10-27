import * as React from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from '../../3-primitives/IconButton';
import styles from './Panel.module.css';
export type PanelKind = 'default' | 'secondary';
export interface RailProps extends React.HTMLAttributes<HTMLElement> {
  floating?: boolean;
  background?: PanelKind;
  noPadding?: boolean;
  leftBorder?: boolean;
  rightBorder?: boolean;
}
export interface PanelProps extends RailProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  closeButton?: boolean;
  onClose?: () => void;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  rail?: React.ReactNode;
}
export const Rail = React.forwardRef<HTMLElement, RailProps>(({ floating = false, background = 'default', noPadding = false, leftBorder = false, rightBorder = false, children, className, ...props }, ref) => (
  <aside {...props} ref={ref} data-ink-component="Rail" className={cn(styles.rail, styles[background], floating && styles.floating, noPadding && styles.noPadding, leftBorder && styles.leftBorder, rightBorder && styles.rightBorder, className)}>{children}</aside>
));
Rail.displayName = 'Rail';
export const Panel = React.forwardRef<HTMLElement, PanelProps>(({ header, footer, children, closeButton = true, onClose, collapsible = false, collapsed, defaultCollapsed = false, onCollapsedChange, rail, floating = false, background = 'default', noPadding = false, leftBorder = false, rightBorder = false, className, ...props }, ref) => {
  const [internal, setInternal] = React.useState(defaultCollapsed);
  const isCollapsed = collapsed ?? internal;
  const bodyId = React.useId();
  const toggle = () => { const next = !isCollapsed; if (collapsed === undefined) setInternal(next); onCollapsedChange?.(next); };
  return <aside {...props} ref={ref} data-ink-component="Panel" className={cn(styles.panel, styles[background], floating && styles.floating, noPadding && styles.noPadding, leftBorder && styles.leftBorder, rightBorder && styles.rightBorder, isCollapsed && styles.collapsed, className)}>
    <div className={styles.header}>
      {!isCollapsed && header}
      {collapsible && <IconButton icon={isCollapsed ? 'chevron-left' : 'chevron-right'} aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'} aria-expanded={!isCollapsed} aria-controls={bodyId} onClick={toggle} variant="tertiary" size="small" />}
      {!isCollapsed && closeButton && onClose && <IconButton icon="close" aria-label="Close panel" variant="tertiary" size="small" onClick={onClose} />}
    </div>
    {isCollapsed ? <div className={styles.railContent}>{rail}</div> : <><div id={bodyId} className={styles.body}>{children}</div>{footer && <div className={styles.footer}>{footer}</div>}</>}
  </aside>;
});
Panel.displayName = 'Panel';
