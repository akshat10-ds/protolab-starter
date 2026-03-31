/**
 * AgentActionCard Component
 *
 * Displays proposed agent actions awaiting user approval.
 * Shows action type, parameters, and provides execute/cancel controls.
 *
 * @example
 * ```tsx
 * <AgentActionCard
 *   action={{
 *     id: '1',
 *     type: 'analyze',
 *     label: 'Analyze Contract Terms',
 *     description: 'Review and extract key terms from the agreement',
 *     status: 'proposed',
 *     parameters: { document: 'NDA-2024.pdf' },
 *   }}
 *   onExecute={(id) => console.log('Execute:', id)}
 *   onCancel={(id) => console.log('Cancel:', id)}
 * />
 * ```
 */

// AgentActionCard Component
import { Icon, Button, ProgressBar } from '@/design-system';
import type { AgentAction, AgentActionType, AgentActionStatus } from './types';
import styles from './AgentActionCard.module.css';

// =============================================================================
// Types
// =============================================================================

export interface AgentActionCardProps {
  /** The action to display */
  action: AgentAction;
  /** Called when user clicks Execute */
  onExecute?: (actionId: string) => void;
  /** Called when user clicks Cancel/Dismiss */
  onCancel?: (actionId: string) => void;
  /** Called when user clicks Retry (error state) */
  onRetry?: (actionId: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Progress value 0-100 when executing */
  progress?: number;
  /** Streaming output text */
  outputText?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getActionIcon(type: AgentActionType): string {
  const iconMap: Record<AgentActionType, string> = {
    analyze: 'search',
    draft: 'document-edit',
    route: 'send',
    schedule: 'calendar',
    generate: 'document-text',
    update: 'refresh',
    notify: 'bell',
  };
  return iconMap[type] || 'sparkle';
}

function getActionTypeLabel(type: AgentActionType): string {
  const labelMap: Record<AgentActionType, string> = {
    analyze: 'Analysis',
    draft: 'Draft',
    route: 'Route',
    schedule: 'Schedule',
    generate: 'Generate',
    update: 'Update',
    notify: 'Notify',
  };
  return labelMap[type] || type;
}

function getStatusLabel(status: AgentActionStatus): string {
  const labelMap: Record<AgentActionStatus, string> = {
    proposed: 'Proposed',
    executing: 'Executing',
    complete: 'Complete',
    cancelled: 'Cancelled',
    error: 'Failed',
  };
  return labelMap[status] || status;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================================================================
// Main Component
// =============================================================================

export function AgentActionCard({
  action,
  onExecute,
  onCancel,
  onRetry,
  className,
  progress,
  outputText,
}: AgentActionCardProps) {
  const { id, type, label, description, icon, status, parameters, result } = action;
  const displayIcon = icon || getActionIcon(type);

  const isProposed = status === 'proposed';
  const isExecuting = status === 'executing';
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isCancelled = status === 'cancelled';

  const handleExecute = () => {
    onExecute?.(id);
  };

  const handleCancel = () => {
    onCancel?.(id);
  };

  const handleRetry = () => {
    onRetry?.(id);
  };

  return (
    <div
      className={`${styles.container} ${styles[`status${capitalize(status)}`]} ${className || ''}`}
    >
      {/* Header with action type badge */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.actionIcon}>
            <Icon name={displayIcon as any} size="small" />
          </span>
          <span className={styles.actionType}>{getActionTypeLabel(type)}</span>
        </div>
        <span className={styles.statusBadge} data-status={status}>
          {isExecuting && <span className={styles.statusDot} />}
          {getStatusLabel(status)}
        </span>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        <h4 className={styles.title}>{label}</h4>
        <p className={styles.description}>{description}</p>

        {/* Parameters */}
        {parameters && Object.keys(parameters).length > 0 && (
          <div className={styles.parameters}>
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key} className={styles.paramRow}>
                <span className={styles.paramKey}>{key}</span>
                <span className={styles.paramValue}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Execution progress */}
        {isExecuting && progress !== undefined && (
          <div className={styles.progressSection}>
            <ProgressBar
              variant="determinate"
              value={progress}
              kind="info"
              showLabel={false}
              showContent={false}
            />
            <span className={styles.progressLabel}>{progress}%</span>
          </div>
        )}

        {/* Streaming output */}
        {isExecuting && outputText && <div className={styles.outputStream}>{outputText}</div>}

        {/* Success result */}
        {isComplete && result && (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <Icon name="status-check" size="small" />
              <span>Result</span>
            </div>
            <div className={styles.resultContent}>{result.output}</div>
            {result.artifacts && result.artifacts.length > 0 && (
              <div className={styles.artifacts}>
                {result.artifacts.map((artifact, i) => (
                  <span key={i} className={styles.artifactTag}>
                    <Icon name="document" size="small" />
                    {artifact}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error result */}
        {isError && result && (
          <div className={styles.errorSection}>
            <div className={styles.errorHeader}>
              <Icon name="status-warn" size="small" />
              <span>Error</span>
            </div>
            <div className={styles.errorContent}>
              {result.error || 'An unexpected error occurred'}
            </div>
          </div>
        )}
      </div>

      {/* Footer with action buttons */}
      <div className={styles.footer}>
        {isProposed && (
          <>
            <Button kind="secondary" size="small" onClick={handleCancel}>
              Dismiss
            </Button>
            <Button kind="primary" size="small" onClick={handleExecute}>
              <Icon name="flash" size="small" />
              Execute
            </Button>
          </>
        )}

        {isExecuting && (
          <Button kind="secondary" size="small" onClick={handleCancel} disabled>
            <Icon name="close" size="small" />
            Cancel
          </Button>
        )}

        {isError && (
          <>
            <Button kind="secondary" size="small" onClick={handleCancel}>
              Dismiss
            </Button>
            <Button kind="primary" size="small" onClick={handleRetry}>
              <Icon name="refresh" size="small" />
              Retry
            </Button>
          </>
        )}

        {isComplete && (
          <Button kind="secondary" size="small" onClick={handleCancel}>
            Done
          </Button>
        )}

        {isCancelled && <span className={styles.cancelledNote}>Action dismissed</span>}
      </div>
    </div>
  );
}

export default AgentActionCard;
