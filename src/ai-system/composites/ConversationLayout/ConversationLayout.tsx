/**
 * ConversationLayout — Slot-based layout for conversation turns
 *
 * Encodes the decided spacing, widths, and composition rules from the
 * MessageBlock exploration. Drop decided components into UserTurn and
 * AssistantTurn slots — spacing is automatic.
 *
 * Spec locked in MessageBlock exploration (2026-03-18).
 *
 * @example
 * ```tsx
 * <ConversationLayout>
 *   <ConversationLayout.UserTurn>
 *     <MessageBubble text="Find the Acme agreement" timestamp="10:32 AM" />
 *   </ConversationLayout.UserTurn>
 *   <ConversationLayout.AssistantTurn>
 *     <AgentThinking steps={...} outcomeSummary="..." initialDone />
 *     <MarkdownRenderer content="..." />
 *     <FeedbackActions copyText="..." />
 *   </ConversationLayout.AssistantTurn>
 *   <ConversationLayout.AssistantTurn showSuggestions>
 *     <MarkdownRenderer content="..." />
 *     <FeedbackActions copyText="..." />
 *     <ConversationLayout.Suggestions>
 *       <SuggestionChip label="Edit draft" onClick={() => {}} />
 *       <SuggestionChip label="Send for approval" onClick={() => {}} />
 *     </ConversationLayout.Suggestions>
 *   </ConversationLayout.AssistantTurn>
 * </ConversationLayout>
 * ```
 */

import React from 'react';
import styles from './ConversationLayout.module.css';

// =============================================================================
// Types
// =============================================================================

export interface ConversationLayoutProps {
  /** Conversation turns — UserTurn and AssistantTurn components */
  children: React.ReactNode;
  /** Additional className for the conversation surface */
  className?: string;
}

export interface UserTurnProps {
  /** MessageBubble component */
  children: React.ReactNode;
  /**
   * THIS TURN IS A RECORD OF AN ACT, NOT A QUESTION — an action receipt, an
   * answered ask. Akshat, 2026-08-20: *"add space after the message so it's
   * clear you're getting a response back."*
   *
   * The 4px under a user turn is an ANCHOR: it glues a question to the answer
   * it asked for. A receipt asked nothing, so what follows it is a fresh turn
   * and not the tail of this one — it takes the full 24px turn gap instead.
   */
  receipt?: boolean;
  /**
   * The turn's own id, stamped as `data-message-id`.
   *
   * Added 2026-08-24 so a scroll anchor can name ONE turn. `data-role="user"`
   * only ever finds the last one, which is right for "pin what was just sent"
   * and useless for "pin the turn the host named". Omit it and the attribute is
   * absent, exactly as before.
   */
  messageId?: string;
  /**
   * This turn JUST ARRIVED, so it plays its entrance. See the entrance block in
   * the stylesheet. The host decides — history must never replay.
   */
  entering?: boolean;
}

export interface AssistantTurnProps {
  /** AgentThinking, MarkdownRenderer, FeedbackActions, and optionally Suggestions */
  children: React.ReactNode;
  /** Whether this is the first turn (no top margin) */
  isFirst?: boolean;
  /** This turn JUST ARRIVED — plays its entrance. See `UserTurnProps.entering`. */
  entering?: boolean;
}

export interface SuggestionsProps {
  /** SuggestionChip components with optional label */
  children: React.ReactNode;
  /** Section label above chips */
  label?: string;
}

// =============================================================================
// Sub-components
// =============================================================================

/** User turn — right-aligned bubble with max-width constraint */
function UserTurn({ children, receipt, messageId, entering }: UserTurnProps) {
  return (
    <div
      className={styles.userTurn}
      data-role="user"
      data-receipt={receipt || undefined}
      data-message-id={messageId}
      data-enter={entering || undefined}
    >
      {children}
    </div>
  );
}

UserTurn.displayName = 'ConversationLayout.UserTurn';

/** Assistant turn — left-aligned response block with intra-block spacing */
function AssistantTurn({ children, isFirst, entering }: AssistantTurnProps) {
  return (
    <div
      className={styles.assistantTurn}
      data-role="assistant"
      data-first={isFirst || undefined}
      data-enter={entering || undefined}
    >
      {children}
    </div>
  );
}

AssistantTurn.displayName = 'ConversationLayout.AssistantTurn';

/** Suggestions section — ephemeral follow-up prompts with label */
function Suggestions({ children, label = 'Suggestions' }: SuggestionsProps) {
  return (
    <div className={styles.suggestions}>
      <span className={styles.suggestionsLabel}>{label}</span>
      <div className={styles.suggestionsList}>{children}</div>
    </div>
  );
}

Suggestions.displayName = 'ConversationLayout.Suggestions';

// =============================================================================
// Main component
// =============================================================================

export const ConversationLayout: React.FC<ConversationLayoutProps> & {
  UserTurn: typeof UserTurn;
  AssistantTurn: typeof AssistantTurn;
  Suggestions: typeof Suggestions;
} = ({ children, className }) => {
  return <div className={`${styles.surface} ${className || ''}`}>{children}</div>;
};

ConversationLayout.displayName = 'ConversationLayout';
ConversationLayout.UserTurn = UserTurn;
ConversationLayout.AssistantTurn = AssistantTurn;
ConversationLayout.Suggestions = Suggestions;
