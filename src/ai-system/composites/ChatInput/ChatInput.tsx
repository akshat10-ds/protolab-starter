/**
 * ChatInput — Agent chat input area (Decided Spec 2026-03-19)
 *
 * ContentEditable div for inline slash coloring. Single-line layout uses
 * `display: contents` on actions wrapper with `order` for:
 *   [+ CommandMenu] [contentEditable] [send brand]
 *
 * Multi-line: text full-width on top, [+ CommandMenu] [spacer] [send] below.
 * Expands when scrollHeight > 28, collapses only when text empty.
 * Animated placeholder cycles hints every N ms with fade transitions.
 * Slash detection: opens CommandMenu on bare `/`, flat filtered list on `/text`.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icon, IconButton } from '@ink';
import { FilterTag } from '@ink';
import { CommandMenu } from '@ai/composites/CommandMenu/CommandMenu';
import type {
  CommandContextItem,
  CommandToolCategory,
  CommandToolChild,
} from '@ai/composites/CommandMenu/CommandMenu';
import styles from './ChatInput.module.css';

// =============================================================================
// Types
// =============================================================================

export interface ChatInputContextSource {
  label: string;
  icon?: string;
  count?: number;
  onClick?: () => void;
  onClear?: () => void;
}

export interface ChatInputMentionItem {
  id: string;
  icon: string;
  label: string;
  secondary?: string;
  timestamp?: string;
  category?: string;
}

export interface ChatInputProps {
  /** Current value (controlled) */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Placeholder text (static — used if placeholderHints has 1 item) */
  placeholder?: string;
  /** Disable input */
  disabled?: boolean;

  /** Send handler — called when user clicks send or presses Enter */
  onSend?: (content: string) => void;
  /** Loading state — shows spinner on send button */
  isLoading?: boolean;
  /** Streaming state — shows stop button instead of send */
  isStreaming?: boolean;
  /** Stop handler */
  onStop?: () => void;

  /**
   * Something sits flush on the composer's top edge — square off its top two
   * corners so the two read as one object.
   *
   * `IrisAgent`'s Suggested Context strip is the first caller. The strip carries
   * the radius for the pair on its own top corners; if the composer kept its
   * 12px curve here, the strip's square bottom corners would stand outside it.
   */
  flushTop?: boolean;
  /** Context source pill */
  contextSource?: ChatInputContextSource;
  /** Attention animation on context pill */
  showContextAttention?: boolean;
  /** Add source handler — shows "+" button when no context */
  onAddSource?: () => void;

  /** Command trigger prefix (default: "/") — fires onCommandTrigger when typed */
  commandPrefix?: string;
  /** Fires when command prefix is detected with the current filter text */
  onCommandTrigger?: (filter: string) => void;
  /** Fires when command trigger is dismissed */
  onCommandDismiss?: () => void;

  /** Fine print under the input. A node, not a string — the shipping panel ends it with a link. */
  disclaimer?: React.ReactNode;

  /** Slot for rendering above the input (e.g., attached files) */
  attachments?: React.ReactNode;
  /** Slot for rendering to the left of the input */
  leadingSlot?: React.ReactNode;

  /**
   * Bump this number and the input takes focus.
   *
   * A counter, not a boolean: the host asks for focus at a moment, and the same
   * request can come twice. `0` (the default) never focuses, so nothing is
   * stolen on mount.
   *
   * `IrisAgent` bumps it when a zero-query agent row is clicked — the agent
   * attaches and the caret lands in the box, ready for what you want it to do.
   */
  focusKey?: number;

  /** Max expand height in px (default: 200) */
  maxExpandHeight?: number;

  /** Layout variant — "default" starts single-line, "expanded" starts multi-line */
  variant?: 'default' | 'expanded';

  className?: string;

  // NEW — CommandMenu integration
  /** Context items for the + CommandMenu (direct actions) */
  commandContextItems?: CommandContextItem[];
  /** Tool categories for the + CommandMenu (drill-downs) */
  commandToolCategories?: CommandToolCategory[];
  /** Called when a command item is selected (from CommandMenu or slash dropdown) */
  onCommandSelect?: (item: CommandContextItem | CommandToolChild) => void;

  // NEW — Animated placeholder
  /** Placeholder hints to cycle through (default: ['Ask a question...']) */
  placeholderHints?: string[];
  /**
   * A slash token drawn at the head of the placeholder — `/counterparty-brief`
   * — with the hint following it. Claude's inline skill token, in ecru.
   *
   * Preview only: it lives in the placeholder layer, so it never enters the
   * value, never changes the input's height, and disappears with the hover that
   * set it. `IrisAgent` passes it while an `agent` zero-query row is under the
   * pointer, and on a click puts the same string into the value for real.
   */
  placeholderToken?: string;
  /** Interval in ms between hint cycles (default: 4000) */
  placeholderInterval?: number;

  // NEW — @ mention file picker
  /** Items to show in the @ mention dropdown */
  mentionItems?: ChatInputMentionItem[];
  /** Called when a mention item is selected */
  onMentionSelect?: (item: ChatInputMentionItem) => void;
  /** Mention trigger prefix (default: "@") */
  mentionPrefix?: string;
}

