/**
 * AIChat Pattern
 *
 * A complete AI chat interface pattern that composes primitives and utilities
 * to create a conversational UI experience.
 *
 * @layer 5-patterns
 *
 * Sub-components:
 * - AIChat (main container)
 * - AIChat.MessageList (scrollable message area)
 * - AIChat.Message (individual message bubble)
 * - AIChat.InputArea (input + send button)
 * - AIChat.TypingIndicator (AI thinking state)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stack } from '../../2-utilities/Stack';
import { Inline } from '../../2-utilities/Inline';
import { Avatar } from '../../3-primitives/Avatar';
import { Text } from '../../3-primitives/Typography';
import { Card } from '../../3-primitives/Card';
import { TextArea } from '../../3-primitives/TextArea';
import { IconButton } from '../../3-primitives/IconButton';
import { Button } from '../../3-primitives/Button';
import { Spinner } from '../../3-primitives/Spinner';
import { Icon } from '../../3-primitives/Icon';
import { Tooltip } from '../../3-primitives/Tooltip';
import { AIBadge } from '../../4-composites/AIBadge';
import styles from './AIChat.module.css';

// ============================================================================
// Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Who sent the message */
  role: MessageRole;
  /** Message content (supports markdown in future) */
  content: string;
  /** Timestamp of the message */
  timestamp: Date;
  /** Message delivery status */
  status?: MessageStatus;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface SuggestedAction {
  /** Action label */
  label: string;
  /** Action description */
  description?: string;
  /** Icon name */
  icon?: string;
  /** Whether this action/step is completed (for checklists) */
  completed?: boolean;
}

/** Context source indicator (e.g., "15 agreements") */
export interface ContextSource {
  /** Label to display (e.g., "agreements", "documents") */
  label: string;
  /** Count of items in context */
  count: number;
  /** Click handler for the context pill (opens sidebar) */
  onClick?: () => void;
  /** Click handler for dismissing/clearing the source */
  onClear?: () => void;
}

export type FeedbackType = 'positive' | 'negative' | null;

export interface AIChatProps {
  /** Array of chat messages to display */
  messages: ChatMessage[];
  /** Callback when user sends a message */
  onSendMessage: (content: string) => void;
  /** Whether the AI is currently generating a response */
  isLoading?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** User avatar (URL or initials) */
  userAvatar?: string;
  /** AI assistant avatar (URL or initials) */
  assistantAvatar?: string;
  /** AI assistant name */
  assistantName?: string;
  /** User name */
  userName?: string;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Whether to show message actions (copy, etc.) */
  showActions?: boolean;
  /** Whether to show thumbs up/down feedback buttons on AI responses */
  showFeedback?: boolean;
  /** Callback when user gives feedback on a message */
  onFeedback?: (messageId: string, feedback: FeedbackType) => void;
  /** Map of message IDs to their feedback state */
  messageFeedback?: Record<string, FeedbackType>;
  /** Callback when a message action is triggered */
  onMessageAction?: (action: string, message: ChatMessage) => void;
  /** Custom welcome message when no messages */
  welcomeMessage?: React.ReactNode;
  /** Welcome title (e.g., "Welcome to Docusign") */
  welcomeTitle?: string;
  /** Suggested actions to show in zero query state */
  suggestedActions?: SuggestedAction[];
  /** Title for suggested actions section */
  suggestedActionsTitle?: string;
  /** Action text for suggested actions header (e.g., "See all") */
  suggestedActionsActionText?: string;
  /** Callback when suggested actions header is clicked */
  onSuggestedActionsHeaderClick?: () => void;
  /** Suggested questions to show in zero query state */
  suggestedQuestions?: string[];
  /** Title for suggested questions section */
  suggestedQuestionsTitle?: string;
  /** Callback when a suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void;
  /** Maximum height of the chat container */
  maxHeight?: string;
  /** Additional CSS class */
  className?: string;
  /** Disable input */
  disabled?: boolean;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Callback when history/menu button is clicked */
  onShowHistory?: () => void;
  /** Callback when new chat button is clicked */
  onNewChat?: () => void;
  /** Callback when maximize button is clicked */
  onMaximize?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Custom message renderer. Return null to use default rendering. */
  renderMessage?: (message: ChatMessage) => React.ReactNode | null;
  /** Context source to display in input area (e.g., loaded agreements) */
  contextSource?: ContextSource;
  /** Show attention animation on context source pill (ripple effect) */
  showContextAttention?: boolean;
  /** Show attention animation on input container (ripple effect) */
  showInputAttention?: boolean;
  /** Controlled input value (optional) */
  inputValue?: string;
  /** Callback when input value changes */
  onInputChange?: (value: string) => void;
  /** Whether AI is actively streaming a response (shows stop button) */
  isStreaming?: boolean;
  /** Callback when stop button is clicked during streaming */
  onStop?: () => void;
  /** Disable automatic scrolling (for custom scroll handling in parent) */
  disableAutoScroll?: boolean;
  /** Callback for input keydown events. Return true to prevent default handling (e.g., Enter to send). */
  onInputKeyDown?: (e: React.KeyboardEvent) => boolean | void;
}

