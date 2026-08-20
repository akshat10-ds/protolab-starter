/**
 * TableRenderer — the `table` artifact, per frame 163:21261.
 *
 * A full-bleed Ink table in the dock's well. It has NO toolbar: the frame gives
 * the agreement one and gives the table none, which is the point of a
 * renderer-owned toolbar.
 *
 * PRESENTATIONAL. The host owns the columns and the rows. The renderer owns
 * only what the frame draws about them: which column sorts, and which rows are
 * ticked.
 *
 * WHY THIS IS NOT INK'S `Table`. Three reasons, in order of weight:
 *
 * 1. The frame's metrics are unreachable from outside Ink. `Table.module.css`
 *    sets its cell height and padding from `.table.medium .td`, and both class
 *    names are hashed by CSS modules — no selector written here can match them.
 *    The 50px header, the ~60px row and the 12px cell padding cannot be applied.
 * 2. `aria-sort` is required and Ink's `<th>` does not render it. Its sort
 *    target is a clickable `<th>` rather than a button, so it is not reachable
 *    from the keyboard either.
 * 3. Ink's `Table` holds column visibility and selection internally, which
 *    fights "the host owns the data".
 *
 * Ink's parts are still used where they are the right size: `Checkbox`,
 * `IconButton`, `Icon`.
 */

import React, { useMemo, useState } from 'react';
import { Checkbox, Icon, IconButton } from '@ink';
import { MarkdownRenderer } from '../../composites/MarkdownRenderer/MarkdownRenderer';
import dock from './ArtifactDock.module.css';
import styles from './TableRenderer.module.css';
import type {
  ArtifactRenderContext,
  ArtifactTable,
  ArtifactTableCell,
  ArtifactTableStatus,
} from './types';

// =============================================================================
// Sorting
// =============================================================================

/** What a cell sorts on when the row supplies no `sortValues` entry. */
function cellText(cell: ArtifactTableCell | undefined): string {
  if (!cell) return '';
  if (cell.kind === 'text') return cell.text;
  if (cell.kind === 'status') return cell.label;
  return cell.chips.join(' ');
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

// =============================================================================
// Cells
// =============================================================================

/**
 * Status is semantic, not decoration. `iconColorWarning` / `iconColorSuccess`
 * for the dot and `fontColorWarning` / `fontColorSuccess` for the label are the
 * Ink tokens that carry that meaning. Nothing here is painted to look like an
 * error: an expiring agreement is a state of the agreement, not a fault.
 */
const STATUS_CLASS: Record<ArtifactTableStatus, string> = {
  expiring: styles.statusExpiring,
  renewing: styles.statusRenewing,
  active: styles.statusActive,
  inactive: styles.statusInactive,
};

const Cell: React.FC<{ cell?: ArtifactTableCell }> = ({ cell }) => {
  if (!cell) return null;

  switch (cell.kind) {
    case 'chips':
      return (
        <span className={styles.chips}>
          {cell.chips.map((chip) => (
            <span key={chip} className={styles.chip}>
              {chip}
            </span>
          ))}
          {cell.more ? (
            <button type="button" className={styles.chipMore}>
              +{cell.more} More
            </button>
          ) : null}
        </span>
      );

    case 'status':
      return (
        <span className={`${styles.status} ${STATUS_CLASS[cell.state]}`}>
          <span className={styles.statusLine}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusLabel}>{cell.label}</span>
          </span>
          {cell.sub && <span className={styles.statusSub}>{cell.sub}</span>}
        </span>
      );

    // text — one line, or two when `sub` is set.
    default:
      return (
        <span className={styles.text}>
          <span className={styles.textMain}>{cell.text}</span>
          {cell.sub && (
            <span className={styles.textSub}>
              {cell.subIcon && <Icon name={cell.subIcon as any} size={16} />}
              {cell.sub}
            </span>
          )}
        </span>
      );
  }
};

// =============================================================================
// The table
// =============================================================================

