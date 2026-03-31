import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import styles from './Dropdown.module.css';
import { Icon } from '../../3-primitives/Icon';
import { Portal } from '../../2-utilities/Portal';

export type DropdownPosition = 'top' | 'bottom' | 'left' | 'right';
export type DropdownAlign = 'start' | 'center' | 'end';

interface Coords {
  top: number;
  left: number;
}

export interface DropdownItemProps {
  /** Item label */
  label: string;
  /** Item icon */
  icon?: React.ReactNode;
  /** Item description (secondary text) */
  description?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is a divider */
  divider?: boolean;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Sub-menu items */
  children?: DropdownItemProps[];
  /** Whether this item is selected (shows checkmark) */
  selected?: boolean;
}

export interface DropdownProps {
  /** Menu items */
  items: DropdownItemProps[];
  /** The element that triggers the dropdown */
  children: React.ReactElement;
  /** Position of the dropdown relative to the trigger */
  position?: DropdownPosition;
  /** Alignment of the dropdown */
  align?: DropdownAlign;
  /** Whether the dropdown is open (controlled) */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Close on item click */
  closeOnItemClick?: boolean;
  /** Section header text (e.g., "Select a view") */
  header?: string;
  /** Show icons with background box styling */
  iconStyle?: 'default' | 'boxed';
  /** Data QA attribute for testing */
  'data-qa'?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  children,
  position = 'bottom',
  align = 'start',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  closeOnItemClick = true,
  header,
  iconStyle = 'default',
  'data-qa': dataQa,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [submenuOpenIndex, setSubmenuOpenIndex] = useState<number>(-1);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Calculate position based on wrapper element
  const calculatePosition = (wrapperEl: HTMLElement): Coords => {
    const triggerRect = wrapperEl.getBoundingClientRect();
    const gap = 4; // Gap between trigger and dropdown

    // Parse combined position values like "bottom-start" into separate position and align
    // This supports both combined format (e.g., "bottom-start") and separate props
    let effectivePosition = position;
    let effectiveAlign = align;

    if (position.includes('-')) {
      const [pos, al] = position.split('-') as [DropdownPosition, DropdownAlign];
      effectivePosition = pos;
      effectiveAlign = al;
    }

    let top = 0;
    let left = 0;

    // Calculate based on position prop
    switch (effectivePosition) {
      case 'bottom':
        top = triggerRect.bottom + gap;
        break;
      case 'top':
        top = triggerRect.top - gap;
        break;
      case 'left':
        left = triggerRect.left - gap;
        top = triggerRect.top;
        break;
      case 'right':
        left = triggerRect.right + gap;
        top = triggerRect.top;
        break;
    }

    // Calculate based on align prop (for top/bottom positions)
    if (effectivePosition === 'top' || effectivePosition === 'bottom') {
      switch (effectiveAlign) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right;
          break;
      }
    }

    return { top, left };
  };

  // Position dropdown after it mounts using double RAF to ensure layout is complete
  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !wrapperRef.current) return;

    // Double RAF ensures the DOM is fully laid out
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (dropdownRef.current && wrapperRef.current) {
          // Use the trigger button (first child) for accurate positioning
          const triggerElement =
            (wrapperRef.current.firstElementChild as HTMLElement) || wrapperRef.current;
          const coords = calculatePosition(triggerElement);

          dropdownRef.current.style.top = `${coords.top}px`;
          dropdownRef.current.style.left = `${coords.left}px`;
          dropdownRef.current.style.visibility = 'visible';
        }
      });
    });
  }, [open, position, align]);

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setActiveIndex(-1);
      setSubmenuOpenIndex(-1);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
    // Call original onClick if it exists
    const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
    childProps.onClick?.(e);
  };

  const handleItemClick = (item: DropdownItemProps, index: number) => {
    if (item.disabled) return;

    if (item.children && item.children.length > 0) {
      setSubmenuOpenIndex(submenuOpenIndex === index ? -1 : index);
      return;
    }

    item.onClick?.();
    if (closeOnItemClick) {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const validItems = items.filter((item) => !item.divider && !item.disabled);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= validItems.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? validItems.length - 1 : next;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < validItems.length) {
          const actualIndex = items.indexOf(validItems[activeIndex]);
          handleItemClick(validItems[activeIndex], actualIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        // Focus the first focusable element in wrapper (the trigger)
        const firstFocusable = wrapperRef.current?.querySelector('button, [tabindex]');
        (firstFocusable as HTMLElement)?.focus();
        break;
    }
  };

  useEffect(() => {
    if (open && activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        wrapperRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!open || !dropdownRef.current || !wrapperRef.current) return;

    const handleUpdate = () => {
      if (dropdownRef.current && wrapperRef.current) {
        const newCoords = calculatePosition(wrapperRef.current);
        dropdownRef.current.style.top = `${newCoords.top}px`;
        dropdownRef.current.style.left = `${newCoords.left}px`;
      }
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [open, position, align]);

  const renderItem = (item: DropdownItemProps, index: number) => {
    if (item.divider) {
      return <div key={`divider-${index}`} className={styles.divider} />;
    }

    const hasSubmenu = item.children && item.children.length > 0;
    const isSubmenuOpen = submenuOpenIndex === index;
    const iconClassName =
      iconStyle === 'boxed' ? `${styles.icon} ${styles.iconBoxed}` : styles.icon;

    return (
      <button
        key={index}
        ref={(el) => {
          itemRefs.current[index] = el;
        }}
        className={`${styles.item} ${item.disabled ? styles.disabled : ''} ${
          activeIndex === index ? styles.active : ''
        } ${item.selected ? styles.selected : ''}`}
        onClick={() => handleItemClick(item, index)}
        disabled={item.disabled}
        type="button"
        role="menuitem"
        aria-selected={item.selected}
      >
        {item.icon && <span className={iconClassName}>{item.icon}</span>}
        <div className={styles.content}>
          <span className={styles.label}>{item.label}</span>
          {item.description && <span className={styles.description}>{item.description}</span>}
        </div>
        {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
        {hasSubmenu && (
          <span className={styles.arrow}>
            <Icon name="chevron-right" size="small" />
          </span>
        )}
        {item.selected && (
          <span className={styles.checkmark}>
            <Icon name="check" size="small" />
          </span>
        )}
      </button>
    );
  };

  // Clone element to add aria attributes (but NOT onClick - that goes on wrapper)
  const trigger = React.cloneElement(children, {
    'aria-expanded': open,
    'aria-haspopup': 'menu' as const,
  });

  // Build alignment class for transform-based centering
  const alignClass = styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`] || '';

  return (
    <div
      data-ink-component="Dropdown"
      className={styles.wrapper}
      ref={wrapperRef}
      onClick={handleTriggerClick}
      style={{ cursor: 'pointer' }}
    >
      {trigger}
      {open && (
        <Portal>
          <div
            ref={dropdownRef}
            className={`${styles.dropdown} ${alignClass}`}
            style={{ position: 'fixed', visibility: 'hidden' }}
            role="menu"
            onKeyDown={handleKeyDown}
            data-qa={dataQa}
          >
            {header && <div className={styles.header}>{header}</div>}
            {items.map((item, index) => renderItem(item, index))}
          </div>
        </Portal>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';
