/**
 * CitationBadge — Inline citation marker with portal-based tooltip
 *
 * Shows a numbered badge that, on hover, reveals a tooltip with source
 * document information. Uses createPortal to escape overflow:hidden containers.
 */

import React, { useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './CitationBadge.module.css';

// =============================================================================
// Types
// =============================================================================

export interface Citation {
  id: string;
  title: string;
  excerpt: string;
  url?: string;
  /** Used to match citation to a specific document in multi-doc scenarios */
  documentTitle?: string;
}

export interface CitationBadgeProps {
  /** The citation number or label to display in the badge */
  citationId: string;
  /** Citation source data for the tooltip */
  citation: Citation;
  /** Optional text before the badge (e.g., "[some linked text]¹") */
  displayText?: string;
  /** Called when the badge is clicked */
  onClick?: (citation: Citation) => void;
  /** Tooltip width in px */
  tooltipWidth?: number;
}

// =============================================================================
// Component
// =============================================================================

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  citationId,
  citation,
  displayText,
  onClick,
  tooltipWidth = 280,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const handleMouseEnter = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      // Position tooltip below the badge
      let left = rect.left;
      const top = rect.bottom + 8;

      // Keep within viewport
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      left = Math.max(16, left);

      setTooltipStyle({ top: `${top}px`, left: `${left}px` });
      setIsHovered(true);
    }
  }, [tooltipWidth]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const tooltip = isHovered
    ? createPortal(
        <span
          className={`${styles.tooltip} ${styles.tooltipVisible}`}
          style={{ ...tooltipStyle, width: tooltipWidth }}
        >
          <span className={styles.tooltipLabel}>Source</span>
          <span className={styles.tooltipTitle}>{citation.title}</span>
          <span className={styles.tooltipExcerpt}>
            &ldquo;
            {citation.excerpt.length > 160
              ? `${citation.excerpt.substring(0, 160)}...`
              : citation.excerpt}
            &rdquo;
          </span>
        </span>,
        document.body
      )
    : null;

  return (
    <span className={styles.wrapper}>
      {displayText}
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onClick?.(citation)}
      >
        <span className={styles.chip}>{citationId}</span>
      </button>
      {tooltip}
    </span>
  );
};
