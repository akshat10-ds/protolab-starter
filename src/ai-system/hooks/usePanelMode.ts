/**
 * usePanelMode — the state machine for how a panel relates to its host page.
 *
 * A panel is a *sibling* of the host page, not its parent. It owns a width; the
 * host page reflows around that width (`width: calc(100% - Npx)`). This hook is
 * the single source of truth for that relationship: which mode the panel is in,
 * how wide it currently is, what it should return to when it leaves a mode, and
 * a stream the host can subscribe to in order to reflow.
 *
 * Modes
 * -----
 *   closed      width 0. Shell stays mounted (content state survives).
 *   sidebar     sized, displaces the host page.
 *   fullscreen  fills the viewport; host page reaches width 0.
 *
 * `fullscreen` is a *width*, not a separate mount. Dragging the handle to the
 * edge of the extent enters it; dragging back leaves it. This falls out of the
 * derivation below at zero cost, and it is what the prototype actually does
 * (`iris-panel/index.tsx:485-488` sets `panelWidth = window.innerWidth`; the
 * drag clamp at `:543` reaches the same state).
 *
 * The extent is the viewport unless `maxWidth` scopes the panel to a narrower
 * container. "Fullscreen" then means "fills its container" — which is the only
 * reading that survives a panel mounted in a split view or a Playground stage.
 *
 * The artifact dock rides along here too — `artifact` on the return. It is a
 * different axis from `mode` (it hides the *chat column* inside the panel, not
 * the host page; backlog §4.1 called it `artifactFullscreen` and kept it out),
 * but opening an artifact has to reach `setMode`: a 420px dock does not fit
 * beside the chat in a 360px sidebar, so `artifact.open` goes fullscreen first.
 * A controller that cannot do that is a controller the host has to finish, and
 * the host finishing it is how the panel prototype shipped a 43px chat sliver.
 *
 * An open dock also RAISES THE PANEL'S FLOOR to `THREE_COLUMN_MIN_WIDTH`, so
 * host + chat + dock is a layout the panel can rest in below fullscreen and the
 * squeeze that produced the sliver is out of reach. Leaving fullscreen with a
 * dock open used to close it; it does not (2026-08-19 — see the mode stream).
 *
 * Composition
 * -----------
 * All drag math, the window-resize clamp, and the near-full-width detection come
 * from `usePanelResize`. This hook does not reimplement any of it — it owns mode,
 * restore memory, viewport-relative size resolution, and the host reflow contract.
 *
 * Sticky fullscreen is therefore free: `usePanelResize`'s resize effect snaps a
 * near-full-width panel to the new `innerWidth`, so `isFullscreen` stays true and
 * the derived mode stays `'fullscreen'`. No code here does that.
 *
 * Provenance: `protoLab/src/prototypes/iris-panel/index.tsx` (frozen archive) —
 * `DEFAULT_PANEL_WIDTH = 360` (:55), `WIDE_PANEL_WIDTH_PERCENT = 0.4` (:56),
 * panel state (:95-102), sticky-fullscreen-on-resize (:161-181), restore memory
 * (:183-203), open/close/expand handlers (:460-496), host push layout (:624-629).
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { usePanelResize } from './usePanelResize';

// =============================================================================
// Types
// =============================================================================

export type PanelMode = 'closed' | 'sidebar' | 'fullscreen';

/** Which side of the viewport the panel occupies. */
export type PanelEdge = 'left' | 'right';

/** A px number, or a viewport-relative string resolved against `window.innerWidth`. */
export type PanelSize = number | `${number}%`;

/** Props for the drag handle. Spread onto the handle element. */
export interface PanelHandleProps {
  /**
   * Pointer, so the drag survives a release outside the window and works with
   * touch and pen. Was `onMouseDown` — a spread handle needs no change.
   */
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  role: 'separator';
  tabIndex: 0;
  'aria-orientation': 'vertical';
  'aria-label': string;
  'aria-valuenow': number;
  'aria-valuemin': number;
  'aria-valuemax': number;
}

