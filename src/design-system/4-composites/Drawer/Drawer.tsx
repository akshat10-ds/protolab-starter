import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Drawer.module.css';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'small' | 'medium' | 'large' | 'full';

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Position of the drawer */
  position?: DrawerPosition;
  /** Size of the drawer */
  size?: DrawerSize;
  /** Title for the drawer header */
  title?: React.ReactNode;
  /** Actions for the drawer header */
  headerActions?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether to show overlay backdrop */
  overlay?: boolean;
  /** Whether drawer can be closed by clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Whether drawer can be closed by pressing Escape */
  closeOnEscape?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Additional className */
  className?: string;
  /** Drawer content */
  children: React.ReactNode;
  /** Custom width (for left/right) or height (for top/bottom) */
  customSize?: string;
  /** Z-index for the drawer */
  zIndex?: number;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  position = 'right',
  size = 'medium',
  title,
  headerActions,
  footer,
  overlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  children,
  customSize,
  zIndex = 1000,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    setTimeout(() => firstFocusable?.focus(), 100);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    drawer.addEventListener('keydown', handleTab);
    return () => drawer.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  const drawerStyle: React.CSSProperties = customSize
    ? {
        ...(position === 'left' || position === 'right' ? { width: customSize } : { height: customSize }),
        zIndex: zIndex + 1,
      }
    : { zIndex: zIndex + 1 };

  const content = (
    <div data-ink-component="Drawer" data-ink-prop-position={position} className={styles.container} style={{ zIndex }}>
      {overlay && (
        <div
          className={styles.overlay}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        className={`${styles.drawer} ${styles[position]} ${styles[size]} ${className}`}
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Drawer'}
      >
        {(title || showCloseButton || headerActions) && (
          <div className={styles.header}>
            {title && (
              <div className={styles.title}>
                {typeof title === 'string' ? <h2>{title}</h2> : title}
              </div>
            )}

            <div className={styles.headerActions}>
              {headerActions}
              {showCloseButton && (
                <IconButton
                  icon="close"
                  variant="tertiary"
                  size="medium"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className={styles.closeButton}
                />
              )}
            </div>
          </div>
        )}

        <div className={styles.body}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

Drawer.displayName = 'Drawer';