const Grid: React.FC<{ table: ArtifactTable; ctx: ArtifactRenderContext }> = ({ table, ctx }) => {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const rows = useMemo(() => {
    if (!sort) return table.rows;
    const key = sort.key;
    const value = (row: (typeof table.rows)[number]) =>
      row.sortValues?.[key] ?? cellText(row.cells[key]);
    return [...table.rows].sort(
      (a, b) => compare(value(a), value(b)) * (sort.dir === 'asc' ? 1 : -1)
    );
  }, [table.rows, sort]);

  const allSelected = selected.size > 0 && selected.size === table.rows.length;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(table.rows.map((row) => row.id)));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {/* The frame's 25px leading gutter, before the checkbox. */}
          <th className={styles.gutter} />

          {table.selectable && (
            <th className={styles.tick} scope="col">
              <Checkbox
                label="Select all rows"
                hideLabel
                checked={allSelected}
                indeterminate={selected.size > 0 && !allSelected}
                onChange={toggleAll}
              />
            </th>
          )}

          {table.columns.map((column) => {
            /* `null` means "this column is not the sorted one". */
            const dir = sort && sort.key === column.key ? sort.dir : null;
            return (
              <th
                key={column.key}
                scope="col"
                /* One class for the header and the body cell, so the label sits
                   over its own column. `start` is the default and adds none. */
                className={column.align === 'end' ? styles.alignEnd : undefined}
                style={column.width ? { width: column.width } : undefined}
                aria-sort={
                  column.sortable
                    ? dir === 'asc'
                      ? 'ascending'
                      : dir === 'desc'
                        ? 'descending'
                        : 'none'
                    : undefined
                }
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => toggleSort(column.key)}
                  >
                    {column.label}
                    <Icon
                      name={
                        dir === 'asc' ? 'chevron-up' : dir === 'desc' ? 'chevron-down' : 'sort'
                      }
                      size={12}
                    />
                  </button>
                ) : (
                  column.label
                )}
              </th>
            );
          })}

          {table.rowActions && (
            <th className={styles.fields} scope="col">
              <IconButton
                icon="eye"
                size="small"
                variant="tertiary"
                onClick={() => ctx.onAction?.('fields', ctx.item)}
                aria-label="Show or hide fields"
              />
            </th>
          )}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          /*
            A row opens the agreement it names — Akshat, 2026-08-19: "clicking
            on any of these should open the agreement". The host decides what
            that means; the table only reports which row.

            `closest('button, a, input, label')` is the guard. A row carries a
            checkbox and an overflow button, and a click on either is about that
            control, not about the row. Without it, selecting a row would also
            navigate away from the table you were selecting in.

            `data-clickable` only when the host is listening — a pointer cursor
            over a row that does nothing is a lie.
          */
          <tr
            key={row.id}
            data-selected={selected.has(row.id) || undefined}
            data-clickable={ctx.onAction ? '' : undefined}
            onClick={
              ctx.onAction
                ? (e) => {
                    if ((e.target as HTMLElement).closest('button, a, input, label')) return;
                    ctx.onAction?.('row-open', ctx.item, row.id);
                  }
                : undefined
            }
          >
            <td className={styles.gutter} />

            {table.selectable && (
              <td className={styles.tick}>
                <Checkbox
                  label={`Select ${cellText(row.cells[table.columns[0].key])}`}
                  hideLabel
                  checked={selected.has(row.id)}
                  onChange={() => toggleRow(row.id)}
                />
              </td>
            )}

            {table.columns.map((column) => (
              <td
                key={column.key}
                className={column.align === 'end' ? styles.alignEnd : undefined}
              >
                <Cell cell={row.cells[column.key]} />
              </td>
            ))}

            {table.rowActions && (
              <td className={styles.fields}>
                <IconButton
                  icon="overflow-vertical"
                  size="small"
                  variant="tertiary"
                  onClick={() => ctx.onAction?.('row-menu', ctx.item, row.id)}
                  aria-label={`Actions for ${cellText(row.cells[table.columns[0].key])}`}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// =============================================================================
// The renderer
// =============================================================================

/**
 * No toolbar — the frame gives the table none.
 *
 * `data-flush` takes the well's padding off, because the frame runs the header
 * row and the column rules to both edges of the pane.
 */
export const TableRenderer = {
  Body: (ctx: ArtifactRenderContext) => (
    <div className={dock.well} data-flush>
      {ctx.item.table ? (
        <Grid table={ctx.item.table} ctx={ctx} />
      ) : (
        /* The markdown-table path. An artifact that carries only `content` still
           renders, which is what every artifact did before the model existed. */
        <div className={dock.markdownFallback}>
          <MarkdownRenderer content={ctx.item.content ?? ''} />
        </div>
      )}
    </div>
  ),
};

export default TableRenderer;