/**
 * The artifact dock's state, and the four things that move it.
 *
 * One occupant, one slot. `openId` names it, `openedIds` is what THIS
 * conversation has produced (the dock's tab strip, not a fixture shelf), and
 * `expanded` is the dock filling the surface.
 */
export interface PanelArtifactState {
  /** The open dock item, or `null` for a closed dock. */
  openId: string | null;
  /** The dock fills the panel and the chat column folds away. */
  expanded: boolean;
  /** Every item this conversation has opened, in the order it opened them. */
  openedIds: string[];
  /**
   * Promote an artifact into the dock. Goes **fullscreen first** — a 420px dock
   * does not fit beside the chat in a 360px sidebar — records the item as one
   * this conversation has produced, and never arrives expanded.
   *
   * Fullscreen is where it ARRIVES, not where it is confined. While the dock is
   * open the panel's floor rises to `THREE_COLUMN_MIN_WIDTH`, so contracting
   * out of fullscreen lands on host + chat + dock rather than closing the dock.
   *
   * `{ fullscreen: false }` asks for that resting layout DIRECTLY — the panel
   * opens at `THREE_COLUMN_MIN_WIDTH` and the host page stays on screen beside
   * it. It is what shipping Iris does with the sources column, and it is an
   * opt-in: omit the option and the fullscreen-first rule is unchanged. An
   * extent too narrow to hold three columns ignores it and goes fullscreen,
   * which is where a dock belongs when three columns cannot fit — and so does
   * an extent that would leave the host page under
   * `THREE_COLUMN_MIN_HOST_WIDTH`, because a third column is not worth a page
   * nobody can read.
   *
   * `{ inPlace: true }` asks for neither. The dock takes the panel it already
   * has — arriving expanded, so the chat folds away rather than being squeezed
   * — and mode and width are not touched at all. It is for a host page that
   * must not be displaced: a document the user is reading beside the chat. It
   * outranks `fullscreen`, because "do not move the panel" is the stronger
   * statement of the two.
   */
  open: (id: string, options?: { fullscreen?: boolean; inPlace?: boolean }) => void;
  /**
   * Move the dock to another item it already holds, or `null` to close it.
   * Does not change panel mode and does not add to `openedIds`: a tab, a back
   * arrow and a source row navigate inside what is already there.
   */
  setOpenId: (id: string | null) => void;
  /** Close the dock and drop `expanded`, so reopening never inherits it. */
  close: () => void;
  /**
   * A NEW CONVERSATION — close the dock and empty the tab strip.
   *
   * `openedIds` is documented as what THIS conversation has produced, and
   * `close` never emptied it: the strip carried the last conversation's
   * artifacts into the next one. Every host that starts a fresh thread —
   * `onNewConversation`, a scenario jig between participants — wants this and
   * had no verb for it.
   *
   * Additive. `close` is unchanged, and a host that never resets is untouched.
   */
  reset: () => void;
  /** The dock's expand/contract control. */
  toggleExpanded: () => void;
}

/** The subset of state `PanelShell` needs. Spread onto `<PanelShell {...shellProps} />`. */
export interface PanelShellState {
  mode: PanelMode;
  width: number;
  isResizing: boolean;
  edge: PanelEdge;
  handleProps: PanelHandleProps;
}

