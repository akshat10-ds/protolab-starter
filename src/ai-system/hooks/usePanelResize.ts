/**
 * usePanelResize — Generalized drag-to-resize hook for panels
 *
 * Extracted from agreement-studio's usePanelResize and generalized
 * for reuse across the ai-system. Supports:
 *
 * - Min/max width constraints
 * - Snap-to-close threshold (drag below min to close panel)
 * - Directional dragging (left-edge vs right-edge handles)
 * - Callbacks for onResize and onToggle
 * - Window resize tracking
 * - Fullscreen expand/collapse
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export type ResizeDirection = 'left' | 'right';

export interface UsePanelResizeOptions {
  /** Initial panel width in px */
  initialWidth: number;
  /** Minimum allowed width in px */
  minWidth: number;
  /** Maximum allowed width in px (defaults to window.innerWidth) */
  maxWidth?: number;
  /** Default width used when collapsing from expanded state */
  defaultWidth?: number;
  /**
   * Threshold below minWidth at which the panel snaps closed.
   * Set to 0 to disable snap-to-close. Defaults to 50.
   */
  snapToCloseThreshold?: number;
  /**
   * Which edge the drag handle sits on.
   * - 'left': handle on left edge, drag left = wider (right-side panels)
   * - 'right': handle on right edge, drag right = wider (left-side panels)
   */
  direction?: ResizeDirection;
  /** Called continuously during resize with the current width */
  onResize?: (width: number) => void;
  /** Called when the panel snaps closed or opens via snap */
  onToggle?: (isOpen: boolean) => void;
}

export interface UsePanelResizeReturn {
  /** Current panel width in px */
  width: number;
  /** Whether the panel is currently being dragged */
  isResizing: boolean;
  /** Whether the panel has been snapped closed */
  isSnappedClosed: boolean;
  /** Set the panel width directly */
  setWidth: (width: number) => void;
  /** Mouse-down handler — attach to the drag handle element */
  handlePointerDown: (e: React.PointerEvent) => void;
  /** Toggle between fullscreen and default width */
  toggleFullscreen: () => void;
  /** Whether the panel is at or near full width */
  isFullscreen: boolean;
  /** Restore the panel after a snap-close */
  restore: () => void;
  /** Reset to initial width */
  reset: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function usePanelResize({
  initialWidth,
  minWidth,
  maxWidth: maxWidthProp,
  defaultWidth,
  snapToCloseThreshold = 50,
  direction = 'left',
  onResize,
  onToggle,
}: UsePanelResizeOptions): UsePanelResizeReturn {
  const effectiveDefault = defaultWidth ?? initialWidth;

  const [width, setWidthState] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isSnappedClosed, setIsSnappedClosed] = useState(false);

  const getMaxWidth = useCallback(() => {
    return maxWidthProp ?? (typeof window !== 'undefined' ? window.innerWidth : 1920);
  }, [maxWidthProp]);

  /**
   * The extent the panel measures itself against — `maxWidth` when the panel is
   * scoped to a container, the viewport otherwise. Tracked so a near-full panel
   * can be re-pinned when the extent changes.
   */
  const prevMaxWidthRef = useRef(
    maxWidthProp ?? (typeof window !== 'undefined' ? window.innerWidth : 1920)
  );

  // Stable ref for callbacks to avoid re-creating mouse handlers
  const callbacksRef = useRef({ onResize, onToggle });
  callbacksRef.current = { onResize, onToggle };

  /**
   * Re-pin against the extent, not against `window.innerWidth`.
   *
   * A panel sitting at (or within 50px of) the old extent is fullscreen, and
   * must stay fullscreen — that is what makes `isFullscreen` sticky across a
   * resize. Reading the viewport directly here meant a container-scoped panel
   * (`maxWidth` supplied) could never track its container, even though the
   * option promised it could.
   */
  const clampToExtent = useCallback(() => {
    const currentMax = getMaxWidth();
    const prevMax = prevMaxWidthRef.current;
    prevMaxWidthRef.current = currentMax;
    if (currentMax === prevMax && width <= currentMax) return;

    if (width >= prevMax - 50 || width > currentMax) {
      setWidthState(Math.max(minWidth, currentMax));
    }
  }, [getMaxWidth, width, minWidth]);

