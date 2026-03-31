/**
 * ThinkingSteps Component
 *
 * Progressive reasoning visualization that shows the agent's thinking process.
 * Features step-by-step reveal, streaming text, and tool call visualization.
 *
 * @example
 * ```tsx
 * <ThinkingSteps
 *   steps={[
 *     { id: '1', title: 'Analyzing document', status: 'complete', duration: 1200 },
 *     { id: '2', title: 'Extracting key terms', status: 'active', progress: 45 },
 *     { id: '3', title: 'Comparing with policy', status: 'pending' },
 *   ]}
 *   streamingText="Found 3 key clauses..."
 * />
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { Icon, ProgressBar } from '@/design-system';
import type { ThinkingStep, ThinkingStepStatus } from './types';
import styles from './ThinkingSteps.module.css';

// =============================================================================
// Types
// =============================================================================

export interface ThinkingStepsProps {
  /** Array of thinking steps to display */
  steps: ThinkingStep[];
  /** Whether the component is collapsed */
  isCollapsed?: boolean;
  /** Callback when collapse state changes */
  onToggleCollapse?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Streaming text for active step */
  streamingText?: string;
  /** Tool call being executed */
  toolCall?: {
    name: string;
    params?: Record<string, string>;
  };
}

// =============================================================================
// Helper Components
// =============================================================================

interface StepIconProps {
  status: ThinkingStepStatus;
}

function StepIcon({ status }: StepIconProps) {
  switch (status) {
    case 'complete':
      return (
        <span className={`${styles.stepIcon} ${styles.stepIconComplete}`}>
          <Icon name="check" size="small" />
        </span>
      );
    case 'active':
      return (
        <span className={`${styles.stepIcon} ${styles.stepIconActive}`}>
          <span className={styles.stepIconPulse} />
        </span>
      );
    case 'error':
      return (
        <span className={`${styles.stepIcon} ${styles.stepIconError}`}>
          <Icon name="close" size="small" />
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={`${styles.stepIcon} ${styles.stepIconPending}`}>
          <span className={styles.stepIconDot} />
        </span>
      );
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function StreamingText({ text }: { text: string }) {
  return <div className={styles.streamingText}>{text}</div>;
}

function ToolCallDisplay({ name, params }: { name: string; params?: Record<string, string> }) {
  const paramsStr = params
    ? Object.entries(params)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
    : '';

  return (
    <div className={styles.toolCall}>
      <span className={styles.toolCallName}>{name}</span>
      {paramsStr && <span className={styles.toolCallParams}>{paramsStr}</span>}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ThinkingSteps({
  steps,
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
  className,
  streamingText,
  toolCall,
}: ThinkingStepsProps) {
  const [isCollapsedInternal, setIsCollapsedInternal] = useState(false);
  const stepsListRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled modes
  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : isCollapsedInternal;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsCollapsedInternal(!isCollapsedInternal);
    }
  };

  // Auto-scroll to active step when streaming
  useEffect(() => {
    if (streamingText && stepsListRef.current) {
      const activeStep = stepsListRef.current.querySelector(`.${styles.stepActive}`);
      if (activeStep) {
        activeStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [streamingText]);

  // Calculate progress stats
  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const hasError = steps.some((s) => s.status === 'error');
  const isComplete = completedCount === steps.length && !hasError && steps.length > 0;

  // Determine header icon class based on state
  const headerIconClass = isComplete
    ? styles.headerIconComplete
    : hasError
      ? styles.headerIconError
      : '';

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={!isCollapsed}
      >
        <div className={styles.headerLeft}>
          <span className={`${styles.headerIcon} ${headerIconClass}`}>
            {isComplete ? (
              <Icon name="status-check" size="small" />
            ) : hasError ? (
              <Icon name="status-warn" size="small" />
            ) : (
              <Icon name="ai-spark" size="small" />
            )}
          </span>
          <span className={styles.headerTitle}>
            {isComplete ? 'Analysis Complete' : hasError ? 'Analysis Error' : 'Agent Reasoning'}
          </span>
          <span className={styles.headerProgress}>
            {completedCount}/{steps.length}
          </span>
        </div>
        <Icon name="chevron-down" size="small" className={styles.headerChevron} />
      </button>

      {/* Steps List */}
      {!isCollapsed && (
        <div className={styles.stepsList} ref={stepsListRef}>
          {steps.map((step) => {
            const isActiveStep = step.status === 'active';

            return (
              <div
                key={step.id}
                className={`${styles.step} ${styles[`step${capitalize(step.status)}`]}`}
              >
                <StepIcon status={step.status} />
                <div className={styles.stepContent}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepTitle}>{step.title}</span>
                    {step.status === 'complete' && step.duration !== undefined && (
                      <span className={styles.stepDuration}>{formatDuration(step.duration)}</span>
                    )}
                  </div>

                  {/* Progress bar for active step */}
                  {isActiveStep && step.progress !== undefined && (
                    <div className={styles.stepProgress}>
                      <ProgressBar
                        variant="determinate"
                        value={step.progress}
                        kind="info"
                        showLabel={false}
                        showContent={false}
                      />
                    </div>
                  )}

                  {/* Streaming text for active step */}
                  {isActiveStep && streamingText && <StreamingText text={streamingText} />}

                  {/* Tool call visualization */}
                  {isActiveStep && toolCall && (
                    <ToolCallDisplay name={toolCall.name} params={toolCall.params} />
                  )}

                  {/* Description */}
                  {step.description && (
                    <span className={styles.stepDescription}>{step.description}</span>
                  )}

                  {/* Error state */}
                  {step.status === 'error' && step.result && (
                    <span className={styles.stepError}>{step.result}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default ThinkingSteps;
