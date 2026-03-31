import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Accordion.module.css';
import { Icon, IconName } from '../../3-primitives/Icon';

export interface AccordionItemData {
  /** Unique identifier */
  id: string;
  /** Title/header text */
  title: string;
  /** Content to display when expanded */
  content: React.ReactNode;
  /** Icon name to display before title */
  startIcon?: IconName;
  /** Subtitle text below title */
  subtitle?: string;
  /** Metadata text displayed on the right */
  metadata?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Remove padding from content area */
  noPadding?: boolean;
}

export interface AccordionProps {
  /** Array of accordion items */
  items: AccordionItemData[];
  /** Allow multiple panels open at once */
  allowMultiple?: boolean;
  /** Default open items (controlled) */
  defaultOpenItems?: string[];
  /** Open items (controlled) */
  openItems?: string[];
  /** Callback when items change */
  onOpenItemsChange?: (openItems: string[]) => void;
  /** Additional className */
  className?: string;
  /** Show bordered variant (border-top separators) vs card variant (gap, radius, selected bg) */
  bordered?: boolean;
  /** Header height: compact (8px), default (12px), tall (20px) vertical padding */
  itemHeight?: 'compact' | 'default' | 'tall';
  /** Title display level for font size: xs (14px), s (18px), default (16px) */
  displayLevel?: 'xs' | 's';
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenItems = [],
  openItems: controlledOpenItems,
  onOpenItemsChange,
  className,
  bordered = true,
  itemHeight = 'default',
  displayLevel,
}) => {
  const [internalOpenItems, setInternalOpenItems] = React.useState<string[]>(defaultOpenItems);
  const isControlled = controlledOpenItems !== undefined;
  const openItems = isControlled ? controlledOpenItems : internalOpenItems;

  const toggleItem = (itemId: string) => {
    let newOpenItems: string[];

    if (openItems.includes(itemId)) {
      // Close the item
      newOpenItems = openItems.filter((id) => id !== itemId);
    } else {
      // Open the item
      if (allowMultiple) {
        newOpenItems = [...openItems, itemId];
      } else {
        newOpenItems = [itemId];
      }
    }

    if (!isControlled) {
      setInternalOpenItems(newOpenItems);
    }
    onOpenItemsChange?.(newOpenItems);
  };

  // Build accordion container classes
  const accordionClasses = cn(
    styles.accordion,
    bordered && styles.bordered,
    itemHeight === 'compact' && styles.compact,
    itemHeight === 'tall' && styles.tall,
    displayLevel === 'xs' && styles.displayLevelXs,
    displayLevel === 's' && styles.displayLevelS,
    className
  );

  return (
    <div data-ink-component="Accordion" className={accordionClasses}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);

        return (
          <div
            key={item.id}
            className={cn(
              styles.item,
              isOpen && styles.itemOpen,
              item.disabled && styles.itemDisabled
            )}
          >
            <button
              type="button"
              className={styles.header}
              onClick={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-header-${item.id}`}
            >
              {item.startIcon && (
                <span className={styles.startIcon}>
                  <Icon name={item.startIcon} size="medium" />
                </span>
              )}
              <div className={styles.titleWrapper}>
                <div className={styles.titleRow}>
                  <span className={styles.title}>{item.title}</span>
                </div>
                {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
              </div>
              {item.metadata && <span className={styles.metadata}>{item.metadata}</span>}
              <span className={cn(styles.chevron, isOpen && styles.chevronOpen)}>
                <Icon name="chevron-down" size="small" />
              </span>
            </button>

            <div
              id={`accordion-content-${item.id}`}
              className={cn(styles.panel, isOpen && styles.panelOpen)}
              aria-labelledby={`accordion-header-${item.id}`}
              role="region"
            >
              <div className={cn(styles.content, item.noPadding && styles.noPadding)}>
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

Accordion.displayName = 'InkAccordion';

export { Accordion };
