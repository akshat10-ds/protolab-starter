/**
 * Motion Guidelines System — TypeScript helpers
 */

export const motionCurves = {
  default: 'cubic-bezier(0.35, 0, 0.2, 1)',
  opacity: 'cubic-bezier(0.33, 0, 0.67, 1)',
  snap: 'cubic-bezier(0.8, 0, 0.65, 1)',
  spring: 'cubic-bezier(0.3, 1.7, 0.5, 1)',
} as const;

export const motionDurations = {
  quick: { fast: 100, default: 150, slow: 300 },
  medium: { fast: 300, default: 400, slow: 600 },
  long: { fast: 600, default: 1000, slow: 2000 },
  loader: { fast: 4000, default: 6000, slow: 8000 },
} as const;

export type MotionCurve = keyof typeof motionCurves;
export type MotionTier = keyof typeof motionDurations;

export function createTransition(
  property: string | string[],
  durationMs: number,
  curve: MotionCurve = 'default',
  delayMs: number = 0,
): string {
  const props = Array.isArray(property) ? property : [property];
  const delayStr = delayMs > 0 ? ` ${delayMs}ms` : '';
  return props
    .map((p) => `${p} ${durationMs}ms ${motionCurves[curve]}${delayStr}`)
    .join(', ');
}

export function staggerDelay(
  index: number,
  intervalMs: number = 30,
  baseDelayMs: number = 0,
): number {
  return baseDelayMs + index * intervalMs;
}

export const motionPresets = {
  hover: (property: string = 'opacity') =>
    createTransition(property, 200, 'opacity'),
  state: (property: string | string[] = 'all') =>
    createTransition(property, 300, 'default'),
  container: (property: string | string[] = ['transform', 'opacity']) =>
    createTransition(property, 400, 'default'),
  overlay: () =>
    createTransition('opacity', 300, 'opacity'),
  page: (property: string | string[] = ['transform', 'opacity']) =>
    createTransition(property, 600, 'default'),
} as const;
