/**
 * AgentPanel Component
 *
 * Resizable side panel for AI/Agent interactions with optional split layout.
 * Supports chat + canvas configuration for document analysis, form generation, etc.
 *
 * @example
 * ```tsx
 * // Basic usage with chat only
 * <AgentPanel isOpen={isOpen} onClose={() => setIsOpen(false)} title="AI Assistant">
 *   <AIChat messages={messages} />
 * </AgentPanel>
 *
 * // Split layout with canvas
 * <AgentPanel
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Document Analysis"
 *   showCanvas
 *   canvasContent={<AgentCanvas mode="document" documentUrl={url} />}
 * >
 *   <AIChat messages={messages} />
 * </AgentPanel>
 * ```
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { IconButton, Heading, Text } from '@/design-system';
import styles from './AgentPanel.module.css';

// =============================================================================
// Types
// =============================================================================

export interface AgentPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Called when panel should close */
  onClose: () => void;
  /** Panel title */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Main content (typically AIChat) */
  children: React.ReactNode;
  /** Whether to show the canvas area */
  showCanvas?: boolean;
  /** Content for the canvas area */
  canvasContent?: React.ReactNode;
  /** Initial width in pixels */
  width?: number;
  /** Callback when width changes */
  onWidthChange?: (width: number) => void;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width (can be number or '100%') */
  maxWidth?: number | string;
  /** Header actions (buttons/icons) */
  headerActions?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Position of the panel */
  position?: 'right' | 'left';
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_WIDTH = 480;
const DEFAULT_MIN_WIDTH = 360;
const DEFAULT_MAX_WIDTH = 1200;

// =============================================================================
// Main Component
// =============================================================================

export function AgentPanel({
  isOpen,
  onClose,
  title = 'AI Assistant',
  subtitle,
  children,
  showCanvas = false,
  canvasContent,
  width: controlledWidth,
  onWidthChange,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  headerActions,
  className,
  position = 'right',
}: AgentPanelProps) {
  // Panel width state (controlled or internal)
  const isWidthControlled = controlledWidth !== undefined;
  const [internalWidth, setInternalWidth] = useState(DEFAULT_WIDTH);
  const panelWidth = isWidthControlled ? controlledWidth : internalWidth;

  // Chat/Canvas split ratio
  const [splitRatio, setSplitRatio] = useState(0.5);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'panel' | 'split' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const startRatio = useRef(0);

  // Calculate max width based on viewport
  const getMaxWidth = useCallback(() => {
    if (typeof maxWidth === 'string' && maxWidth === '100%') {
      return window.innerWidth;
    }
    return typeof maxWidth === 'number' ? maxWidth : DEFAULT_MAX_WIDTH;
  }, [maxWidth]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle panel resize
  const handlePanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType('panel');
    startX.current = e.clientX;
    startWidth.current = panelWidth;
  };

  // Handle split resize
  const handleSplitResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType('split');
    startX.current = e.clientX;
    startRatio.current = splitRatio;
  };

  // Handle mouse move during resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizeType === 'panel') {
        const delta =
          position === 'right' ? startX.current - e.clientX : e.clientX - startX.current;
        const newWidth = Math.min(Math.max(startWidth.current + delta, minWidth), getMaxWidth());
        if (isWidthControlled) {
          onWidthChange?.(newWidth);
        } else {
          setInternalWidth(newWidth);
        }
      } else if (resizeType === 'split' && panelRef.current) {
        const panelRect = panelRef.current.getBoundingClientRect();
        const relativeX = e.clientX - panelRect.left;
        const newRatio = Math.min(Math.max(relativeX / panelRect.width, 0.3), 0.7);
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeType(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeType, position, minWidth, getMaxWidth, isWidthControlled, onWidthChange]);

  // Calculate content widths for split layout
  const chatWidth = showCanvas ? `${splitRatio * 100}%` : '100%';
  const canvasWidth = showCanvas ? `${(1 - splitRatio) * 100}%` : '0%';

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Panel */}
      <div
        data-ink-component="AgentPanel"
        ref={panelRef}
        className={`${styles.panel} ${styles[`position${capitalize(position)}`]} ${isResizing ? styles.isResizing : ''} ${className || ''}`}
        style={{ width: panelWidth }}
      >
        {/* Resize handle */}
        <div
          className={`${styles.resizeHandle} ${styles[`resize${capitalize(position)}`]}`}
          onMouseDown={handlePanelResizeStart}
        />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerTitles}>
              <Heading level={4} className={styles.title}>
                {title}
              </Heading>
              {subtitle && (
                <Text size="xs" color="secondary" className={styles.subtitle}>
                  {subtitle}
                </Text>
              )}
            </div>
            <div className={styles.headerActions}>
              {headerActions}
              <IconButton
                icon="close"
                size="small"
                variant="tertiary"
                onClick={onClose}
                aria-label="Close panel"
              />
            </div>
          </div>
        </div>

        {/* Body with optional split */}
        <div className={styles.body}>
          {/* Chat area */}
          <div className={styles.chatArea} style={{ width: chatWidth }}>
            {children}
          </div>

          {/* Split resizer */}
          {showCanvas && (
            <div className={styles.splitResizer} onMouseDown={handleSplitResizeStart}>
              <div className={styles.splitResizerLine} />
            </div>
          )}

          {/* Canvas area */}
          {showCanvas && (
            <div className={styles.canvasArea} style={{ width: canvasWidth }}>
              {canvasContent}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default AgentPanel;