// ============================================================================
// Sub-components
// ============================================================================

interface MessageProps {
  message: ChatMessage;
  userAvatar?: string;
  assistantAvatar?: string;
  userName?: string;
  assistantName?: string;
  showTimestamp?: boolean;
  showActions?: boolean;
  showFeedback?: boolean;
  feedback?: FeedbackType;
  onFeedback?: (feedback: FeedbackType) => void;
  onAction?: (action: string, message: ChatMessage) => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  userAvatar,
  assistantAvatar,
  userName = 'You',
  assistantName = 'Assistant',
  showTimestamp = false,
  showActions = true,
  showFeedback = true,
  feedback,
  onFeedback,
  onAction,
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    onAction?.('copy', message);
  }, [message, onAction]);

  if (isSystem) {
    return (
      <div className={styles.systemMessage}>
        <Text variant="caption" color="secondary">
          {message.content}
        </Text>
      </div>
    );
  }

  // Don't render assistant messages until they have content (prevents gray box during streaming start)
  if (isAssistant && !message.content) {
    return null;
  }

  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}>
      <div className={styles.messageContent}>
        {showTimestamp && (
          <Text variant="caption" color="secondary">
            {formatTime(message.timestamp)}
          </Text>
        )}

        {message.content && (
          <div className={styles.messageBubble}>
            <Text variant="body">{message.content}</Text>
          </div>
        )}

        {(showActions || showFeedback) && !isUser && (
          <div className={styles.messageActions}>
            {showFeedback && (
              <>
                <Tooltip content="Helpful">
                  <IconButton
                    icon={feedback === 'positive' ? 'thumbs-up-filled' : 'thumbs-up'}
                    size="small"
                    kind="tertiary"
                    onClick={() => onFeedback?.(feedback === 'positive' ? null : 'positive')}
                    aria-label="Mark as helpful"
                    className={feedback === 'positive' ? styles.feedbackActive : undefined}
                  />
                </Tooltip>
                <Tooltip content="Not helpful">
                  <IconButton
                    icon={feedback === 'negative' ? 'thumbs-down-filled' : 'thumbs-down'}
                    size="small"
                    kind="tertiary"
                    onClick={() => onFeedback?.(feedback === 'negative' ? null : 'negative')}
                    aria-label="Mark as not helpful"
                    className={feedback === 'negative' ? styles.feedbackActive : undefined}
                  />
                </Tooltip>
              </>
            )}
            {showActions && (
              <Tooltip content="Copy message">
                <IconButton
                  icon="duplicate"
                  size="small"
                  kind="tertiary"
                  onClick={handleCopy}
                  aria-label="Copy message"
                />
              </Tooltip>
            )}
          </div>
        )}

        {message.status === 'error' && (
          <Inline gap="small" align="center">
            <Icon name="status-warn" size="small" />
            <Text variant="caption" color="danger">
              Failed to send
            </Text>
            <Button kind="tertiary" size="small" onClick={() => onAction?.('retry', message)}>
              Retry
            </Button>
          </Inline>
        )}
      </div>
    </div>
  );
};

