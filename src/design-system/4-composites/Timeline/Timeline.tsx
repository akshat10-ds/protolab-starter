import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Timeline.module.css';
import { Icon, IconName } from '../../3-primitives/Icon';

/**
 * Ink Timeline — a vertical run of dated events on a single rail.
 *
 * Ports `[ds-ui] Child/[INK] Timeline.Step` (node 907:9961). The master's
 * `status=other` is `current` here; `complete` and `incomplete` keep their
 * names. The rail is drawn as the master draws it: every row owns a `before`
 * segment above its dot and an `end` segment below, each coloured by that
 * row's own status, with the first row's `before` and the last row's `end`
 * suppressed.
 */

export type TimelineStatus = 'complete' | 'current' | 'incomplete' | 'error' | 'success' | 'warning';

export interface TimelineItem {
  /** Unique identifier for the event */
  id: string;
  /** Timestamp line above the label */
  timestamp?: string;
  /** Event label */
  label: string;
  /** Body text below the label; expandable when the Timeline is collapsible */
  description?: React.ReactNode;
  /** Icon shown before the label */
  icon?: IconName;
  iconElement?: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Overrides the status derived from `activeIndex` */
  status?: TimelineStatus;
  /** Call-to-action row under the event (Buttons, usually) */
  actions?: React.ReactNode;
}

export interface TimelineProps {
  /** Events, oldest first */
  items: TimelineItem[];
  /** Index of the current event — earlier are complete, later incomplete */
  activeIndex?: number;
  /** Descriptions collapse behind a chevron and start closed */
  collapsible?: boolean;
  /** Ids open on mount (collapsible only) */
  defaultOpenIds?: string[];
  openIds?: string[];
  onOpenIdsChange?: (ids: string[]) => void;
  railTone?: 'default' | 'subtle';
  /** Custom className */
  className?: string;
}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>((props, ref) => {
  const {
    items,
    activeIndex = items.length - 1,
    collapsible = false,
    defaultOpenIds,
    openIds: controlledOpenIds,
    onOpenIdsChange,
    railTone = 'default',
    className,
    ...restProps
  } = props;

  const [internalOpenIds, setOpenIds] = React.useState<string[]>(defaultOpenIds ?? []);

  const openIds = controlledOpenIds ?? internalOpenIds;
  const instanceId = React.useId();

  const statusOf = (item: TimelineItem, index: number): TimelineStatus => {
    if (item.status) return item.status;
    if (index < activeIndex) return 'complete';
    if (index === activeIndex) return 'current';
    return 'incomplete';
  };

  const toggle = (item: TimelineItem, isOpen: boolean) => {
    const next = isOpen ? openIds.filter(id => id !== item.id) : [...openIds, item.id];
    if (controlledOpenIds === undefined && item.open === undefined) setOpenIds(next);
    onOpenIdsChange?.(next);
    item.onOpenChange?.(!isOpen);
  };

  return (
    <ol
      data-ink-component="Timeline"
      ref={ref}
      className={cn(styles.timeline, railTone === 'subtle' && styles.subtleRail, className)}
      {...restProps}
    >
      {items.map((item, index) => {
        const status = statusOf(item, index);
        const itemCollapsible = item.collapsible ?? collapsible;
        const isOpen = !itemCollapsible || (item.open ?? openIds.includes(item.id));
        const canCollapse = itemCollapsible && Boolean(item.description);

        return (
          <li key={item.id} className={cn(styles.row, styles[status])} data-status={status}>
            <div className={styles.rail} aria-hidden="true">
              <span className={cn(styles.segment, index === 0 && styles.suppressed)} />
              <span className={styles.dotSlot}>
                {status === 'error' || status === 'success' || status === 'warning'
                  ? <Icon name={status === 'error' ? 'status-error' : status === 'success' ? 'status-verify' : 'status-warn'} size="small" className={styles.statusIcon} />
                  : <span className={styles.dot} />}
              </span>
              <span
                className={cn(
                  styles.segment,
                  styles.end,
                  index === items.length - 1 && styles.suppressed
                )}
              />
            </div>

            <div className={styles.content}>
              <div className={styles.event}>
                {item.timestamp && <div className={styles.timestamp}>{item.timestamp}</div>}
                <div className={styles.labelRow}>
                  {item.iconElement ?? (item.icon && <Icon name={item.icon} size={20} className={styles.icon} />)}
                  <span className={styles.label}>{item.label}</span>
                  {canCollapse && (
                    <button
                      type="button"
                      className={styles.disclosure}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                      aria-controls={`${instanceId}-${item.id}`}
                      onClick={() => toggle(item, isOpen)}
                    >
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} />
                    </button>
                  )}
                </div>
                {item.description && isOpen && (
                  <div id={`${instanceId}-${item.id}`} className={styles.description}>{item.description}</div>
                )}
              </div>
              {item.actions && <div className={styles.footer}>{item.actions}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
});

Timeline.displayName = 'InkTimeline';

export { Timeline };
