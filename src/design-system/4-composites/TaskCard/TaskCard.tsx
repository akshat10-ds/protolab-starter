import React from 'react';
import { Heading, Text } from '../../3-primitives/Typography';
import { IconButton } from '../../3-primitives/IconButton';
import { Button } from '../../3-primitives/Button';
import styles from './TaskCard.module.css';

export interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface TaskCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The heading text of the TaskCard */
  heading: string;
  /** Shows an icon in the upper end corner for contextual actions */
  showIcon?: boolean;
  /** Icon name to display (defaults to 'overflow-horizontal') */
  icon?: string;
  /** Callback when the icon button is clicked */
  onIconClick?: () => void;
  /** Accessible label for the icon button */
  iconAriaLabel?: string;
}

export interface TaskCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface TaskCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra content like metadata to display */
  metadata?: string;
  /** Show the extra content section */
  showMetadata?: boolean;
  /** Primary action button label */
  actionLabel?: string;
  /** Callback when the action button is clicked */
  onActionClick?: () => void;
  /** Custom content for the footer (overrides default structure) */
  children?: React.ReactNode;
}

export const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({
  heading,
  showIcon = false,
  icon = 'overflow-horizontal',
  onIconClick,
  iconAriaLabel = 'More options',
  className,
  ...props
}) => {
  return (
    <div className={`${styles.header} ${className || ''}`} {...props}>
      <Heading level={3} className={styles.heading}>
        {heading}
      </Heading>
      {showIcon && (
        <IconButton
          icon={icon}
          variant="tertiary"
          size="small"
          aria-label={iconAriaLabel}
          onClick={onIconClick}
        />
      )}
    </div>
  );
};

export const TaskCardBody: React.FC<TaskCardBodyProps> = ({ children, className, ...props }) => {
  return (
    <div className={`${styles.body} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const TaskCardFooter: React.FC<TaskCardFooterProps> = ({
  metadata,
  showMetadata = true,
  actionLabel = 'Button',
  onActionClick,
  children,
  className,
  ...props
}) => {
  // If children are provided, render them instead of default structure
  if (children) {
    return (
      <div className={`${styles.footer} ${className || ''}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${styles.footer} ${className || ''}`} {...props}>
      {showMetadata && metadata && (
        <Text size="small" className={styles.metadata}>
          {metadata}
        </Text>
      )}
      <Button kind="secondary" size="small" onClick={onActionClick}>
        {actionLabel}
      </Button>
    </div>
  );
};

export const TaskCard: React.FC<TaskCardProps> & {
  Header: typeof TaskCardHeader;
  Body: typeof TaskCardBody;
  Footer: typeof TaskCardFooter;
} = ({ children, className, ...props }) => {
  return (
    <div data-ink-component="TaskCard" className={`${styles.taskCard} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

TaskCard.Header = TaskCardHeader;
TaskCard.Body = TaskCardBody;
TaskCard.Footer = TaskCardFooter;
TaskCard.displayName = 'TaskCard';
