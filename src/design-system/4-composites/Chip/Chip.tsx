import React from 'react';
import { Icon } from '../../3-primitives';
import { cn } from '@/lib/utils';
import styles from './Chip.module.css';
export type ChipKind = 'default' | 'AI';
export type ChipSize = 'small' | 'medium';
export interface ChipProps {
  children: React.ReactNode;
  startElement?: React.ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  selected?: boolean;
  kind?: ChipKind;
  size?: ChipSize;
  removeLabel?: string;
}
export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(({ children, startElement, onRemove, onClick, className, disabled = false, selected = false, kind = 'default', size = 'medium', removeLabel }, ref) => {
  const content = <>{startElement && <span className={styles.startElement}>{startElement}</span>}<span className={styles.text}>{children}</span></>;
  return <div data-ink-component="Chip" ref={ref} className={cn(styles.chip,styles[kind],styles[size],(onClick || onRemove) && styles.clickable,disabled && styles.disabled,selected && styles.selected,className)}>
    {onClick ? <button type="button" className={styles.mainButton} onClick={onClick} disabled={disabled} aria-pressed={selected}>{content}</button> : content}
    {onRemove && <button type="button" className={styles.removeButton} onClick={onRemove} disabled={disabled} aria-label={removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove')}><Icon name="close" size="small" /></button>}
  </div>;
});
Chip.displayName = 'Chip';