interface TypingIndicatorProps {
  assistantName?: string;
  assistantAvatar?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = () => {
  return (
    <div className={`${styles.message} ${styles.assistantMessage}`}>
      <div className={styles.messageContent}>
        <div className={styles.typingIndicator}>
          {/* Simple skeleton text lines */}
          <div className={styles.typingContent}>
            <div className={styles.typingLine} />
            <div className={styles.typingLine} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface InputAreaProps {
  onSend: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  /** Whether AI is actively streaming (shows stop button) */
  isStreaming?: boolean;
  /** Callback when stop button is clicked */
  onStop?: () => void;
  /** Show "Add source" button */
  showAddSource?: boolean;
  /** Callback when add source is clicked */
  onAddSource?: () => void;
  /** Context source to display instead of "Add source" */
  contextSource?: ContextSource;
  /** Show attention animation on context source pill */
  showContextAttention?: boolean;
  /** Show attention animation on input container (ripple effect) */
  showInputAttention?: boolean;
  /** Show AI disclaimer */
  showDisclaimer?: boolean;
  /** Custom disclaimer text */
  disclaimerText?: string;
  /** Controlled input value */
  value?: string;
  /** Callback when value changes (for controlled mode) */
  onValueChange?: (value: string) => void;
  /** Callback for keydown events. Return true to prevent default handling. */
  onKeyDown?: (e: React.KeyboardEvent) => boolean | void;
}

const InputArea: React.FC<InputAreaProps> = ({
  onSend,
  placeholder = 'Ask anything...',
  disabled = false,
  isLoading = false,
  isStreaming = false,
  onStop,
  showAddSource = true,
  onAddSource,
  contextSource,
  showContextAttention = false,
  showInputAttention = false,
  showDisclaimer = true,
  disclaimerText = 'Responses are generated with AI and are not legal advice.',
  value: controlledValue,
  onValueChange,
  onKeyDown: onKeyDownProp,
}) => {
  // Support both controlled and uncontrolled modes
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const value = isControlled ? controlledValue : internalValue;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Expand state for long content
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if content is long enough to show expand button (more than 200 chars or 3 lines)
  const lineCount = (value.match(/\n/g) || []).length + 1;
  const isLongContent = value.length > 200 || lineCount > 3;

  // Auto-resize textarea based on content
  const adjustTextAreaHeight = useCallback(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      const minHeight = 40;
      const maxHeight = isExpanded ? 500 : 200;

      // If empty or very short, use min height directly
      if (!value || value.length < 50) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight, clamped between min and max
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, isExpanded]);

  // Adjust height when value changes
  useEffect(() => {
    adjustTextAreaHeight();
  }, [value, adjustTextAreaHeight]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (isControlled) {
        onValueChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [isControlled, onValueChange]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      // Clear value after send
      handleValueChange('');
      // Reset textarea height
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
      }
    }
  }, [value, onSend, disabled, isLoading, handleValueChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Allow parent to intercept keydown events
      if (onKeyDownProp) {
        const handled = onKeyDownProp(e);
        if (handled) return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, onKeyDownProp]
  );

  const canSend = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className={styles.inputArea}>
      <div
        className={`${styles.inputContainer}${showInputAttention ? ` ${styles.inputContainerAttention}` : ''}${isExpanded ? ` ${styles.inputContainerExpanded}` : ''}`}
      >
        {/* Expand/Collapse button - shows when content is long */}
        {isLongContent && (
          <Tooltip text={isExpanded ? 'Collapse' : 'Expand'} location="above" alignment="end">
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse input' : 'Expand input'}
            >
              <Icon name={isExpanded ? 'arrows-in' : 'arrows-out'} size="small" />
            </button>
          </Tooltip>
        )}
        <div className={styles.inputContent}>
          <TextArea
            ref={textAreaRef}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`${styles.textInput}${isExpanded ? ` ${styles.textInputExpanded}` : ''}${isLongContent ? ` ${styles.textInputWithExpandButton}` : ''}`}
            label="Chat message input"
            hideLabel
          />
        </div>
        <div className={styles.inputActions}>
          {contextSource ? (
            <div
              className={`${styles.contextSourcePill}${showContextAttention ? ` ${styles.contextSourcePillAttention}` : ''}`}
            >
              <button
                type="button"
                className={styles.contextSourcePillMain}
                onClick={contextSource.onClick}
                disabled={disabled}
              >
                <Icon name="document-stack" size="small" />
                <span>
                  {contextSource.count} {contextSource.label}
                </span>
              </button>
              {contextSource.onClear && (
                <button
                  type="button"
                  className={styles.contextSourcePillClear}
                  onClick={contextSource.onClear}
                  disabled={disabled}
                  aria-label="Clear source"
                >
                  <Icon name="close" size="small" />
                </button>
              )}
            </div>
          ) : showAddSource ? (
            <button
              type="button"
              className={styles.addSourceButton}
              onClick={onAddSource}
              disabled={disabled}
            >
              <Icon name="plus" size="small" />
              <span>Add source</span>
            </button>
          ) : null}
          {isStreaming ? (
            <IconButton
              icon="control-stop"
              variant="brand"
              size="small"
              onClick={onStop}
              aria-label="Stop generating"
            />
          ) : isLoading ? (
            <Spinner size="small" />
          ) : (
            <IconButton
              icon="arrow-up"
              variant="brand"
              size="small"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
            />
          )}
        </div>
      </div>
      {showDisclaimer && <p className={styles.disclaimer}>{disclaimerText}</p>}
    </div>
  );
};

