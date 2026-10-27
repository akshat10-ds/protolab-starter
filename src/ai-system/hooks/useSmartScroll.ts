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
 *
 * ── THE LAW THIS SERVES ──
 *
 * Akshat, 2026-08-24: *"only on new threads / messages / accepting tasks should
 * it jump to top — otherwise it keeps adding to same turn."*
 *
 * So a pin marks a NEW MOMENT and nothing else: a new thread, a message she
 * sent, a task she accepted. Growth inside the turn she is already reading —
 * an answer streaming, a run ticking, a delta landing — never moves the
 * viewport. The observer resizes the spacer; it does not scroll.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

/** Padding between the container top and the pinned user message */
const TOP_PADDING = 16;

/**
 * How far from a scroll extreme still counts as being at it.
 *
 * `scrollTop` is fractional; `scrollHeight` and `clientHeight` are rounded to
 * whole pixels. So `scrollHeight - clientHeight` under-reports the real maximum
 * and a container parked hard at the bottom reads as ONE PIXEL PAST its own
 * limit. Measured on the panel at dpr 2, sitting at the true bottom:
 * `scrollTop` 2490, `scrollHeight` 3071, `clientHeight` 582 (real box 581.602)
 * — a computed max of 2489, a difference of exactly 1.
 *
 * With a sub-pixel tolerance that reads as "he scrolled": the holder let go of a
 * clamp at the bottom of the thread and stopped correcting, and the pin's guard
 * wrote a move that was already made, leaving `selfScrollRef` raised for a
 * scroll event that never came. Two pixels clears the rounding. The cost of a
 * false positive is one correction after a 2px scroll, which is the same bound
 * the anchor test already accepts.
 */
