/**
 * InsightList — the findings the surface already made, as objects you can act on.
 *
 * Akshat, 2026-08-13: *"we can do an insights list for this page"*, and the card
 * should be *"sort of like gmail suggested tasks"*. So a finding is not a line of
 * text under a greeting; it is a self-contained recommendation with its own
 * evidence and its own way in.
 *
 * **The action opens the conversation about the finding.** It does not navigate
 * away and it does not mark anything done — Akshat: *"way more interesting to
 * have them be in iris because then you can interact with them."* A card sends a
 * full query and the answer arrives in the chat, with citations, like any other
 * turn.
 *
 * **Dismiss only.** There is no complete state, no check mark and no snooze. A
 * finding is not a to-do; the user either takes it up or takes it away.
 *
 * **The card is the target.** Hover tints the whole card and the action label is
 * a legend, not a second button — `GetStarted`'s row grammar, at card size. The
 * only separate control is dismiss.
 *
 * The box comes from Figma `ZeroQuery/SummaryCard` (node 6:2196) and agrees with
 * the panel's other cards on fill, hairline, radius and row gap.
 *
 * **The host owns the list.** Which insights exist, and whether a dismissed one
 * disappears, are the host's; this component only draws what it is given.
 */

import { useId } from 'react';
import { Icon } from '@ink';

import styles from './InsightList.module.css';

// =============================================================================
// Types
// =============================================================================

export interface Insight {
  /** Stable key. */
  id: string;
  /** The finding, as a short imperative or a claim. */
  title: string;
  /** The evidence — where it came from, why it matters. Cut to three lines. */
  body: string;
  /** A date, a count, a source name. Sits under the title. */
  meta?: string;
  /** The action's visible label. Default `Ask Iris`. */
  actionLabel?: string;
  /** Opens the conversation about this finding. Wins over the list's `onAction`. */
  onAction?: () => void;
  /** Removes it. Wins over the list's `onDismiss`. Omit both and there is no control. */
  onDismiss?: () => void;
}

export interface InsightListProps {
  insights: Insight[];
  /** A quiet line above the list, e.g. "3 things to look at". */
  heading?: string;
  /** Fallback action, when an insight carries none. */
  onAction?: (id: string) => void;
  /** Fallback dismiss, when an insight carries none. */
  onDismiss?: (id: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function InsightList({
  insights,
  heading,
  onAction,
  onDismiss,
}: InsightListProps) {
  const uid = useId();

  if (insights.length === 0) return null;

  return (
    <section className={styles.root} aria-label={heading ?? 'Insights'}>
      {heading && <p className={styles.heading}>{heading}</p>}

      <ul className={styles.list}>
        {insights.map((insight) => {
          const titleId = `insight-title-${uid}-${insight.id}`;
          const action = insight.onAction ?? (onAction && (() => onAction(insight.id)));
          const dismiss = insight.onDismiss ?? (onDismiss && (() => onDismiss(insight.id)));

          return (
            <li key={insight.id} className={styles.card}>
              {/*
                One button over the whole card. `aria-labelledby` points at the
                title so the accessible name is the finding, not the finding
                plus its evidence plus the action label read as one sentence.
              */}
              <button
                type="button"
                className={`${styles.main} ${dismiss ? styles.mainDismissable : ''}`}
                aria-labelledby={titleId}
                onClick={action}
              >
                <span id={titleId} className={styles.title}>
                  {insight.title}
                </span>
                {insight.meta && <span className={styles.meta}>{insight.meta}</span>}
                <span className={styles.body}>{insight.body}</span>
                <span className={styles.action}>{insight.actionLabel ?? 'Ask Iris'}</span>
              </button>

              {dismiss && (
                <button
                  type="button"
                  className={styles.dismiss}
                  aria-label={`Dismiss “${insight.title}”`}
                  onClick={dismiss}
                >
                  <Icon name="close" size="small" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