interface WelcomeProps {
  assistantName?: string;
  userName?: string;
  welcomeTitle?: string;
  suggestedActions?: SuggestedAction[];
  suggestedActionsTitle?: string;
  suggestedActionsActionText?: string;
  onSuggestedActionsHeaderClick?: () => void;
  suggestedQuestions?: string[];
  suggestedQuestionsTitle?: string;
  onSuggestionClick?: (suggestion: string) => void;
  children?: React.ReactNode;
}

const Welcome: React.FC<WelcomeProps> = ({
  assistantName = 'Assistant',
  userName,
  welcomeTitle,
  suggestedActions,
  suggestedActionsTitle = 'Prompts',
  suggestedActionsActionText,
  onSuggestedActionsHeaderClick,
  suggestedQuestions,
  suggestedQuestionsTitle = 'Questions you can ask',
  onSuggestionClick,
  children,
}) => {
  if (children) {
    return <div className={styles.welcome}>{children}</div>;
  }

  const hasZeroQueryState = userName || suggestedActions?.length || suggestedQuestions?.length;

  if (hasZeroQueryState) {
    return (
      <div className={styles.welcomeZeroQuery}>
        <Stack gap="large">
          {/* Greeting */}
          {userName && (
            <div className={styles.welcomeGreeting}>
              <AIBadge />
              <h2 className={styles.greetingText}>
                <span className={styles.greetingHello}>Hello,</span>{' '}
                <span className={styles.greetingName}>{userName}</span>
              </h2>
              <p className={styles.greetingSubtitle}>
                {welcomeTitle || 'What would you like to know?'}
              </p>
            </div>
          )}

          {/* Suggested Prompts */}
          {suggestedActions && suggestedActions.length > 0 && (
            <div className={styles.suggestionsSection}>
              <div
                className={`${styles.sectionHeader} ${onSuggestedActionsHeaderClick ? styles.sectionHeaderClickable : ''}`}
                onClick={onSuggestedActionsHeaderClick}
                role={onSuggestedActionsHeaderClick ? 'button' : undefined}
                tabIndex={onSuggestedActionsHeaderClick ? 0 : undefined}
              >
                <Text variant="caption" color="secondary" weight="medium">
                  {suggestedActionsTitle}
                </Text>
                {suggestedActionsActionText && onSuggestedActionsHeaderClick && (
                  <Inline gap="small" align="center" className={styles.sectionHeaderAction}>
                    <Text variant="caption" color="secondary">
                      {suggestedActionsActionText}
                    </Text>
                    <Icon name="chevron-right" size="small" />
                  </Inline>
                )}
              </div>
              <Stack gap="small">
                {suggestedActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.suggestionCard} ${action.completed ? styles.suggestionCardCompleted : ''}`}
                    onClick={() => onSuggestionClick?.(action.label)}
                    disabled={action.completed}
                  >
                    <div
                      className={`${styles.suggestionIcon} ${action.completed ? styles.suggestionIconCompleted : ''}`}
                    >
                      <Icon
                        name={action.completed ? 'check' : (action.icon as any) || 'bolt'}
                        size="medium"
                      />
                    </div>
                    <div className={styles.suggestionContent}>
                      <Text variant="body" weight="medium">
                        {action.label}
                      </Text>
                      {action.description && <Text variant="caption">{action.description}</Text>}
                    </div>
                  </button>
                ))}
              </Stack>
            </div>
          )}

          {/* Suggested Questions */}
          {suggestedQuestions && suggestedQuestions.length > 0 && (
            <div className={styles.suggestionsSection}>
              <Inline gap="small" align="center" className={styles.sectionHeader}>
                <Text variant="caption" color="secondary" weight="medium">
                  {suggestedQuestionsTitle}
                </Text>
                <Icon name="chevron-right" size="small" />
              </Inline>
              <Stack gap="small">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.questionCard}
                    onClick={() => onSuggestionClick?.(question)}
                  >
                    <div className={styles.suggestionIcon}>
                      <Icon name="help" size="medium" />
                    </div>
                    <Text variant="body">{question}</Text>
                  </button>
                ))}
              </Stack>
            </div>
          )}
        </Stack>
      </div>
    );
  }

  return (
    <div className={styles.welcome}>
      <Stack gap="medium" align="center">
        <div className={styles.welcomeIcon}>
          <Icon name="messages" size="large" />
        </div>
        <Text variant="body" color="secondary" align="center">
          Start a conversation with {assistantName}
        </Text>
      </Stack>
    </div>
  );
};

// ============================================================================
// Header Sub-component
// ============================================================================

interface HeaderProps {
  onShowHistory?: () => void;
  onNewChat?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowHistory, onNewChat, onMaximize, onClose }) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Tooltip content="History">
          <IconButton
            icon="menu"
            size="small"
            kind="tertiary"
            onClick={onShowHistory}
            aria-label="Show history"
          />
        </Tooltip>
      </div>
      <div className={styles.headerRight}>
        <Tooltip content="New chat">
          <IconButton
            icon="plus"
            size="small"
            kind="tertiary"
            onClick={onNewChat}
            aria-label="New chat"
          />
        </Tooltip>
        <Tooltip content="Maximize">
          <IconButton
            icon="container-enlarge"
            size="small"
            kind="tertiary"
            onClick={onMaximize}
            aria-label="Maximize"
          />
        </Tooltip>
        <Tooltip content="Close">
          <IconButton
            icon="close"
            size="small"
            kind="tertiary"
            onClick={onClose}
            aria-label="Close"
          />
        </Tooltip>
      </div>
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// Main Component
// ============================================================================

export const AIChat: React.FC<AIChatProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = 'Type a message...',
  userAvatar,
  assistantAvatar,
  assistantName = 'Assistant',
  userName = 'You',
  showTimestamps = false,
  showActions = true,
  showFeedback = true,
  onFeedback,
  messageFeedback = {},
  onMessageAction,
  welcomeMessage,
  welcomeTitle,
  suggestedActions,
  suggestedActionsTitle,
  suggestedActionsActionText,
  onSuggestedActionsHeaderClick,
  suggestedQuestions,
  suggestedQuestionsTitle,
  onSuggestionClick,
  maxHeight = '600px',
  className,
  disabled = false,
  showHeader = true,
  onShowHistory,
  onNewChat,
  onMaximize,
  onClose,
  renderMessage,
  contextSource,
  showContextAttention = false,
  showInputAttention = false,
  inputValue,
  onInputChange,
  isStreaming = false,
  onStop,
  disableAutoScroll = false,
  onInputKeyDown,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAiMessageRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Smart auto-scroll:
  // - User message: scroll to bottom (show their message)
  // - AI message: scroll to start of AI response (so user sees the beginning)
  // Can be disabled via disableAutoScroll prop for custom scroll handling
  useEffect(() => {
    if (disableAutoScroll) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    const prevLength = prevMessagesLengthRef.current;
    const currentLength = messages.length;

    if (currentLength > prevLength) {
      const lastMessage = messages[currentLength - 1];
      if (lastMessage?.role === 'user') {
        // User sent a message - scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (lastMessage?.role === 'assistant') {
        // AI response - scroll to start of response with a small delay for DOM update
        setTimeout(() => {
          lastAiMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    }

    prevMessagesLengthRef.current = currentLength;
  }, [messages, disableAutoScroll]);

  const isEmpty = messages.length === 0;

  // Use CSS custom property for maxHeight to avoid inline styles
  const containerStyle = {
    '--ai-chat-max-height': maxHeight,
  } as React.CSSProperties;

  return (
    <Card data-ink-component="AIChat" className={`${styles.container} ${className || ''}`} style={containerStyle}>
      {showHeader && (
        <Header
          onShowHistory={onShowHistory}
          onNewChat={onNewChat}
          onMaximize={onMaximize}
          onClose={onClose}
        />
      )}
      <div className={styles.messageList}>
        {isEmpty ? (
          <Welcome
            assistantName={assistantName}
            userName={userName !== 'You' ? userName : undefined}
            welcomeTitle={welcomeTitle}
            suggestedActions={suggestedActions}
            suggestedActionsTitle={suggestedActionsTitle}
            suggestedActionsActionText={suggestedActionsActionText}
            onSuggestedActionsHeaderClick={onSuggestedActionsHeaderClick}
            suggestedQuestions={suggestedQuestions}
            suggestedQuestionsTitle={suggestedQuestionsTitle}
            onSuggestionClick={onSuggestionClick}
          >
            {welcomeMessage}
          </Welcome>
        ) : (
          <Stack gap="medium" className={styles.messages}>
            {messages.map((message, index) => {
              // Check if this is the last assistant message (for scroll ref)
              const isLastAiMessage =
                (message.role === 'assistant' && index === messages.length - 1) ||
                (index === messages.length - 2 && messages[messages.length - 1]?.role === 'user');

              // Check if custom renderer is provided and returns content
              const customContent = renderMessage?.(message);
              if (customContent !== null && customContent !== undefined) {
                return (
                  <div
                    key={message.id}
                    ref={isLastAiMessage ? lastAiMessageRef : undefined}
                    className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                  >
                    <div className={styles.messageContent}>{customContent}</div>
                  </div>
                );
              }
              // Default rendering
              return (
                <div key={message.id} ref={isLastAiMessage ? lastAiMessageRef : undefined}>
                  <Message
                    message={message}
                    userAvatar={userAvatar}
                    assistantAvatar={assistantAvatar}
                    userName={userName}
                    assistantName={assistantName}
                    showTimestamp={showTimestamps}
                    showActions={showActions}
                    showFeedback={showFeedback}
                    feedback={messageFeedback[message.id]}
                    onFeedback={(fb) => onFeedback?.(message.id, fb)}
                    onAction={onMessageAction}
                  />
                </div>
              );
            })}
            {isLoading && (
              <TypingIndicator assistantName={assistantName} assistantAvatar={assistantAvatar} />
            )}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </div>

      <InputArea
        onSend={onSendMessage}
        placeholder={placeholder}
        disabled={disabled}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onStop={onStop}
        contextSource={contextSource}
        showContextAttention={showContextAttention}
        showInputAttention={showInputAttention}
        value={inputValue}
        onValueChange={onInputChange}
        onKeyDown={onInputKeyDown}
      />
    </Card>
  );
};

// Attach sub-components for compound component pattern
AIChat.displayName = 'AIChat';
