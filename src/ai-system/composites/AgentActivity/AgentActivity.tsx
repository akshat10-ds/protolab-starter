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
 * `appearance="workspace"` opts into result-led rows and a run record with
 * left-aligned instruction context. The default retains this compact inbox.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, Card, Dropdown, FilterTag, Icon, IconButton, SearchInput, StatusLight, Table, Text } from '@ink';

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
type ActivityView = 'list' | 'kanban' | 'table';

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
  /** Omit the section heading when the host already names this surface. */
  showHeading?: boolean;
  /** Result-led workspace list and run record. Default keeps the compact inbox. */
  appearance?: 'default' | 'workspace';
  /** Offer List, Kanban, and Table layouts in the workspace appearance only. */
  viewSwitcher?: boolean;
  /** Icon-only Ink controls, labelled for keyboard and assistive technology. */
  viewSwitcherStyle?: 'text' | 'icons';
  /** Initial workspace layout. Other appearances retain the list. */
  defaultView?: ActivityView;
  /** Return true when the host opens this run in its own contextual surface. */
  onOpenRun?: (run: AgentRun) => boolean;
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

const VIEWS: { id: ActivityView; label: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'table', label: 'Table' },
];
const BOARD_STATUSES: AgentRunStatus[] = ['needs-attention', 'running', 'done'];

const EMPTY_BY_FILTER: Record<StatusFilter, string> = {
  all: 'No activity yet.',
  running: 'Nothing running.',
  'needs-attention': 'Nothing needs attention.',
  done: 'Nothing done yet.',
};

// =============================================================================
// Component
// =============================================================================