export interface UsePanelModeOptions {
  /** Default `'closed'`. */
  initialMode?: PanelMode;
  /** Width when opening into `sidebar` from `closed`. Prototype: `'40%'`. */
  sidebarWidth?: PanelSize;
  /** Floor for drag and for every resolved width. Prototype: `360`. */
  minWidth?: PanelSize;
  /**
   * The extent `fullscreen` fills, and the basis every `%` size resolves
   * against. Defaults to the viewport.
   *
   * Supply this when the panel is a sibling of something narrower than the
   * viewport — a split view, a modal, the Playground's stage. Re-supply it when
   * that container resizes: a panel already at the extent stays pinned to it,
   * exactly as a viewport-scoped panel stays fullscreen across a window resize.
   */
  maxWidth?: PanelSize;
  /** Which side of the viewport the panel sits on. Default `'right'`. */
  edge?: PanelEdge;
  /**
   * How far below `minWidth` a drag must go before the panel closes. `0`
   * (the default) disables drag-to-close, matching the prototype: closing is an
   * explicit action, and a panel that vanishes mid-drag is a surprise.
   *
   * Opt in and the mode machine subscribes to the snap that `usePanelResize`
   * has always emitted and this hook has always ignored.
   */
  snapToCloseThreshold?: number;
  /** Fires on every width change, including each drag frame. */
  onWidthChange?: (width: number) => void;
  /** Fires after the mode settles. `prev` is the mode being left. */
  onModeChange?: (mode: PanelMode, prev: PanelMode) => void;
  /** Accessible name for the drag handle. */
  handleLabel?: string;
}

export interface UsePanelModeReturn {
  /** Derived: `closed` when shut, else `fullscreen` if at-or-near viewport width, else `sidebar`. */
  mode: PanelMode;
  /** Resolved px width. Always `0` when `mode === 'closed'`. */
  width: number;
  isResizing: boolean;

  /** Callable from anywhere, including deep inside artifact content. */
  setMode: (mode: PanelMode) => void;
  /** `sidebar` ⇄ `fullscreen`, restoring the pre-fullscreen width. */
  toggleFullscreen: () => void;
  /** → `sidebar` at `sidebarWidth`. */
  open: () => void;
  /** → `closed`, remembering the width to restore. */
  close: () => void;
  /** Set the open width directly. Clamped to `[minWidth, viewport]`. */
  setWidth: (size: PanelSize) => void;

  /** Spread onto `<PanelShell />`. */
  shellProps: PanelShellState;
  /** Spread onto a custom drag handle, if you are not using `PanelShell`. */
  handleProps: PanelHandleProps;
  /** Spread onto the host page element. Gives it `width: calc(100% - Npx)`. */
  hostStyle: React.CSSProperties;

