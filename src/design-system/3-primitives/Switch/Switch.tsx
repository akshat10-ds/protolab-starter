import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /** Whether the switch is checked */
  checked?: boolean;
  /** Default checked state for uncontrolled component */
  defaultChecked?: boolean;
  /** Label text */
  label?: string;
  /** Description text below label */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Callback when checked state changes */
  onChange?: (checked: boolean) => void;
  /** Additional className */
  className?: string;
  /** Name attribute */
  name?: string;
  /** ID attribute */
  id?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked,
      label,
      description,
      disabled = false,
      onChange,
      className,
      name,
      id,
      'aria-labelledby': labelledBy,
      'aria-describedby': describedBy,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;

      if (!isControlled) {
        setInternalChecked(newChecked);
      }

      onChange?.(newChecked);
    };

    const generatedId = React.useId();
    const switchId = id || `switch-${generatedId}`;
    const labelId = `${switchId}-label`;
    const descriptionId = `${switchId}-description`;

    const switchElement = (
      <span
        data-ink-component="Switch"
        className={cn(styles.container, disabled && styles.disabled)}
      >
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          name={name}
          className={styles.input}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          role="switch"
          aria-checked={isChecked}
          aria-labelledby={labelledBy || (label ? labelId : description && !props['aria-label'] ? descriptionId : undefined)}
          aria-describedby={[describedBy, description && (label || props['aria-label']) ? descriptionId : undefined].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        <span className={cn(styles.track, isChecked && styles.checked)}>
          <span className={styles.thumb} />
        </span>
      </span>
    );

    return (
      <label htmlFor={switchId} className={cn(styles.wrapper, disabled && styles.wrapperDisabled, className)}>
        {switchElement}
        {(label || description) && (
          <span className={styles.labelContainer}>
            {label && <span id={labelId} className={styles.label}>{label}</span>}
            {description && <span id={descriptionId} className={styles.description}>{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'InkSwitch';

export { Switch };