const EXTREME_EPSILON = 2;

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
  /**
   * The same pin with no journey: spacer and scroll applied in one synchronous,
   * pre-paint pass, with the CSS `scroll-behavior: smooth` overridden for the
   * duration. Call it from a LAYOUT effect — from a passive effect or an rAF it
   * still animates nothing, but the turn gets one painted frame in the wrong
   * place first.
   */
  pinToTopNow: (userMessageSelector?: string) => void;
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
  /*
    THE PIN IS HELD, NOT JUST SET.

    Akshat, 2026-08-25, on the accept exchange: *"how did this card get pinned to
    the top? I didn't scroll."* He was right that he did not — and so did three
    traces of `scrollTop`, `scrollTo` and `scrollIntoView`, which found exactly
    one call, the pin itself.

    NOTHING SCROLLED. CONTENT ABOVE HIM VANISHED. The turn that offered the card
    sits above his acceptance, and when the card resolves that turn collapses
    from ~130px to nothing. `scrollTop` is a distance from the top of the
    content, so when 130px of content above the anchor disappears, everything
    below slides up by 130 and the anchor leaves the viewport. Measured: anchor
    at +17, then −112, with `scrollTop` unchanged at 808.

    The spacer already protects the reading position from content arriving
    BELOW. This is the same promise for content changing ABOVE, and the file's
    own rule — reading position is sacred — never distinguished the two.

    `pinnedNode` is the element the last pin landed on — the node itself, never a
    selector to re-run — and `pinHeld` is whether that pin is still ours to keep.
    Any scroll he performs himself hands it back.
  */
  const pinnedNodeRef = useRef<HTMLElement | null>(null);
  const pinHeldRef = useRef(false);
  /* What WE last put in `scrollTop`. Anything else there was somebody else. */

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
    /*
      NOTHING HERE RELEASES THE PIN ANY MORE.

      A scroll event says the box moved. It never said WHO moved it, and three
      rounds of trying to infer that from geometry each died on a movement the
      browser made for its own reasons: a clamp when content shrank, a resize
      when the docked question mounted and took 174px of the container's height,
      scroll anchoring compensating for content above. Each was read as him and
      each let go of a pin he was still looking at — the last one is the beat
      Akshat reported, the acceptance that *"kinda moved down from the top"*.
      Reproduced exactly: a 16px movement that is neither ours nor at an extreme
      strands the anchor at 32 and the holder never writes again.

      So the claim ends where the fact actually lives — `wheel`, `touchmove`,
      `keydown`, a pointer in the scrollbar gutter. See `installHolder`. Those
      are him; everything else is the browser, and the browser does not get to
      end a claim it never made.
    */
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

    /*
      THE CONTENT ABOVE THE SPACER, MEASURED DIRECTLY.

      This used to be `el.scrollHeight - currentSpacer`, and that is wrong in
      exactly the case the anchor exists for. **`scrollHeight` never reports
      less than `clientHeight`.** A thread shorter than the viewport therefore
      reports the viewport's height as its content, the subtraction over-states
      the content by whatever the shortfall is, and the spacer comes out that
      much too small — so the container cannot scroll far enough to bring the
      anchor to the top.

      Traced live, 2026-08-24, on the upload turn of a fresh thread: real
      content 267px, spacer 593px, `scrollHeight` 860px = exactly `clientHeight`.
      Max scroll was **0**. The pin ran, set `scrollTop`, and the container had
      nowhere to go; the turn sat mid-viewport until later content grew the
      thread past the viewport and the streaming observer corrected it seconds
      later. That correction is the "then it scrolls to top" Akshat saw.

      The spacer is the last child of the scroll content, so where it starts IS
      the height of everything before it — no clamp, no subtraction, true even
      when the thread is 40px tall.
    */
    const spacerRect = spacerEl?.getBoundingClientRect();
    /*
      The container's own bottom padding scrolls too, and it sits BELOW the
      spacer — so it is content the spacer's offset alone does not see. Both
      streams carry 16px of it, and leaving it out landed the anchor flush at 0
      instead of at `TOP_PADDING` (measured live: scrollHeight 1146 =
      spacerOffset 866 + spacer 264 + padding 16).
    */
    const padBottom = spacerRect ? parseFloat(getComputedStyle(el).paddingBottom) || 0 : 0;
    const baseContentH = spacerRect
      ? el.scrollTop + (spacerRect.top - containerRect.top) + padBottom
      : el.scrollHeight;

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

  /*
    ── THE HOLDER: CONTENT ABOVE HIM MAY NOT MOVE HIM ────────────────────────
    Akshat, 2026-08-25: *"how did this card get pinned to the top? I didn't
    scroll."* He had not. The turn that offered the card sits above his
    acceptance, and resolving the card collapsed that turn to nothing — 130px
    of content gone from above the anchor, so everything below rose by 130 and
    his act left the screen. No scroll, a layout collapse, which is why every
    `scrollTop` trace came back clean.

    ── IT IS INSTALLED FROM THE PIN, NOT FROM AN EFFECT ──────────────────────
    The first version of this ran in a `useEffect` with `[]` deps and read
    `scrollRef.current`. That ref points at a node IrisAgent renders only once
    the thread has messages, and the host mounts the panel with an empty one —
    so at the single effect pass the ref was null, the function returned early,
    and NO OBSERVER WAS EVER CREATED. The holder was dead code for its whole
    life, and it read as working because Chrome's own `overflow-anchor` was
    quietly doing part of the job. Found by an audit that patched the `scrollTop`
    setter and counted writes: `hold()` wrote zero times, ever.

    So installation hangs off `pinToTopNow`, where the container is guaranteed
    to exist — there is no pin without a thread. `holderElRef` remembers which
    node the observers are bound to, so a container that unmounts and comes back
    (opening an artifact page swaps it out entirely) gets fresh observers rather
    than leaving them attached to a detached node forever.

    ── THE ANCHOR IS A NODE, NOT A SELECTOR ──────────────────────────────────
    It used to re-query `[data-role="user"]` and take the last match. That is
    wrong across a thread switch, where the new thread has its own user turns:
    the holder would find one, decide it was the anchor, and yank the new thread
    to a 16px offset. Holding the ELEMENT means identity survives every content
    change and dies exactly when it should — the node leaves the container, and
    the claim ends.
  */
  const holderElRef = useRef<HTMLDivElement | null>(null);
  const holderStopRef = useRef<(() => void) | null>(null);

  const holdPin = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pinHeldRef.current) return;
    const target = pinnedNodeRef.current;
    /* The anchor left the container — a thread switch, or the turn was removed.
       Nothing to hold to, so stop holding rather than adopt a stranger. */
    if (!target || !el.contains(target)) {
      pinHeldRef.current = false;
      pinnedNodeRef.current = null;
      return;
    }

    const drift = target.getBoundingClientRect().top - el.getBoundingClientRect().top - TOP_PADDING;
    /* Sub-pixel noise is not a movement. A whole pixel is. */
    if (Math.abs(drift) < 1) return;
    const next = Math.max(0, Math.min(el.scrollTop + drift, el.scrollHeight - el.clientHeight));
    if (Math.abs(next - el.scrollTop) < 1) return;
    /*
      THE SAME TRAP `pinToTopNow` DOCUMENTS BELOW. These containers set
      `scroll-behavior: smooth` in CSS, which turns a plain `scrollTop`
      assignment into an animation — the write does not land synchronously, and
      the fourteen scroll events it emits each look like him, so the claim
      released itself on the correction it was performing.
    */
    const previousBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = next;
    el.style.scrollBehavior = previousBehavior;
  }, []);

  /** Bind the observers to whatever container is live now. Idempotent. */
  const installHolder = useCallback(() => {
    const el = scrollRef.current;
    if (!el || holderElRef.current === el) return;
    holderStopRef.current?.();

    const mutations = new MutationObserver(holdPin);
    mutations.observe(el, { childList: true, subtree: true, characterData: true });
    /* A turn can change height without a DOM mutation — a font swap, a late
       image, a card animating open. The surface's own box covers those. */
    const resize = new ResizeObserver(holdPin);
    const surface = el.firstElementChild;
    if (surface) resize.observe(surface);

    /*
      HIS SCROLL ENDS THE CLAIM, AND ONLY HIS — ASKED OF THE INPUT, NOT THE BOX.

      Every earlier attempt inferred "was that him?" from geometry after the
      fact, and every one of them was wrong about some movement the browser made
      on its own account: a clamp when content shrank, the container losing
      174px of height when the docked question mounted, scroll anchoring
      compensating above the fold. A scroll event cannot tell them apart, because
      by the time it is delivered they all look identical — a box at a new
      offset.

      The fact lives in the input. A wheel, a drag on the touch surface, an arrow
      key with focus inside the stream, a pointer down in the scrollbar gutter:
      those are him, and there is nothing else he can scroll with. The browser's
      own adjustments arrive without any of them, which is exactly the
      distinction three geometric rules kept failing to draw.

      ponytail: `pointerdown` is read as his only in the gutter — measured 15px
      wide here (offsetWidth 479, clientWidth 464). A click on a button inside a
      turn is not a scroll and must not end the claim. Overlay scrollbars report
      no gutter, in which case a scrollbar drag is missed and the pin holds one
      beat too long; wheel and touch cover every other way of getting there.
    */
    const letGo = () => {
      pinHeldRef.current = false;
    };
    /* Only the keys that actually scroll, and not while she is typing into a
       widget inside the stream — a HITL question's "tell the agent something
       else" field sits in here, and answering it is not a scroll. */
    const SCROLL_KEYS = new Set([
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      ' ',
      'Spacebar',
    ]);
    const letGoIfScrollKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (SCROLL_KEYS.has(e.key)) letGo();
    };
    const letGoIfGutter = (e: PointerEvent) => {
      const gutter = el.offsetWidth - el.clientWidth;
      if (gutter > 0 && e.offsetX > el.clientWidth) letGo();
    };
    el.addEventListener('wheel', letGo, { passive: true });
    el.addEventListener('touchmove', letGo, { passive: true });
    el.addEventListener('keydown', letGoIfScrollKey);
    el.addEventListener('pointerdown', letGoIfGutter);

    holderElRef.current = el;
    holderStopRef.current = () => {
      mutations.disconnect();
      resize.disconnect();
      el.removeEventListener('wheel', letGo);
      el.removeEventListener('touchmove', letGo);
      el.removeEventListener('keydown', letGoIfScrollKey);
      el.removeEventListener('pointerdown', letGoIfGutter);
      holderElRef.current = null;
      holderStopRef.current = null;
    };
  }, [holdPin]);

  useEffect(() => () => holderStopRef.current?.(), []);

  // ---------------------------------------------------------------------------
  // pinToTopNow — the same pin, with no journey
  // ---------------------------------------------------------------------------
  /*
    Akshat, 2026-08-24, on the anchored upload turn: *"the upload is kinda stuck
    half way and then scrolls to top it should be pinned immediately."* He was
    watching the mechanism work. `pinToTop` above spends two rAFs getting there
    and asks for `smooth` when it arrives, so the turn renders where it landed
    and then travels — the journey is the bug.

    Two things had to go, and the second is the one that actually hurt:

    1. THE rAF CHAIN. Writing `minHeight` and then reading `scrollHeight`
       forces layout synchronously, so the post-spacer height is readable in the
       same pass that set the spacer. There was never anything to wait for. Two
       convergence passes rather than one, because real boxes have fractional
       heights and the first measurement is taken before the spacer exists.

    2. `scroll-behavior: smooth`, WHICH IS IN THE CSS. Both stream containers
       set it, and it animates a plain `scrollTop` assignment just as happily as
       a `scrollTo({behavior:'smooth'})` — so no amount of "use auto" at the call
       site would have helped. It is overridden inline for the length of this
       call and put back exactly as it was found, because that declaration is
       right for every other scroll these containers do.

    Called from a layout effect, the whole thing lands before the browser paints:
    the turn's first painted frame is already at the top. `pinToTop` is untouched
    and still serves `send`, so no existing surface changes.
  */
  const pinToTopNow = useCallback(
    (userMessageSelector?: string) => {
      const el = scrollRef.current;
      if (!el) return;

      const previousBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';

      /*
        NO WRITE THAT MOVES NOTHING. Pass 2 is a no-op in every pin measured
        (`205 → req 786, landed 205`; `816 → req 1397, landed 816`), because
        pass 1 already put the container at its extreme.

        The two passes stay. They exist because real boxes have fractional
        heights and the first measurement is taken before the spacer exists, so
        pass 2 settles the difference — that is still worth doing whether or not
        it ends up moving anything.
      */
      const pinToExtreme = () => {
        applySpacer(calcSpacerHeight(userMessageSelector));
        const max = el.scrollHeight - el.clientHeight;
        if (Math.abs(el.scrollTop - max) < EXTREME_EPSILON) return;
        el.scrollTop = el.scrollHeight;
      };
      // Pass 1 sizes the spacer; reading scrollHeight after it flushes layout.
      pinToExtreme();
      // Pass 2 settles the sub-pixel difference, still before paint.
      pinToExtreme();

      el.style.scrollBehavior = previousBehavior;
      isNearBottomRef.current = true;
      setShowScrollButton(false);
      /* The claim opens here and the holder keeps it until he scrolls. The node
         is captured, not the selector — see the holder for why. */
      const sel = userMessageSelector ?? '[data-role="user"]';
      const found = el.querySelectorAll(sel);
      pinnedNodeRef.current = (found[found.length - 1] as HTMLElement) ?? null;
      pinHeldRef.current = pinnedNodeRef.current !== null;
      installHolder();
    },
    [applySpacer, calcSpacerHeight, installHolder]
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

      /*
        Re-size the spacer as content grows. This was a COPY of
        `calcSpacerHeight`'s arithmetic, and it carried the same
        `scrollHeight - currentSpacer` defect — so the copy had to be found and
        fixed twice, which is how one of them stayed wrong. It calls the real
        one now.

        Still a direct style write and no `setSpacer`: this fires on every
        mutation of a streaming turn, and routing that through React state would
        re-render the whole surface per token. `stopEnforcement` syncs the final
        value back.
      */
      const spacerEl = spacerRef.current;
      if (spacerEl) {
        spacerEl.style.minHeight = `${calcSpacerHeight('[data-role="user"]')}px`;
      }

      /*
        NO SCROLL CORRECTION HERE. There used to be a
        `requestAnimationFrame(() => el.scrollTop = el.scrollHeight)` on this
        line, and it was the "random scrolling all the way down" Akshat hit,
        2026-08-24.

        Two faults, one line. It was **redundant**: once the anchor is pinned,
        keeping it pinned is entirely the spacer's job — content growing below
        the anchor shrinks the spacer by the same amount, `scrollHeight` holds
        still, `scrollTop` holds still, and the anchor stays exactly where it
        is. Nothing needed to be re-scrolled.

        And it was **unstoppable**. `stopEnforcement` is only ever called from
        `handleStreamingComplete`, so a turn that never streams — an action
        receipt, a run chip, an offer, a delta — never disarms this observer. It
        stayed armed for the life of the thread and slammed to the bottom on
        every DOM mutation, which includes `RunChip`'s elapsed clock ticking
        once a second. Traced live: 14 of 16 scrolls in one arc came from here,
        at ~1000ms intervals, still firing 30s after the run landed.

        READING POSITION IS SACRED WHILE CONTENT ARRIVES BELOW. The observer
        resizes the spacer and touches nothing else.
      */
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;
  }, [calcSpacerHeight]);

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
    pinToTopNow,
    prepareEnforcement,
    stopEnforcement,
    spacerHeight,
  };
}
