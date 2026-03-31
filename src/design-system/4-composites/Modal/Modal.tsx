import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { IconButton } from '../../3-primitives/IconButton';

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Callback when modal requests to close */
  onClose?: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (typically buttons) */
  footer?: React.ReactNode;
  /** Modal size variant */
  size?: ModalSize;
  /** Whether clicking backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing ESC closes the modal */
  closeOnEscape?: boolean;
  /** Custom className for the modal content */
  className?: string;
  /** Data QA attribute for testing */
  'data-qa'?: string;
  /** When true, modal is positioned within its parent container instead of viewport */
  contained?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  'data-qa': dataQa,
  contained = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key
  useEffect(() => {
    if (!open || !closeOnEscape || !onClose) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      previousActiveElement.current?.focus();
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  if (!open) return null;

  const overlayClasses = [styles.overlay, contained && styles.contained].filter(Boolean).join(' ');

  const modalContent = (
    <div data-ink-component="Modal" data-ink-prop-size={size} className={overlayClasses} onClick={handleBackdropClick} data-qa={dataQa}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles[size]} ${className || ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {title && (
          <div className={styles.header}>
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
            {onClose && (
              <IconButton
                icon="close"
                variant="tertiary"
                size="medium"
                onClick={onClose}
                aria-label="Close modal"
                className={styles.closeButton}
              />
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );

  // When contained, render in place. Otherwise, use portal to escape stacking contexts.
  if (contained) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';
