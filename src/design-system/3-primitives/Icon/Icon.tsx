import React from 'react';
import { iconPaths } from './iconPaths';
import styles from './Icon.module.css';

export type IconName = keyof typeof iconPaths;

export type IconSize = 'small' | 'medium' | number;

export interface IconProps {
  /** Name of the icon to display */
  name: IconName;
  /** Size of the icon: small (16px in 20x20 container), medium (24px in 24x24 container), or custom number */
  size?: IconSize;
  /** Color of the icon (defaults to currentColor) */
  color?: string;
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for the icon */
  'aria-label'?: string;
  /** Whether the icon is decorative (hidden from screen readers) */
  'aria-hidden'?: boolean;
  /** Additional props to pass to the SVG element */
  [key: string]: any;
}

const sizeMap: Record<string, number> = {
  small: 16,
  medium: 24,
};

/**
 * Icon component from the DocuSign Ink Design System
 *
 * @example
 * ```tsx
 * <Icon name="check" size="small" />
 * <Icon name="arrow-left" size="medium" />
 * <Icon name="status-warn" size={32} color="#0066FF" aria-label="Warning" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const iconData = iconPaths[name];

  if (!iconData) {
    console.warn(`Icon "${name}" not found in iconPaths`);
    return null;
  }

  const sizeValue = typeof size === 'number' ? size : sizeMap[size] || sizeMap.medium;
  const viewBox = iconData.viewBox || '0 0 24 24';

  return (
    <svg
      data-ink-component="Icon"
      data-ink-prop-name={name}
      data-ink-prop-size={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={sizeValue}
      height={sizeValue}
      fill={color}
      className={`${styles.icon} ${className || ''}`}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? !ariaLabel}
      focusable="false"
      role={ariaLabel ? 'img' : undefined}
      {...props}
    >
      <path d={iconData.path} />
    </svg>
  );
};

Icon.displayName = 'Icon';
