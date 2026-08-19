/**
 * PanelShell — the DOM for a panel that is a *sibling* of its host page.
 *
 * `PanelShell` does not take the host page as `children`. It mounts next to an
 * arbitrary page it knows nothing about, and the host reflows around it using
 * `usePanelMode().hostStyle`. That inversion is the whole point: a panel that
 * wraps the page cannot be a flex sibling of it, and `width: calc(100% - Npx)`
 * on the page is what makes the push layout possible.
 *
 * `children` is the panel's *contents* — typically an agent. `PanelShell` is
 * content-agnostic and imports nothing from `patterns/`.
 *
 * Provenance: `protoLab/src/prototypes/iris-panel/index.module.css` (frozen) —
 * `.panelWrapper` (:7-22), `.panelInnerRow` (:25-31), `.dragHandle` /
 * `.dragHandleBar` (:135-171); shell JSX at `index.tsx:803-811`.
 */

import React from 'react';
import type { PanelEdge, PanelHandleProps, PanelMode } from '../../hooks/usePanelMode';
import styles from './PanelShell.module.css';

// =============================================================================
// Types
// =============================================================================

export interface PanelShellProps {
  /** Current mode. Spread from `usePanelMode().shellProps`. */
  mode: PanelMode;
  /** Resolved px width. Ignored when `mode === 'closed'`. */
  width: number;
  /** Suppresses the width transition so the panel tracks the pointer. */
  isResizing?: boolean;
  /** Which side of the viewport the panel occupies. Default `'right'`. */
  edge?: PanelEdge;
  /** Spread onto the drag handle. Omit to render a non-resizable shell. */
  handleProps?: PanelHandleProps;
  /**
   * Force the handle on or off. Defaults to "shown whenever `handleProps` is
   * supplied and the panel is not closed".
   */
  showHandle?: boolean;
  /** Stacking context against the host page. Default `300` (the prototype's). */
  zIndex?: number;
  /** Accessible name for the panel region. */
  label?: string;
  className?: string;
  /** The panel's contents. NOT the host page. */
  children: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export const PanelShell: React.FC<PanelShellProps> = ({
  mode,
  width,
  isResizing = false,
  edge = 'right',
  handleProps,
  showHandle,
  zIndex = 300,
  label = 'Assistant panel',
  className,
  children,
}) => {
  const isClosed = mode === 'closed';
  const handleVisible = showHandle ?? (Boolean(handleProps) && !isClosed);

  const classNames = [
    styles.shell,
    edge === 'right' ? styles.shellRight : styles.shellLeft,
    isResizing ? styles.shellResizing : '',
    isClosed ? styles.shellClosed : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside
      className={classNames}
      // A closed shell is zero-width, not unmounted: its children keep their
      // state (scroll position, draft input, streamed message) across a
      // close/reopen, and the reopen animates a width rather than a mount.
      style={{ width: isClosed ? 0 : width, zIndex }}
      data-mode={mode}
      aria-label={label}
      aria-hidden={isClosed}
      // A zero-width shell is still in the sequential focus order without this.
      inert={isClosed}
    >
      {handleVisible && handleProps && (
        <div className={styles.handle} {...handleProps}>
          <div className={styles.handleBar} />
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </aside>
  );
};
