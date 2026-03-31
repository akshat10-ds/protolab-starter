import React from 'react';
import styles from './Icon.module.css';

export type AIIconName = 'ai-iris' | 'ai-iris-filled' | 'ai-spark' | 'ai-spark-filled';

export type AIIconSize = 'small' | 'medium' | number;

export interface AIIconProps {
  /** Name of the AI icon to display */
  name: AIIconName;
  /** Size of the icon: small (16px), medium (24px), or custom number */
  size?: AIIconSize;
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for the icon */
  'aria-label'?: string;
  /** Whether the icon is decorative (hidden from screen readers) */
  'aria-hidden'?: boolean;
}

const sizeMap: Record<string, number> = {
  small: 16,
  medium: 24,
};

/**
 * Exact SVG path from Figma AI_sparkFilled icon
 * Source: Figma node 31266-45550
 * ViewBox: 0 0 12 12
 */
const AI_SPARK_FILLED_PATH = 'M11.6809 5.53526C10.689 5.16763 9.95376 4.82775 9.36416 4.44624C8.60116 3.96069 8.04624 3.40578 7.56069 2.64277C7.18613 2.05318 6.83931 1.31098 6.47168 0.326012C6.40231 0.124856 6.21503 0 6.00694 0C5.79884 0 5.61156 0.124856 5.5422 0.326012C5.17457 1.31792 4.83468 2.05318 4.45318 2.64277C3.96763 3.40578 3.40578 3.96069 2.64277 4.44624C2.05318 4.82081 1.31098 5.16763 0.326012 5.53526C0.124856 5.60462 0 5.79191 0 6C0 6.20809 0.124856 6.39538 0.326012 6.46474C1.31792 6.82543 2.05318 7.17225 2.64277 7.55376C3.40578 8.03931 3.96069 8.59422 4.45318 9.35723C4.82775 9.95376 5.17457 10.689 5.5422 11.674C5.6185 11.8751 5.79884 12 6.00694 12C6.21503 12 6.40231 11.8682 6.47168 11.674C6.83931 10.6821 7.17919 9.94682 7.56069 9.35723C8.04624 8.59422 8.60116 8.03931 9.36416 7.55376C9.96069 7.17919 10.696 6.83237 11.6809 6.46474C11.8821 6.38844 12.0069 6.20809 12.0069 6C12.0069 5.79191 11.8751 5.60462 11.6809 5.53526Z';

// Gradient colors from Figma
const GRADIENT_COLORS = {
  start: '#D9155D',      // Magenta (0%)
  middle: '#A02AAC',     // Purple (50.1%)
  end: '#4C06FF',        // Blue-violet (89.5%)
};

/**
 * AIIcon component - DocuSign Iris AI branding icons with gradient fill
 *
 * Uses the exact SVG from Figma with the official DocuSign Iris gradient:
 * - Magenta (#D9155D) → Purple (#A02AAC) → Blue-violet (#4C06FF)
 *
 * @example
 * ```tsx
 * <AIIcon name="ai-spark-filled" size="small" />
 * <AIIcon name="ai-spark-filled" size={14} />
 * ```
 */
export const AIIcon: React.FC<AIIconProps> = ({
  name,
  size = 'medium',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  // Generate unique gradient ID for this instance
  const gradientId = `ai-gradient-${React.useId().replace(/:/g, '')}`;

  const classes = [styles.aiIcon, className].filter(Boolean).join(' ');

  // All variants use the exact Figma path (12x12 viewBox)
  return (
    <svg
      data-ink-component="AIIcon"
      className={classes}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? !ariaLabel}
      role={ariaLabel ? 'img' : 'presentation'}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0.0196984"
          y1="6"
          x2="12.0313"
          y2="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={GRADIENT_COLORS.start} />
          <stop offset="0.501049" stopColor={GRADIENT_COLORS.middle} />
          <stop offset="0.895" stopColor={GRADIENT_COLORS.end} />
        </linearGradient>
      </defs>
      <path d={AI_SPARK_FILLED_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
};

AIIcon.displayName = 'AIIcon';
