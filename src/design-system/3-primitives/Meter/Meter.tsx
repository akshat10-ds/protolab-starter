import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Meter.module.css';

export type MeterKind = 'info' | 'semantic-high' | 'semantic-medium' | 'semantic-low';
export interface MeterProps {
  label: string;
  /** Explain the value in words; color alone must not convey the result. */
  content: string;
  value?: number;
  min?: number;
  max?: number;
  kind?: MeterKind;
  className?: string;
}

export const Meter: React.FC<MeterProps> = ({ label, content, value, min = 0, max = 100, kind = 'info', className }) => {
  const minimum = Number.isFinite(min) ? min : 0;
  const maximum = Number.isFinite(max) && max > minimum ? max : minimum + 100;
  const defaults = { info: 1, 'semantic-high': .825, 'semantic-medium': .5, 'semantic-low': .25 };
  const supplied = value ?? minimum + (maximum - minimum) * defaults[kind];
  const bounded = Math.max(minimum, Math.min(maximum, Number.isFinite(supplied) ? supplied : minimum));
  const percent = ((bounded - minimum) / (maximum - minimum)) * 100;
  const labelId = React.useId();
  return (
    <div data-ink-component="Meter" className={cn(styles.meter, styles[kind], className)}>
      <div className={styles.labels}><span id={labelId} className={styles.label}>{label}</span><span>{content}</span></div>
      <div className={styles.track} role="meter" aria-labelledby={labelId} aria-valuemin={minimum} aria-valuemax={maximum} aria-valuenow={bounded} aria-valuetext={content}>
        <span className={styles.fill} style={{ width: `${percent}%` }} />
        <span className={styles.stop} />
      </div>
    </div>
  );
};
Meter.displayName = 'Meter';
