/**
 * AgentCanvas Component
 *
 * Multi-mode content area for the AgentPanel that supports various content types:
 * - document: PDF/document viewer with zoom controls
 * - form: Form builder placeholder
 * - visualization: Data visualization placeholder
 * - custom: Renders any children
 *
 * @example
 * ```tsx
 * // Document mode
 * <AgentCanvas mode="document" documentUrl="/path/to/document.pdf" />
 *
 * // Custom mode with any content
 * <AgentCanvas mode="custom">
 *   <MyCustomComponent />
 * </AgentCanvas>
 * ```
 */

import { useState } from 'react';
import { Icon, Button, Heading, Text } from '@/design-system';
import type { AgentCanvasMode } from './types';
import styles from './AgentCanvas.module.css';

// =============================================================================
// Types
// =============================================================================

export interface AgentCanvasProps {
  /** The display mode for the canvas */
  mode?: AgentCanvasMode;
  /** Custom content for 'custom' mode */
  children?: React.ReactNode;
  /** Document URL for 'document' mode */
  documentUrl?: string;
  /** Document title for 'document' mode */
  documentTitle?: string;
  /** Current page number (1-indexed) */
  currentPage?: number;
  /** Total pages in document */
  totalPages?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Additional CSS class */
  className?: string;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
}

// =============================================================================
// Placeholder Components
// =============================================================================

function EmptyState({
  title = 'No content selected',
  description = 'Select a document or start a conversation to see content here.',
  icon = 'document',
}: {
  title?: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon name={icon as any} size={32} />
      </div>
      <Heading level={4} className={styles.emptyTitle}>
        {title}
      </Heading>
      <Text size="sm" color="secondary" className={styles.emptyDescription}>
        {description}
      </Text>
    </div>
  );
}

function DocumentViewer({
  documentUrl,
  documentTitle,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: {
  documentUrl?: string;
  documentTitle?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handlePrevPage = () => onPageChange?.(Math.max(1, currentPage - 1));
  const handleNextPage = () => onPageChange?.(Math.min(totalPages, currentPage + 1));

  if (!documentUrl) {
    return (
      <EmptyState
        title="No document loaded"
        description="Open a document to view it here."
        icon="document"
      />
    );
  }

  return (
    <div className={styles.documentViewer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {documentTitle && (
            <span className={styles.documentTitle}>
              <Icon name="document" size="small" />
              {documentTitle}
            </span>
          )}
        </div>
        <div className={styles.toolbarCenter}>
          <Button kind="tertiary" size="small" onClick={handlePrevPage} disabled={currentPage <= 1}>
            <Icon name="chevron-left" size="small" />
          </Button>
          <span className={styles.pageIndicator}>
            {currentPage} / {totalPages}
          </span>
          <Button
            kind="tertiary"
            size="small"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <Icon name="chevron-right" size="small" />
          </Button>
        </div>
        <div className={styles.toolbarRight}>
          <Button kind="tertiary" size="small" onClick={handleZoomOut}>
            <Icon name="minus" size="small" />
          </Button>
          <span className={styles.zoomIndicator}>{zoom}%</span>
          <Button kind="tertiary" size="small" onClick={handleZoomIn}>
            <Icon name="plus" size="small" />
          </Button>
        </div>
      </div>

      {/* Document content */}
      <div className={styles.documentContent}>
        <div className={styles.documentPage} style={{ transform: `scale(${zoom / 100})` }}>
          {/* PDF/Image would be rendered here */}
          <div className={styles.documentPlaceholder}>
            <Icon name="document" size={32} />
            <Text size="sm" color="secondary">
              Document Preview
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormPlaceholder() {
  return (
    <EmptyState
      title="Form Builder"
      description="Form building capabilities coming soon."
      icon="clipboard"
    />
  );
}

function VisualizationPlaceholder() {
  return (
    <EmptyState
      title="Data Visualization"
      description="Visualization capabilities coming soon."
      icon="chart-bar"
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AgentCanvas({
  mode = 'custom',
  children,
  documentUrl,
  documentTitle,
  currentPage,
  totalPages,
  onPageChange,
  className,
  emptyTitle,
  emptyDescription,
}: AgentCanvasProps) {
  const renderContent = () => {
    switch (mode) {
      case 'document':
        return (
          <DocumentViewer
            documentUrl={documentUrl}
            documentTitle={documentTitle}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        );
      case 'form':
        return <FormPlaceholder />;
      case 'visualization':
        return <VisualizationPlaceholder />;
      case 'custom':
      default:
        return children || <EmptyState title={emptyTitle} description={emptyDescription} />;
    }
  };

  return <div className={`${styles.container} ${className || ''}`}>{renderContent()}</div>;
}

export default AgentCanvas;
