import React from 'react';
import styles from './Callout.module.css';
import { Button, IconButton } from '../../3-primitives';

export type CalloutWidth = 'small' | 'medium' | 'large' | 'xlarge';
export type CalloutAlignment = 'start' | 'center' | 'end';
export type CalloutLocation = 'above' | 'below' | 'before' | 'after';
export type CalloutImagePosition = 'start' | 'top';
export type CalloutGlass = 'None' | 'glassFrost' | 'glassTint';

export interface CalloutAction {
  label: string;
  onClick: () => void;
}

export interface CalloutProps {
  /** Heading text */
  heading: string;
  /** Body content */
  children: React.ReactNode;
  /** Width variant: xlarge (640px), large (480px), medium (384px), small (320px) */
  width?: CalloutWidth;
  /** Arrow alignment position along edge */
  alignment?: CalloutAlignment;
  /** Caret/arrow location relative to trigger */
  location?: CalloutLocation;
  /** Image position (when image is provided) */
  imagePosition?: CalloutImagePosition;
  /** Glass effect: None, glassFrost, glassTint */
  glass?: CalloutGlass;
  /** Show action buttons footer (Figma: actions) */
  actions?: boolean;
  /** Primary action button */
  primaryAction?: CalloutAction;
  /** Secondary action button */
  secondaryAction?: CalloutAction;
  /** Show close button (Figma: closeButton) */
  closeButton?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Show arrow/caret pointing to trigger (Figma: enableArrow) */
  enableArrow?: boolean;
  /** Optional image */
  image?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  (
    {
      heading,
      children,
      width = 'large',
      alignment = 'start',
      location = 'above',
      imagePosition = 'start',
      glass = 'None',
      actions = false,
      primaryAction,
      secondaryAction,
      closeButton = true,
      onClose,
      enableArrow = true,
      image,
      className,
    },
    ref
  ) => {
    // Check if we're in glass mode
    const isGlass = glass !== 'None';
    // Map glass values to CSS class names
    const glassClassMap: Record<CalloutGlass, string> = {
      None: '',
      glassFrost: styles['glass-frost'],
      glassTint: styles['glass-tint'],
    };

    const containerClasses = [
      styles.container,
      styles[`width-${width}`],
      styles[`location-${location}`],
      styles[`align-${alignment}`],
      glass !== 'None' && styles[`container-${glass.toLowerCase()}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const calloutClasses = [styles.callout, glassClassMap[glass]].filter(Boolean).join(' ');

    return (
      <div data-ink-component="Callout" ref={ref} className={containerClasses}>
        {enableArrow && location === 'above' && <div className={styles.caret} />}
        {enableArrow && location === 'before' && <div className={styles.caretBefore} />}

        <div className={calloutClasses}>
          <div className={styles.content}>
            {image && <div className={styles.image}>{image}</div>}

            <div className={styles.body}>
              <div className={styles.header}>
                <h3 className={styles.heading}>{heading}</h3>
              </div>

              <div className={styles.text}>{children}</div>

              {actions && (primaryAction || secondaryAction) && (
                <div className={`${styles.footer} ${isGlass ? styles.footerGlass : ''}`}>
                  {secondaryAction && (
                    <Button
                      kind={isGlass ? 'secondary' : 'tertiary'}
                      size="medium"
                      onClick={secondaryAction.onClick}
                      className={isGlass ? styles.buttonGlassSecondary : undefined}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                  {primaryAction && (
                    <Button
                      kind={isGlass ? 'secondary' : 'primary'}
                      size="medium"
                      onClick={primaryAction.onClick}
                      className={isGlass ? styles.buttonGlassPrimary : undefined}
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {closeButton && (
              <IconButton
                icon="close"
                size="medium"
                kind="tertiary"
                onClick={onClose}
                aria-label="Close callout"
                className={`${styles.closeButtonWrapper} ${isGlass ? styles.closeButtonGlass : ''}`}
              />
            )}
          </div>
        </div>

        {enableArrow && location === 'below' && <div className={styles.caret} />}
        {enableArrow && location === 'after' && <div className={styles.caretAfter} />}
      </div>
    );
  }
);

Callout.displayName = 'Callout';
