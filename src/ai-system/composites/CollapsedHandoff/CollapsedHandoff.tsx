/**
 * CollapsedHandoff — the block that has handed its contents to the right pane.
 *
 * ONE RULE, WHEREVER IT APPLIES: a block whose contents are currently filling
 * the artifact pane does not draw them twice. It collapses to its own header
 * line, takes the indigo tint, and becomes the control that closes the pane.
 *
 * Akshat, 2026-08-18, on the search results card: *"we need some sort of an
 * active state so it's clear you're viewing it in the right… should we collapse
 * the table in left if you're viewing on right?"* The two asks answer each
 * other — the collapse and the state are ONE change, not two, which is why
 * there is no collapse animation. Shape does the work before colour does: a
 * block that has folded to one line beside blocks that have not is legible
 * without reading the label at all.
 *
 * Indigo 10 is the tint that already means "this belongs to Iris" on the
 * context chip. Here it says the same thing about a PLACE rather than a thing:
 * you are looking at this one. Border and fill are the same token, so the
 * hairline dissolves into the fill and the box stops reading as a container.
 *
 * DERIVED, NEVER STORED. The host compares the id of what it holds to
 * `artifact.openId` and renders this instead of its own block. Nothing here
 * keeps state, so promoting a second block reverts the first with no second
 * piece of state to keep in step.
 *
 * **`children` is the line, not a `label` string.** Every consumer already owns
 * a header line — the results card's glyph and count, the receipt's ring, step
 * and badge — and the collapsed row is that same line under a different paint.
 * A string prop would have made each consumer rebuild its own header inside
 * this one.
 *
 * `onClose` is optional: a host that shows the state but cannot act on it draws
 * a plain, unpressable row rather than a button that refuses.
 */

import React from 'react';

import styles from './CollapsedHandoff.module.css';

export interface CollapsedHandoffProps {
  /** The header line — the consumer's own, unchanged. */
  children: React.ReactNode;
  /**
   * Press closes the pane and the block comes back. Omit it and the row is
   * state only: no role, no focus, no "Close".
   */
  onClose?: () => void;
  /** What the row announces — "Close the results panel". */
  ariaLabel?: string;
  /** The hover-revealed word in the right slot. */
  closeLabel?: string;
  /**
   * Outer spacing, which belongs to the flow this sits in and not to the row.
   * The message stream gives it a margin; a grid with a `gap` gives it none.
   */
  className?: string;
}

export const CollapsedHandoff = ({
  children,
  onClose,
  ariaLabel,
  closeLabel = 'Close',
  className,
}: CollapsedHandoffProps) => (
  <div className={`${styles.wrap} ${className ?? ''}`}>
    {/*
      The whole row is the control. The line already reads "you are looking at
      this"; pressing it stops. A separate close button would put a second
      target inside a row that is already one.
    */}
    <div
      className={styles.row}
      role={onClose ? 'button' : undefined}
      tabIndex={onClose ? 0 : undefined}
      aria-label={onClose ? ariaLabel : undefined}
      onClick={onClose}
      onKeyDown={
        onClose
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
              }
            }
          : undefined
      }
    >
      {/* A `div`, not a `span`: a consumer's header line is its own block —
          `ProgressReceipt` hands over a `<p>` — and phrasing content cannot
          hold it. `display: flex` makes the two identical to look at. */}
      <div className={styles.label}>{children}</div>
      {/*
        Hidden at rest so the row stays one quiet line — it is already saying
        where you are, and a standing second label would make it say two things.
        The pane has its own close, so this is the second way out, not the only.
      */}
      {onClose && <span className={styles.close}>{closeLabel}</span>}
    </div>
  </div>
);

CollapsedHandoff.displayName = 'CollapsedHandoff';