  /** The artifact dock. Pass it to `IrisAgent`'s `artifact` prop. */
  artifact: PanelArtifactState;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * How close to the viewport edge counts as fullscreen. Must match
 * `usePanelResize`'s own threshold, which is what actually computes `isFullscreen`.
 */
const FULLSCREEN_EPSILON = 50;

/** Width delta per arrow-key press on the drag handle. */
const KEYBOARD_RESIZE_STEP = 24;

/** Matches `usePanelResize`'s SSR fallback. */
const SSR_VIEWPORT_WIDTH = 1920;

/**
 * THE THREE-COLUMN FLOOR — how wide a `sidebar` must be to hold a chat AND a
 * dock beside it, with the host page still visible on the other side.
 *
 * 916 = 480 + 420 + 16.
 *   480  the chat column's floor. `IrisAgent.module.css` states it as
 *        `flex-basis: 480px` on `.rightArea`, and it is the panel's own
 *        default `sidebarWidth`.
 *   420  the dock card. `ArtifactDock.module.css` `.dock { width: 420px }`
 *        with `flex-shrink: 0`, so it is a constant, not a preference.
 *    16  the card's own right margin (`--ink-spacing-200`), which is panel
 *        width the chat never gets.
 *
 * It is a FLOOR ON THE DRAG, not a mode trigger. Akshat, 2026-08-19: *"we
 * shouldn't automatically collapse the right sidebar if they start narrowing
 * the chat."* So narrowing simply stops here; nothing closes and nothing
 * flips mid-drag.
 *
 * Below `916 + FULLSCREEN_EPSILON + 1` of extent there is no room for three
 * columns at all. The floor is then clamped to the extent itself, which reads
 * as fullscreen — so a viewport that cannot hold three columns gets the dock
 * at fullscreen, which is the fullscreen-first rule doing its existing job.
 */
export const THREE_COLUMN_MIN_WIDTH = 916;

/**
 * THE OTHER HALF OF THE THREE-COLUMN RULE — what the HOST is left with.
 *
 * `THREE_COLUMN_MIN_WIDTH` is entirely about the panel's side of the seam. It
 * says nothing about the remainder, and the remainder is a whole page. At
 * 1440 the panel takes 916 and the host page gets 524, which is not a
 * three-column layout so much as a chat with a stripe of app behind it.
 *
 * MEASURED, not chosen. Navigator's own insights band (`.ink-insights__body`)
 * is a flex row of two cards — `flex: 1 1 440px` and `flex: 0 1 460px`, both
 * `min-width: 0` — so it has no breakpoint and no floor: it shrinks until its
 * contents clip. Driven live at 1440/1600/1700/1800 with the sources column
 * open, the knee is where the CTA card stops clipping its own action row
 * ("Review Data" / "Do This Later", 183px intrinsic + 48px card padding = a
 * 231px card):
 *
 *   viewport 1440 → host 524 → card  89  — headline one word per line
 *   viewport 1600 → host 684 → card 175  — action row clipped by 43px
 *   viewport 1700 → host 784 → card 229  — action row clipped by 2px
 *   viewport 1800 → host 884 → card 283  — nothing clipped, headline 2 lines
 *
 * The knee is host ≈ 786; 800 is that rounded up. Below it the dock opens the
 * way it always did — fullscreen — rather than onto a host page too narrow to
 * read. Only `open(id, { fullscreen: false })` consults this, so a host that
 * never asks for the resting layout is untouched.
 *
 * Not applied to `resolvedMinWidth`: the drag floor is every prototype's, and
 * raising it here would change what contracting out of fullscreen lands on for
 * all of them. Contracting at 1440 still lands on the 916 floor and the 524px
 * host — that is today's behaviour, left alone deliberately.
 */
export const THREE_COLUMN_MIN_HOST_WIDTH = 800;

// =============================================================================
// Helpers
// =============================================================================

const readViewportWidth = (): number =>
  typeof window !== 'undefined' ? window.innerWidth : SSR_VIEWPORT_WIDTH;

/** Resolve a `PanelSize` against a viewport width. `Math.floor` matches the prototype (`index.tsx:462`). */
export function resolvePanelSize(size: PanelSize, viewportWidth: number): number {
  if (typeof size === 'number') return Math.round(size);
  return Math.floor((viewportWidth * parseFloat(size)) / 100);
}

// =============================================================================
// Hook
// =============================================================================

export function usePanelMode({
  initialMode = 'closed',
  sidebarWidth = '40%',
  minWidth = 360,
  maxWidth,
  edge = 'right',
  snapToCloseThreshold = 0,
  onWidthChange,
  onModeChange,
  handleLabel = 'Resize panel',
}: UsePanelModeOptions = {}): UsePanelModeReturn {
  /**
   * Tracked so viewport-relative sizes (`'40%'`) re-resolve on window resize, and
   * so `isFullscreen` — which reads `window.innerWidth` during render — is
   * re-derived. This is *not* a second copy of `usePanelResize`'s clamp; that
   * hook still owns every write to `width`.
   */
  const [viewportWidth, setViewportWidth] = useState(readViewportWidth);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /**
   * What `fullscreen` means, and what a `%` is a percentage *of*. The viewport
   * unless the host scopes the panel to a narrower container.
   */
  const extentWidth =
    maxWidth === undefined ? viewportWidth : resolvePanelSize(maxWidth, viewportWidth);

  const resolvedSidebarWidth = resolvePanelSize(sidebarWidth, extentWidth);

  const [isOpen, setIsOpen] = useState(initialMode !== 'closed');

  /*
    The dock's state is declared up here, ahead of the resize hook, because the
    panel's own floor depends on it — see `resolvedMinWidth` below. The verbs
    that move it still live in their own section further down, next to the
    artifact block they belong to.
  */
  const [artifactOpenId, setArtifactOpenId] = useState<string | null>(null);
  const [artifactExpanded, setArtifactExpanded] = useState(false);
  const [openedArtifactIds, setOpenedArtifactIds] = useState<string[]>([]);

  /**
   * The panel's floor, and the whole of the three-column rule.
   *
   * With a dock open the panel may not be narrowed past the width where the
   * chat and the dock both fit — `usePanelResize` clamps every drag frame,
   * every keyboard step and every `setWidth` against this number, so one value
   * enforces the rule on all three paths and no mode ever flips underneath the
   * pointer.
   *
   * It also does the work on the way OUT of fullscreen at no cost: the contract
   * control restores the width the panel came from (often 480), `setWidth`
   * clamps that up to the floor, and the panel lands on the three-column layout
   * instead of the squeezed one.
   *
   * `Math.min(…, extentWidth)` is the small-viewport case: a floor wider than
   * the extent would push the panel past the screen edge. Clamped to the extent
   * it reads as fullscreen instead, which is where a dock belongs when three
   * columns cannot fit.
   */
  const baseMinWidth = resolvePanelSize(minWidth, extentWidth);
  const resolvedMinWidth = artifactOpenId
    ? Math.min(THREE_COLUMN_MIN_WIDTH, extentWidth)
    : baseMinWidth;

  /**
   * A drag crossed `snapToCloseThreshold`. Assigned below, once `resize` exists;
   * `usePanelResize` reads `onToggle` through a ref, so identity does not matter.
   */
  const snapClosedRef = useRef<() => void>(() => {});

  const resize = usePanelResize({
    initialWidth:
      initialMode === 'fullscreen'
        ? extentWidth
        : resolvePanelSize(sidebarWidth, extentWidth),
    minWidth: resolvedMinWidth,
    maxWidth: maxWidth === undefined ? undefined : extentWidth,
    defaultWidth: resolvedSidebarWidth,
    snapToCloseThreshold,
    // A right-side panel carries its handle on its left edge: drag left = wider.
    direction: edge === 'right' ? 'left' : 'right',
    onToggle: (open) => {
      if (!open) snapClosedRef.current();
    },
  });

  // ---------------------------------------------------------------------------
  // Derived mode
  // ---------------------------------------------------------------------------

  /**
   * `fullscreen` is a width, not a flag. Deriving it means drag-to-edge enters
   * fullscreen and drag-back leaves it, with no transition table to maintain —
   * and it means sticky-fullscreen-across-window-resize is inherited from
   * `usePanelResize` rather than re-implemented.
   */
  const mode: PanelMode = !isOpen ? 'closed' : resize.isFullscreen ? 'fullscreen' : 'sidebar';
  const width = isOpen ? resize.width : 0;

  /**
   * The mode + width to return to when leaving `fullscreen`.
   *
   * The prototype stored a *boolean* (`panelWasOpenRef`, `index.tsx:184`) and
   * restored to a hardcoded 40% — so a user who dragged to 72%, went fullscreen,
   * and came back silently lost their width. Storing the width fixes that. The
   * ref could not express the thing it needed to restore.
   */
  const priorRef = useRef<{ mode: PanelMode; width: number } | null>(null);

  // ---------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------

  /** The widest a `sidebar` may be before it reads as `fullscreen`. */
  /*
    `baseMinWidth`, not the dock-aware floor: this is a ceiling, and pinning it
    to a floor that moves when the dock opens would change the identity of
    `open` and `setMode` — which are documented as stable, and which a consumer
    is invited to put in an effect's dependency array. The floor is enforced
    where it belongs, inside `usePanelResize.setWidth`, which clamps every write
    up to `minWidth` after this ceiling has clamped it down.
  */
  const maxSidebarWidth = Math.max(baseMinWidth, extentWidth - FULLSCREEN_EPSILON - 1);

  /**
   * The transitions read the *current* mode and width, but must not be
   * re-created when those change.
   *
   * `usePanelResize` returns a fresh object literal every render, and `mode` and
   * `width` change on every drag frame. Closing over them directly meant every
   * callback below got a new identity on every render — so a consumer doing the
   * documented thing (`useEffect(() => panel.open(), [panel.open])`) re-opened
   * the panel on every render and could never drag it. These callbacks are
   * documented as stable; refs are what make that true.
   */
  const resizeRef = useRef(resize);
  resizeRef.current = resize;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const setMode = useCallback(
    (next: PanelMode) => {
      const current = modeRef.current;
      const r = resizeRef.current;
      if (next === current) return;

      if (next === 'closed') {
        priorRef.current = { mode: current, width: r.width };
        setIsOpen(false);
        return;
      }

      if (next === 'fullscreen') {
        // Remember where we came from — including `closed`, so a fullscreen
        // opened by a citation click collapses back to nothing, not to a sidebar
        // the user never asked for.
        priorRef.current = { mode: current, width: r.width };
        setIsOpen(true);
        r.setWidth(extentWidth);
        return;
      }

      // → sidebar
      const prior = priorRef.current;
      const desired =
        current === 'fullscreen' && prior?.mode === 'sidebar' ? prior.width : resolvedSidebarWidth;
      priorRef.current = null;
      setIsOpen(true);
      r.setWidth(Math.min(desired, maxSidebarWidth));
    },
    [extentWidth, resolvedSidebarWidth, maxSidebarWidth]
  );

  /**
   * Drag-to-close. Remembering the width means a snapped-shut panel restores
   * where the user left it, the same as one closed from the header.
   */
  snapClosedRef.current = () => {
    if (!isOpen) return;
    priorRef.current = { mode, width: resize.width };
    setIsOpen(false);
  };

  const toggleFullscreen = useCallback(() => {
    if (modeRef.current === 'fullscreen') {
      const prior = priorRef.current;
      setMode(prior?.mode === 'closed' ? 'closed' : 'sidebar');
    } else {
      setMode('fullscreen');
    }
  }, [setMode]);

  const open = useCallback(() => {
    // Opening is always `sidebarWidth`, even from a remembered wider width —
    // the prototype's `handleOpenAIChat` (:460-464) does this, and it means the
    // affordance always lands in the same place.
    priorRef.current = null;
    setIsOpen(true);
    resizeRef.current.setWidth(Math.min(resolvedSidebarWidth, maxSidebarWidth));
  }, [resolvedSidebarWidth, maxSidebarWidth]);

  const close = useCallback(() => setMode('closed'), [setMode]);

  const setWidth = useCallback(
    (size: PanelSize) => resizeRef.current.setWidth(resolvePanelSize(size, extentWidth)),
    [extentWidth]
  );

  // ---------------------------------------------------------------------------
  // The artifact dock
  // ---------------------------------------------------------------------------

  /* State declared above the resize hook — it is what sets the panel's floor. */

  const openArtifact = useCallback(
    (id: string, options?: { fullscreen?: boolean; inPlace?: boolean }) => {
      /*
        THE DOCK IN THE PANEL IT ALREADY HAS.

        `{ inPlace: true }` is the opt-out from the whole width negotiation
        below: no fullscreen, no three-column floor, no width change at all.
        The dock arrives EXPANDED — it takes the panel's own width, and the
        chat column folds away rather than being squeezed into a sliver next to
        a 420px card.

        It exists because a host page can be something the user is reading —
        a document open beside the chat — and every other route to the dock
        displaces it. Akshat, 2026-08-25: *"in the doc preview mode we kinda
        want to stay in the sidebar mode only and not go fullscreen."*

        Checked first, and it returns: `fullscreen: false` still asks the panel
        to move (to `THREE_COLUMN_MIN_WIDTH`, or to fullscreen when three
        columns do not fit), and "do not move the panel" outranks it.
      */
      if (options?.inPlace) {
        /* "In place" needs a place. A closed panel has none, and a dock opened
           into one is an artifact nobody can see — so a shut panel gets its
           sidebar back. An OPEN panel is not touched, at any width: `setMode`
           would snap a dragged width back to `sidebarWidth`. */
        if (modeRef.current === 'closed') setMode('sidebar');
        setArtifactExpanded(true);
        setOpenedArtifactIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setArtifactOpenId(id);
        return;
      }

      /*
        THE THIRD COLUMN, ASKED FOR DIRECTLY.

        `artifact.open(id)` goes fullscreen first because a 420px dock does not
        fit beside a 360px chat. But `host | chat | dock` is already a layout
        the panel can rest in — the floor rises to `THREE_COLUMN_MIN_WIDTH` the
        moment a dock is open, which is what contracting out of fullscreen
        lands on. `{ fullscreen: false }` simply opens onto that resting layout
        instead of arriving through fullscreen, so the host page never blinks
        out. Shipping Iris opens Sources this way.

        Below `THREE_COLUMN_MIN_WIDTH + FULLSCREEN_EPSILON + 1` of extent the
        three columns do not fit and the option is ignored: the panel goes
        fullscreen, which is the existing rule doing its existing job.

        And below `THREE_COLUMN_MIN_HOST_WIDTH` of REMAINDER they fit only
        arithmetically: the third column exists and the page behind it is
        unreadable. Same fallback, same reason — see that constant for the
        measurement.
      */
      if (
        options?.fullscreen === false &&
        extentWidth > THREE_COLUMN_MIN_WIDTH + FULLSCREEN_EPSILON &&
        extentWidth - THREE_COLUMN_MIN_WIDTH >= THREE_COLUMN_MIN_HOST_WIDTH
      ) {
        priorRef.current = null;
        setIsOpen(true);
        resizeRef.current.setWidth(THREE_COLUMN_MIN_WIDTH);
      } else {
        setMode('fullscreen');
      }
      setArtifactExpanded(false); // a freshly opened artifact never arrives expanded
      setOpenedArtifactIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setArtifactOpenId(id);
    },
    [setMode, extentWidth]
  );

  const setArtifactOpen = useCallback((id: string | null) => {
    setArtifactOpenId(id);
    if (!id) setArtifactExpanded(false);
  }, []);

  const closeArtifact = useCallback(() => {
    setArtifactOpenId(null);
    setArtifactExpanded(false);
  }, []);

  const resetArtifacts = useCallback(() => {
    setArtifactOpenId(null);
    setArtifactExpanded(false);
    setOpenedArtifactIds([]);
  }, []);

  const toggleArtifactExpanded = useCallback(() => setArtifactExpanded((v) => !v), []);

  const artifact = useMemo<PanelArtifactState>(
    () => ({
      openId: artifactOpenId,
      expanded: artifactExpanded,
      openedIds: openedArtifactIds,
      open: openArtifact,
      setOpenId: setArtifactOpen,
      close: closeArtifact,
      reset: resetArtifacts,
      toggleExpanded: toggleArtifactExpanded,
    }),
    [
      artifactOpenId,
      artifactExpanded,
      openedArtifactIds,
      openArtifact,
      setArtifactOpen,
      closeArtifact,
      resetArtifacts,
      toggleArtifactExpanded,
    ]
  );

  // ---------------------------------------------------------------------------
  // Streams
  // ---------------------------------------------------------------------------

  const callbacksRef = useRef({ onWidthChange, onModeChange });
  callbacksRef.current = { onWidthChange, onModeChange };

  const lastWidthRef = useRef(width);
  useEffect(() => {
    if (lastWidthRef.current === width) return;
    lastWidthRef.current = width;
    callbacksRef.current.onWidthChange?.(width);
  }, [width]);

  /*
    FULLSCREEN IS A WIDTH, SO IT HAS TO BE THE WHOLE WIDTH.

    `usePanelResize` re-pins a panel that was AT the old extent when the extent
    changes — that is what makes fullscreen sticky across a window resize. It
    does nothing for the panel that BECOMES fullscreen because the viewport
    shrank down to it, which is now a reachable state: a dock-open panel sits on
    its 916 floor, the window narrows to 940, and the derived mode flips to
    `fullscreen` while a 24px strip of host page still shows beside it. The
    chrome switches to the fullscreen grammar; the geometry does not.

    Not during a drag: the drag owns the width while the pointer is down, and a
    panel that snapped to the edge 50px early would fight the hand. On release
    it settles, which is the same rule stated once.
  */
  useEffect(() => {
    if (mode !== 'fullscreen' || resize.isResizing) return;
    if (width === extentWidth) return;
    resizeRef.current.setWidth(extentWidth);
  }, [mode, width, extentWidth, resize.isResizing]);

  const lastModeRef = useRef(mode);
  useEffect(() => {
    if (lastModeRef.current === mode) return;
    const prev = lastModeRef.current;
    lastModeRef.current = mode;
    /*
      LEAVING FULLSCREEN NO LONGER CLOSES THE DOCK — REMOVED 2026-08-19.

      The rule that stood here closed the dock whenever the panel left
      fullscreen. It was written against a real defect: a 420px card floating
      inside a 480px panel with a ~40px sliver of chat beside it. Akshat
      overruled the cure rather than the diagnosis — *"we shouldn't
      automatically collapse the right sidebar if they start narrowing the
      chat"* — because a dock the user opened is not the mode machine's to
      close.

      What replaces it is `THREE_COLUMN_MIN_WIDTH` on `resolvedMinWidth`: with a
      dock open the panel simply cannot be narrower than a chat plus a dock, so
      the squeezed frame is unreachable and host + chat + dock is a state the
      panel can rest in. The defect stays dead; the dock stays open.
    */
    callbacksRef.current.onModeChange?.(mode, prev);
  }, [mode]);

  // ---------------------------------------------------------------------------
  // Prop bundles
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const screenDelta = e.key === 'ArrowLeft' ? -KEYBOARD_RESIZE_STEP : KEYBOARD_RESIZE_STEP;
        // On a right-side panel, moving the handle left widens the panel.
        const r = resizeRef.current;
        r.setWidth(r.width + (edge === 'right' ? -screenDelta : screenDelta));
      } else if (e.key === 'Home') {
        e.preventDefault();
        resizeRef.current.setWidth(resolvedMinWidth);
      } else if (e.key === 'End') {
        e.preventDefault();
        resizeRef.current.setWidth(extentWidth);
      }
    },
    [edge, resolvedMinWidth, extentWidth]
  );

  const handleProps = useMemo<PanelHandleProps>(
    () => ({
      onPointerDown: resize.handlePointerDown,
      onKeyDown: handleKeyDown,
      role: 'separator',
      tabIndex: 0,
      'aria-orientation': 'vertical',
      'aria-label': handleLabel,
      'aria-valuenow': width,
      'aria-valuemin': resolvedMinWidth,
      'aria-valuemax': extentWidth,
    }),
    [resize.handlePointerDown, handleKeyDown, handleLabel, width, resolvedMinWidth, extentWidth]
  );

  const shellProps = useMemo<PanelShellState>(
    () => ({ mode, width, isResizing: resize.isResizing, edge, handleProps }),
    [mode, width, resize.isResizing, edge, handleProps]
  );

  /**
   * The host reflow contract. `calc(100% - 0px)` when closed rather than an
   * absent `width` — the prototype drops the property entirely (`:624-629`),
   * which means closing never animates. Keeping the calc makes open and close
   * symmetric.
   *
   * The duration token is zeroed under `prefers-reduced-motion` in
   * `tokens/motion.css`, which is the only way an inline style can honor it.
   */
  const hostStyle = useMemo<React.CSSProperties>(
    () => ({
      width: `calc(100% - ${width}px)`,
      transition: resize.isResizing
        ? 'none'
        : 'width var(--ai-motion-duration-panel) var(--ai-motion-easing-standard)',
    }),
    [width, resize.isResizing]
  );

  return {
    mode,
    width,
    isResizing: resize.isResizing,
    setMode,
    toggleFullscreen,
    open,
    close,
    setWidth,
    shellProps,
    handleProps,
    hostStyle,
    artifact,
  };
}
