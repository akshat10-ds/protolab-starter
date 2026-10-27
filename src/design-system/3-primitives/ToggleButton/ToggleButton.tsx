import React, { forwardRef, useState } from 'react';
import styles from './ToggleButton.module.css';

export interface ToggleButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> {
  /** Always names the control, including an icon-only button. */
  text: string;
  icon?: React.ReactNode;
  iconSmall?: React.ReactNode;
  hasIcon?: boolean;
  showText?: boolean;
  size?: 'small' | 'medium';
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Figma's inactive state maps to the native disabled state. */
  inactive?: boolean;
}

/** Independent pressed state; use SegmentedControl for mutually exclusive choices. */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton({
  text, icon, iconSmall, hasIcon = true, showText, size = 'medium',
  selected, defaultSelected = false, onSelectedChange, inactive = false,
  disabled, className, onClick, type = 'button', ...props
}, ref) {
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const isSelected = selected ?? internalSelected;
  const element = hasIcon ? (size === 'small' ? iconSmall ?? icon : icon) : null;
  const textVisible = showText ?? !element;
  return <button {...props} ref={ref} type={type} disabled={disabled || inactive}
    data-ink-component="ToggleButton" data-size={size} aria-pressed={isSelected}
    className={[styles.button, styles[size], isSelected && styles.selected, className].filter(Boolean).join(' ')}
    onClick={event => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (selected === undefined) setInternalSelected(!isSelected);
      onSelectedChange?.(!isSelected);
    }}>
    {element && <span className={styles.icon} aria-hidden="true">{element}</span>}
    <span className={textVisible ? styles.text : styles.hidden}>{text}</span>
  </button>;
});
