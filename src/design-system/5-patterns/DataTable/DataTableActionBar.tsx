import React from 'react';
import styles from './DataTableActionBar.module.css';
import { Button } from '../../3-primitives/Button';
import { Icon } from '../../3-primitives/Icon';
import type { DataTableActionBarProps } from './types';

/**
 * DataTableActionBar - Selection action bar
 *
 * Shows when rows are selected with count and configurable actions.
 * Animates in/out matching production behavior.
 */
export function DataTableActionBar({
  selectedCount,
  actions,
  customContent,
  visible,
  selectedRows,
}: DataTableActionBarProps) {
  const barClasses = [styles.actionBar, visible ? styles.visible : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={barClasses} role="toolbar" aria-label="Selection actions">
      {/* Selection count */}
      <span className={styles.count}>
        {selectedCount} Selected
      </span>

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.id}
              kind={action.variant || 'secondary'}
              size="small"
              onClick={() => action.onClick(selectedRows)}
              disabled={action.disabled}
              startElement={action.icon ? <Icon name={action.icon} size="small" /> : undefined}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Custom content */}
      {customContent && (
        <div className={styles.customContent}>
          {customContent}
        </div>
      )}
    </div>
  );
}

DataTableActionBar.displayName = 'DataTableActionBar';
