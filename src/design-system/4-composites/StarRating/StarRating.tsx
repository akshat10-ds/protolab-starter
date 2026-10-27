import * as React from 'react';
import { Icon } from '../../3-primitives/Icon';
import { cn } from '@/lib/utils';
import styles from './StarRating.module.css';

export interface StarRatingProps {
  label: string;
  value?: number;
  defaultValue?: number;
  onChange?: (rating: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  showLegend?: boolean;
  showRatingLabels?: boolean;
  ratingLabels?: readonly [string, string, string, string, string];
  unratedLabel?: string;
  className?: string;
}
export const StarRating: React.FC<StarRatingProps> = ({ label, value, defaultValue = 0, onChange, disabled = false, readOnly = false, required = false, error, showLegend = true, showRatingLabels = true, ratingLabels = ['Poor', 'Below average', 'Neutral', 'Above average', 'Excellent'], unratedLabel = 'Not rated', className }) => {
  const normalize = (n: number) => Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0;
  const [internal, setInternal] = React.useState(() => normalize(defaultValue));
  const rating = normalize(value ?? internal);
  const [preview, setPreview] = React.useState<number | null>(null);
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const errorId = React.useId();
  const change = (n: number, focus = false) => {
    if (disabled || readOnly) return;
    if (value === undefined) setInternal(n);
    onChange?.(n);
    if (focus) refs.current[n - 1]?.focus();
  };
  const keyDown = (event: React.KeyboardEvent<HTMLButtonElement>, n: number) => {
    let next: number | undefined;
    if (event.key === 'Home') next = 1;
    else if (event.key === 'End') next = 5;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = n === 5 ? 1 : n + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = n === 1 ? 5 : n - 1;
    if (next !== undefined) { event.preventDefault(); change(next, true); }
  };
  const shown = preview ?? rating;
  return <fieldset data-ink-component="StarRating" disabled={disabled} className={cn(styles.rating, disabled && styles.disabled, className)}>
    {showLegend && <legend className={styles.legend}>{label}{required && <span className={styles.required}> *</span>}</legend>}
    <div role="radiogroup" aria-label={label} aria-required={required || undefined} aria-readonly={readOnly || undefined} aria-invalid={!!error || undefined} aria-describedby={error ? errorId : undefined} className={styles.stars} onMouseLeave={() => setPreview(null)}>
      {[1, 2, 3, 4, 5].map(n => <button key={n} ref={node => { refs.current[n - 1] = node; }} type="button" role="radio" aria-checked={rating === n} disabled={disabled} tabIndex={n === (rating || 1) ? 0 : -1} className={cn(styles.star, n <= shown && styles.selected)} onClick={() => change(n)} onKeyDown={event => keyDown(event, n)} onMouseEnter={() => { if (!disabled && !readOnly) setPreview(n); }}><Icon name={n <= shown ? 'star-filled' : 'star'} size={32} /><span className={styles.srOnly}>{n} out of 5: {ratingLabels[n - 1]}</span></button>)}
    </div>
    {showRatingLabels && <div className={styles.value} aria-live="polite">{shown ? ratingLabels[shown - 1] : unratedLabel}</div>}
    {error && <div id={errorId} className={styles.error}>{error}</div>}
  </fieldset>;
};
StarRating.displayName = 'StarRating';
