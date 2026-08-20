/**
 * useSmartScroll — Claude-style "pin new message to top" scroll behavior
 *
 * Technique: a dynamic trailing spacer fills the viewport below the latest
 * response so that scrolling to the absolute bottom places the newest user
 * message at the top of the visible area.
 *
 * On send:
 *   1. setSpacer(containerHeight) — ensure enough room
 *   2. rAF → scrollTo(scrollHeight) — browser scrolls to bottom
 *   3. MutationObserver keeps scrolling to bottom as response streams in
 *   4. Spacer shrinks as content grows, keeping user msg pinned at top
 *
 * On streaming complete:
 *   stopEnforcement() — freeze spacer, stop auto-scroll
 */

import { useRef, useCallback, useState, useEffect } from 'react';

/** Padding between the container top and the pinned user message */
const TOP_PADDING = 16;

// =============================================================================
// Types
// =============================================================================

export interface UseSmartScrollOptions {
  enabled?: boolean;
}

export interface UseSmartScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  spacerRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: React.UIEventHandler<HTMLDivElement>;
  isNearBottom: boolean;
  showScrollButton: boolean;
  scrollToBottom: (behavior?: ScrollBehavior, force?: boolean) => void;
  /** @deprecated Use pinToTop() instead */
  scrollToResponseTop: (userMessageSelector?: string) => void;
  /** Call immediately on send — sizes spacer and scrolls user message to top */
  pinToTop: (userMessageSelector?: string) => void;
  prepareEnforcement: () => void;
  stopEnforcement: () => void;
  /** Current spacer height — apply to the trailing spacer element */
  spacerHeight: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useSmartScroll(_options: UseSmartScrollOptions = {}): UseSmartScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const enforcingRef = useRef(false);
  const [spacerHeight, setSpacer] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isNearBottomRef = useRef(true);

  // ---------------------------------------------------------------------------
  // scrollToBottom — scroll the container to absolute bottom
  // ---------------------------------------------------------------------------
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
      isNearBottomRef.current = true;
      setShowScrollButton(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // handleScroll — track user scroll position
  // ---------------------------------------------------------------------------
  const handleScroll: React.UIEventHandler<HTMLDivElement> = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 120;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = nearBottom;
    // Only show scroll button when not enforcing (during streaming we're auto-scrolling)
    if (!enforcingRef.current) {
      setShowScrollButton(!nearBottom);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // applySpacer — set spacer height directly on DOM for immediate effect
  // ---------------------------------------------------------------------------
  const applySpacer = useCallback((height: number) => {
    const spacerEl = spacerRef.current;
    if (spacerEl) {
      spacerEl.style.minHeight = `${height}px`;
    }
    setSpacer(height); // sync React state
  }, []);

  // ---------------------------------------------------------------------------
  // calcSpacerHeight — pure calculation, no side effects
  // ---------------------------------------------------------------------------
  const calcSpacerHeight = useCallback((userMessageSelector?: string): number => {
    const el = scrollRef.current;
    const spacerEl = spacerRef.current;
    if (!el) return 0;

    const containerHeight = el.clientHeight;
    if (!userMessageSelector) return containerHeight;

    const matches = el.querySelectorAll(userMessageSelector);
    const target = matches[matches.length - 1] as HTMLElement | undefined;
    if (!target) return containerHeight;

    // Use scroll-relative offsets (not viewport positions) to avoid
    // circular dependency with the spacer's own height.
    const containerRect = el.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const userScrollOffset = el.scrollTop + (targetRect.top - containerRect.top);

    // Base content height = scrollHeight minus the current spacer
    const currentSpacerH = spacerEl ? parseFloat(spacerEl.style.minHeight) || 0 : 0;
    const baseContentH = el.scrollHeight - currentSpacerH;

    // We want: when scrolled to bottom, user msg is at TOP_PADDING from top
    // scrollTop_at_bottom = (baseContentH + spacer) - containerHeight
    // userVisibleOffset = userScrollOffset - scrollTop_at_bottom = TOP_PADDING
    // → spacer = userScrollOffset + containerHeight - TOP_PADDING - baseContentH
    return Math.max(0, userScrollOffset + containerHeight - TOP_PADDING - baseContentH);
  }, []);

  // ---------------------------------------------------------------------------
  // pinToTop — the main entry point, called on message send
  // ---------------------------------------------------------------------------
  const pinToTop = useCallback(
    (userMessageSelector?: string) => {
      applySpacer(calcSpacerHeight(userMessageSelector));
      // Frame 1: scroll to bottom (spacer is already sized on DOM)
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
        // Frame 2: recalculate after layout settles
        requestAnimationFrame(() => {
          applySpacer(calcSpacerHeight(userMessageSelector));
          scrollToBottom('smooth');
        });
      });
    },
    [calcSpacerHeight, applySpacer, scrollToBottom]
  );

  // Legacy alias
  const scrollToResponseTop = pinToTop;

  // ---------------------------------------------------------------------------
  // prepareEnforcement — start auto-scroll + spacer resizing during streaming
  // ---------------------------------------------------------------------------
  const prepareEnforcement = useCallback(() => {
    enforcingRef.current = true;
    setShowScrollButton(false);

    // Set up MutationObserver to auto-scroll as content streams in
    const el = scrollRef.current;
    if (!el) return;

    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new MutationObserver(() => {
      if (!enforcingRef.current) return;

      // Re-size spacer as content grows (same formula as calcSpacerHeight)
      const spacerEl = spacerRef.current;
      if (spacerEl) {
        const containerHeight = el.clientHeight;
        const userMsgs = el.querySelectorAll('[data-role="user"]');
        const lastUser = userMsgs[userMsgs.length - 1] as HTMLElement | undefined;

        if (lastUser) {
          const containerRect = el.getBoundingClientRect();
          const userRect = lastUser.getBoundingClientRect();
          const userScrollOffset = el.scrollTop + (userRect.top - containerRect.top);
          const currentSpacerH = parseFloat(spacerEl.style.minHeight) || 0;
          const baseContentH = el.scrollHeight - currentSpacerH;
          const newSpacer = Math.max(
            0,
            userScrollOffset + containerHeight - TOP_PADDING - baseContentH
          );
          spacerEl.style.minHeight = `${newSpacer}px`;
        }
      }

      // Keep scrolled to bottom
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;
  }, []);

  // ---------------------------------------------------------------------------
  // stopEnforcement — freeze state, disconnect observer
  // ---------------------------------------------------------------------------
  const stopEnforcement = useCallback(() => {
    enforcingRef.current = false;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Sync React state with the final spacer height set by the observer
    const spacerEl = spacerRef.current;
    if (spacerEl) {
      const finalHeight = parseFloat(spacerEl.style.minHeight) || 0;
      setSpacer(finalHeight);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    scrollRef,
    spacerRef,
    handleScroll,
    isNearBottom: isNearBottomRef.current,
    showScrollButton,
    scrollToBottom,
    scrollToResponseTop,
    pinToTop,
    prepareEnforcement,
    stopEnforcement,
    spacerHeight,
  };
}
