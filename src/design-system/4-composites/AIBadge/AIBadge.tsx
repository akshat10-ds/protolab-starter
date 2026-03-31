/**
 * AIBadge Component
 *
 * AI denotation badge with Iris icon, used to indicate AI-assisted features.
 * Supports hover state and optional info callout on click.
 * Based on Figma design: node-id=19467-181071
 *
 * @layer 4-composites
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Callout } from '../Callout';
import { Link } from '../../3-primitives';
import styles from './AIBadge.module.css';

// Iris Icon SVG Component - exact paths from Figma
// Exported for use in other components (e.g., Banner promo variant)
export const IrisIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Corner petals - light purple */}
    <path
      d="M5.39143 3.21709C4.66395 2.31986 3.57272 1.87528 1.73785 1.50346C1.72168 1.50346 1.7136 1.50346 1.69743 1.50346C1.64085 1.50346 1.58427 1.52771 1.54385 1.57621C1.50344 1.62471 1.48727 1.68129 1.50344 1.73787C1.87526 3.57274 2.32792 4.67205 3.21706 5.39145C4.13046 4.80946 4.81753 4.1224 5.39951 3.209L5.39143 3.21709Z"
      fill="#CBC2FF"
    />
    <path
      d="M10.7906 5.39146C11.6878 4.66398 12.1324 3.57275 12.5042 1.73788C12.5204 1.6813 12.5042 1.61663 12.4638 1.56813C12.4234 1.51963 12.3668 1.49538 12.3102 1.49538C12.2941 1.49538 12.286 1.49538 12.2698 1.49538C10.435 1.86721 9.33564 2.31986 8.60816 3.20901C9.19015 4.12241 9.87721 4.80947 10.7906 5.39146Z"
      fill="#CBC2FF"
    />
    <path
      d="M3.21706 8.60854C2.31984 9.33602 1.87526 10.4272 1.50344 12.2621C1.48727 12.3187 1.50344 12.3834 1.54385 12.4319C1.59235 12.4884 1.6651 12.5208 1.73785 12.5046C3.57272 12.1328 4.67203 11.6801 5.39143 10.791C4.80944 9.87759 4.12238 9.19053 3.20898 8.60854H3.21706Z"
      fill="#CBC2FF"
    />
    <path
      d="M8.60854 10.791C9.33602 11.6882 10.4272 12.1328 12.2621 12.5046C12.3349 12.5208 12.4076 12.4884 12.4561 12.4319C12.4965 12.3834 12.5127 12.3268 12.4965 12.2621C12.1247 10.4272 11.6721 9.32794 10.7829 8.60854C9.86951 9.19053 9.18245 9.87759 8.60046 10.791H8.60854Z"
      fill="#CBC2FF"
    />
    {/* Center star with gradient */}
    <path
      d="M13.6197 6.45843C12.4638 6.03003 11.607 5.63395 10.9199 5.18938C10.0308 4.62356 9.38414 3.97691 8.81832 3.08776C8.38183 2.4007 7.97768 1.5358 7.54927 0.387994C7.46844 0.153583 7.25019 0.00808674 7.0077 0.00808674C6.76521 0.00808674 6.54696 0.153583 6.46613 0.387994C6.03772 1.54388 5.64165 2.4007 5.19708 3.08776C4.63126 3.97691 3.97652 4.62356 3.08738 5.18938C2.40031 5.62587 1.53541 6.03003 0.387608 6.45843C0.153197 6.53926 0.00770082 6.75751 0.00770082 7C0.00770082 7.2425 0.153197 7.46074 0.387608 7.54157C1.5435 7.9619 2.40031 8.36605 3.08738 8.81063C3.97652 9.37645 4.62317 10.0231 5.19708 10.9122C5.63357 11.6074 6.03772 12.4642 6.46613 13.612C6.55504 13.8464 6.76521 13.9919 7.0077 13.9919C7.25019 13.9919 7.46844 13.8383 7.54927 13.612C7.97768 12.4561 8.37375 11.5993 8.81832 10.9122C9.38414 10.0231 10.0308 9.37645 10.9199 8.81063C11.6151 8.37414 12.4719 7.96998 13.6197 7.54157C13.8541 7.45266 13.9996 7.2425 13.9996 7C13.9996 6.75751 13.846 6.53926 13.6197 6.45843ZM10.1116 7.08892C8.31717 7.72749 7.7271 8.31756 7.08853 10.112C7.0562 10.1928 6.93495 10.1928 6.9107 10.112C6.27213 8.31756 5.68207 7.72749 3.88761 7.08892C3.80678 7.05659 3.80678 6.93534 3.88761 6.91109C5.68207 6.27252 6.27213 5.68245 6.9107 3.88799C6.94304 3.79908 7.06428 3.79908 7.08853 3.88799C7.7271 5.68245 8.31717 6.27252 10.1116 6.91109C10.1925 6.94342 10.1925 7.06467 10.1116 7.08892Z"
      fill="url(#irisGradient)"
    />
    <defs>
      <linearGradient
        id="irisGradient"
        x1="0.0306558"
        y1="7"
        x2="14.028"
        y2="7"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#D9155D" />
        <stop offset="0.501049" stopColor="#A02AAC" />
        <stop offset="1" stopColor="#4C06FF" />
      </linearGradient>
    </defs>
  </svg>
);

