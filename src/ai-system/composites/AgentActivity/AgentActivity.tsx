/**
 * AgentActivity — an inbox of headless agent runs, and each run's transcript.
 *
 * Two views in one nav page. The list is the inbox: one 40px row per run —
 * agent name, what it did, when, a status mark. Clicking a row opens the run's
 * transcript: a read-only, chat-like record of what the agent did, composed
 * from the decided Tier 2 parts (MessageBubble, AgentThinking,
 * MarkdownRenderer / StreamingMarkdown). No input — a run is read, not chatted
 * with.
 *
 * Chrome matches NavPage (title 24 bold, subtitle, search, bottom-anchored
 * list); rows take the `card` appearance values from ZeroQueryActions. Status
 * filter chips (All · Running · Needs attention · Done) sit between search and
 * the list — single-select, composing with search; the All view sorts
 * needs-attention first, then running, then done. Status
 * follows ToolCallCard: a neutral secondary label, the glyph carries the
 * difference — `process-spinner` spins for running, `status-check` for done,
 * `status-warn` for needs-attention. No status is painted red.
 *
 * Rendered by the host through `IrisAgent.navPageSlot`, as a sibling of the
 * Agents and Prompt Library pages. The component owns which run is open;
 * `onNavBack` in the header still exits the whole page.
 *
 * UNDECIDED — rough, directional. Akshat iterates on this surface.
 */

import { useMemo, useState } from 'react';
import { Icon, SearchInput } from '@ink';

import { MessageBubble } from '@ai/primitives/MessageBubble/MessageBubble';
import { AgentThinking } from '@ai/composites/AgentThinking/AgentThinking';
import type { AgentStep } from '@ai/composites/AgentThinking/AgentThinking';
import { MarkdownRenderer } from '@ai/composites/MarkdownRenderer/MarkdownRenderer';
import { StreamingMarkdown } from '@ai/composites/StreamingMarkdown/StreamingMarkdown';

import styles from './AgentActivity.module.css';

// =============================================================================
// Types
// =============================================================================

export type AgentRunStatus = 'running' | 'done' | 'needs-attention';

/** The status filter chips above the list. */
type StatusFilter = 'all' | AgentRunStatus;

/** One entry in a run's transcript. */
export type AgentRunEvent =
  /** What started or instructed the run. Rendered as a user-side bubble. */
  | { type: 'trigger'; text: string }
  /** A reasoning / tool-step block. Rendered as a finished AgentThinking accordion. */
  | { type: 'thinking'; steps: AgentStep[]; outcome: string }
  /** The agent reporting in markdown. Streams when the run is still running. */
  | { type: 'message'; markdown: string };

export interface AgentRun {
  id: string;
  /** The agent's name — "Renewals Agent". */
  agent: string;
  /** What it did, one line. */
  summary: string;
  /** When, already formatted — "12 min ago". */
  timestamp: string;
  status: AgentRunStatus;
  /** Ink icon for the row. Defaults to `flash`. */
  icon?: string;
  transcript: AgentRunEvent[];
}

export interface AgentActivityProps {
  runs: AgentRun[];
  title?: string;
  subtitle?: string;
}

// =============================================================================
// Constants
// =============================================================================

/* Same precedent as ToolCallCard: the glyph differs, the color does not. */
const STATUS: Record<AgentRunStatus, { icon: string; label: string }> = {
  running: { icon: 'process-spinner', label: 'Running' },
  done: { icon: 'status-check', label: 'Done' },
  'needs-attention': { icon: 'status-warn', label: 'Needs attention' },
};

/* Chip order is decided: All · Running · Needs attention · Done. */
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'running', label: 'Running' },
  { key: 'needs-attention', label: 'Needs attention' },
  { key: 'done', label: 'Done' },
];

/* All view: needs-attention first, then running, then done. Stable sort keeps
   recency (the array order) inside each group. */
const STATUS_RANK: Record<AgentRunStatus, number> = {
  'needs-attention': 0,
  running: 1,
  done: 2,
};

const EMPTY_BY_FILTER: Record<StatusFilter, string> = {
  all: 'No activity yet.',
  running: 'Nothing running.',
  'needs-attention': 'Nothing needs attention.',
  done: 'Nothing done yet.',
};

