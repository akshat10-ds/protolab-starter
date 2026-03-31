import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
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

    const switchId = id || `switch-${React.useId()}`;

    const switchElement = (
      <label
        data-ink-component="Switch"
        className={cn(styles.container, disabled && styles.disabled, className)}
        htmlFor={switchId}
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
          {...props}
        />
        <span className={cn(styles.track, isChecked && styles.checked)}>
          <span className={styles.thumb} />
        </span>
      </label>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <div className={styles.wrapper}>
        {switchElement}
        {label && (
          <div className={styles.labelContainer}>
            <span className={styles.label}>{label}</span>
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'InkSwitch';

export { Switch };
