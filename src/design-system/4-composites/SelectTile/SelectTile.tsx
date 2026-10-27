import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './SelectTile.module.css';

export interface SelectTileProps {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  image?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  imageFit?: 'fit' | 'fill' | 'none';
  direction?: 'row' | 'column';
  type?: 'radio' | 'checkbox';
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}
export const SelectTile = React.forwardRef<HTMLInputElement, SelectTileProps>(({ value, label, description, image, icon, badge, imageFit = 'fit', direction = 'row', type = 'radio', name, checked, defaultChecked, onChange, disabled = false, readOnly = false, className }, ref) => {
  const labelId = React.useId();
  const descriptionId = React.useId();
  return <label data-ink-component="SelectTile" className={cn(styles.tile, styles[direction], styles[imageFit], readOnly && styles.readOnly, disabled && styles.disabled, className)}>
    <input ref={ref} className={styles.input} type={type} value={value} name={name} checked={checked} defaultChecked={defaultChecked} disabled={disabled} aria-readonly={readOnly || undefined} aria-labelledby={labelId} aria-describedby={description ? descriptionId : undefined} onClick={event => { if (readOnly) event.preventDefault(); }} onChange={event => { if (!readOnly) onChange?.(event.target.checked); }} />
    <span className={styles.content}>
      {icon ? <span className={styles.icon}>{icon}</span> : image && imageFit !== 'none' && <span className={styles.image}>{image}</span>}
      <span className={styles.body}><span className={styles.header}><span id={labelId} className={styles.label}>{label}</span>{badge && <span>{badge}</span>}</span>{description && <span id={descriptionId} className={styles.description}>{description}</span>}</span>
    </span>
  </label>;
});
SelectTile.displayName = 'SelectTile';
export interface SelectTileGroupProps {
  label: string;
  hideLabel?: boolean;
  description?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  direction?: 'row' | 'column';
  className?: string;
}
export const SelectTileGroup: React.FC<SelectTileGroupProps> = ({ label, hideLabel = false, description, error, children, value, defaultValue, onChange, multiple = false, disabled = false, readOnly = false, direction = 'column', className }) => {
  const name = React.useId();
  const descriptionId = React.useId();
  const errorId = React.useId();
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const [internal, setInternal] = React.useState<string | string[]>(defaultValue ?? (multiple ? [] : ''));
  const selected = value ?? internal;
  const change = (key: string, checked: boolean) => {
    if (readOnly || disabled) return;
    const current = Array.isArray(selected) ? selected : selected ? [selected] : [];
    const next = multiple ? checked ? [...new Set([...current, key])] : current.filter(item => item !== key) : key;
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };
  return <fieldset disabled={disabled} aria-describedby={describedBy} aria-invalid={!!error || undefined} className={cn(styles.group, className)}><legend className={hideLabel ? styles.srOnly : styles.legend}>{label}</legend>{description && <div id={descriptionId} className={styles.groupDescription}>{description}</div>}<div className={cn(styles.choices, styles[direction])}>{React.Children.map(children, child => React.isValidElement<SelectTileProps>(child) && child.type === SelectTile ? React.cloneElement(child, { name, type: multiple ? 'checkbox' : 'radio', checked: Array.isArray(selected) ? selected.includes(child.props.value) : selected === child.props.value, disabled: disabled || child.props.disabled, readOnly: readOnly || child.props.readOnly, onChange: checked => { change(child.props.value, checked); child.props.onChange?.(checked); } }) : child)}</div>{error && <div id={errorId} className={styles.error} role="alert">{error}</div>}</fieldset>;
};
