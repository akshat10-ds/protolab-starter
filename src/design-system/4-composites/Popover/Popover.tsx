import React, { useState, useRef, useEffect } from 'react';
import styles from './Popover.module.css';

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverProps {
  /** The content to display in the popover */
  content: React.ReactNode;
  /** The element that triggers the popover */
  children: React.ReactElement;
  /** Position of the popover relative to the trigger */
  position?: PopoverPosition;
  /** Alignment of the popover */
  align?: PopoverAlign;
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether to show an arrow pointing to the trigger */
  showArrow?: boolean;
  /** Close on click outside */
  closeOnClickOutside?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Data QA attribute for testing */
  'data-qa'?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  position = 'bottom',
  align = 'center',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  showArrow = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  'data-qa': dataQa,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const gap = showArrow ? 12 : 8;

    let top = 0;
    let left = 0;

    // Calculate primary axis (position)
    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - gap;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        break;
      case 'left':
        left = triggerRect.left - popoverRect.width - gap;
        break;
      case 'right':
        left = triggerRect.right + gap;
        break;
    }

    // Calculate secondary axis (alignment)
    if (position === 'top' || position === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          break;
        case 'end':
          left = triggerRect.right - popoverRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          break;
        case 'end':
          top = triggerRect.bottom - popoverRect.height;
          break;
      }
    }

    // Boundary checks
    const padding = 8;
    if (left < padding) left = padding;
    if (left + popoverRect.width > window.innerWidth - padding) {
      left = window.innerWidth - popoverRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + popoverRect.height > window.innerHeight - padding) {
      top = window.innerHeight - popoverRect.height - padding;
    }

    setCoords({ top, left });
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
    children.props.onClick?.(e);
  };

  // Handle click outside
  useEffect(() => {
    if (!open || !closeOnClickOutside) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, closeOnClickOutside]);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape]);

  // Update position when open
  useEffect(() => {
    if (open) {
      calculatePosition();
    }
  }, [open]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!open) return;

    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [open]);

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onClick: handleTriggerClick,
    'aria-expanded': open,
    'aria-haspopup': 'true',
  });

  return (
    <span data-ink-component="Popover" data-ink-prop-placement={position}>
      {trigger}
      {open && (
        <div
          ref={popoverRef}
          className={`${styles.popover} ${styles[position]}`}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          role="dialog"
          data-qa={dataQa}
        >
          {content}
          {showArrow && <div className={styles.arrow} />}
        </div>
      )}
    </span>
  );
};

Popover.displayName = 'Popover';
