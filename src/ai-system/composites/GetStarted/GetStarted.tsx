/**
 * GetStarted — the onboarding checklist on the cold state.
 *
 * It sits below the zero-query rows and above the composer. The rows use the
 * grammar of `ZeroQueryActions`: 40px, the same gap, the same hover tint, the
 * same radius, the same type. The checklist rows and the suggestion rows read
 * as one list.
 *
 * **One progress encoding.** The header shows the count — "Get started · 1 of
 * 4". There is no progress bar.
 *
 * **The row is the target.** A click on a not-done row runs its `onTry`. There
 * is no "Try" button. A done row is a record, not a target — it takes no click
 * and shows no hover tint.
 *
 * **Three variants, on one component:**
 *
 * - `rows` — the card: title row with the count, caret, dismiss, and the
 *   checklist rows when open.
 * - `inline` — closed, one 40px row in suggestion grammar with a trailing
 *   caret and no card chrome. Open, it unfolds in place to the rows, with the
 *   collapse caret and the dismiss.
 * - `next` — one row: the count and the first undone item, "Next: …". No
 *   caret, nothing expands. When every item is done it shows one done line.
 *
 * **Two markers, for `rows` and the open `inline` state:**
 *
 * - `check` — a not-done row leads with the item's `icon` when it has one,
 *   else with no mark. A done row leads with a check glyph and dims the label.
 * - `number` — a not-done row leads with a plain numeral. A done row replaces
 *   the numeral with the check glyph and dims the label.
 *
 * **The host owns everything except open/closed.** Which items exist, which
 * are done, what a row runs, and whether the component is dismissed are all
 * the host's. `defaultOpen` is read once, at mount; a host that re-opens the
 * component mounts it fresh with a changing `key`.
 */

import { useId, useState } from 'react';
import { Icon } from '@ink';

import styles from './GetStarted.module.css';

// =============================================================================
// Types
// =============================================================================

export interface GetStartedItem {
  /** Stable key. */
  id: string;
  /** The row's visible text, e.g. "Add a source". */
  label: string;
  /**
   * The user has done this one. The row shows the check glyph, dims, and stops
   * being a target.
   */
  complete?: boolean;
  /**
   * Ink icon name for the row's leading mark, drawn at the `small` cut. Used
   * by `marker="check"` on a not-done row. Omit it and the row has no leading
   * mark.
   */
  icon?: string;
  /**
   * The row was pressed. The action belongs to the item, so a row can send a
   * query, open a picker, or navigate, and the component never learns the
   * difference.
   */
  onTry: () => void;
}

export interface GetStartedProps {
  items: GetStartedItem[];
  /** The title, and the toggle's accessible name. The count is appended. */
  title?: string;
  /**
   * How the component presents:
   *
   * - `rows` — the card, with the checklist rows when open. The default.
   * - `inline` — one suggestion-grammar row that unfolds in place.
   * - `next` — one row with the first undone item. Nothing expands.
   */
  variant?: 'rows' | 'inline' | 'next';
  /**
   * The leading mark on a checklist row (`rows`, and `inline` when open):
   *
   * - `check` — the item's icon when not done, the check glyph when done.
   * - `number` — a numeral when not done, the check glyph when done.
   */
  marker?: 'check' | 'number';
  /**
   * Open on mount. Default `false`. Read once, at mount — a host that needs to
   * force it open re-mounts the component (a changing `key`). Ignored by
   * `next`, which has no open state.
   */
  defaultOpen?: boolean;
  /**
   * The user pressed dismiss. Supply it and the control appears; omit it and
   * there is none. Hiding the component is the host's move.
   */
  onDismiss?: () => void;
  /** @deprecated The "Try" button is gone — the row itself is the target. */
  tryLabel?: string;
  /** The dismiss control's accessible name. */
  dismissLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

export function GetStarted({
  items,
  title = 'Get started',
  variant = 'rows',
  marker = 'check',
  defaultOpen = false,
  onDismiss,
  dismissLabel = 'Dismiss get started',
}: GetStartedProps) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const headerId = `get-started-header-${uid}`;
  const panelId = `get-started-panel-${uid}`;

  if (items.length === 0) return null;

  const done = items.filter((item) => item.complete).length;
  const count = `${done} of ${items.length}`;

