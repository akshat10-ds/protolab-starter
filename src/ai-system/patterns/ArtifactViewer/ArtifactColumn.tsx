/**
 * ArtifactColumn — the artifact surface for IrisAgent's `artifactSlot`.
 *
 * This is the live successor to the deprecated Tier 3 `ArtifactPanel`, whose
 * own docstring says it was "superseded by IrisAgent's host-owned
 * `artifactSlot`". The host owns all state: which artifacts exist, which one
 * is open, and whether the chat column is collapsed (`artifactExpanded`).
 *
 * Composition, not duplication:
 * - `ArtifactViewer` (this directory) is the frame — toolbar, title, close,
 *   actions slot, content well.
 * - `MarkdownRenderer` renders the content. Both kinds are markdown strings;
 *   `kind` only drives the toolbar icon and the `ArtifactViewer` type.
 * - A tab strip appears above the viewer when there is more than one artifact.
 *
 * Rough by design — "directional, not perfect". No resize, no streaming,
 * no per-kind renderers beyond markdown.
 */

import React from 'react';
import { Icon, IconButton } from '@ink';
import { ArtifactViewer } from './ArtifactViewer';
import type { ArtifactViewerType } from './ArtifactViewer';
import { MarkdownRenderer } from '../../composites/MarkdownRenderer/MarkdownRenderer';
import styles from './ArtifactColumn.module.css';

// =============================================================================
// Types
// =============================================================================

/**
 * Renderable artifact kinds. Both render through `MarkdownRenderer`.
 * `table` is a markdown table; the kind only changes the icon and type label.
 * (`html` / `chart` are not kinds yet: no existing part renders them and the
 * system adds no dependencies.)
 */
export type ArtifactKind = 'markdown' | 'table';

/** One agent-produced artifact. The host owns the list. */
export interface Artifact {
  id: string;
  title: string;
  kind: ArtifactKind;
  /** Markdown source. For `table`, a markdown table. */
  content: string;
}

export interface ArtifactColumnProps {
  /** All artifacts in the conversation. The host owns this array. */
  artifacts: Artifact[];
  /** Id of the open artifact. `null` renders nothing. */
  openId: string | null;
  /** Open a different artifact (tab click) or close (`null`). */
  onOpenChange: (id: string | null) => void;
  /** Mirrors IrisAgent's `artifactExpanded` — the column fills the surface. */
  expanded?: boolean;
  /** Renders the expand/contract toolbar button when supplied. */
  onToggleExpand?: () => void;
  /** Column width in px when not expanded. */
  width?: number;
}

const KIND_META: Record<ArtifactKind, { icon: string; viewerType: ArtifactViewerType }> = {
  markdown: { icon: 'document', viewerType: 'document' },
  table: { icon: 'table', viewerType: 'table' },
};

// =============================================================================
// Component
// =============================================================================

export const ArtifactColumn: React.FC<ArtifactColumnProps> = ({
  artifacts,
  openId,
  onOpenChange,
  expanded = false,
  onToggleExpand,
  width = 480,
}) => {
  const active = artifacts.find((a) => a.id === openId);
  if (!active) return null;

  return (
    <div
      className={styles.column}
      style={expanded ? undefined : { width }}
      data-expanded={expanded || undefined}
    >
      {artifacts.length > 1 && (
        <div className={styles.tabStrip} role="tablist">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              type="button"
              role="tab"
              aria-selected={artifact.id === active.id}
              className={styles.tab}
              data-active={artifact.id === active.id || undefined}
              onClick={() => onOpenChange(artifact.id)}
            >
              <Icon name={KIND_META[artifact.kind].icon as any} size={14} />
              <span className={styles.tabLabel}>{artifact.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.viewerWrap}>
        <ArtifactViewer
          title={active.title}
          type={KIND_META[active.kind].viewerType}
          content={<MarkdownRenderer content={active.content} />}
          onClose={() => onOpenChange(null)}
          actions={
            onToggleExpand && (
              <IconButton
                icon={expanded ? 'arrows-in' : 'arrows-out'}
                size="small"
                variant="tertiary"
                onClick={onToggleExpand}
                aria-label={expanded ? 'Contract artifact' : 'Expand artifact'}
              />
            )
          }
        />
      </div>
    </div>
  );
};
