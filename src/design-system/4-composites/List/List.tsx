import React from 'react';
import styles from './List.module.css';

export type ListVariant = 'default' | 'bordered' | 'divided';
export type ListSize = 'small' | 'medium' | 'large';
export type ListItemAlign = 'top' | 'center' | 'bottom';

// List Item Props
export interface ListItemProps {
  /** Primary content */
  children: React.ReactNode;
  /** Secondary text/description */
  description?: React.ReactNode;
  /** Meta text (shown on the right) */
  meta?: React.ReactNode;
  /** Start element (icon, avatar, etc.) */
  startElement?: React.ReactNode;
  /** End element (action, badge, etc.) */
  endElement?: React.ReactNode;
  /** Whether the item is clickable */
  clickable?: boolean;
  /** Whether the item is selected */
  selected?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Alignment of content */
  align?: ListItemAlign;
  /** Additional className */
  className?: string;
}

// List Props
export interface ListProps {
  /** List items */
  children: React.ReactNode;
  /** Visual variant */
  variant?: ListVariant;
  /** Size of list items */
  size?: ListSize;
  /** Whether list is ordered (numbered) */
  ordered?: boolean;
  /** Whether to show hover state on items */
  hoverable?: boolean;
  /** Additional className */
  className?: string;
  /** Role for accessibility */
  role?: string;
}

// List Item Component
export const ListItem: React.FC<ListItemProps> = ({
  children,
  description,
  meta,
  startElement,
  endElement,
  clickable = false,
  selected = false,
  disabled = false,
  onClick,
  align = 'center',
  className = '',
}) => {
  const Component = clickable ? 'button' : 'div';

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <Component
      className={`
        ${styles.item}
        ${styles[`align-${align}`]}
        ${clickable ? styles.clickable : ''}
        ${selected ? styles.selected : ''}
        ${disabled ? styles.disabled : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      disabled={disabled && clickable}
      type={clickable ? 'button' : undefined}
      role={clickable ? 'button' : undefined}
      aria-selected={selected ? true : undefined}
      aria-disabled={disabled ? true : undefined}
    >
      {startElement && (
        <div className={styles.startElement}>
          {startElement}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.primary}>
          {children}
        </div>
        {description && (
          <div className={styles.description}>
            {description}
          </div>
        )}
      </div>

      {meta && (
        <div className={styles.meta}>
          {meta}
        </div>
      )}

      {endElement && (
        <div className={styles.endElement}>
          {endElement}
        </div>
      )}
    </Component>
  );
};

// List Component
export const List: React.FC<ListProps> & {
  Item: typeof ListItem;
} = ({
  children,
  variant = 'default',
  size = 'medium',
  ordered = false,
  hoverable = false,
  className = '',
  role = 'list',
}) => {
  const Component = ordered ? 'ol' : 'ul';

  return (
    <Component
      data-ink-component="List"
      data-ink-prop-kind={variant}
      className={`
        ${styles.list}
        ${styles[variant]}
        ${styles[size]}
        ${hoverable ? styles.hoverable : ''}
        ${className}
      `.trim()}
      role={role}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          // If it's already a list item, wrap it in <li>
          if (child.type === ListItem || child.type === 'li') {
            return <li className={styles.listItemWrapper}>{child}</li>;
          }
          // For other elements, wrap them directly
          return <li className={styles.listItemWrapper}>{child}</li>;
        }
        // For text or other content, wrap in a basic list item
        return (
          <li className={styles.listItemWrapper}>
            <div className={styles.item}>{child}</div>
          </li>
        );
      })}
    </Component>
  );
};

// Attach Item component to List
List.Item = ListItem;

// Display names for dev tools
List.displayName = 'List';
ListItem.displayName = 'List.Item';