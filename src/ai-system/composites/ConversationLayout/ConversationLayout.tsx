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
}

export interface AssistantTurnProps {
  /** AgentThinking, MarkdownRenderer, FeedbackActions, and optionally Suggestions */
  children: React.ReactNode;
  /** Whether this is the first turn (no top margin) */
  isFirst?: boolean;
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
function UserTurn({ children }: UserTurnProps) {
  return (
    <div className={styles.userTurn} data-role="user">
      {children}
    </div>
  );
}

UserTurn.displayName = 'ConversationLayout.UserTurn';

/** Assistant turn — left-aligned response block with intra-block spacing */
function AssistantTurn({ children, isFirst }: AssistantTurnProps) {
  return (
    <div className={styles.assistantTurn} data-role="assistant" data-first={isFirst || undefined}>
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
