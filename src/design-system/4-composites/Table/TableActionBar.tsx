import React from 'react';
import styles from './Table.module.css';
import { Button } from '../../3-primitives/Button';
import { Icon } from '../../3-primitives/Icon';
import type { TableActionBarProps } from './types';

/**
 * TableActionBar - Selection action bar that appears above the table when rows are selected
 *
 * Shows a count of selected items and configurable action buttons.
 * Animates in/out based on the visible prop.
 */
export function TableActionBar({
  selectedCount,
  actions,
  customContent,
  visible,
  selectedRows,
}: TableActionBarProps) {
  const actionBarClasses = `
    ${styles.actionBar}
    ${visible ? styles.visible : ''}
  `.trim();

  return (
    <div className={actionBarClasses} aria-hidden={!visible}>
      {/* Selected count */}
      <span className={styles.actionBarCount}>
        {selectedCount} Selected
      </span>

      {/* Actions */}
      <div className={styles.actionBarActions}>
        {customContent ? (
          customContent
        ) : (
          actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              size="small"
              onClick={() => action.onClick(selectedRows)}
              disabled={action.disabled}
            >
              {action.icon && (
                <Icon name={action.icon} size="small" />
              )}
              {action.label}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}

TableActionBar.displayName = 'TableActionBar';