  // Viewport-scoped panels follow the window. Container-scoped panels follow
  // `maxWidth`, which the consumer re-supplies when the container resizes.
  useEffect(() => {
    if (maxWidthProp !== undefined) {
      clampToExtent();
      return;
    }
    window.addEventListener('resize', clampToExtent);
    return () => window.removeEventListener('resize', clampToExtent);
  }, [maxWidthProp, clampToExtent]);

  const setWidth = useCallback(
    (newWidth: number) => {
      const max = getMaxWidth();
      const clamped = Math.min(max, Math.max(minWidth, newWidth));
      setWidthState(clamped);
      setIsSnappedClosed(false);
    },
    [minWidth, getMaxWidth]
  );

  /**
   * Pointer, not mouse.
   *
   * Three failures came out of the mouse-only version, and pointer capture
   * fixes all three at once:
   *
   * 1. **Release outside the window left the drag on.** `mouseup` is never
   *    delivered when the button comes up past the browser's edge — which is
   *    exactly where you end up when dragging a panel wide. The listeners
   *    stayed attached and the panel kept resizing on the next move.
   * 2. **Touch and pen did nothing.** There was no touch path at all.
   * 3. **A fast drag outran the handle.** Capture pins every subsequent event
   *    to the handle no matter what is under the cursor.
   *
   * `data-panel-resizing` on `<body>` is the other half: it locks the cursor to
   * `ew-resize` and kills text selection for the whole page while the drag is
   * live. Without it the cursor reverts to an I-beam the instant the pointer
   * leaves the 16px strip, which is immediately, and the drag reads as broken
   * even when it is working.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsResizing(true);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      document.body.dataset.panelResizing = 'true';

      const startX = e.clientX;
      const startWidth = isSnappedClosed ? minWidth : width;

      const handleMouseMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const max = getMaxWidth();

        // Direction determines how mouse movement maps to width change:
        // 'left' handle (right-side panel): drag left = wider, so invert
        // 'right' handle (left-side panel): drag right = wider, so use as-is
        const widthDelta = direction === 'left' ? -deltaX : deltaX;
        const rawWidth = startWidth + widthDelta;

        // Check snap-to-close
        if (snapToCloseThreshold > 0 && rawWidth < minWidth - snapToCloseThreshold) {
          setIsSnappedClosed(true);
          setWidthState(minWidth);
          callbacksRef.current.onToggle?.(false);
          return;
        }

        // If we were snapped closed but dragged back above min, restore
        if (rawWidth >= minWidth) {
          setIsSnappedClosed(false);
        }

        const clamped = Math.min(max, Math.max(minWidth, rawWidth));
        setWidthState(clamped);
        callbacksRef.current.onResize?.(clamped);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        delete document.body.dataset.panelResizing;
        document.removeEventListener('pointermove', handleMouseMove);
        document.removeEventListener('pointerup', handleMouseUp);
        /* A cancelled pointer — the OS took it, or the browser did — ends the
           drag the same way a release does. Without this the body attribute
           survives and the whole page keeps the resize cursor. */
        document.removeEventListener('pointercancel', handleMouseUp);
      };

      document.addEventListener('pointermove', handleMouseMove);
      document.addEventListener('pointerup', handleMouseUp);
      document.addEventListener('pointercancel', handleMouseUp);
    },
    [width, isSnappedClosed, minWidth, getMaxWidth, direction, snapToCloseThreshold]
  );

  const toggleFullscreen = useCallback(() => {
    const max = getMaxWidth();
    if (width >= max - 50) {
      setWidthState(effectiveDefault);
    } else {
      setWidthState(max);
    }
    setIsSnappedClosed(false);
  }, [width, getMaxWidth, effectiveDefault]);

  const isFullscreen = width >= getMaxWidth() - 50;

  const restore = useCallback(() => {
    setIsSnappedClosed(false);
    setWidthState(effectiveDefault);
    callbacksRef.current.onToggle?.(true);
  }, [effectiveDefault]);

  const reset = useCallback(() => {
    setWidthState(initialWidth);
    setIsSnappedClosed(false);
  }, [initialWidth]);

  return {
    width,
    isResizing,
    isSnappedClosed,
    setWidth,
    handlePointerDown,
    toggleFullscreen,
    isFullscreen,
    restore,
    reset,
  };
}
