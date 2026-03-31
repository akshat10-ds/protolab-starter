import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

/** @deprecated Use TooltipLocation instead */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipLocation = 'above' | 'below' | 'before' | 'after';
export type TooltipAlignment = 'start' | 'center' | 'end';

export interface TooltipProps {
  /** The text to display inside the Tooltip */
  text?: string;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** The preferred location of the Tooltip relative to its anchor element */
  location?: TooltipLocation;
  /**
   * The alignment of the Tooltip along the edge of its anchor element.
   * For locations 'above' and 'below': 'start' = left-aligned, 'center' = centered, 'end' = right-aligned
   * For locations 'before' and 'after': 'start' = top-aligned, 'center' = centered, 'end' = bottom-aligned
   */
  alignment?: TooltipAlignment;
  /** Delay in milliseconds before showing the tooltip */
  delay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Data QA attribute for testing */
  'data-qa'?: string;
  /** @deprecated Use text instead */
  content?: string;
  /** @deprecated Use location instead */
  position?: TooltipPosition;
}

// Map legacy position prop to new location prop
const positionToLocation: Record<TooltipPosition, TooltipLocation> = {
  top: 'above',
  bottom: 'below',
  left: 'before',
  right: 'after',
};

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  location,
  alignment = 'center',
  delay = 200,
  disabled = false,
  'data-qa': dataQa,
  // Legacy props
  content,
  position,
}) => {
  // Support legacy props
  const tooltipText = text || content || '';
  const tooltipLocation: TooltipLocation =
    location || (position ? positionToLocation[position] : 'above');

  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [actualLocation, setActualLocation] = useState<TooltipLocation>(tooltipLocation);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 0; // Figma spec: no spacing between tooltip and anchor
    const padding = 8;

    let top = 0;
    let left = 0;
    let finalLocation = tooltipLocation;

    // Helper to check if tooltip fits in a location
    const fitsAbove = () => triggerRect.top - tooltipRect.height - gap >= padding;
    const fitsBelow = () =>
      triggerRect.bottom + gap + tooltipRect.height <= window.innerHeight - padding;
    const fitsBefore = () => triggerRect.left - tooltipRect.width - gap >= padding;
    const fitsAfter = () =>
      triggerRect.right + gap + tooltipRect.width <= window.innerWidth - padding;

    // Smart positioning: flip if preferred location doesn't fit
    switch (tooltipLocation) {
      case 'above':
        if (!fitsAbove() && fitsBelow()) {
          finalLocation = 'below';
        }
        break;
      case 'below':
        if (!fitsBelow() && fitsAbove()) {
          finalLocation = 'above';
        }
        break;
      case 'before':
        if (!fitsBefore() && fitsAfter()) {
          finalLocation = 'after';
        }
        break;
      case 'after':
        if (!fitsAfter() && fitsBefore()) {
          finalLocation = 'before';
        }
        break;
    }

    // Calculate position based on final location
    switch (finalLocation) {
      case 'above':
        top = triggerRect.top - tooltipRect.height - gap;
        break;
      case 'below':
        top = triggerRect.bottom + gap;
        break;
      case 'before':
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'after':
        left = triggerRect.right + gap;
        break;
    }

    // Calculate alignment
    if (finalLocation === 'above' || finalLocation === 'below') {
      switch (alignment) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'end':
          left = triggerRect.right - tooltipRect.width;
          break;
      }
    } else {
      // before/after locations
      switch (alignment) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
        case 'end':
          top = triggerRect.bottom - tooltipRect.height;
          break;
      }
    }

    // Final boundary checks (slide along edge if needed)
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }

    setActualLocation(finalLocation);
    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      calculatePosition();
    }
  }, [visible]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!visible) return;

    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [visible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clone the child element and add event handlers
  // Handle case where children might be undefined or invalid
  if (!children || !React.isValidElement(children)) {
    return null;
  }

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props?.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props?.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleMouseEnter();
      children.props?.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleMouseLeave();
      children.props?.onBlur?.(e);
    },
  });

  // Build CSS class based on actual location (after smart positioning) and alignment
  const tooltipClasses = [
    styles.tooltip,
    styles[actualLocation],
    styles[`align-${alignment}`],
  ].join(' ');

  return (
    <React.Fragment>
      {trigger}
      {visible &&
        !disabled &&
        createPortal(
          <div
            data-ink-component="Tooltip"
            data-ink-prop-placement={actualLocation}
            ref={tooltipRef}
            className={tooltipClasses}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            role="tooltip"
            data-qa={dataQa}
          >
            <span className={styles.text}>{tooltipText}</span>
            <div className={styles.caret}>
              <svg className={styles.caretSvg} width="15" height="8" viewBox="0 0 15 8" fill="none">
                <path d="M7.5 8L0.5 0H14.5L7.5 8Z" className={styles.caretFill} />
                <path d="M0.5 0L7.5 8" className={styles.caretBorder} strokeWidth="1" />
                <path d="M14.5 0L7.5 8" className={styles.caretBorder} strokeWidth="1" />
              </svg>
            </div>
          </div>,
          document.body
        )}
    </React.Fragment>
  );
};

Tooltip.displayName = 'Tooltip';