// Default callout content
const DefaultInfoContent: React.FC = () => (
  <>
    Docusign Iris provides this service. Learn more about how we use{' '}
    <Link href="https://www.docusign.com/trust/privacy/artificial-intelligence" target="_blank">
      AI at Docusign
    </Link>
    .
  </>
);

export interface AIBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge text - defaults to "AI-Assisted" */
  children?: React.ReactNode;
  /** Info content to show in callout when clicked. Set to false to disable callout. */
  infoContent?: React.ReactNode | false;
  /** Title for the info callout */
  infoTitle?: string;
  /** Position of the callout */
  calloutPosition?: 'top' | 'bottom';
  /** Whether the callout is open (controlled mode) */
  open?: boolean;
  /** Callback when callout open state changes */
  onOpenChange?: (open: boolean) => void;
}

export const AIBadge: React.FC<AIBadgeProps> = ({
  children = 'AI-Assisted',
  className,
  infoContent,
  infoTitle = 'AI-assisted',
  calloutPosition = 'bottom',
  open: controlledOpen,
  onOpenChange,
  onClick,
  ...props
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const badgeRef = useRef<HTMLSpanElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);

  // Default to showing callout unless explicitly disabled with false
  const hasCallout = infoContent !== false;
  const calloutContent =
    infoContent === undefined || infoContent === true ? <DefaultInfoContent /> : infoContent;

  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (hasCallout) {
        e.stopPropagation();
        setOpen(!isOpen);
      }
      onClick?.(e);
    },
    [hasCallout, isOpen, setOpen, onClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (hasCallout && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    },
    [hasCallout, isOpen, setOpen]
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen || !hasCallout) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        badgeRef.current &&
        calloutRef.current &&
        !badgeRef.current.contains(e.target as Node) &&
        !calloutRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, hasCallout, setOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen || !hasCallout) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, hasCallout, setOpen]);

  const badgeClasses = [
    styles.badge,
    hasCallout && styles.interactive,
    isOpen && styles.active,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span data-ink-component="AIBadge" className={styles.container}>
      <span
        ref={badgeRef}
        className={badgeClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={hasCallout ? 'button' : undefined}
        tabIndex={hasCallout ? 0 : undefined}
        aria-expanded={hasCallout ? isOpen : undefined}
        aria-haspopup={hasCallout ? 'dialog' : undefined}
        {...props}
      >
        <IrisIcon className={styles.icon} />
        <span className={styles.text}>{children}</span>
      </span>

      {hasCallout && isOpen && (
        <div ref={calloutRef} className={styles.calloutWrapper}>
          <Callout heading={infoTitle} width="medium" onClose={() => setOpen(false)}>
            {calloutContent}
          </Callout>
        </div>
      )}
    </span>
  );
};

AIBadge.displayName = 'AIBadge';
