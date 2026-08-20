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
   */
  open: (id: string) => void;
  /**
   * Move the dock to another item it already holds, or `null` to close it.
   * Does not change panel mode and does not add to `openedIds`: a tab, a back
   * arrow and a source row navigate inside what is already there.
   */
  setOpenId: (id: string | null) => void;
  /** Close the dock and drop `expanded`, so reopening never inherits it. */
  close: () => void;
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

  const resolvedMinWidth = resolvePanelSize(minWidth, extentWidth);
  const resolvedSidebarWidth = resolvePanelSize(sidebarWidth, extentWidth);

  const [isOpen, setIsOpen] = useState(initialMode !== 'closed');

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
  const maxSidebarWidth = Math.max(resolvedMinWidth, extentWidth - FULLSCREEN_EPSILON - 1);

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

  const [artifactOpenId, setArtifactOpenId] = useState<string | null>(null);
  const [artifactExpanded, setArtifactExpanded] = useState(false);
  const [openedArtifactIds, setOpenedArtifactIds] = useState<string[]>([]);

  const openArtifact = useCallback(
    (id: string) => {
      setMode('fullscreen');
      setArtifactExpanded(false); // a freshly opened artifact never arrives expanded
      setOpenedArtifactIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setArtifactOpenId(id);
    },
    [setMode]
  );

  const setArtifactOpen = useCallback((id: string | null) => {
    setArtifactOpenId(id);
    if (!id) setArtifactExpanded(false);
  }, []);

  const closeArtifact = useCallback(() => {
    setArtifactOpenId(null);
    setArtifactExpanded(false);
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
      toggleExpanded: toggleArtifactExpanded,
    }),
    [
      artifactOpenId,
      artifactExpanded,
      openedArtifactIds,
      openArtifact,
      setArtifactOpen,
      closeArtifact,
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

  const lastModeRef = useRef(mode);
  useEffect(() => {
    if (lastModeRef.current === mode) return;
    const prev = lastModeRef.current;
    lastModeRef.current = mode;
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
