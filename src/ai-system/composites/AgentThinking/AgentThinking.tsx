/**
 * AgentThinking — Agent reasoning accordion
 *
 * Single accordion with a live-updating header that shows the current step
 * while streaming and an outcome summary when done.
 *
 * Steps appear one-by-one with realistic timing per step kind.
 * Collapsed by default — user clicks to expand.
 *
 * Ported from the decided ThinkingReasoningExploration spec.
 *
 * @example
 * ```tsx
 * <AgentThinking
 *   steps={[
 *     { kind: 'thinking', title: 'Analyzing agreement', text: 'Looking at clause structure...' },
 *     { kind: 'searching', title: 'Searching precedent database', result: '12 matches' },
 *     { kind: 'reading', title: 'Reading indemnification section', result: 'Section 4.2' },
 *     { kind: 'done', title: 'Done' },
 *   ]}
 *   outcomeSummary="Analyzed 3 sections, found 2 risk factors"
 * />
 * ```
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Icon, Badge } from '@ink';
import styles from './AgentThinking.module.css';

// =============================================================================
// Types
// =============================================================================

export type StepKind = 'thinking' | 'searching' | 'reading' | 'writing' | 'processing' | 'tool' | 'done';

export interface AgentStep {
  /** What kind of step this is */
  kind: StepKind;
  /** Step title / label */
  title: string;
  /** Reasoning text (only for 'thinking' kind) */
  text?: string;
  /** Tool name for tool steps */
  toolName?: string;
  /** Ink icon name override */
  toolIcon?: string;
  /** URL to brand logo image */
  brandLogo?: string;
  /** Result badge text */
  result?: string;
}

export interface AgentThinkingProps {
  /** Array of agent steps to display */
  steps: AgentStep[];
  /** Summary text shown in header when all steps are done */
  outcomeSummary: string;
  /** Callback fired when the component transitions to done */
  onComplete?: () => void;
  /** Whether the accordion starts expanded (default: false) */
  defaultExpanded?: boolean;
  /** Skip animation and render in the finalized done state immediately */
  initialDone?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

// 'done' is deliberately absent: that branch renders a filled doneCircle with a
// 'check' glyph, so a STEP_ICONS entry for it would never be read.
const STEP_ICONS: Record<Exclude<StepKind, 'done'>, string> = {
  thinking: 'ai-spark-filled',
  searching: 'search',
  reading: 'data-read',
  writing: 'document-pencil',
  processing: 'gear',
  tool: 'plugin',
};

// =============================================================================
// Component
// =============================================================================

export const AgentThinking: React.FC<AgentThinkingProps> = ({
  steps,
  outcomeSummary,
  onComplete,
  defaultExpanded = false,
  initialDone = false,
}) => {
  const [phase, setPhase] = useState<'streaming' | 'collapsed'>(initialDone ? 'collapsed' : 'streaming');
  const [visibleCount, setVisibleCount] = useState(initialDone ? steps.length : 0);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  // ------ step animation ------
  useEffect(() => {
    if (initialDone) {
      setPhase('collapsed');
      setVisibleCount(steps.length);
      return;
    }

    setPhase('streaming');
    setVisibleCount(0);
    setIsExpanded(false);

    let current = 0;
    const advance = () => {
      current++;
      setVisibleCount(current);
      if (current >= steps.length) {
        setTimeout(() => {
          setPhase('collapsed');
          onCompleteRef.current?.();
        }, 1000);
      } else {
        const next = steps[current];
        let delay: number;
        switch (next?.kind) {
          case 'thinking': delay = 2500 + Math.random() * 1000; break;
          case 'searching': delay = 1800 + Math.random() * 800; break;
          case 'reading': delay = 2000 + Math.random() * 600; break;
          case 'writing': delay = 2000 + Math.random() * 600; break;
          case 'processing': delay = 2200 + Math.random() * 800; break;
          case 'tool': delay = 1500 + Math.random() * 1000; break;
          case 'done': delay = 600; break;
          default: delay = 1500;
        }
        setTimeout(advance, delay);
      }
    };
    // Initial pause before first step appears
    setTimeout(advance, 1500);
  }, [steps, initialDone]);

  // ------ early return ------
  if (steps.length === 0) return null;

  const isStreaming = phase === 'streaming';

  // ------ header text: last visible non-done step, or summary when done ------
  const currentStepText = (() => {
    if (!isStreaming) return outcomeSummary;
    const visible = steps.slice(0, visibleCount);
    const lastMeaningful = [...visible].reverse().find(s => s.kind !== 'done');
    return lastMeaningful?.title || 'Thinking...';
  })();

  return (
    <div className={styles.agentThinking} data-phase={phase}>
      {/* Accordion header */}
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        data-streaming={isStreaming}
      >
        <span className={`${styles.headerText} ${isStreaming ? styles.shimmerText : ''}`}>
          {currentStepText}
        </span>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size="small"
          className={styles.headerChevron}
        />
      </button>

      {/* Expanded step list */}
      {isExpanded && (
        <div className={styles.stepsList}>
          {steps.slice(0, isStreaming ? visibleCount : steps.length).map((step, index) => (
            <div key={`${index}-${step.kind}-${step.title}`} className={styles.step} data-kind={step.kind}>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <span className={styles.connectorLine} />
              )}

              {/* Step icon */}
              <span className={styles.stepIcon} data-kind={step.kind}>
                {step.kind === 'done' ? (
                  <span className={styles.doneCircle}>
                    <Icon name="check" size={10} />
                  </span>
                ) : step.brandLogo ? (
                  <img
                    src={step.brandLogo}
                    alt={step.toolName || ''}
                    className={styles.brandLogo}
                  />
                ) : (
                  <Icon
                    name={(step.toolIcon as string) || STEP_ICONS[step.kind]}
                    size="small"
                  />
                )}
              </span>

              {/* Step content */}
              <div className={styles.stepContent}>
                {step.kind === 'thinking' && (
                  <>
                    <div className={styles.stepTitle}>{step.title}</div>
                    {step.text && (
                      <div className={styles.reasoning}>
                        {step.text.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx} className={styles.reasoningText}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {step.kind !== 'thinking' && step.kind !== 'done' && (
                  <div className={styles.toolRow}>
                    <span className={styles.toolLabel}>{step.toolName || step.title}</span>
                    {step.result && (
                      <Badge text={step.result} kind="subtle" />
                    )}
                  </div>
                )}

                {step.kind === 'done' && (
                  <span className={styles.doneText}>{step.title}</span>
                )}
              </div>
            </div>
          ))}

          {/* Skeleton for next step while streaming */}
          {isStreaming && visibleCount < steps.length && (
            <div className={styles.step}>
              <span className={styles.stepIcon}>
                <span className={styles.spinnerDot} />
              </span>
              <div className={styles.skeletonGroup}>
                <div className={styles.skeletonLine} style={{ width: '55%' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentThinking;