function StatusMark({ status, workspace = false, count }: { status: AgentRunStatus; workspace?: boolean; count?: number }) {
  const s = STATUS[status];
  if (workspace) {
    return <StatusLight kind={status === 'needs-attention' ? 'warning' : status === 'done' ? 'success' : 'neutral'}
      className={status === 'running' ? styles.runningStatus : undefined} noFill text={count === undefined ? s.label : `${s.label} (${count})`} />;
  }
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
  showHeading = true,
  appearance = 'default',
  viewSwitcher = false,
  viewSwitcherStyle = 'text',
  defaultView = 'list',
  onOpenRun,
}: AgentActivityProps) {
  const isWorkspace = appearance === 'workspace';
  const canSwitchView = isWorkspace && viewSwitcher;
  const [selectedView, setSelectedView] = useState<ActivityView>(defaultView);
  const view = canSwitchView ? selectedView : 'list';
  const viewId = useId();
  const viewRefs = useRef(new Map<ActivityView, HTMLButtonElement | HTMLAnchorElement>());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement | HTMLAnchorElement>());
  const returnFocusId = useRef<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const detailBackRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isWorkspace) return;
    if (openId) {
      detailBackRef.current?.focus({ preventScroll: true });
      return;
    }
    if (!returnFocusId.current) return;
    rowRefs.current.get(returnFocusId.current)?.focus({ preventScroll: true });
    returnFocusId.current = null;
  }, [openId, isWorkspace]);

  const pageClass = `${styles.page} ${isWorkspace ? styles.workspace : ''}`;
  const registerRun = (id: string, node: HTMLButtonElement | HTMLAnchorElement | null) => {
    if (node) rowRefs.current.set(id, node);
    else rowRefs.current.delete(id);
  };

  const openRun = (run: AgentRun) => {
    if (onOpenRun?.(run)) return;
    setOpenId(run.id);
  };

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
    const backToList = () => {
      if (isWorkspace) returnFocusId.current = open.id;
      setOpenId(null);
    };
    const firstMessageIndex = open.transcript.findIndex((event) => event.type === 'message');
    return (
      <div className={pageClass} data-agent-activity-appearance={appearance}>
        <div className={styles.detail}>
          {isWorkspace ? (
            <Button ref={detailBackRef} kind="tertiary" size="small" className={styles.workspaceBack}
              startElement={<Icon name="arrow-left" size="small" />} onClick={backToList}>
              All activity
            </Button>
          ) : <button type="button" className={styles.back} onClick={backToList}>
            <Icon name={'arrow-left' as never} size="small" />
            All activity
          </button>}

          <div className={styles.heading}>
            <h2 className={styles.title}>{isWorkspace ? open.summary : open.agent}</h2>
            <p className={styles.subtitle}>{isWorkspace ? open.agent : open.summary}</p>
            <div className={styles.detailMeta}>
              <StatusMark status={open.status} workspace={isWorkspace} />
              <span className={styles.time}>{open.timestamp}</span>
            </div>
          </div>

          <div className={styles.transcript}>
            {open.transcript.map((event, i) => {
              const isLast = i === open.transcript.length - 1;
              switch (event.type) {
                case 'trigger':
                  return isWorkspace ? (
                    <div key={i} className={styles.instruction}>
                      <Text size="xs" weight="medium" color="secondary">Instructions</Text>
                      <Text size="sm" color="secondary">{event.text}</Text>
                    </div>
                  ) : <MessageBubble key={i} text={event.text} label="Trigger" />;
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
                case 'message': {
                  // The result is already the record's title. Remove only an
                  // identical opening paragraph, retaining all remaining output.
                  const opening = event.markdown.match(/^([\s\S]*?)(?:\r?\n\s*\r?\n|$)/);
                  const markdown = isWorkspace && i === firstMessageIndex && opening?.[1].trim() === open.summary.trim()
                    ? event.markdown.slice(opening[0].length).trimStart()
                    : event.markdown;
                  if (isWorkspace && !markdown) return null;
                  /* The one live touch: a running run's last message types itself. */
                  return open.status === 'running' && isLast ? (
                    <StreamingMarkdown key={i} content={markdown} />
                  ) : (
                    <MarkdownRenderer key={i} content={markdown} />
                  );
                }
              }
            })}
          </div>
        </div>
      </div>
    );
  }

  const search = <SearchInput
    ref={searchRef}
    size="small"
    className={isWorkspace ? styles.workspaceSearch : undefined}
    value={query}
    onChange={setQuery}
    placeholder="Search activity"
    aria-label={`Search ${title}`}
  />;
  const filters = isWorkspace ? (
    <Dropdown variant="solid" header="Filter by status" items={FILTERS.map((option) => ({
      label: option.key === 'all' ? 'All statuses' : option.key === 'needs-attention' && needsAttention > 0
        ? `${option.label} · ${needsAttention}` : option.label,
      selected: filter === option.key,
      onClick: () => setFilter(option.key),
    }))}>
      <FilterTag label={filter === 'all' ? 'Status' : STATUS[filter].label} active={filter !== 'all'} />
    </Dropdown>
  ) : (
    <div className={styles.filters} role="group" aria-label="Filter by status">
      {FILTERS.map((f) => {
        const label = f.key === 'needs-attention' && needsAttention > 0 ? `${f.label} · ${needsAttention}` : f.label;
        return (
          <button key={f.key} type="button" className={styles.chip}
            aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{label}</button>
        );
      })}
    </div>
  );

  const heading = (
    <div className={styles.heading}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
  const viewControls = (
    <div className={styles.viewControls} role="group" aria-label="Activity view" onKeyDown={(event) => {
      const current = VIEWS.findIndex(({ id }) => viewRefs.current.get(id) === event.target);
      if (current < 0) return;
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % VIEWS.length;
      else if (event.key === 'ArrowLeft') next = (current + VIEWS.length - 1) % VIEWS.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = VIEWS.length - 1;
      else return;
      event.preventDefault();
      setSelectedView(VIEWS[next].id);
      viewRefs.current.get(VIEWS[next].id)?.focus();
    }}>
      {VIEWS.map((option) => viewSwitcherStyle === 'icons' ? (
        <IconButton key={option.id} variant="secondary" size="small"
          icon={{ list: 'layout-detail', kanban: 'layout-grid', table: 'table' }[option.id]}
          className={styles.workspaceFilter} aria-pressed={view === option.id}
          aria-label={`${option.label} view`} title={`${option.label} view`} aria-controls={viewId}
          ref={(node) => {
            if (node) viewRefs.current.set(option.id, node);
            else viewRefs.current.delete(option.id);
          }} onClick={() => setSelectedView(option.id)} />
      ) : (
        <Button key={option.id} kind="secondary" size="small" active={view === option.id}
          className={styles.workspaceFilter} aria-pressed={view === option.id}
          aria-label={`${option.label} view`} aria-controls={viewId}
          ref={(node) => {
            if (node) viewRefs.current.set(option.id, node);
            else viewRefs.current.delete(option.id);
          }} onClick={() => setSelectedView(option.id)}>
          {option.label}
        </Button>
      ))}
    </div>
  );
  const emptyState = isWorkspace ? (
    <div className={`${styles.workspaceEmpty} ${view === 'kanban' ? styles.boardEmpty : ''}`}>
      <span className={styles.emptyIcon} aria-hidden="true"><Icon name={query.trim() ? 'search' : 'data-read'} size="medium" /></span>
      <Text size="md" weight="medium">{query.trim() ? 'No matching activity' : EMPTY_BY_FILTER[filter]}</Text>
      <Text size="sm" color="secondary">{query.trim() || filter !== 'all'
        ? 'Try a different search or status.'
        : 'Your agents’ run results will appear here.'}</Text>
      {(query.trim() || filter !== 'all') && <Button kind="secondary" size="small" onClick={() => {
        setQuery('');
        setFilter('all');
        searchRef.current?.focus();
      }}>Clear filters</Button>}
    </div>
  ) : (
    <p className={styles.empty}>
      {query.trim() ? `Nothing matches “${query}”.` : EMPTY_BY_FILTER[filter]}
    </p>
  );
  const board = (
    <div className={styles.board}>
      {BOARD_STATUSES.map((status) => {
        const laneRuns = visible.filter((run) => run.status === status);
        return (
          <section key={status} className={styles.boardLane} aria-label={STATUS[status].label}>
            <header className={styles.laneHeader}>
              <h3 className={styles.laneTitle}>
                <StatusMark status={status} workspace count={laneRuns.length} />
              </h3>
            </header>
            <div className={styles.laneCards}>
              {laneRuns.map((run) => (
                <Card key={run.id} radius="small" className={styles.boardCard}>
                  <Button kind="tertiary" className={styles.boardCardButton}
                    ref={(node) => registerRun(run.id, node)} onClick={() => openRun(run)}>
                    <span className={styles.boardCardContent}>
                      <span className={styles.rowSummary}>{run.summary}</span>
                      <span className={styles.rowAgent}>{run.agent}</span>
                      <span className={styles.time}>{run.timestamp}</span>
                    </span>
                  </Button>
                </Card>
              ))}
              {laneRuns.length === 0 && <p className={styles.laneEmpty}>
                {runs.some((run) => run.status === status) && (query.trim() || filter !== 'all')
                  ? 'No matching runs.' : EMPTY_BY_FILTER[status]}
              </p>}
            </div>
          </section>
        );
      })}
    </div>
  );
  const table = (
    <div className={styles.tableScroll} role="region" aria-label="Activity table" tabIndex={0}>
      <Table<AgentRun> data={visible} getRowKey={(run) => run.id} size="medium" hoverable
        responsive={false} className={styles.activityTable}
        onRowClick={openRun} columns={[
          { key: 'summary', header: 'Result', width: '46%', cell: (run) => (
            <Button kind="tertiary" size="small" className={styles.tableResult}
              ref={(node) => registerRun(run.id, node)} onClick={() => openRun(run)}>
              {run.summary}
            </Button>
          ) },
          { key: 'agent', header: 'Agent', width: '22%' },
          { key: 'status', header: 'Status', width: '17%', cell: (run) => <StatusMark status={run.status} workspace /> },
          { key: 'timestamp', header: 'Time', width: '15%', cell: (run) => <span className={styles.time}>{run.timestamp}</span> },
        ]} />
    </div>
  );

  const activityContent = (
    <>
      {visible.length === 0 && emptyState}
      {view === 'kanban' ? board : visible.length > 0 && view === 'table' ? table : visible.length > 0 ? (
        <div className={styles.list}>
          {visible.map((run) => (
            <button
              key={run.id}
              type="button"
              className={styles.row}
              ref={isWorkspace ? (node) => {
                if (node) rowRefs.current.set(run.id, node);
                else rowRefs.current.delete(run.id);
              } : undefined}
              onClick={() => openRun(run)}
            >
              <span className={styles.rowIcon} aria-hidden="true">
                <Icon name={(run.icon ?? (isWorkspace ? 'data-read' : 'flash')) as never} size="small" />
              </span>
              {isWorkspace ? (
                <span className={styles.rowContent}>
                  <span className={styles.rowSummary}>{run.summary}</span>
                  <span className={styles.rowAgent}>{run.agent}</span>
                </span>
              ) : <>
                <span className={styles.rowAgent}>{run.agent}</span>
                <span className={styles.rowSummary}>{run.summary}</span>
              </>}
              <span className={styles.rowMeta}>
                <span className={styles.time}>{run.timestamp}</span>
                <StatusMark status={run.status} workspace={isWorkspace} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );

  // ── Activity view ─────────────────────────────────────────────────────────
  return (
    <div className={pageClass} data-agent-activity-appearance={appearance}>
      <div className={styles.column}>
        {showHeading && (canSwitchView ? <div className={styles.headingWithViews}>{heading}{viewControls}</div> : heading)}

        <div className={styles.body}>
          {isWorkspace ? <div className={styles.workspaceToolbar}>{search}{filters}{!showHeading && canSwitchView && <div className={styles.toolbarViews}>{viewControls}</div>}</div> : <>{search}{filters}</>}

          {canSwitchView ? <div id={viewId} className={styles.viewContent}>{activityContent}</div> : activityContent}
        </div>
      </div>
    </div>
  );
}

export default AgentActivity;
