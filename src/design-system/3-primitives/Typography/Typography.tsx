import React from 'react';
import styles from './Typography.module.css';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div' | 'label';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'error';
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  level = 1,
  as,
  className,
  ...props
}) => {
  const Component = as || (`h${level}` as 'h1');
  const headingClasses = [
    styles.heading,
    styles[`h${level}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component data-ink-component="Heading" data-ink-prop-level={level} className={headingClasses} {...props}>
      {children}
    </Component>
  );
};

export const Text: React.FC<TextProps> = ({
  children,
  as = 'p',
  size = 'md',
  weight = 'regular',
  color = 'primary',
  className,
  ...props
}) => {
  const Component = as;
  const textClasses = [
    styles.text,
    styles[`size-${size}`],
    styles[`weight-${weight}`],
    styles[`color-${color}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component data-ink-component="Text" data-ink-prop-size={size} className={textClasses} {...props}>
      {children}
    </Component>
  );
};

Heading.displayName = 'Heading';
Text.displayName = 'Text';
