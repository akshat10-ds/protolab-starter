/**
 * DocumentViewer — Generic document display with highlights
 *
 * Generalized from agreement-studio's DocumentCanvas.
 * Supports page navigation, zoom controls, page thumbnails sidebar,
 * and highlight rendering with click callbacks.
 *
 * No react-pdf dependency — uses rendered ReactNode pages (fake-document mode).
 * Consumers can provide any content as page nodes.
 */

import React, { useState, useEffect } from 'react';
import { Icon, IconButton } from '@ink';
import styles from './DocumentViewer.module.css';

// =============================================================================
// Types
// =============================================================================

export interface DocumentHighlight {
  id: string;
  /** Top position as percentage (0-100) */
  top: number;
  /** Left position as percentage (0-100) */
  left: number;
  /** Width as percentage (0-100) */
  width: number;
  /** Height as percentage (0-100) */
  height: number;
  /** Label shown on hover */
  label?: string;
  /** Highlight color (CSS value, defaults to orange-30 token) */
  color?: string;
}

export interface DocumentPage {
  pageNumber: number;
  /** Rendered page content */
  content: React.ReactNode;
  /** Highlighted regions on this page */
  highlights?: DocumentHighlight[];
}

export interface DocumentViewerProps {
  /** Array of pages to display */
  pages: DocumentPage[];
  /** Document title shown in header */
  title?: string;
  /** Active page number (controlled) */
  activePage?: number;
  /** Page change callback */
  onPageChange?: (page: number) => void;
  /** Highlight click callback */
  onHighlightClick?: (id: string) => void;
  /** Additional toolbar actions (right side of header) */
  actions?: React.ReactNode;
  /** Show thumbnail sidebar (default: true) */
  showThumbnails?: boolean;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Page with a thumbnail highlight indicator */
  highlightedPage?: number;
}

// =============================================================================
// Component
// =============================================================================

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  pages,
  title = 'Document',
  activePage: controlledPage,
  onPageChange,
  onHighlightClick,
  actions,
  showThumbnails = true,
  isLoading = false,
  highlightedPage,
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const isControlled = controlledPage !== undefined;
  const currentPage = isControlled ? controlledPage : internalPage;

  const totalPages = pages.length;
  const pageData = pages.find((p) => p.pageNumber === currentPage);

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    if (!isControlled) {
      setInternalPage(clamped);
    }
    onPageChange?.(clamped);
  };

  // Sync internal page when controlled changes
  useEffect(() => {
    if (isControlled && controlledPage) {
      setInternalPage(controlledPage);
    }
  }, [isControlled, controlledPage]);

  return (
    <div className={styles.viewer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <IconButton
            icon="chevron-left"
            size="small"
            variant="tertiary"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          />
          <span className={styles.title}>{title}</span>
          <IconButton
            icon="chevron-right"
            size="small"
            variant="tertiary"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          />
        </div>
        <div className={styles.headerRight}>
          {actions}
        </div>
      </div>

      {/* Body: thumbnails + content */}
      <div className={styles.body}>
        {/* Thumbnails sidebar */}
        {showThumbnails && (
          <div className={styles.thumbnails}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeletonThumb} />
                ))
              : pages.map((page) => (
                  <button
                    key={page.pageNumber}
                    className={`${styles.thumb} ${
                      page.pageNumber === currentPage ? styles.thumbActive : ''
                    }`}
                    onClick={() => goToPage(page.pageNumber)}
                  >
                    <div className={styles.thumbPage}>
                      {page.pageNumber === highlightedPage && (
                        <div className={styles.thumbHighlight} />
                      )}
                    </div>
                    <span className={styles.thumbNum}>{page.pageNumber}</span>
                  </button>
                ))}
          </div>
        )}

        {/* Document content area */}
        <div className={styles.content}>
          <div className={styles.document}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '80%' }} />
                <div className={styles.skeletonBlock} />
                <div className={styles.skeletonLine} style={{ width: '70%' }} />
                <div className={styles.skeletonLine} style={{ width: '90%' }} />
              </div>
            ) : pageData ? (
              <>
                {pageData.content}

                {/* Render highlight overlays */}
                {pageData.highlights?.map((h) => (
                  <div
                    key={h.id}
                    className={styles.highlightRegion}
                    data-interactive={!!onHighlightClick || undefined}
                    style={{
                      top: `${h.top}%`,
                      left: `${h.left}%`,
                      width: `${h.width}%`,
                      height: `${h.height}%`,
                      backgroundColor: h.color || 'var(--ink-orange-30)',
                      opacity: 0.3,
                    }}
                    onClick={() => onHighlightClick?.(h.id)}
                    title={h.label}
                  />
                ))}
              </>
            ) : (
              <div className={styles.placeholder}>
                <Icon name="document" size={40} />
                <p>Page {currentPage}</p>
              </div>
            )}

            {/* Page footer */}
            <div className={styles.pageFooter}>
              <span>Page {currentPage} of {totalPages}</span>
              <span>{title}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
