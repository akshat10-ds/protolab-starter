/**
 * Shimmer — the system's one signal for "work is happening in this box".
 *
 * Akshat, 2026-08-19, pointing at the research card in Claude's chat: *"when
 * there is work we can show a shimmer over the loan progress — literally the
 * same thing."* So a live surface is not redrawn as a skeleton and does not
 * grow a progress bar; the thing you are already reading takes a slow sweep
 * across it and stops when the work lands.
 *
 * It wraps rather than replaces. The box keeps its own contents, its own
 * layout and its own text — the sweep is an overlay with `pointer-events:
 * none`, so nothing under it becomes unreachable while the agent runs.
 *
 * `active` false renders the children and nothing else, so a caller can leave
 * the wrapper in place across the whole lifecycle of a surface.
 */

import React from 'react';

import styles from './Shimmer.module.css';

export interface ShimmerProps {
  /** The sweep runs while this is true. */
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Shimmer = ({ active = false, className, children }: ShimmerProps) => (
  <div className={`${active ? styles.shimmer : ''} ${className ?? ''}`.trim() || undefined}>
    {children}
  </div>
);

Shimmer.displayName = 'Shimmer';
