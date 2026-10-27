import React, { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import styles from './Dropdown.module.css';
import { Icon } from '../../3-primitives/Icon';
import { Portal } from '../../2-utilities/Portal';

export type DropdownPosition = 'top' | 'bottom' | 'left' | 'right';
export type DropdownAlign = 'start' | 'center' | 'end';

export interface DropdownItemProps {
  /** Optional for non-interactive dividers and section headers. */
  label?: string;
  icon?: React.ReactNode;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  section?: string;
  badge?: string;
  shortcut?: string;
  children?: DropdownItemProps[];
  selected?: boolean;
  /** Alert actions use Ink's error foreground role. */
  kind?: 'default' | 'alert';
  /** Optional designed content at the end of a menu item. */
  endElement?: React.ReactNode;
}

export interface DropdownProps {
  items: DropdownItemProps[];
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  position?: DropdownPosition;
  align?: DropdownAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnItemClick?: boolean;
  header?: string;
  iconStyle?: 'default' | 'boxed';
  maxHeight?: number;
  variant?: 'glass' | 'solid';
  'data-qa'?: string;
}

interface MenuItemsProps {
  items: DropdownItemProps[];
  iconStyle: 'default' | 'boxed';
  onSelect: (item: DropdownItemProps) => void;
  onClose: () => void;
  onBack?: () => void;
  initialFocus?: 'first' | 'last';
}

/** Each menu owns its own focus indices, including its dividers/disabled rows. */
function MenuItems({ items, iconStyle, onSelect, onClose, onBack, initialFocus = 'first' }: MenuItemsProps) {
  const [submenu, setSubmenu] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const enabled = items.flatMap((item, index) =>
    item.disabled || item.divider || item.section ? [] : [index]);
  const focus = (index: number) => refs.current[index]?.focus();
  useEffect(() => {
    if (enabled.length) focus(initialFocus === 'last' ? enabled[enabled.length - 1] : enabled[0]);
    else menuRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const current = refs.current.findIndex(element => element === document.activeElement);
    const offset = enabled.indexOf(current);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (enabled.length) focus(enabled[(offset + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focus(event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1]);
    } else if (event.key === 'ArrowRight' && items[current]?.children?.length && !items[current].disabled) {
      event.preventDefault();
      setSubmenu(current);
    } else if ((event.key === 'ArrowLeft' || event.key === 'Escape') && onBack) {
      event.preventDefault();
      onBack();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      onClose();
    }
  };

  return <div ref={menuRef} tabIndex={-1} role="menu" onKeyDown={handleKeyDown}>
    {items.map((item, index) => {
      if (item.divider) return <div key={index} role="separator" className={styles.divider} />;
      if (item.section) return <div key={index} role="presentation" className={styles.header}>{item.section}</div>;
      const hasSubmenu = Boolean(item.children?.length);
      return <div key={index} className={styles.submenuWrapper}
        onMouseEnter={() => setSubmenu(hasSubmenu && !item.disabled ? index : null)}
        onMouseLeave={() => setSubmenu(current => current === index ? null : current)}>
        <button ref={element => { refs.current[index] = element; }}
          type="button"
          role={item.selected !== undefined ? 'menuitemcheckbox' : 'menuitem'}
          aria-checked={item.selected !== undefined ? item.selected : undefined}
          aria-haspopup={hasSubmenu ? 'menu' : undefined}
          aria-expanded={hasSubmenu ? submenu === index : undefined}
          disabled={item.disabled}
          className={[styles.item, item.disabled && styles.disabled, item.selected && styles.selected, item.kind === 'alert' && styles.alert].filter(Boolean).join(' ')}
          onClick={event => {
            event.stopPropagation();
            if (item.disabled) return;
            if (hasSubmenu) setSubmenu(current => current === index ? null : index);
            else onSelect(item);
          }}>
          {item.icon && <span className={`${styles.icon} ${iconStyle === 'boxed' ? styles.iconBoxed : ''}`}>{item.icon}</span>}
          <span className={styles.content}>
            <span className={styles.label}>{item.label}</span>
            {item.description && <span className={styles.description}>{item.description}</span>}
          </span>
          {item.badge && <span className={styles.badge}>{item.badge}</span>}
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
          {item.endElement}
          {item.selected && <span className={styles.checkmark}><Icon name="check" size="small" /></span>}
          {hasSubmenu && <span className={styles.arrow}><Icon name="chevron-right" size="small" /></span>}
        </button>
        {hasSubmenu && submenu === index && !item.disabled &&
          <div className={`${styles.dropdown} ${styles.submenu}`}>
            <MenuItems items={item.children!} iconStyle={iconStyle} onSelect={onSelect} onClose={onClose}
              onBack={() => { setSubmenu(null); focus(index); }} />
          </div>}
      </div>;
    })}
  </div>;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items, children, position = 'bottom', align = 'start', open: controlledOpen,
  defaultOpen = false, onOpenChange, closeOnItemClick = true, header,
  iconStyle = 'default', maxHeight, variant = 'glass', 'data-qa': dataQa,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [initialFocus, setInitialFocus] = useState<'first' | 'last'>('first');
  const open = controlledOpen ?? internalOpen;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const close = () => {
    setOpen(false);
    (wrapperRef.current?.firstElementChild as HTMLElement | null)?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = wrapperRef.current?.firstElementChild;
      const menu = dropdownRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const box = menu.getBoundingClientRect();
      const gap = 4;
      let top = position === 'top' ? rect.top - box.height - gap : rect.bottom + gap;
      let left = align === 'end' ? rect.right - box.width : align === 'center' ? rect.left + (rect.width - box.width) / 2 : rect.left;
      if (position === 'left' || position === 'right') {
        left = position === 'left' ? rect.left - box.width - gap : rect.right + gap;
        top = align === 'end' ? rect.bottom - box.height : align === 'center' ? rect.top + (rect.height - box.height) / 2 : rect.top;
      }
      menu.style.top = `${Math.max(gap, Math.min(top, window.innerHeight - box.height - gap))}px`;
      menu.style.left = `${Math.max(gap, Math.min(left, window.innerWidth - box.width - gap))}px`;
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, position, align]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      const node = event.target as Node;
      if (!wrapperRef.current?.contains(node) && !dropdownRef.current?.contains(node)) setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  const trigger = React.cloneElement(children, {
    'aria-expanded': open, 'aria-haspopup': 'menu', 'aria-controls': open ? menuId : undefined,
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) { setInitialFocus('first'); setOpen(!open); }
      event.stopPropagation();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      children.props.onKeyDown?.(event);
      if (!event.defaultPrevented && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        setInitialFocus(event.key === 'ArrowUp' ? 'last' : 'first');
        setOpen(true);
      }
    },
  });

  return <div data-ink-component="Dropdown" data-ink-prop-variant={variant} className={styles.wrapper} ref={wrapperRef}>
    {trigger}
    {open && <Portal><div id={menuId} ref={dropdownRef}
      className={`${styles.dropdown} ${variant === 'solid' ? styles.solid : ''}`}
      style={{ position: 'fixed', ...(maxHeight ? { maxHeight } : {}), ...(items.some(item => item.children?.length) ? { overflow: 'visible' } : {}) }}
      data-qa={dataQa}>
      {header && <div className={styles.header}>{header}</div>}
      <MenuItems items={items} iconStyle={iconStyle} initialFocus={initialFocus} onClose={close} onSelect={item => { item.onClick?.(); if (closeOnItemClick) close(); }} />
    </div></Portal>}
  </div>;
};

Dropdown.displayName = 'Dropdown';
