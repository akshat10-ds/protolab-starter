import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Stepper.module.css';
import { Icon } from '../../3-primitives';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepStatus = 'completed' | 'active' | 'upcoming' | 'error';

export interface Step {
  /** Unique identifier for the step */
  id: string;
  /** Title of the step */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Status of the step */
  status?: StepStatus;
  /** Optional custom number/label */
  label?: string | number;
  /** Disable the step */
  disabled?: boolean;
}

export interface StepperProps {
  /** Array of steps */
  steps: Step[];
  /** Current active step index */
  activeStep?: number;
  /** Orientation of the stepper */
  orientation?: StepperOrientation;
  /** Whether completed steps are clickable */
  clickable?: boolean;
  /** Whether to show step descriptions */
  showDescription?: boolean;
  /** Whether to show connector lines */
  showConnector?: boolean;
  /** Callback when a step is clicked */
  onStepClick?: (stepIndex: number, step: Step) => void;
  /** Custom className */
  className?: string;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>((props, ref) => {
  const {
    steps,
    activeStep = 0,
    orientation = 'horizontal',
    clickable = false,
    showDescription = true,
    showConnector = true,
    onStepClick,
    className,
    ...restProps
  } = props;
  const getStepStatus = (index: number, step: Step): StepStatus => {
    if (step.status) return step.status;
    if (index < activeStep) return 'completed';
    if (index === activeStep) return 'active';
    return 'upcoming';
  };

  const handleStepClick = (index: number, step: Step) => {
    if (step.disabled) return;
    const status = getStepStatus(index, step);
    if (clickable && (status === 'completed' || status === 'active')) {
      onStepClick?.(index, step);
    }
  };

  const isStepClickable = (index: number, step: Step): boolean => {
    if (step.disabled) return false;
    const status = getStepStatus(index, step);
    return clickable && (status === 'completed' || status === 'active');
  };

  const renderStepIcon = (index: number, step: Step, status: StepStatus) => {
    if (step.icon) {
      return <span className={styles.customIcon}>{step.icon}</span>;
    }

    if (status === 'completed') {
      return (
        <span className={styles.checkIcon}>
          <Icon name="check" size="small" />
        </span>
      );
    }

    if (status === 'error') {
      return (
        <span className={styles.errorIcon}>
          <Icon name="status-error" size="small" />
        </span>
      );
    }

    return (
      <span className={styles.stepNumber}>{step.label !== undefined ? step.label : index + 1}</span>
    );
  };

  const renderStep = (step: Step, index: number) => {
    const status = getStepStatus(index, step);
    const isClickable = isStepClickable(index, step);

    const stepClasses = cn(
      styles.step,
      styles[status],
      isClickable && styles.clickable,
      step.disabled && styles.disabled
    );

    return (
      <div
        key={step.id}
        className={stepClasses}
        onClick={() => handleStepClick(index, step)}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleStepClick(index, step);
          }
        }}
      >
        <div className={styles.stepIndicator}>
          <div className={styles.stepIconWrapper}>{renderStepIcon(index, step, status)}</div>
          {showConnector && index < steps.length - 1 && <div className={styles.connector} />}
        </div>
        <div className={styles.stepContent}>
          <div className={styles.stepTitle}>{step.title}</div>
          {showDescription && step.description && (
            <div className={styles.stepDescription}>{step.description}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div data-ink-component="Stepper" ref={ref} className={cn(styles.stepper, styles[orientation], className)} {...restProps}>
      {steps.map((step, index) => renderStep(step, index))}
    </div>
  );
});

Stepper.displayName = 'InkStepper';

export { Stepper };
