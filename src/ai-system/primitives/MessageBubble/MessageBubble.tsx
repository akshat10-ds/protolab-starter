/**
 * MessageBubble — User message bubble for the Iris chat interface.
 *
 * Four variants sharing one bubble shape:
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

/**
 * `action-receipt` — WHAT THE USER DID, not what they said.
 *
 * The thread is a ledger as well as a conversation: when an agent acts because
 * a person approved something, the approval is a turn. Akshat, 2026-08-19,
 * choosing this over a status line in a box: *"thread as ledger, most clear."*
 * Every acceptance appends a pair — this receipt, then the agent's
 * deterministic response — so the thread reads as cause and effect with no
 * state hidden in a panel.
 *
 * **IT WEARS THE SHAPE HER WORDS WEAR.** Akshat, 2026-08-20: it should look
 * like a message she sent. So it is the user bubble — same fill, same radius,
 * same size, same right alignment — with the check inside it.
 *
 * OVERRULED, and the reasoning is kept because it is the better argument that
 * lost: this was a chip, no fill and one size down, because *nobody said* "You
 * approved: Request the income documents" and a filled shape on her side of the
 * thread reads as speech. The answer is that the press IS her turn, and a turn
 * she took should not be quieter than a turn she typed.
 */
/**
 * `answer-record` — WHAT THE USER ANSWERED, once the asking is over.
 *
 * Akshat, 2026-08-20: the HITL ask stays docked in the composer, but the
 * ANSWER lands in the thread. The composer frees the moment she answers, and
 * what survives is a user-side record wearing the same caption grammar as an
 * acceptance — "Answered" over the thing that was answered.
 *
 * One question is one bubble: the question in the quiet register, her answer
 * in default ink, inline. A batch is the condensed block instead — a dashed
 * container of Q+A pairs that truncates and offers "Show full answer", because
 * six questions of transcript between two turns is a document, not a turn.
 */
export type MessageBubbleVariant =
  | 'plain-text'
  | 'slash-command'
  | 'suggestion-selected'
  | 'action-receipt'
  | 'answer-record';

/** One question and what it was answered with. */
export interface AnswerPair {
  question: string;
  answer: string;
}

export interface MessageBubbleProps {
  /** The message text */
  text: string;
  /** Variant determines text styling and interaction */
  variant?: MessageBubbleVariant;
  /**
   * THE READER'S OWN SIDE, FILLED. Akshat, 2026-09-03: *"for the imessage type
   * things - can we maybe change the chat color to a blue so its more
   * obvious?"* — a long agent thread is shaped like a text thread with a
   * colleague, and a messaging app marks your side with a fill.
   *
   * His "maybe" is why this is opt-in and not the default: undefined is exactly
   * today's neutral bubble, so a host turns it on for one conversation and off
   * again by deleting one prop. `plain-text` only — a `slash-command` draws
   * cobalt text, which on a cobalt fill is no text at all.
   *
   * ponytail: `action-receipt` and `answer-record` stay neutral here, so a host
   * that uses both this and receipts gets two fills on one side. Extend the
   * class to `.actionReceipt` (and re-colour its green check) when one does.
   */
  tone?: 'brand';
  /** Short timestamp shown on hover, e.g. "10:49 AM" */
  timestamp?: string;
  /** Full date shown in tooltip, e.g. "Mar 18, 2026, 10:49 AM" */
  fullDate?: string;
  /** Source label above bubble, e.g. "Agreement Skill", "Playbook" */
  label?: string;
  /**
   * The mark on an `action-receipt`. Default is the green check — the act
   * landed. Akshat, 2026-08-20: a DISMISSAL gets no check, because a check is
   * the sign of a thing done and a dismissal is a thing declined. `none` draws
   * the caption and the words and nothing else.
   */
  receiptGlyph?: 'check' | 'none';
  /** `answer-record` only — the question(s) and what they were answered with. */
  answers?: AnswerPair[];

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

/**
 * A batch of answers, condensed. Dashed border because it is a record of an
 * exchange rather than a thing she said, and clamped because the point of the
 * record is that the decision is on file — not that it is re-read in full every
 * time the thread scrolls past it.
 */
function AnswerBlock({ answers }: { answers: AnswerPair[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.answerBlock}>
      <div className={open ? undefined : styles.answerBlockClamped}>
        {answers.map((a, i) => (
          <p key={i} className={styles.answerPair}>
            <span className={styles.answerQuestion}>{a.question}</span>{' '}
            <span className={styles.answerValue}>{a.answer}</span>
          </p>
        ))}
      </div>
      {!open && (
        <button type="button" className={styles.answerMore} onClick={() => setOpen(true)}>
          Show full answer
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  variant = 'plain-text',
  tone,
  timestamp,
  fullDate,
  label,
  receiptGlyph = 'check',
  answers,
  commandDescription,
  commandType,
}) => {
  const commandName = text.replace(/^\//, '');

  /*
    A receipt has no hover metadata: there is nothing to copy and no timestamp
    worth reading on "you approved this". Everything else about it is the user
    bubble, so it is built from the same three elements and not imitated.
  */
  if (variant === 'answer-record' && answers?.length) {
    return (
      <div className={styles.messageWrap}>
        <div className={`${styles.message} ${styles.receiptStack}`}>
          {label && <span className={styles.receiptCaption}>{label}</span>}
          {answers.length === 1 ? (
            <p className={styles.bubble}>
              <span className={styles.answerQuestion}>{answers[0].question}</span>{' '}
              <span className={styles.answerValue}>{answers[0].answer}</span>
            </p>
          ) : (
            <AnswerBlock answers={answers} />
          )}
        </div>
      </div>
    );
  }

  if (variant === 'action-receipt') {
    return (
      <div className={styles.messageWrap}>
        <div className={`${styles.message} ${styles.receiptStack}`}>
          {/*
            THE CAPTION CARRIES THE STATE, the bubble carries the thing. Akshat,
            2026-08-20 (frame 401:53354): the receipt reads "Accepted
            Recommendation" over the recommendation's own words — no "You
            approved:" prefix, no colon, no quoting. It is the `Selected`
            caption grammar with the string handed in, so a different verdict is
            a different caption and not a different component.
          */}
          {label && <span className={styles.receiptCaption}>{label}</span>}
          <p className={`${styles.bubble} ${styles.actionReceipt}`}>
            {receiptGlyph === 'check' && <Icon name="status-check" size={16} />}
            {text}
          </p>
        </div>
      </div>
    );
  }

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
          <div
            className={
              tone === 'brand' ? `${styles.bubble} ${styles.bubbleBrand}` : styles.bubble
            }
          >
            {text}
          </div>
        )}
      </div>

      {/* Hover metadata — always rendered for consistent spacing */}
      <MessageMeta timestamp={timestamp || ''} fullDate={fullDate} text={text} />
    </div>
  );
};

MessageBubble.displayName = 'MessageBubble';
