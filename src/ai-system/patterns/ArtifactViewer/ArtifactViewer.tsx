/**
 * ArtifactViewer — Renders artifacts by type
 *
 * Type-aware rendering for agent-generated content:
 * document (with page navigation), code (syntax highlighting),
 * table, and custom content.
 */

import React from 'react';
import { Icon, IconButton } from '@ink';
import styles from './ArtifactViewer.module.css';

// =============================================================================
// Types
// =============================================================================

export type ArtifactViewerType = 'document' | 'code' | 'table' | 'custom';

export interface ArtifactViewerProps {
  /** Artifact title */
  title: string;
  /** Content type */
  type: ArtifactViewerType;
  /** Content to render — string for document/code, ReactNode for custom */
  content: React.ReactNode;
  /** Called when close is clicked */
  onClose?: () => void;
  /** Optional toolbar actions */
  actions?: React.ReactNode;
  /** Language hint for code type */
  language?: string;
}

// =============================================================================
// Component
// =============================================================================

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  title,
  type,
  content,
  onClose,
  actions,
  language,
}) => {
  const typeIcons: Record<ArtifactViewerType, string> = {
    document: 'document',
    code: 'code',
    table: 'table',
    custom: 'layout-grid',
  };

  return (
    <div className={styles.viewer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Icon name={typeIcons[type] as any} size={16} className={styles.typeIcon} />
        <span className={styles.title}>{title}</span>
        {language && <span className={styles.language}>{language}</span>}
        <div className={styles.toolbarActions}>
          {actions}
          {onClose && (
            <IconButton
              icon="close"
              size="small"
              variant="tertiary"
              onClick={onClose}
              aria-label="Close"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content} data-type={type}>
        {typeof content === 'string' && type === 'code' ? (
          <pre className={styles.codeBlock}>
            <code>{content}</code>
          </pre>
        ) : typeof content === 'string' ? (
          <div className={styles.documentContent}>{content}</div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};
