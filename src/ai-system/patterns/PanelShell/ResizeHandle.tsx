/**
 * ResizeHandle — the one drag divider in the system.
 *
 * It was inline in `PanelShell` until the pane became resizable too (Akshat,
 * 2026-08-19: *"we probably want it to be resizable too!"*). Two dividers with
 * two implementations is two feels; this is the same 16px hit area, the same
 * 4px × 48px bar and the same hover/focus grammar wherever it is used, and
 * `usePanelResize` is still the only thing that moves either of them.
 *
 * Akshat, 2026-08-18, on the panel's own divider: *"the handle inside doesn't
 * work well sometimes and we also need to have the entire divider be
 * draggable"* — so the target is full height and straddles the seam, 8px each
 * side, in both placements.
 *
 *   `left` / `right`  absolutely positioned against a `position: relative`
 *                     ancestor, on that edge. What `PanelShell` uses.
 *   `inline`          a flex item in the row it divides, 16px wide with -8px
 *                     margins so it costs the layout nothing and still
 *                     straddles. What the chat/pane seam uses, because the
 *                     pane clips its own overflow and an absolute handle
 *                     hanging 8px outside it would be cut in half.
 */

import React from 'react';
import type { PanelHandleProps } from '../../hooks/usePanelMode';
import styles from './PanelShell.module.css';

export interface ResizeHandleProps extends PanelHandleProps {
  /** Which edge it sits on, or `inline` for a flex item in the row. */
  placement?: 'left' | 'right' | 'inline';
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  placement = 'left',
  ...handleProps
}) => (
  <div
    className={`${styles.handle} ${
      placement === 'inline'
        ? styles.handleInline
        : placement === 'right'
          ? styles.handleRight
          : styles.handleLeft
    }`}
    {...handleProps}
  >
    <div className={styles.handleBar} />
  </div>
);

ResizeHandle.displayName = 'ResizeHandle';