  /*
   * The 24px lead box. `check` marker: the item's icon, or nothing; done rows
   * always get the check glyph. `number` marker: a numeral; done rows get the
   * check glyph. The box is fixed so labels align across states.
   */
  const lead = (item: GetStartedItem, index: number) => {
    if (item.complete) {
      return (
        <span className={styles.lead} aria-hidden="true">
          <Icon name="check" size="small" />
        </span>
      );
    }
    if (marker === 'number') {
      return (
        <span className={`${styles.lead} ${styles.numeral}`} aria-hidden="true">
          {index + 1}
        </span>
      );
    }
    if (item.icon) {
      return (
        <span className={styles.lead} aria-hidden="true">
          <Icon name={item.icon as never} size="small" />
        </span>
      );
    }
    return null;
  };

  /*
   * The checklist rows, in ZeroQueryActions' grammar. A not-done row is a
   * button and runs `onTry`. A done row is plain text — no target, no tint —
   * and speaks "Completed".
   */
  const rows = (bleed: boolean) => (
    <ul className={`${styles.rows} ${bleed ? styles.rowsBleed : ''}`}>
      {items.map((item, index) => (
        <li key={item.id}>
          {item.complete ? (
            <div className={`${styles.row} ${styles.rowDone}`}>
              {lead(item, index)}
              <span className={`${styles.rowLabel} ${styles.rowLabelDone}`}>{item.label}</span>
              <span className={styles.srOnly}>Completed</span>
            </div>
          ) : (
            <button type="button" className={styles.row} onClick={item.onTry}>
              {lead(item, index)}
              <span className={styles.rowLabel}>{item.label}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  const dismissButton = onDismiss && (
    <button
      type="button"
      className={styles.dismiss}
      aria-label={dismissLabel}
      onClick={onDismiss}
    >
      <Icon name="close" size="small" />
    </button>
  );

  // ---------------------------------------------------------------------------
  // next — the count and the first undone item, as one row
  // ---------------------------------------------------------------------------

  if (variant === 'next') {
    const next = items.find((item) => !item.complete);
    return (
      <section className={styles.nextWrap} aria-labelledby={headerId}>
        {next ? (
          <button type="button" id={headerId} className={styles.row} onClick={next.onTry}>
            {next.icon && (
              <span className={styles.lead} aria-hidden="true">
                <Icon name={next.icon as never} size="small" />
              </span>
            )}
            <span className={styles.rowLabel}>Next: {next.label}</span>
            <span className={styles.count}>{count}</span>
          </button>
        ) : (
          <div id={headerId} className={`${styles.row} ${styles.rowDone}`}>
            <span className={styles.lead} aria-hidden="true">
              <Icon name="check" size="small" />
            </span>
            <span className={`${styles.rowLabel} ${styles.rowLabelDone}`}>
              {title} · all {items.length} done
            </span>
          </div>
        )}
        {dismissButton}
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // inline — one suggestion row that unfolds in place
  // ---------------------------------------------------------------------------

  if (variant === 'inline') {
    return (
      <section className={styles.inline} aria-labelledby={headerId}>
        <div className={styles.inlineHeader}>
          <button
            type="button"
            id={headerId}
            className={`${styles.row} ${styles.inlineToggle}`}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.rowLabel}>
              {title} <span className={styles.count}>· {count}</span>
            </span>
            <span
              className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            >
              <Icon name="chevron-down" size="small" />
            </span>
          </button>
          {open && dismissButton}
        </div>

        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        >
          {rows(true)}
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // rows — the card
  // ---------------------------------------------------------------------------

  return (
    <section className={styles.card} aria-labelledby={headerId}>
      <div className={styles.header}>
        {/*
          The toggle is the whole header bar minus the dismiss. `aria-expanded`
          plus `aria-controls` is Ink `Accordion`'s wiring — it makes the card
          work from the keyboard with no key handler of our own.
        */}
        <button
          type="button"
          id={headerId}
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.title}>
            {title} <span className={styles.count}>· {count}</span>
          </span>
          <span
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          >
            <Icon name="chevron-down" size="small" />
          </span>
        </button>
        {dismissButton}
      </div>

      {/*
        Collapsed with `max-height`, as `Accordion` does, plus `visibility` —
        without it the collapsed rows stay in the accessibility tree and stay
        in the tab order.
      */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
      >
        <div className={styles.body}>{rows(false)}</div>
      </div>
    </section>
  );
}
