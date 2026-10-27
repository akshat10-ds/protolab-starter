import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOptionProps { value: string; label: React.ReactNode; icon?: React.ReactNode; iconOnly?: boolean; disabled?: boolean; }
const Option: React.FC<SegmentedControlOptionProps> = () => null;
Option.displayName = 'SegmentedControl.Option';
export interface SegmentedControlProps {
  label: string;
  items?: SegmentedControlOptionProps[];
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  description?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}
const SegmentedControlRoot: React.FC<SegmentedControlProps> = ({ label, items, children, value, defaultValue, onChange, description, fullWidth = false, disabled = false, className }) => {
  const options = items ?? React.Children.toArray(children).flatMap(child => React.isValidElement<SegmentedControlOptionProps>(child) && child.type === Option ? [child.props] : []);
  const first = options.find(option => !option.disabled)?.value;
  const [internal, setInternal] = React.useState(defaultValue ?? first);
  const selected = value ?? internal;
  const tabbable = options.some(option => option.value === selected && !option.disabled) ? selected : first;
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const descriptionId = React.useId();
  const choose = (index: number, focus = false) => {
    const option = options[index];
    if (!option || option.disabled || disabled) return;
    if (value === undefined) setInternal(option.value);
    if (option.value !== selected) onChange?.(option.value);
    if (focus) refs.current[index]?.focus();
  };
  const keyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = options.flatMap((option, i) => option.disabled ? [] : [i]);
    if (!enabled.length) return;
    const position = enabled.indexOf(index);
    let next: number | undefined;
    const rtl = event.currentTarget.closest('[dir="rtl"]') !== null;
    if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
      next = enabled[(position + (forward ? 1 : -1) + enabled.length) % enabled.length];
    }
    if (next !== undefined) { event.preventDefault(); choose(next, true); }
  };
  return <div data-ink-component="SegmentedControl" className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
    <div role="radiogroup" aria-label={label} aria-describedby={description ? descriptionId : undefined} className={styles.options}>
      {options.map((option, index) => <button key={option.value} ref={node => { refs.current[index] = node; }} type="button" role="radio" aria-checked={selected === option.value} disabled={disabled || option.disabled} tabIndex={tabbable === option.value ? 0 : -1} onClick={() => choose(index)} onKeyDown={event => keyDown(event, index)} className={cn(styles.option, selected === option.value && styles.selected)}>{option.icon}<span className={option.iconOnly ? styles.srOnly : undefined}>{option.label}</span></button>)}
    </div>
    {description && <div id={descriptionId} className={styles.description}>{description}</div>}
  </div>;
};
export const SegmentedControl = Object.assign(SegmentedControlRoot, { Option });
SegmentedControl.displayName = 'SegmentedControl';
