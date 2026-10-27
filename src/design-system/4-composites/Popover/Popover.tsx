import React, { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import { Portal } from '../../2-utilities/Portal';
import styles from './Popover.module.css';

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverProps {
  /** The content to display in the popover */
  content: React.ReactNode;
  /** The element that triggers the popover */
  children: React.ReactElement<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;
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
  /** Accessible name of the nonmodal dialog. */
  label?: string;
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
  label = 'Details',
  'data-qa': dataQa,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const dialogId = useId();
  const triggerElement = () => wrapperRef.current?.firstElementChild as HTMLElement | null;
  const popoverRef = useRef<HTMLDivElement>(null);

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const calculatePosition = () => {
    const trigger = triggerElement();
    if (!trigger || !popoverRef.current) return;

    const triggerRect = trigger.getBoundingClientRect();
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

  const handleTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
    children.props.onClick?.(e);
    if (!e.defaultPrevented) setOpen(!open);
    e.stopPropagation();
  };

  // Handle click outside
  useEffect(() => {
    if (!open || !closeOnClickOutside) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        wrapperRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !wrapperRef.current.contains(e.target as Node)
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
        e.preventDefault();
        setOpen(false);
        triggerElement()?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape]);

  // Update position when open
  useLayoutEffect(() => {
    if (open) calculatePosition();
  }, [open, position, align, showArrow, content]);

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
  }, [open, position, align, showArrow]);

  const trigger = React.cloneElement(children, {
    onClick: handleTriggerClick,
    'aria-expanded': open,
    'aria-haspopup': 'dialog',
    'aria-controls': open ? dialogId : undefined,
  });

  return (
    <span ref={wrapperRef} data-ink-component="Popover" data-ink-prop-placement={position}>
      {trigger}
      {open && (
        <Portal><div
          id={dialogId}
          ref={popoverRef}
          className={`${styles.popover} ${styles[position]}`}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          role="dialog"
          aria-label={label}
          data-qa={dataQa}
        >
          {content}
          {showArrow && <div className={styles.arrow} />}
        </div></Portal>
      )}
    </span>
  );
};

Popover.displayName = 'Popover';
