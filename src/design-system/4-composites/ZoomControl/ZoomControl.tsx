import * as React from 'react';
import { IconButton } from '../../3-primitives/IconButton';
import { cn } from '@/lib/utils';
import styles from './ZoomControl.module.css';

export interface ZoomControlProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  direction?: 'row' | 'column';
  /** Show the subtle container background, matching Figma's stripped property. */
  stripped?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}
export const ZoomControl: React.FC<ZoomControlProps> = ({ value, defaultValue = 100, onChange, min = 25, max = 400, step = 25, direction = 'column', stripped = true, disabled = false, label = 'Zoom', className }) => {
  const lower = Number.isFinite(min) ? min : 25;
  const upper = Number.isFinite(max) && max >= lower ? max : lower;
  const clamp = (n: number) => Math.min(upper, Math.max(lower, Number.isFinite(n) ? n : lower));
  const [internal, setInternal] = React.useState(() => clamp(defaultValue));
  const current = clamp(value ?? internal);
  const increment = Number.isFinite(step) && step > 0 ? step : 25;
  const change = (delta: number) => {
    const next = clamp(current + delta);
    if (value === undefined) setInternal(next);
    if (next !== current) onChange?.(next);
  };
  return <div data-ink-component="ZoomControl" role="group" aria-label={label} className={cn(styles.control, styles[direction], stripped && styles.surface, className)}>
    <IconButton icon="zoom-in" size="medium" variant="tertiary" aria-label="Zoom in" disabled={disabled || current >= upper} onClick={() => change(increment)} />
    <output className={styles.value} aria-live="polite" aria-atomic="true">{current}%</output>
    <IconButton icon="zoom-out" size="medium" variant="tertiary" aria-label="Zoom out" disabled={disabled || current <= lower} onClick={() => change(-increment)} />
  </div>;
};
ZoomControl.displayName = 'ZoomControl';
