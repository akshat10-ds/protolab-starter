/**
 * MessageBubble — User message bubble for the Iris chat interface.
 *
 * Three variants sharing one bubble shape:
 *   - plain-text: default dark text
 *   - slash-command: cobalt text with hover popover
 *   - suggestion-selected: green check icon + "Selected" label
 *
 * Hover metadata (timestamp + copy) appears on message hover when timestamp is provided.
 *
 * Spec locked in Messages exploration (2026-03-18).
 */

import React, { useState } from 'react';
import { Icon, IconButton } from '@ink';
import styles from './MessageBubble.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageBubbleVariant = 'plain-text' | 'slash-command' | 'suggestion-selected';

export interface MessageBubbleProps {
  /** The message text */
  text: string;
  /** Variant determines text styling and interaction */
  variant?: MessageBubbleVariant;
  /** Short timestamp shown on hover, e.g. "10:49 AM" */
  timestamp?: string;
  /** Full date shown in tooltip, e.g. "Mar 18, 2026, 10:49 AM" */
  fullDate?: string;
  /** Source label above bubble, e.g. "Agreement Skill", "Playbook" */
  label?: string;

  // Slash command props
  /** Description for hover popover (slash-command only) */
  commandDescription?: string;
  /** Type label in popover footer, e.g. "Skill", "Agent" (slash-command only) */
  commandType?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** CSS-only hover tooltip — matches feedback action tooltip style */
function HoverTooltip({ text, active }: { text: string; active?: boolean }) {
  return (
    <span className={active ? styles.activeTooltip : styles.hoverTooltip}>
      {text}
    </span>
  );
}

/** Hover metadata row — timestamp + copy, fades in on message hover */
function MessageMeta({ timestamp, fullDate, text }: {
  timestamp: string;
  fullDate?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.messageMeta}>
      <div className={styles.metaItemWrap}>
        <span className={styles.messageMetaTime}>{timestamp}</span>
        <HoverTooltip text={fullDate || timestamp} />
      </div>
      <div className={styles.metaItemWrap}>
        <IconButton
          icon={copied ? 'check' : 'duplicate'}
          variant="tertiary"
          size="small"
          aria-label="Copy message"
          onClick={handleCopy}
        />
        <HoverTooltip text={copied ? 'Copied!' : 'Copy'} active={copied} />
      </div>
    </div>
  );
}

/** Slash command hover popover — ecru card with description + type */
function CommandPopover({ commandName, description, commandType }: {
  commandName: string;
  description: string;
  commandType?: string;
}) {
  return (
    <div className={styles.commandPopover}>
      <div className={styles.commandPopoverCard}>
        <div className={styles.commandPopoverDescWrap}>
          <p className={styles.commandPopoverDesc}>{description}</p>
        </div>
        <div className={styles.commandPopoverFooter}>
          {commandType && (
            <span className={styles.commandPopoverType}>{commandType}: {commandName}</span>
          )}
          <span className={styles.commandPopoverView}>View</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  variant = 'plain-text',
  timestamp,
  fullDate,
  label,
  commandDescription,
  commandType,
}) => {
  const commandName = text.replace(/^\//, '');

  return (
    <div className={styles.messageWrap}>
      <div className={styles.message}>
        {/* Source label — only for non-selected variants */}
        {label && variant !== 'suggestion-selected' && (
          <span className={styles.label}>{label}</span>
        )}

        {/* Selected label — only when no question is embedded */}
        {variant === 'suggestion-selected' && !label && (
          <span className={styles.selectedLabel}>Selected</span>
        )}

        {/* Bubble */}
        {variant === 'slash-command' ? (
          <div className={styles.commandBubbleWrap}>
            <div className={styles.bubble}>
              <span className={styles.commandText}>/{commandName}</span>
            </div>
            {commandDescription && (
              <CommandPopover
                commandName={commandName}
                description={commandDescription}
                commandType={commandType}
              />
            )}
          </div>
        ) : variant === 'suggestion-selected' ? (
          label ? (
            <div className={styles.selectedBubbleText}>
              {`Q: ${label}\nA: ${text}`}
            </div>
          ) : (
            <div className={styles.selectedBubble}>
              <span className={styles.selectedIcon}>
                <Icon name="status-check" size={16} />
              </span>
              {text}
            </div>
          )
        ) : (
          <div className={styles.bubble}>{text}</div>
        )}
      </div>

      {/* Hover metadata — always rendered for consistent spacing */}
      <MessageMeta timestamp={timestamp || ''} fullDate={fullDate} text={text} />
    </div>
  );
};

MessageBubble.displayName = 'MessageBubble';
