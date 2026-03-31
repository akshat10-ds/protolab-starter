import React from 'react';
import styles from './PageHeader.module.css';
import { Heading } from '../../3-primitives/Typography';
import { AIBadge } from '../../4-composites/AIBadge';
import { Inline } from '../../2-utilities/Inline';

export interface PageHeaderProps {
  /** Page title (H1) */
  title: string;
  /** Show AIBadge next to title (defaults to true) */
  showAIBadge?: boolean;
  /** Custom AIBadge text (defaults to "AI-Assisted") */
  aiBadgeText?: string;
  /** Optional action buttons on the right */
  actions?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * PageHeader - Page title with optional AI badge and actions
 *
 * Layer 5: Patterns
 *
 * DocuSign Layout Rules:
 * - Title: 32px, weight 400 (--ink-font-heading-m)
 * - AIBadge: Inline with title, 12px gap
 * - Actions: Right-aligned, 8px gap between buttons (secondary kind recommended)
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Completed"
 *   showAIBadge
 *   actions={
 *     <>
 *       <IconButton icon="settings" variant="tertiary" />
 *       <Button kind="secondary" startElement={<Icon name="plus" />}>
 *         New
 *       </Button>
 *     </>
 *   }
 * />
 * ```
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showAIBadge = false,
  aiBadgeText,
  actions,
  className,
}) => {
  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <header data-ink-component="PageHeader" className={containerClasses}>
      <Inline justify="between" align="center" gap="medium">
        {/* Left section: Title + AIBadge */}
        <div className={styles.titleSection}>
          <Heading level={1} className={styles.title}>
            {title}
          </Heading>
          {showAIBadge && (
            <AIBadge>
              {aiBadgeText}
            </AIBadge>
          )}
        </div>

        {/* Right section: Actions */}
        {actions && (
          <Inline gap="small" align="center">
            {actions}
          </Inline>
        )}
      </Inline>
    </header>
  );
};

PageHeader.displayName = 'PageHeader';
