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

export type TimelineStatus = 'complete' | 'current' | 'incomplete';

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
  /** Custom className */
  className?: string;
}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>((props, ref) => {
  const {
    items,
    activeIndex = items.length - 1,
    collapsible = false,
    defaultOpenIds,
    className,
    ...restProps
  } = props;

  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpenIds ?? []);

  const statusOf = (item: TimelineItem, index: number): TimelineStatus => {
    if (item.status) return item.status;
    if (index < activeIndex) return 'complete';
    if (index === activeIndex) return 'current';
    return 'incomplete';
  };

  const toggle = (id: string) =>
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  return (
    <ol
      data-ink-component="Timeline"
      ref={ref}
      className={cn(styles.timeline, className)}
      {...restProps}
    >
      {items.map((item, index) => {
        const status = statusOf(item, index);
        const isOpen = !collapsible || openIds.includes(item.id);
        const canCollapse = collapsible && Boolean(item.description);

        return (
          <li key={item.id} className={cn(styles.row, styles[status])} data-status={status}>
            <div className={styles.rail} aria-hidden="true">
              <span className={cn(styles.segment, index === 0 && styles.suppressed)} />
              <span className={styles.dotSlot}>
                <span className={styles.dot} />
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
                  {item.icon && <Icon name={item.icon} size={20} className={styles.icon} />}
                  <span className={styles.label}>{item.label}</span>
                  {canCollapse && (
                    <button
                      type="button"
                      className={styles.disclosure}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                      onClick={() => toggle(item.id)}
                    >
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} />
                    </button>
                  )}
                </div>
                {item.description && isOpen && (
                  <div className={styles.description}>{item.description}</div>
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
