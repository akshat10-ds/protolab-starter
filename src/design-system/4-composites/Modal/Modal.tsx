import React, { useEffect, useRef, useId } from 'react';
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
  title?: React.ReactNode;
  'aria-label'?: string;
  image?: React.ReactNode;
  imagePosition?: 'top' | 'start' | 'end';
  statusBadge?: React.ReactNode;
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
  image,
  imagePosition = 'top',
  statusBadge,
  'aria-label': ariaLabel,
  children,
  footer,
  size = 'medium',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  'data-qa': dataQa,
  contained = false,
}) => {
  const titleId = useId();
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

  // Preserve the caller's scroll state and return focus to the opener on cleanup.
  useEffect(() => {
    if (!open) return;
    previousActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousActiveElement.current?.focus();
    };
  }, [open]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
    ) ?? []).filter(node => !node.closest('[hidden]'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === modalRef.current)) {
      event.preventDefault(); first.focus();
    }
  };

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
        className={`${styles.modal} ${styles[size]} ${image ? styles[`image-${imagePosition}`] : ''} ${className || ''}`}
        onKeyDown={trapFocus}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {image && <div className={styles.image}>{image}</div>}
        <div className={styles.content}>
        {title && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {statusBadge}
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
    </div>
  );

  // When contained, render in place. Otherwise, use portal to escape stacking contexts.
  if (contained) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';
