import * as React from 'react';
import { Icon } from '../../3-primitives/Icon';
import { cn } from '@/lib/utils';
import styles from './WorkflowStepper.module.css';

export interface WorkflowStepperItemProps { id?: string; text: React.ReactNode; description?: React.ReactNode; status?: 'current' | 'unvisited' | 'visited'; isComplete?: boolean; callToAction?: React.ReactNode; children?: React.ReactNode; expanded?: boolean; defaultExpanded?: boolean; onExpandedChange?: (expanded: boolean) => void; index?: number; showBeforeConnector?: boolean; showEndConnector?: boolean; }
const Item: React.FC<WorkflowStepperItemProps> = ({ text, description, status = 'unvisited', isComplete = false, callToAction, children, expanded, defaultExpanded = false, onExpandedChange, index = 1, showBeforeConnector = true, showEndConnector = true }) => {
  const [internal, setInternal] = React.useState(defaultExpanded);
  const open = expanded ?? internal;
  const contentId = React.useId();
  const toggle = () => { if (expanded === undefined) setInternal(!open); onExpandedChange?.(!open); };
  return <li data-ink-component="WorkflowStepper.Item" aria-current={status === 'current' ? 'step' : undefined} className={cn(styles.item, styles[status], isComplete && styles.complete)}>
    {showBeforeConnector && <span className={styles.before} aria-hidden="true" />}{showEndConnector && <span className={styles.after} aria-hidden="true" />}<div className={styles.marker} aria-hidden="true">{isComplete ? <Icon name="check" size="small" /> : index}</div>
    <div className={styles.body}><div className={styles.header}>{children ? <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={contentId} onClick={toggle}>{text}<Icon name={open ? 'chevron-up' : 'chevron-down'} size="small" /></button> : <span className={styles.text}>{text}</span>}{callToAction && <div className={styles.action}>{callToAction}</div>}</div>{description && <div className={styles.description}>{description}</div>}{children && <div id={contentId} hidden={!open} className={styles.content}>{children}</div>}</div>
  </li>;
};
export interface WorkflowStepperProps { children?: React.ReactNode; items?: WorkflowStepperItemProps[]; label?: string; variant?: 'compact' | 'expanded'; className?: string; }
const WorkflowStepperRoot: React.FC<WorkflowStepperProps> = ({ children, items, label = 'Workflow progress', variant = 'compact', className }) => {
  const steps = items ? items.map((item, index) => <Item {...item} key={item.id ?? index} index={index + 1} showBeforeConnector={item.showBeforeConnector ?? index > 0} showEndConnector={item.showEndConnector ?? index < items.length - 1} />) : React.Children.toArray(children).filter(child => React.isValidElement<WorkflowStepperItemProps>(child) && child.type === Item).map((child, index) => React.cloneElement(child as React.ReactElement<WorkflowStepperItemProps>, { index: index + 1, showBeforeConnector: (child as React.ReactElement<WorkflowStepperItemProps>).props.showBeforeConnector ?? index > 0, showEndConnector: (child as React.ReactElement<WorkflowStepperItemProps>).props.showEndConnector ?? index < React.Children.count(children) - 1 }));
  return <ol data-ink-component="WorkflowStepper" aria-label={label} className={cn(styles.stepper, styles[variant], className)}>{steps}</ol>;
};
export const WorkflowStepper = Object.assign(WorkflowStepperRoot, { Item });
WorkflowStepper.displayName = 'WorkflowStepper';
