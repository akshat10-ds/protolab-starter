/**
 * SourceListView — File selection list for ArtifactViewer
 *
 * Renders a scrollable list of source documents with checkboxes,
 * select-all, and a footer action button. Mirrors the agreement-studio
 * AgreementsSidebar pattern: pending selection that commits on button click.
 *
 * Designed to slot into ArtifactViewer as content for type="custom".
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon, Checkbox, Button } from '@ink';
import styles from './SourceListView.module.css';

// =============================================================================
// Types
// =============================================================================

export interface SourceItem {
  /** Unique source ID */
  id: string;
  /** Source number (displayed in badge) */
  number: number;
  /** Source document title */
  title: string;
  /** Relevant excerpt from the source */
  excerpt: string;
  /** Document type icon */
  icon?: string;
}

export interface SourceListViewProps {
  /** List of source items */
  sources: SourceItem[];
  /** Called when a source card is clicked (opens document) */
  onSourceClick?: (source: SourceItem) => void;
  /** Currently active/highlighted source ID */
  activeSourceId?: string;
  /** Controlled selected IDs */
  selectedIds?: Set<string>;
  /** Called when selection is confirmed via footer button */
  onSelectionConfirm?: (selectedIds: Set<string>) => void;
  /** Footer button label template — {count} is replaced with selection count */
  actionLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

export const SourceListView: React.FC<SourceListViewProps> = ({
  sources,
  onSourceClick,
  activeSourceId,
  selectedIds,
  onSelectionConfirm,
  actionLabel = 'Chat with {count} {noun}',
}) => {
  // Pending selection — changes don't commit until button click
  const [pendingIds, setPendingIds] = useState<Set<string>>(
    () => selectedIds ?? new Set(sources.map((s) => s.id))
  );

  // Sync when controlled selectedIds change
  useEffect(() => {
    if (selectedIds) {
      setPendingIds(new Set(selectedIds));
    }
  }, [selectedIds]);

  const allSelected = pendingIds.size === sources.length;

  const toggleItem = useCallback((id: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setPendingIds(new Set());
    } else {
      setPendingIds(new Set(sources.map((s) => s.id)));
    }
  }, [allSelected, sources]);

  const handleConfirm = useCallback(() => {
    onSelectionConfirm?.(pendingIds);
  }, [onSelectionConfirm, pendingIds]);

  // Build action label
  const count = pendingIds.size;
  const noun = count === 1 ? 'agreement' : 'agreements';
  const buttonLabel = actionLabel.replace('{count}', String(count)).replace('{noun}', noun);

  if (sources.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon name="document" size={24} />
        <p>No sources referenced</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Select all row */}
      <button type="button" className={styles.selectAll} onClick={handleSelectAll}>
        <span className={styles.selectAllText}>Select all sources</span>
        <div className={styles.checkboxWrap} onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={allSelected} onChange={handleSelectAll} label="" showLabel={false} />
        </div>
      </button>

      <div className={styles.divider} />

      {/* Source list */}
      <div className={styles.list}>
        {sources.map((source) => {
          const isSelected = pendingIds.has(source.id);
          return (
            <div
              key={source.id}
              className={styles.card}
              data-active={source.id === activeSourceId || undefined}
            >
              <button
                className={styles.cardClickArea}
                onClick={() => onSourceClick?.(source)}
                type="button"
              >
                <div className={styles.cardIcon}>
                  <Icon name="document" size={18} />
                </div>
                <span className={styles.cardTitle}>{source.title}</span>
              </button>
              <div className={styles.checkboxWrap} onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleItem(source.id)}
                  label=""
                  showLabel={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer action */}
      {onSelectionConfirm && (
        <div className={styles.footer}>
          <Button
            variant="brand"
            size="medium"
            onClick={handleConfirm}
            disabled={count === 0}
            fullWidth
          >
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
