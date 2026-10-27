import * as React from 'react';
import { cn } from '@/lib/utils';
import hotspotAsset from './assets/hotspot.svg';
import styles from './Hotspot.module.css';

export interface HotspotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** A descriptive name for the annotation or detail this hotspot opens. */
  label: string;
}

/** The current Figma Hotspot asset, with a named, keyboard-operable trigger. */
export const Hotspot = React.forwardRef<HTMLButtonElement, HotspotProps>(
  ({ label, className, type = 'button', ...props }, ref) => (
    <button {...props} ref={ref} type={type} data-ink-component="Hotspot" className={cn(styles.hotspot, className)}>
      <img src={hotspotAsset} alt="" width={32} height={32} />
      <span className={styles.srOnly}>{label}</span>
    </button>
  ),
);
Hotspot.displayName = 'Hotspot';
