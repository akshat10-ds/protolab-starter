import './1-tokens/tokens.css';
/** ProtoLab public API. Generated consumers receive this source verbatim. */
export * from './1-tokens';
export * from './2-utilities';
export * from './3-primitives';
export * from './4-composites';
export * from './5-patterns';
export * from './6-layouts';
export * from './motion';

// Compatibility constants from the established public source API.
// Icon names for easy reference
export const ICON_NAMES = [
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'arrow-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'chevron-down',
  'chevrons-up-down',
  'menu',
  'close',
  'x',
  'add',
  'plus',
  'edit',
  'delete',
  'trash',
  'trash-2',
  'save',
  'search',
  'filter',
  'refresh',
  'download',
  'upload',
  'share',
  'check',
  'check-circle',
  'error',
  'warning',
  'info',
  'help',
  'star',
  'star-filled',
  'heart',
  'heart-filled',
  'user',
  'users',
  'settings',
  'home',
  'document',
  'file',
  'file-text',
  'folder',
  'calendar',
  'clock',
  'bell',
  'mail',
  'more-horizontal',
  'more-vertical',
  'expand',
  'collapse',
  'external-link',
  'copy',
  'paste',
  'eye',
  'eye-off',
  'lock',
  'minus',
  'image',
  'video',
  'music',
  'presentation',
  'table',
  'database',
] as const;

// Typography constants
export const TEXT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const TEXT_WEIGHTS = ['light', 'regular', 'medium', 'semibold', 'bold'] as const;
export const TEXT_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'error',
  'inherit',
] as const;
export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
