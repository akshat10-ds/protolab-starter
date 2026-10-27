/** AI denotation badge. The historical Figma target remains unresolved; no fresh visual-match claim. */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Callout } from '../Callout';
import { Link } from '../../3-primitives';
import styles from './AIBadge.module.css';
import { AIIcon } from '../../3-primitives/Icon/AIIcon';

export const IrisIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 16 }) => <AIIcon name="ai-iris" size={size} className={className} aria-hidden />;
export const IrisIconInverse: React.FC<{ className?: string; size?: number }> = ({ className, size = 16 }) => <AIIcon name="ai-iris-inverse" size={size} className={className} aria-hidden />;
const DefaultInfoContent: React.FC = () => <>
  Docusign Iris provides this service. Learn more about how we use{' '}
  <Link href="https://www.docusign.com/trust/privacy/artificial-intelligence" target="_blank">AI at Docusign</Link>.
</>;

/** Span event attributes remain source-compatible; an interactive badge uses a native button. */
export interface AIBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  infoContent?: React.ReactNode | false;
  infoTitle?: string;
  calloutPosition?: 'top' | 'bottom';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export const AIBadge: React.FC<AIBadgeProps> = ({
  children = 'AI-Assisted', className, infoContent, infoTitle = 'AI-assisted', calloutPosition = 'bottom',
  open: controlledOpen, onOpenChange, onClick, onKeyDown, ...props
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const badgeRef = useRef<HTMLButtonElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const uid = React.useId(); const dialogId = `${uid}-info`; const titleId = `${uid}-title`;
  const hasCallout = infoContent !== false;
  const calloutContent = infoContent === undefined || infoContent === true ? <DefaultInfoContent /> : infoContent;
  const setOpen = useCallback((next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [isControlled, onOpenChange]);
  const closeAndRestoreFocus = useCallback(() => { setOpen(false); badgeRef.current?.focus(); }, [setOpen]);
  useEffect(() => {
    if (!isOpen || !hasCallout) return;
    calloutRef.current?.focus();
    const outside = (event: MouseEvent) => {
      if (!badgeRef.current?.contains(event.target as Node) && !calloutRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); closeAndRestoreFocus(); }
    };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [isOpen, hasCallout, setOpen, closeAndRestoreFocus]);
  const classes = [styles.badge, hasCallout && styles.interactive, hasCallout && isOpen && styles.active, className].filter(Boolean).join(' ');
  const content = <><IrisIcon className={styles.icon} /><span className={styles.text}>{children}</span></>;
  return (
    <div data-ink-component="AIBadge" className={styles.container}>
      {hasCallout ? <button {...props} ref={badgeRef} type="button" className={classes}
        aria-expanded={isOpen} aria-haspopup="dialog" aria-controls={isOpen ? dialogId : undefined}
        onClick={event => { onClick?.(event); if (!event.defaultPrevented) { event.stopPropagation(); setOpen(!isOpen); } }}
        onKeyDown={event => { onKeyDown?.(event); }}>
        {content}
      </button> : <span {...props} className={classes} onClick={onClick} onKeyDown={onKeyDown}>{content}</span>}
      {hasCallout && isOpen && <div ref={calloutRef} id={dialogId} role="dialog" aria-labelledby={titleId} tabIndex={-1}
        data-callout-position={calloutPosition} className={`${styles.calloutWrapper} ${styles[calloutPosition]}`}>
        <Callout heading={<span id={titleId}>{infoTitle}</span>} width="medium" location={calloutPosition === 'top' ? 'above' : 'below'} alignment="start" onClose={closeAndRestoreFocus}>
          {calloutContent}
        </Callout>
      </div>}
    </div>
  );
};
AIBadge.displayName = 'AIBadge';
