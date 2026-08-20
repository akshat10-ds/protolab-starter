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
 * `table` and `document` are not.
 */

import React from 'react';
import { Icon } from '@ink';
import { MarkdownRenderer } from '../../composites/MarkdownRenderer/MarkdownRenderer';
import { DocumentRenderer } from './DocumentRenderer';
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

/** Sources. Rows that drill into a `document` item. */
const SourcesArtifact: ArtifactRenderer = {
  Body: ({ item, onSourceOpen }: ArtifactRenderContext) => (
    <div className={dock.well}>
      <div className={dock.sourceList}>
        {(item.sources ?? []).map((source) => (
          <button
            key={source.id}
            type="button"
            className={dock.sourceRow}
            onClick={() => onSourceOpen?.(source.id)}
          >
            <span className={dock.sourceIcon}>
              <Icon name={(source.icon ?? 'document') as any} size={16} />
            </span>
            <span className={dock.sourceText}>
              <span className={dock.sourceTitle}>{source.title}</span>
              {source.excerpt && <span className={dock.sourceExcerpt}>{source.excerpt}</span>}
            </span>
            {source.meta && <span className={dock.sourceMeta}>{source.meta}</span>}
          </button>
        ))}
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
};
