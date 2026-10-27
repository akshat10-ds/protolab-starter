import * as React from 'react';
import { Icon } from '../Icon';
import { cn } from '@/lib/utils';
import styles from './Tag.module.css';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  startElement?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
}
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ text, startElement, onRemove, removeLabel = `Remove ${text}`, disabled = false, className, ...props }, ref) => (
    <span {...props} ref={ref} data-ink-component="Tag" className={cn(styles.tag, disabled && styles.disabled, className)}>
      {startElement && <span className={styles.start}>{startElement}</span>}
      <span>{text}</span>
      {onRemove && <button type="button" className={styles.close} onClick={onRemove} disabled={disabled}><Icon name="close" size="small" /><span className={styles.srOnly}>{removeLabel}</span></button>}
    </span>
  ),
);
Tag.displayName = 'Tag';
