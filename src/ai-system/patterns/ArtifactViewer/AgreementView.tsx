/**
 * AgreementView — Document viewer for ArtifactViewer
 *
 * Renders a formal agreement/document with:
 * - Primary header: document title, prev/next navigation, download, close
 * - Secondary toolbar: page navigation, zoom controls, search
 * - Document body: letterhead, sections with citation highlights
 *
 * Mirrors the agreement-studio DocumentCanvas toolbar pattern.
 */

import React, { useState, useCallback } from 'react';
import { Icon, IconButton, Tooltip, Button, Divider } from '@ink';
import styles from './AgreementView.module.css';

// =============================================================================
// Types
// =============================================================================

export interface AgreementSection {
  /** Section heading (e.g., "Section 4.2 — Liability Limitation") */
  heading?: string;
  /** Section body text */
  body: string;
  /** Whether this section is highlighted as a citation */
  highlighted?: boolean;
  /** Citation ID for click handling */
  citationId?: string;
}

export interface AgreementViewProps {
  /** Document title (e.g., "Master Services Agreement") */
  title: string;
  /** Parties involved */
  parties?: string;
  /** Effective date */
  date?: string;
  /** Document status badge */
  status?: 'draft' | 'active' | 'expired' | 'pending';
  /** Document sections */
  sections: AgreementSection[];
  /** Called when a highlighted citation section is clicked */
  onCitationClick?: (citationId: string) => void;
  /** Total pages */
  totalPages?: number;
  /** Called when navigating to previous document */
  onPrevDocument?: () => void;
  /** Called when navigating to next document */
  onNextDocument?: () => void;
  /** Called when download is clicked */
  onDownload?: () => void;
  /** Called when open externally is clicked */
  onOpenExternal?: () => void;
  /** Called when close is clicked */
  onClose?: () => void;
}

// =============================================================================
// Status labels
// =============================================================================

const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
  draft: { label: 'Draft', icon: 'pencil' },
  active: { label: 'Active', icon: 'status-check' },
  expired: { label: 'Expired', icon: 'status-warn' },
  pending: { label: 'Pending Review', icon: 'clock' },
};

// =============================================================================
// Component
// =============================================================================

export const AgreementView: React.FC<AgreementViewProps> = ({
  title,
  parties,
  date,
  status,
  sections,
  onCitationClick,
  totalPages = 1,
  onPrevDocument,
  onNextDocument,
  onDownload,
  onOpenExternal,
  onClose,
}) => {
  const statusInfo = status ? STATUS_LABELS[status] : null;
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  }, []);

  return (
    <div className={styles.agreement}>
      {/* Primary header — document title + navigation */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {onPrevDocument && (
            <Tooltip text="Previous document" size="compact">
              <IconButton
                icon="chevron-left"
                size="small"
                variant="tertiary"
                onClick={onPrevDocument}
                aria-label="Previous document"
              />
            </Tooltip>
          )}
          <span className={styles.headerTitle}>{title}</span>
          {onNextDocument && (
            <Tooltip text="Next document" size="compact">
              <IconButton
                icon="chevron-right"
                size="small"
                variant="tertiary"
                onClick={onNextDocument}
                aria-label="Next document"
              />
            </Tooltip>
          )}
        </div>
        <div className={styles.headerRight}>
          {onOpenExternal && (
            <Tooltip text="Open in Navigator" size="compact">
              <IconButton
                icon="external-link"
                size="small"
                variant="tertiary"
                onClick={onOpenExternal}
                aria-label="Open in Navigator"
              />
            </Tooltip>
          )}
          {onDownload && (
            <Button variant="secondary" size="small" onClick={onDownload}>
              Download
            </Button>
          )}
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

      {/* Secondary toolbar — page nav + zoom + search */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarCenter}>
          {/* Page navigation */}
          <div className={styles.pageNav}>
            <span className={styles.pageText}>
              {currentPage} / {totalPages}
            </span>
            <div className={styles.pageButtons}>
              <IconButton
                icon="chevron-up"
                size="small"
                variant="tertiary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              />
              <IconButton
                icon="chevron-down"
                size="small"
                variant="tertiary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              />
            </div>
          </div>

          <div className={styles.toolbarDivider} />

          {/* Zoom controls */}
          <div className={styles.zoomGroup}>
            <IconButton
              icon="plus"
              size="small"
              variant="tertiary"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              aria-label="Zoom in"
            />
            <span className={styles.zoomText}>{zoomLevel}%</span>
            <IconButton
              icon="minus"
              size="small"
              variant="tertiary"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              aria-label="Zoom out"
            />
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <Tooltip text="Search in document" size="compact">
            <IconButton
              icon="search"
              size="small"
              variant="tertiary"
              aria-label="Search in document"
            />
          </Tooltip>
        </div>
      </div>

      {/* Document body */}
      <div className={styles.body} style={{ fontSize: `${(14 * zoomLevel) / 100}px` }}>
        {/* Letterhead */}
        <div className={styles.letterhead}>
          <h2 className={styles.docTitle}>{title}</h2>
          {parties && <p className={styles.parties}>{parties}</p>}
          <div className={styles.meta}>
            {date && <span className={styles.metaItem}>{date}</span>}
            {statusInfo && (
              <span className={styles.statusBadge} data-status={status}>
                <Icon name={statusInfo.icon as any} size={12} />
                {statusInfo.label}
              </span>
            )}
          </div>
        </div>

        <div className={styles.letterDivider} />

        {/* Sections */}
        {sections.map((section, i) => (
          <div
            key={i}
            className={`${styles.section} ${section.highlighted ? styles.sectionHighlighted : ''}`}
            onClick={
              section.highlighted && section.citationId && onCitationClick
                ? () => onCitationClick(section.citationId!)
                : undefined
            }
          >
            {section.heading && <h3 className={styles.sectionHeading}>{section.heading}</h3>}
            <p className={styles.sectionBody}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
