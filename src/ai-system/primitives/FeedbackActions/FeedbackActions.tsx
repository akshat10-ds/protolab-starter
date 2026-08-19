/**
 * FeedbackActions — Response action row for Iris chat
 *
 * Minimal composition: copy → thumbs-up → thumbs-down (copy first).
 * No dividers, no regenerate. IconButton tertiary/small with icon-subtle color.
 * Hover tooltips on all buttons. Silent feedback (toggle only).
 * Copy swaps duplicate→check for 2s. Binary signal.
 *
 * Spec locked in Feedback exploration (2026-03-18).
 */

import React, { useState } from 'react';
import { IconButton } from '@ink';
import styles from './FeedbackActions.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeedbackState = 'idle' | 'thumbs-up' | 'thumbs-down';

export interface FeedbackActionsProps {
  /** Text to copy when the copy button is clicked */
  copyText?: string;
  /** Initial feedback state */
  initialFeedback?: FeedbackState;
  /** Callback when feedback changes */
  onFeedbackChange?: (state: FeedbackState) => void;
  /** Callback when copy is clicked */
  onCopy?: () => void;
  /** Hide the copy button */
  hideCopy?: boolean;
}

// ---------------------------------------------------------------------------
// Tooltip sub-component
// ---------------------------------------------------------------------------

function HoverTooltip({ text, active }: { text: string; active?: boolean }) {
  return (
    <span className={active ? styles.activeTooltip : styles.hoverTooltip}>
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const FeedbackActions: React.FC<FeedbackActionsProps> = ({
  copyText,
  initialFeedback = 'idle',
  onFeedbackChange,
  onCopy,
  hideCopy = false,
}) => {
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (copyText) {
      navigator.clipboard.writeText(copyText).catch(() => {});
    }
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThumbsUp = () => {
    const next: FeedbackState = feedback === 'thumbs-up' ? 'idle' : 'thumbs-up';
    setFeedback(next);
    onFeedbackChange?.(next);
  };

  const handleThumbsDown = () => {
    const next: FeedbackState = feedback === 'thumbs-down' ? 'idle' : 'thumbs-down';
    setFeedback(next);
    onFeedbackChange?.(next);
  };

  return (
    <div className={styles.actions}>
      {/* Copy — first position, most frequent action */}
      {!hideCopy && (
        <div className={styles.buttonWrap}>
          <IconButton
            icon={copied ? 'check' : 'duplicate'}
            variant="tertiary"
            size="small"
            onClick={handleCopy}
            aria-label="Copy"
          />
          <HoverTooltip text={copied ? 'Copied!' : 'Copy'} active={copied} />
        </div>
      )}

      {/* Thumbs up */}
      <div className={styles.buttonWrap}>
        <IconButton
          icon={feedback === 'thumbs-up' ? 'thumbs-up-filled' : 'thumbs-up'}
          variant="tertiary"
          size="small"
          onClick={handleThumbsUp}
          aria-label="Good response"
        />
        <HoverTooltip text="Good response" />
      </div>

      {/* Thumbs down */}
      <div className={styles.buttonWrap}>
        <IconButton
          icon={feedback === 'thumbs-down' ? 'thumbs-down-filled' : 'thumbs-down'}
          variant="tertiary"
          size="small"
          onClick={handleThumbsDown}
          aria-label="Bad response"
        />
        <HoverTooltip text="Bad response" />
      </div>
    </div>
  );
};

FeedbackActions.displayName = 'FeedbackActions';