// =============================================================================
// Component
// =============================================================================

function StatusMark({ status }: { status: AgentRunStatus }) {
  const s = STATUS[status];
  return (
    <span className={styles.status} data-status={status}>
      <span className={styles.statusIcon} data-status={status} aria-hidden="true">
        <Icon name={s.icon as never} size="small" />
      </span>
      {s.label}
    </span>
  );
}

export function AgentActivity({
  runs,
  title = 'Activity',
  subtitle = 'What your agents have been doing.',
}: AgentActivityProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = filter === 'all' ? runs : runs.filter((run) => run.status === filter);
    if (q) {
      out = out.filter(
        (run) =>
          run.agent.toLowerCase().includes(q) || run.summary.toLowerCase().includes(q)
      );
    }
    if (filter === 'all') {
      out = [...out].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
    }
    return out;
  }, [runs, query, filter]);

  /* Count from all runs, not the searched set — a count that shrinks as you
     type reads as broken. Shown only on Needs attention: that is the one chip
     where the number is the signal. */
  const needsAttention = runs.filter((run) => run.status === 'needs-attention').length;

  const open = openId ? runs.find((run) => run.id === openId) : undefined;

  // ── Detail — the run's transcript ─────────────────────────────────────────
  if (open) {
    return (
      <div className={styles.page}>
        <div className={styles.detail}>
          <button type="button" className={styles.back} onClick={() => setOpenId(null)}>
            <Icon name={'arrow-left' as never} size="small" />
            All activity
          </button>

          <div className={styles.heading}>
            <h2 className={styles.title}>{open.agent}</h2>
            <p className={styles.subtitle}>{open.summary}</p>
            <div className={styles.detailMeta}>
              <StatusMark status={open.status} />
              <span className={styles.time}>{open.timestamp}</span>
            </div>
          </div>

          <div className={styles.transcript}>
            {open.transcript.map((event, i) => {
              const isLast = i === open.transcript.length - 1;
              switch (event.type) {
                case 'trigger':
                  return <MessageBubble key={i} text={event.text} label="Trigger" />;
                case 'thinking':
                  /*
                   * Always `initialDone`, even on a running run — the animated
                   * path ends in the done state, which would visually finish a
                   * run whose header says Running. The header carries liveness.
                   */
                  return (
                    <AgentThinking
                      key={i}
                      steps={event.steps}
                      outcomeSummary={event.outcome}
                      initialDone
                    />
                  );
                case 'message':
                  /* The one live touch: a running run's last message types itself. */
                  return open.status === 'running' && isLast ? (
                    <StreamingMarkdown key={i} content={event.markdown} />
                  ) : (
                    <MarkdownRenderer key={i} content={event.markdown} />
                  );
              }
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── List — the inbox ──────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.body}>
          <SearchInput
            size="small"
            value={query}
            onChange={setQuery}
            placeholder="Search activity"
            aria-label={`Search ${title}`}
          />

          {/* FilterTag's grammar, hand-carried — Ink's FilterTag cannot take
              aria-pressed. Selected state is styled off the attribute itself
              so the visual and the semantics cannot drift. */}
          <div className={styles.filters} role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={styles.chip}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.key === 'needs-attention' && needsAttention > 0
                  ? `${f.label} · ${needsAttention}`
                  : f.label}
              </button>
            ))}
          </div>

          {visible.length > 0 ? (
            <div className={styles.list}>
              {visible.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  className={styles.row}
                  onClick={() => setOpenId(run.id)}
                >
                  <span className={styles.rowIcon} aria-hidden="true">
                    <Icon name={(run.icon ?? 'flash') as never} size="small" />
                  </span>
                  <span className={styles.rowAgent}>{run.agent}</span>
                  <span className={styles.rowSummary}>{run.summary}</span>
                  <span className={styles.rowMeta}>
                    <span className={styles.time}>{run.timestamp}</span>
                    <StatusMark status={run.status} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              {query.trim() ? `Nothing matches “${query}”.` : EMPTY_BY_FILTER[filter]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentActivity;
