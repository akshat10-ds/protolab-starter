/**
 * SuggestionChip — Single suggested action button
 *
 * A compact chip with a leading redirect arrow and label text, used for
 * quick-action suggestions. Displayed in a column below chat responses.
 *
 * Design: ecru-10 background, 4px radius, 16px forward icon, 14px text.
 * Figma ref: node 20574:43257
 *
 * The leading icon is Ink's `suggestion-arrow` — the Figma-exact redirect
 * arrow. A consuming app's vendored Ink must carry that glyph (the 2026-07
 * snapshots had dropped it; it has been restored to all lab prototypes and
 * must ship in the starter's Ink).
 */

import { Icon } from '@ink';
import styles from './SuggestionChip.module.css';

// =============================================================================
// Types
// =============================================================================

export interface SuggestionChipProps {
  label: string;
  /** Override the default leading icon. Defaults to 'suggestion-arrow' (the perfected redirect arrow from Figma). */
  icon?: string;
  onClick: () => void;
  /** @deprecated Single variant only — this prop is ignored. */
  variant?: 'default' | 'outlined';
}

// =============================================================================
// Component
// =============================================================================

export function SuggestionChip({
  label,
  icon = 'suggestion-arrow',
  onClick,
}: SuggestionChipProps) {
  return (
    <button
      type="button"
      className={styles.chip}
      onClick={onClick}
    >
      <span className={styles.chipIcon}>
        <Icon name={icon as any} size={16} />
      </span>
      <span className={styles.chipLabel}>{label}</span>
    </button>
  );
}