// =============================================================================
// Hook: useAnimatedPlaceholder
// =============================================================================

function useAnimatedPlaceholder(hints: string[], interval: number) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'entering'>('visible');
  const [paused, setPaused] = useState(false);

  // No cycling if only one hint
  const shouldCycle = hints.length > 1;

  useEffect(() => {
    if (paused || !shouldCycle) return;

    const timer = setInterval(() => {
      setPhase('exiting');
      setTimeout(() => {
        setIndex((i) => (i + 1) % hints.length);
        setPhase('entering');
        setTimeout(() => setPhase('visible'), 280);
      }, 280);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, paused, shouldCycle, hints.length]);

  return {
    /*
     * Wrapped, not indexed raw. The host swaps the whole array when a
     * zero-query row is hovered — three cycling hints become one previewed
     * line — and `index` is state that nothing resets, so a stale 1 or 2 read
     * past the end of the new array and the placeholder went blank. The
     * modulo keeps a shorter list in range.
     */
    text: hints.length ? hints[index % hints.length] : '',
    phase,
    pause: useCallback(() => {
      setPaused(true);
      setPhase('visible');
    }, []),
    resume: useCallback(() => {
      setIndex(0);
      setPhase('visible');
      setPaused(false);
    }, []),
  };
}

// =============================================================================
// Component
// =============================================================================

const DEFAULT_HINTS = ['Ask a question...'];

/** Get the caret offset (character count) within a contentEditable element */
function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return (el.textContent || '').length;
  try {
    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
  } catch {
    return (el.textContent || '').length;
  }
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value: controlledValue,
  onChange,
  placeholder = 'Ask a question...',
  disabled = false,
  onSend,
  isLoading = false,
  isStreaming = false,
  onStop,
  flushTop = false,
  contextSource,
  showContextAttention = false,
  onAddSource,
  commandPrefix = '/',
  onCommandTrigger,
  onCommandDismiss,
  disclaimer,
  attachments,
  leadingSlot,
  focusKey = 0,
  maxExpandHeight = 200,
  variant = 'default',
  className,
  commandContextItems,
  commandToolCategories,
  onCommandSelect,
  placeholderHints = DEFAULT_HINTS,
  placeholderToken,
  placeholderInterval = 4000,
  mentionItems,
  onMentionSelect,
  mentionPrefix = '@',
}) => {
  // Uncontrolled fallback
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const currentValue = isControlled ? controlledValue : internalValue;

  const inputRef = useRef<HTMLDivElement>(null);
  const isUpdatingDOM = useRef(false);
  const commandActiveRef = useRef(false);
  // Inline ref — updated every render so rAF can check if value was cleared externally
  const currentValueRef = useRef(currentValue);
  currentValueRef.current = currentValue;

  // Layout states
  const [isMultiLine, setIsMultiLine] = useState(variant === 'expanded');
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wasMultiLine = useRef(variant === 'expanded');

  // CommandMenu states
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashLeftPx, setSlashLeftPx] = useState(0);
  const [slashFocusIndex, setSlashFocusIndex] = useState(0);

  // Mention states
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionLeftPx, setMentionLeftPx] = useState(0);
  const [mentionFocusIndex, setMentionFocusIndex] = useState(0);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Determine if CommandMenu mode is active. An *empty* array is not a menu:
  // `!!([])` is true, so the old check rendered the "+" as a trigger for a menu
  // with zero items — it opened an empty popover. Require actual items.
  const hasCommandMenu =
    (commandContextItems?.length ?? 0) > 0 || (commandToolCategories?.length ?? 0) > 0;
  const hasMentionItems = !!(mentionItems && mentionItems.length > 0);

  // Animated placeholder
  const animPlaceholder = useAnimatedPlaceholder(placeholderHints, placeholderInterval);

  // =========================================================================
  // Slash position calculation
  // =========================================================================

  const positionSlashAnchor = useCallback((slashCharIndex: number) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const wrapperRect = el.closest(`.${styles.textareaWrapper}`)?.getBoundingClientRect();
    if (!wrapperRect) return;

    try {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const len = (node.textContent || '').length;
        if (offset + len > slashCharIndex) {
          const range = document.createRange();
          range.setStart(node, slashCharIndex - offset);
          range.setEnd(node, slashCharIndex - offset);
          const slashRect = range.getBoundingClientRect();
          setSlashLeftPx(slashRect.left - wrapperRect.left);
          break;
        }
        offset += len;
      }
    } catch {
      /* ignore */
    }
  }, []);

  const positionMentionAnchor = useCallback((charIndex: number) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const wrapperRect = el.closest(`.${styles.textareaWrapper}`)?.getBoundingClientRect();
    if (!wrapperRect) return;

    try {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const len = (node.textContent || '').length;
        if (offset + len > charIndex) {
          const range = document.createRange();
          range.setStart(node, charIndex - offset);
          range.setEnd(node, charIndex - offset);
          const rect = range.getBoundingClientRect();
          setMentionLeftPx(rect.left - wrapperRect.left);
          break;
        }
        offset += len;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // =========================================================================
  // Build flat items for slash filtering
  // =========================================================================

  const allFlatItems = hasCommandMenu
    ? [
        ...(commandContextItems || []).map((i) => ({
          id: i.id,
          icon: i.icon,
          label: i.label,
          description: '',
          type: 'Context' as const,
          original: i as CommandContextItem | CommandToolChild,
        })),
        ...(commandToolCategories || []).flatMap((cat) =>
          cat.children.map((ch) => ({
            id: ch.id,
            icon: ch.icon,
            label: ch.label,
            description: ch.description || '',
            type: cat.label,
            original: ch as CommandContextItem | CommandToolChild,
          }))
        ),
      ]
    : [];

  const allItemLabels = allFlatItems.map((i) => i.label);

  const filteredFlatItems = slashFilter
    ? allFlatItems.filter(
        (i) =>
          i.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
          i.description.toLowerCase().includes(slashFilter.toLowerCase()) ||
          i.type.toLowerCase().includes(slashFilter.toLowerCase())
      )
    : allFlatItems;

  // =========================================================================
  // Filtered mention items
  // =========================================================================

  const filteredMentionItems = mentionFilter
    ? (mentionItems || []).filter(
        (i) =>
          i.label.toLowerCase().includes(mentionFilter.toLowerCase()) ||
          (i.secondary || '').toLowerCase().includes(mentionFilter.toLowerCase())
      )
    : mentionItems || [];

  // Scroll focused mention item into view
  useEffect(() => {
    if (!mentionMenuOpen || !mentionDropdownRef.current) return;
    const items = mentionDropdownRef.current.querySelectorAll(`.${styles.mentionDropdownItem}`);
    const focused = items[mentionFocusIndex];
    if (focused) {
      focused.scrollIntoView({ block: 'nearest' });
    }
  }, [mentionFocusIndex, mentionMenuOpen]);

  // =========================================================================
  // Matched command detection (for coloring)
  // =========================================================================

  const matchedCommandItem = currentValue.startsWith(commandPrefix)
    ? (() => {
        const spaceIdx = currentValue.indexOf(' ');
        const cmdText = (
          spaceIdx === -1
            ? currentValue.slice(commandPrefix.length)
            : currentValue.slice(commandPrefix.length, spaceIdx)
        ).toLowerCase();
        return (
          allFlatItems.find(
            (i) =>
              i.label.toLowerCase().replace(/\s+/g, '-') === cmdText ||
              i.label.toLowerCase() === cmdText
          ) ?? null
        );
      })()
    : null;

  const matchedCommand = matchedCommandItem?.label ?? null;

  // =========================================================================
  // Set value helper (updates state + notifies consumer)
  // =========================================================================

  const setValue = useCallback(
    (val: string) => {
      if (!isControlled) setInternalValue(val);
      onChange?.(val);
    },
    [isControlled, onChange]
  );

  // =========================================================================
  // Input handler — reads contentEditable text, detects slashes
  // =========================================================================

  const handleInput = useCallback(() => {
    if (isUpdatingDOM.current) return;
    const el = inputRef.current;
    if (!el) return;
    const newText = el.textContent || '';
    setValue(newText);

    // Legacy command trigger callback
    if (onCommandTrigger && newText.startsWith(commandPrefix)) {
      commandActiveRef.current = true;
      onCommandTrigger(newText.slice(commandPrefix.length));
    } else if (commandActiveRef.current) {
      commandActiveRef.current = false;
      onCommandDismiss?.();
    }

    const caretPos = getCaretOffset(el);
    const textBeforeCaret = newText.slice(0, caretPos);

    // Slash detection for CommandMenu mode
    if (hasCommandMenu) {
      const lastSlashIdx = textBeforeCaret.lastIndexOf('/');
      const textAfterSlash = lastSlashIdx >= 0 ? textBeforeCaret.slice(lastSlashIdx + 1) : '';

      if (lastSlashIdx >= 0 && !textAfterSlash.includes(' ')) {
        setSlashMenuOpen(true);
        setPlusMenuOpen(false);
        setMentionMenuOpen(false);
        setSlashFilter(textAfterSlash);
        setSlashFocusIndex(0);
        requestAnimationFrame(() => positionSlashAnchor(lastSlashIdx));
        return; // slash takes priority — skip mention detection
      } else {
        setSlashMenuOpen(false);
        setSlashFilter('');
        setSlashFocusIndex(0);
      }
    }

    // @ mention detection
    if (hasMentionItems) {
      const lastAtIdx = textBeforeCaret.lastIndexOf(mentionPrefix);
      const textAfterAt =
        lastAtIdx >= 0 ? textBeforeCaret.slice(lastAtIdx + mentionPrefix.length) : '';

      if (lastAtIdx >= 0 && !textAfterAt.includes(' ')) {
        setMentionMenuOpen(true);
        setSlashMenuOpen(false);
        setPlusMenuOpen(false);
        setMentionFilter(textAfterAt);
        setMentionFocusIndex(0);
        requestAnimationFrame(() => positionMentionAnchor(lastAtIdx));
        return;
      }
    }

    // No trigger active — close mention menu
    setMentionMenuOpen(false);
    setMentionFilter('');
    setMentionFocusIndex(0);
  }, [
    setValue,
    hasCommandMenu,
    hasMentionItems,
    commandPrefix,
    mentionPrefix,
    onCommandTrigger,
    onCommandDismiss,
    positionSlashAnchor,
    positionMentionAnchor,
  ]);

  // =========================================================================
  // Slash coloring via innerHTML
  // =========================================================================

  useEffect(() => {
    const el = inputRef.current;
    if (!el || !matchedCommand) return;

    const raf = requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const sel = window.getSelection();
      let caretOffset = 0;
      if (sel && sel.rangeCount > 0) {
        try {
          const range = sel.getRangeAt(0);
          const pre = range.cloneRange();
          pre.selectNodeContents(el);
          pre.setEnd(range.endContainer, range.endOffset);
          caretOffset = pre.toString().length;
        } catch {
          /* ignore */
        }
      }

      isUpdatingDOM.current = true;
      const spaceIdx = currentValue.indexOf(' ');
      if (spaceIdx === -1) {
        el.innerHTML = `<span class="${styles.commandSlash}">${escapeHtml(currentValue)}</span>`;
      } else {
        el.innerHTML =
          `<span class="${styles.commandSlash}">${escapeHtml(currentValue.slice(0, spaceIdx))}</span>` +
          `<span class="${styles.commandDesc}">${escapeHtml(currentValue.slice(spaceIdx))}</span>`;
      }
      isUpdatingDOM.current = false;

      // Restore caret
      try {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let offset = 0;
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const len = (node.textContent || '').length;
          if (offset + len >= caretOffset) {
            const newRange = document.createRange();
            newRange.setStart(node, caretOffset - offset);
            newRange.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(newRange);
            break;
          }
          offset += len;
        }
      } catch {
        /* ignore */
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [currentValue, matchedCommand]);

  // =========================================================================
  // Multi-line detection: expand when scrollHeight > 28, collapse on empty
  // =========================================================================

  const hasAttachments = !!attachments;
  const hasContext = !!contextSource;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    // Expanded variant always stays multi-line — skip all detection
    if (variant === 'expanded') return;

    // Force expand when attachments or context source are present
    if (hasAttachments || hasContext) {
      if (!wasMultiLine.current) {
        wasMultiLine.current = true;
        setIsMultiLine(true);
      }
      return;
    }

    if (!currentValue) {
      if (wasMultiLine.current) {
        setIsCollapsing(true);
        setTimeout(() => {
          wasMultiLine.current = false;
          setIsMultiLine(false);
          setIsCollapsing(false);
        }, 200);
      }
      return;
    }

    if (!wasMultiLine.current) {
      requestAnimationFrame(() => {
        if (!inputRef.current) return;
        if (inputRef.current.scrollHeight > 28) {
          wasMultiLine.current = true;
          setIsMultiLine(true);
        }
      });
    }
  }, [currentValue, hasAttachments, hasContext]);

  // =========================================================================
  // Sync controlled value into contentEditable
  // =========================================================================

  useEffect(() => {
    const el = inputRef.current;
    if (!el || isUpdatingDOM.current) return;
    const domText = el.textContent || '';
    if (domText !== currentValue) {
      isUpdatingDOM.current = true;
      el.textContent = currentValue;
      isUpdatingDOM.current = false;
    }
  }, [currentValue]);

  // =========================================================================
  // Focus on request
  // =========================================================================

  useEffect(() => {
    if (!focusKey) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    /*
     * The caret goes to the end, not the start. The host asks for focus right
     * after it puts text in the box — a committed `/agent-name ` token — and
     * the point of the gesture is to type *after* it. The value-sync effect is
     * declared above this one, so the text is already in the DOM here. On an
     * empty input this is a no-op.
     */
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      /* ignore */
    }
  }, [focusKey]);

  // =========================================================================
  // Clear helper
  // =========================================================================

  const clearInput = useCallback(() => {
    setValue('');
    setSlashMenuOpen(false);
    setSlashFilter('');
    setPlusMenuOpen(false);
    setMentionMenuOpen(false);
    setMentionFilter('');
    setMentionFocusIndex(0);
    if (inputRef.current) {
      inputRef.current.textContent = '';
      inputRef.current.focus();
    }
    // Don't force-collapse here — the multi-line effect will handle it
    // based on whether contextSource/attachments are still present
  }, [setValue]);

  // =========================================================================
  // Send logic
  // =========================================================================

  const doSend = useCallback(() => {
    const trimmed = currentValue.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend?.(trimmed);
    clearInput();
  }, [currentValue, disabled, isLoading, onSend, clearInput]);

  // =========================================================================
  // Command select handler (from CommandMenu or slash dropdown)
  // =========================================================================

  const handleCommandSelect = useCallback(
    (item: CommandContextItem | CommandToolChild) => {
      // Insert as slash command in kebab-case: "Review Agent" → "/review-agent"
      const kebab = item.label.toLowerCase().replace(/\s+/g, '-');
      const commandText = `/${kebab}`;
      // Close menus first
      setSlashMenuOpen(false);
      setSlashFilter('');
      setPlusMenuOpen(false);
      // Update value via setValue (handles both controlled + uncontrolled)
      setValue(commandText);
      // Update the contentEditable DOM to match — but skip if value was already
      // cleared externally by onCommandSelect (e.g. command sent immediately)
      const capturedCommand = commandText;
      requestAnimationFrame(() => {
        if (!inputRef.current || currentValueRef.current === '') return;
        inputRef.current.textContent = capturedCommand;
        inputRef.current.focus();
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
      onCommandSelect?.(item);
    },
    [onCommandSelect, setValue]
  );

  // =========================================================================
  // Mention select handler
  // =========================================================================

  const handleMentionSelect = useCallback(
    (item: ChatInputMentionItem) => {
      setMentionMenuOpen(false);
      setMentionFilter('');
      setMentionFocusIndex(0);

      // Remove @filter text from contentEditable
      const el = inputRef.current;
      if (el) {
        const text = el.textContent || '';
        const caretPos = getCaretOffset(el);
        const textBeforeCaret = text.slice(0, caretPos);
        const lastAtIdx = textBeforeCaret.lastIndexOf(mentionPrefix);
        if (lastAtIdx >= 0) {
          const newText = text.slice(0, lastAtIdx) + text.slice(caretPos);
          isUpdatingDOM.current = true;
          el.textContent = newText;
          isUpdatingDOM.current = false;
          setValue(newText);

          // Restore caret at removal point
          requestAnimationFrame(() => {
            if (!inputRef.current) return;
            try {
              const walker = document.createTreeWalker(inputRef.current, NodeFilter.SHOW_TEXT);
              let offset = 0;
              let node: Node | null;
              while ((node = walker.nextNode())) {
                const len = (node.textContent || '').length;
                if (offset + len >= lastAtIdx) {
                  const range = document.createRange();
                  range.setStart(node, lastAtIdx - offset);
                  range.collapse(true);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                  break;
                }
                offset += len;
              }
            } catch {
              /* ignore */
            }
          });
        }
      }

      onMentionSelect?.(item);
    },
    [mentionPrefix, onMentionSelect, setValue]
  );

  // =========================================================================
  // Key handler
  // =========================================================================

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Arrow navigation in slash dropdown
      if (slashMenuOpen && filteredFlatItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlashFocusIndex((i) => (i + 1) % filteredFlatItems.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlashFocusIndex((i) => (i - 1 + filteredFlatItems.length) % filteredFlatItems.length);
          return;
        }
      }

      // Arrow navigation in mention dropdown
      if (mentionMenuOpen && filteredMentionItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionFocusIndex((i) => (i + 1) % filteredMentionItems.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionFocusIndex(
            (i) => (i - 1 + filteredMentionItems.length) % filteredMentionItems.length
          );
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (slashMenuOpen && filteredFlatItems.length > 0) {
          const focused = filteredFlatItems[slashFocusIndex] ?? filteredFlatItems[0];
          handleCommandSelect(focused.original);
        } else if (mentionMenuOpen && filteredMentionItems.length > 0) {
          const focused = filteredMentionItems[mentionFocusIndex] ?? filteredMentionItems[0];
          handleMentionSelect(focused);
        } else {
          doSend();
        }
      }
      if (e.key === 'Escape') {
        setPlusMenuOpen(false);
        if (mentionMenuOpen) {
          setMentionMenuOpen(false);
          setMentionFilter('');
          setMentionFocusIndex(0);
        } else if (slashMenuOpen) {
          clearInput();
        }
      }
    },
    [
      slashMenuOpen,
      filteredFlatItems,
      slashFocusIndex,
      mentionMenuOpen,
      filteredMentionItems,
      mentionFocusIndex,
      doSend,
      clearInput,
      handleCommandSelect,
      handleMentionSelect,
    ]
  );

  // =========================================================================
  // Can send?
  // =========================================================================

  /*
   * A *bare* command is not sendable — it is selected, not typed at. A command
   * with text after it is: `/agent-name do the thing` is a message. This used
   * to block the whole slash branch, which left the send button dead on a
   * committed agent token even after the user wrote what they wanted. Enter
   * already sent that exact string, so the button now agrees with the key.
   */
  const trimmedValue = currentValue.trim();
  const isBareCommand =
    trimmedValue.startsWith(commandPrefix) && !/\s/.test(trimmedValue);

  const canSend = trimmedValue.length > 0 && !disabled && !isLoading && !isBareCommand;

  // =========================================================================
  // Render: send/stop button
  // =========================================================================

  const renderSendButton = () => {
    if (isStreaming) {
      return (
        <IconButton
          icon="control-stop"
          size="small"
          variant="danger"
          aria-label="Stop"
          onClick={onStop}
        />
      );
    }
    return (
      <IconButton
        icon="arrow-up"
        size="small"
        variant="brand"
        aria-label="Send"
        onClick={doSend}
        disabled={!canSend}
      />
    );
  };

  // =========================================================================
  // Render: + button (with or without CommandMenu)
  // =========================================================================

  const renderPlusButton = () => {
    if (hasCommandMenu) {
      return (
        <CommandMenu
          contextItems={commandContextItems}
          toolCategories={commandToolCategories || []}
          onSelect={handleCommandSelect}
          position="top"
          align="start"
          open={plusMenuOpen}
          onOpenChange={setPlusMenuOpen}
        >
          <IconButton
            icon="plus"
            variant="tertiary"
            size="small"
            onClick={() => {}}
            aria-label="Add"
          />
        </CommandMenu>
      );
    }

    // Legacy: simple + button for onAddSource
    if (onAddSource) {
      return (
        <IconButton
          icon="plus"
          size="small"
          variant="tertiary"
          aria-label="Add"
          onClick={onAddSource}
        />
      );
    }

    return null;
  };

  // =========================================================================
  // Build shell class
  // =========================================================================

  const shellClasses = [
    styles.shell,
    isMultiLine ? styles.shellMulti : '',
    isCollapsing ? styles.shellCollapsing : '',
    flushTop ? styles.shellFlushTop : '',
  ]
    .filter(Boolean)
    .join(' ');

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {/* Attachments slot */}
      {attachments && <div className={styles.attachments}>{attachments}</div>}

      <div className={styles.shellWithMenu}>
        {/* Slash: bare / with no filter = full CommandMenu anchored at slash */}
        {hasCommandMenu && slashMenuOpen && !slashFilter && (
          <div
            style={{ position: 'absolute', left: `${slashLeftPx}px`, top: 0, width: 0, height: 0 }}
          >
            <CommandMenu
              contextItems={commandContextItems}
              toolCategories={commandToolCategories || []}
              onSelect={handleCommandSelect}
              position="top"
              align="start"
              open
              onOpenChange={() => {}}
            >
              <div style={{ width: 1, height: 1 }} />
            </CommandMenu>
          </div>
        )}

        {/* Slash: typing after / = flat filtered dropdown */}
        {hasCommandMenu && slashMenuOpen && slashFilter && filteredFlatItems.length > 0 && (
          <div className={styles.slashDropdown} style={{ left: `${slashLeftPx}px` }}>
            {filteredFlatItems.map((item, idx) => (
              <button
                key={item.id}
                className={`${styles.slashDropdownItem} ${idx === slashFocusIndex ? styles.slashDropdownItemFocused : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCommandSelect(item.original);
                }}
                onMouseEnter={() => setSlashFocusIndex(idx)}
              >
                <Icon name={item.icon as any} size="small" />
                <span className={styles.slashDropdownLabel}>{item.label}</span>
                {item.description && (
                  <span className={styles.slashDropdownDesc}>{item.description}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* @ mention dropdown */}
        {hasMentionItems && mentionMenuOpen && filteredMentionItems.length > 0 && (
          <div
            ref={mentionDropdownRef}
            className={`${styles.slashDropdown} ${styles.mentionDropdown}`}
          >
            <div className={styles.mentionHeader}>Recent</div>
            {filteredMentionItems.map((item, idx) => (
              <button
                key={item.id}
                className={`${styles.mentionDropdownItem} ${idx === mentionFocusIndex ? styles.slashDropdownItemFocused : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleMentionSelect(item);
                }}
                onMouseEnter={() => setMentionFocusIndex(idx)}
              >
                <span className={styles.mentionIcon}>
                  <Icon name={item.icon as any} size="small" />
                </span>
                <span className={styles.mentionContent}>
                  <span className={styles.mentionLabel}>{item.label}</span>
                  {item.secondary && (
                    <span className={styles.mentionSecondary}>{item.secondary}</span>
                  )}
                </span>
                {item.timestamp && (
                  <span className={styles.mentionTimestamp}>{item.timestamp}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className={shellClasses}>
          {/* Leading slot */}
          {leadingSlot && <div className={styles.leading}>{leadingSlot}</div>}

          {/* Textarea wrapper — contentEditable + animated placeholder */}
          <div className={styles.textareaWrapper}>
            {/* Animated placeholder */}
            {!currentValue && (
              <span
                className={styles.animatedPlaceholder}
                data-phase={animPlaceholder.phase}
                data-dimmed={isFocused ? 'true' : undefined}
              >
                {/*
                  Wrapped, not bare. `text-overflow` needs a block box to act
                  on, and a bare text node in a flex container is an anonymous
                  item it cannot reach — a long previewed query would run past
                  the input instead of ellipsing inside it.
                */}
                {/*
                  The agent's slash token, ahead of the hint. `flex: none` so
                  the ellipsis stays on the text beside it, and the token is
                  never the thing that gets cut.
                */}
                {placeholderToken && (
                  <span className={styles.placeholderToken}>{placeholderToken}</span>
                )}
                <span className={styles.animatedPlaceholderText}>{animPlaceholder.text}</span>
              </span>
            )}

            {/* Command description hint — shows after /command-name */}
            {matchedCommandItem?.description && currentValue.indexOf(' ') === -1 && (
              <span className={styles.commandHint}>
                {/* Invisible copy of command text to push description to the right */}
                <span style={{ visibility: 'hidden', whiteSpace: 'pre' }}>{currentValue} </span>
                <span>{matchedCommandItem.description}</span>
              </span>
            )}

            {/* ContentEditable input */}
            <div
              ref={inputRef}
              className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                animPlaceholder.pause();
              }}
              onBlur={() => {
                setIsFocused(false);
                setPlusMenuOpen(false);
                setMentionMenuOpen(false);
                if (!currentValue) animPlaceholder.resume();
              }}
              role="textbox"
              aria-label={placeholder}
              aria-disabled={disabled}
            />
          </div>

          {/* Context tag (single-line mode — inline) */}
          {!isMultiLine && contextSource && (
            <div
              className={`${styles.contextRow} ${showContextAttention ? styles.contextAttention : ''}`}
            >
              <FilterTag
                icon={contextSource.icon}
                label={
                  contextSource.count
                    ? `${contextSource.label} (${contextSource.count})`
                    : contextSource.label
                }
                active
                dismissible={!!contextSource.onClear}
                onDismiss={contextSource.onClear}
                onClick={contextSource.onClick}
              />
            </div>
          )}

          {/* Legacy add source (when no CommandMenu and no context) */}
          {!hasCommandMenu && !contextSource && onAddSource && (
            <button className={styles.addSource} onClick={onAddSource} type="button">
              <Icon name="plus" size={12} />
              <span>Add source</span>
            </button>
          )}

          {/* Actions: display:contents single-line, flex row multi-line */}
          <div className={styles.actions}>
            {renderPlusButton()}
            {/* Context tag in actions row (multi-line mode) */}
            {isMultiLine && contextSource && (
              <div
                className={`${styles.contextInline} ${showContextAttention ? styles.contextAttention : ''}`}
              >
                <FilterTag
                  icon={contextSource.icon}
                  label={
                    contextSource.count
                      ? `${contextSource.label} (${contextSource.count})`
                      : contextSource.label
                  }
                  active
                  dismissible={!!contextSource.onClear}
                  onDismiss={contextSource.onClear}
                  onClick={contextSource.onClick}
                />
              </div>
            )}
            <div className={styles.actionsSpacer} />
            {renderSendButton()}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      {disclaimer && <div className={styles.disclaimer}>{disclaimer}</div>}
    </div>
  );
};

// =============================================================================
// Helpers
// =============================================================================

/** Minimal HTML escaping for innerHTML injection */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
