import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant of the skeleton */
  variant?: SkeletonVariant;
  /** Size preset (only applies to circular variant) */
  size?: SkeletonSize;
  /** Custom width */
  width?: string | number;
  /** Custom height */
  height?: string | number;
  /** Whether to animate */
  animated?: boolean;
  /** Number of lines (for text variant) */
  lines?: number;
  /** Custom className */
  className?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      size = 'md',
      width,
      height,
      animated = true,
      lines = 1,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const skeletonStyle: React.CSSProperties = {
      ...style,
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    };

    // For text variant with multiple lines
    if (variant === 'text' && lines > 1) {
      return (
        <div
          data-ink-component="Skeleton"
          ref={ref}
          className={cn(styles.skeletonGroup, className)}
          {...props}
        >
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                styles.skeleton,
                styles[variant],
                animated && styles.animated,
                // Make last line shorter
                index === lines - 1 && styles.lastLine
              )}
              style={{
                ...skeletonStyle,
                width: index === lines - 1 && !width ? '80%' : skeletonStyle.width,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        data-ink-component="Skeleton"
        ref={ref}
        className={cn(
          styles.skeleton,
          styles[variant],
          variant === 'circular' && styles[size],
          animated && styles.animated,
          className
        )}
        style={skeletonStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'InkSkeleton';

export { Skeleton };
