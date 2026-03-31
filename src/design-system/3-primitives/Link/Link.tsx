import React, { forwardRef } from 'react';
import styles from './Link.module.css';
import { Icon } from '../Icon';

export type LinkKind = 'default' | 'subtle';
export type LinkSize = 'xs' | 'small' | 'medium';

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  /** Link text or content */
  children: React.ReactNode;
  /** URL to navigate to */
  href?: string;
  /** Link kind/variant */
  kind?: LinkKind;
  /** Link size */
  size?: LinkSize;
  /** Discrete mode - only show underline on hover/active */
  discrete?: boolean;
  /** Whether to show external link icon */
  external?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      children,
      href = '#',
      kind = 'default',
      size = 'medium',
      discrete = false,
      external = false,
      disabled = false,
      className,
      target,
      rel,
      onClick,
      ...props
    },
    ref
  ) => {
    const linkClasses = [
      styles.link,
      styles[`kind-${kind}`],
      styles[`size-${size}`],
      discrete && styles.discrete,
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // If external prop is true and target is not specified, set target to _blank
    const linkTarget = external && !target ? '_blank' : target;

    // If target is _blank, add rel="noopener noreferrer" for security
    const linkRel = linkTarget === '_blank' ? 'noopener noreferrer' : rel;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <a
        data-ink-component="Link"
        data-ink-prop-kind={kind}
        ref={ref}
        href={href}
        className={linkClasses}
        target={linkTarget}
        rel={linkRel}
        aria-disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
        {external && <Icon name="external-link" size="small" />}
      </a>
    );
  }
);

Link.displayName = 'Link';
