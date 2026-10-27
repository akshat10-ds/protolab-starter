/**
 * The renderer registry — the only place in the dock that names a kind.
 *
 * MECHANISM. A plain `Record<ArtifactKind, ArtifactRenderer>`. The dock looks a
 * renderer up by `item.kind` and renders two of its parts: `HeaderActions` in
 * the universal 73px header, and `Body` below it. Adding a kind is one entry
 * here plus one renderer file; the dock does not change.
 *
 * `Body` owns the 48px toolbar as well as the well — see the contract in
 * `types.ts` for why the toolbar is not a slot the dock places.
 *
 * Three kinds are small enough to live here rather than in files of their own.
 * `table`, `document` and `process` are not.
 */

import React from 'react';
import { Icon, IconButton } from '@ink';
import { MarkdownRenderer } from '../../composites/MarkdownRenderer/MarkdownRenderer';
import { DocumentRenderer } from './DocumentRenderer';
import { ProcessArtifact } from './ProcessArtifact';
import { TableRenderer } from './TableRenderer';
import dock from './ArtifactDock.module.css';
import type { ArtifactKind, ArtifactRenderContext, ArtifactRenderer } from './types';

/** Markdown. The padded well, and nothing else. */
const MarkdownArtifact: ArtifactRenderer = {
  Body: ({ item }) => (
    <div className={dock.well}>
      <MarkdownRenderer content={item.content ?? ''} />
    </div>
  ),
};

/**
 * Sources. Rows that drill into a `document` item.
 *
 * A row is one line until the host gives it more: status, type or parties turn
 * it into the attached-source card shipping draws, and `removable` gives it its
 * own ✕. The ✕ is a sibling of the click area rather than a child of it —
 * nesting a button inside a button is invalid HTML and the row would swallow
 * the removal — which is why the row is a div and the drill-in is the area
 * inside it. `SourceListView`'s card is the in-repo precedent for the split.
 */
const SourcesArtifact: ArtifactRenderer = {
  Body: ({ item, onAction, onSourceOpen }: ArtifactRenderContext) => (
    <div className={dock.well}>
      <div className={dock.sourceList}>
        {(item.sources ?? []).map((source) => {
          const rich = source.status || source.agreementType || (source.parties ?? []).length > 0;
          return (
            <div key={source.id} className={dock.sourceRow} data-rich={rich || undefined}>
              <button
                type="button"
                className={dock.sourceClickArea}
                onClick={() => onSourceOpen?.(source.id)}
              >
                <span className={dock.sourceIcon}>
                  <Icon name={(source.icon ?? 'document') as any} size={16} />
                </span>
                <span className={dock.sourceText}>
                  <span className={dock.sourceTitle}>{source.title}</span>
                  {source.excerpt && <span className={dock.sourceExcerpt}>{source.excerpt}</span>}
                  {source.status && (
                    <span className={dock.sourceStatus}>
                      <span className={dock.sourceDot} data-status={source.status} />
                      <span className={dock.sourceStatusLabel}>
                        {source.statusLabel ??
                          (source.status === 'active' ? 'Active' : 'Inactive')}
                      </span>
                      {source.statusDate && (
                        <span className={dock.sourceStatusDate}>{source.statusDate}</span>
                      )}
                    </span>
                  )}
                  {source.agreementType && (
                    <span className={dock.sourceType}>{source.agreementType}</span>
                  )}
                  {(source.parties ?? []).length > 0 && (
                    <span className={dock.sourceParties}>{(source.parties ?? []).join(' · ')}</span>
                  )}
                </span>
              </button>
              {source.meta && <span className={dock.sourceMeta}>{source.meta}</span>}
              {source.removable && (
                <IconButton
                  icon="close"
                  variant="tertiary"
                  size="small"
                  aria-label={`Remove ${source.title}`}
                  onClick={() => onAction?.('source:remove', item, source.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  ),
};

/** A declared placeholder. The system adds no chart dependency to draw one. */
const VisualizationArtifact: ArtifactRenderer = {
  Body: ({ item }) => (
    <div className={dock.well}>
      <div className={dock.placeholder}>
        <Icon name="chart-bar" size={24} />
        <span className={dock.placeholderTitle}>Visualization</span>
        <span className={dock.placeholderMeta}>{item.title}</span>
      </div>
    </div>
  ),
};

export const ARTIFACT_RENDERERS: Record<ArtifactKind, ArtifactRenderer> = {
  markdown: MarkdownArtifact,
  table: TableRenderer,
  document: DocumentRenderer,
  sources: SourcesArtifact,
  visualization: VisualizationArtifact,
  process: ProcessArtifact,
};

// =============================================================================
// How wide the pane opens — one entry per kind
// =============================================================================

/**
 * PANE WIDTH IS A PROPERTY OF WHAT YOU ARE LOOKING AT. Akshat, 2026-08-19:
 * *"the pane width is dependent on what you see… if it's agreement it should be
 * 2/3 but for sources, progress 1/3 is good. we probably want it to be
 * resizable too!"*
 *
 * So the width is not one number. A reading surface — an agreement, a document
 * page — is the thing you came for and takes two thirds; a reference surface —
 * the run's progress, a source list, a log — stands beside the conversation and
 * takes one third.
 *
 * It lives here, beside the registry, for the same reason the registry does: a
 * new kind declares its own width in the one file where a kind is named, and
 * the dock never learns another kind's name.
 *
 * `table` IS AN ASSUMPTION. He named agreements, sources and progress, not
 * tables. Wide, because the search-results table is a data table with six
 * columns and column room is the whole reason it is open — flagged in
 * `SPEC.md` for his call, not presented as his dose.
 */
export type PaneSize = 'wide' | 'narrow';

export const PANE_SIZE: Record<ArtifactKind, PaneSize> = {
  document: 'wide',
  table: 'wide',
  markdown: 'narrow',
  sources: 'narrow',
  process: 'narrow',
  visualization: 'narrow',
};

/**
 * The pane's opening width in px, for one kind, against the extent it opens in.
 *
 * Fractions of the extent with a floor and a ceiling: two thirds and one third
 * are the dose, 420 is the floor (the table's own minimum — a pane narrower
 * than the card it replaces is not a pane), and the ceilings stop a very wide
 * screen from handing the pane a measure nothing in it can use.
 *
 * JS OWNS THIS NUMBER, not CSS, because the drag has to start from it: the
 * resize hook snapshots the current width when the pointer goes down, so a
 * default only CSS knows about makes the first drag jump. One source, two
 * readers.
 */
export function paneWidthFor(size: PaneSize, extent: number): number {
  return size === 'wide'
    ? Math.round(Math.min(1100, Math.max(560, extent * (2 / 3))))
    : Math.round(Math.min(560, Math.max(420, extent / 3)));
}
