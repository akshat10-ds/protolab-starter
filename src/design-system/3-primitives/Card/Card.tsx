import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Background variant - light (white), dark (purple), or secondary (gray) */
  variant?: 'light' | 'dark' | 'secondary';
  /** Disabled state - reduces opacity to 0.2 */
  disabled?: boolean;
  /** Remove all padding from header, body, and footer */
  noPadding?: boolean;
  /** Border radius size */
  radius?: 'small' | 'medium' | 'large';
  /** Image position when Card.Image is used - start (left side) or top (above content) */
  imagePosition?: 'start' | 'top';
}

export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className, ...props }) => {
  return (
    <div className={`${styles.header} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({ children, className, ...props }) => {
  return (
    <div className={`${styles.body} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, className, ...props }) => {
  return (
    <div className={`${styles.footer} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardImage: React.FC<CardImageProps> = ({ src, alt, className, ...props }) => {
  return (
    <div className={`${styles.image} ${className || ''}`} {...props}>
      <img src={src} alt={alt} />
    </div>
  );
};

export const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Image: typeof CardImage;
} = ({
  children,
  variant = 'light',
  disabled = false,
  noPadding = false,
  radius,
  imagePosition = 'top',
  className,
  ...props
}) => {
  // Check if Card.Image is used to apply imagePosition class
  const hasImage = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === CardImage
  );

  const cardClasses = [
    styles.card,
    styles[variant],
    disabled && styles.disabled,
    noPadding && styles.noPadding,
    radius && styles[`radius-${radius}`],
    hasImage && (imagePosition === 'start' ? styles.imageStart : styles.imageTop),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Separate Card.Image from other children and wrap non-image children in content div
  if (hasImage) {
    const imageChild = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === CardImage
    );
    const otherChildren = React.Children.toArray(children).filter(
      (child) => !(React.isValidElement(child) && child.type === CardImage)
    );

    return (
      <div data-ink-component="Card" className={cardClasses} {...props}>
        {imagePosition === 'top' && imageChild}
        <div className={styles.content}>{otherChildren}</div>
        {imagePosition === 'start' && imageChild}
      </div>
    );
  }

  return (
    <div data-ink-component="Card" className={cardClasses} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Image = CardImage;
Card.displayName = 'Card';
