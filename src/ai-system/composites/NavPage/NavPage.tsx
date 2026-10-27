/**
 * NavPage — a titled list page inside the panel, in place of the conversation.
 *
 * Title, subtitle, a search box, then the rows. `IrisAgent.navPageSlot` renders
 * it where the chat stream would be. The composer stays — the page replaces the
 * conversation, not the input.
 *
 * **One layout, two pages.** Figma draws Agents and Prompt Library as separate
 * frames, but node for node they are the same frame with different words in it.
 * Two components here would be one component copied.
 *
 * **The row still explains itself in the composer.** Every description node in
 * frame 94:13551 is `visible=false`; the row is one line, and hovering it
 * previews its query into the input below — the same `onPreview` the cold state
 * uses. Akshat: "we also want to keep the input below so you can hover the items
 * and see the preview in the input." That is why the composer had to come back.
 */

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SearchInput } from '@ink';

import { ZeroQueryActions } from '@ai/composites/ZeroQueryActions/ZeroQueryActions';
import type {
  ZeroQueryActionItem,
  ZeroQueryPreview,
} from '@ai/composites/ZeroQueryActions/ZeroQueryActions';

import styles from './NavPage.module.css';

export interface NavPageProps {
  /** The page's name — "Agents", "Prompt Library". */
  title: string;
  /** One line under it, saying what the page is for. */
  subtitle?: string;
  /** The rows. Same items the cold state takes. */
  items: ZeroQueryActionItem[];
  /**
   * Called with the row's query — its `description`, or its label when it has
   * no description — when the row carries no `onClick` of its own. This is the
   * same string `onPreview` showed, never a shorter one.
   */
  onSend: (query: string) => void;
  /**
   * The row under the pointer wants itself previewed in the composer — a
   * prompt's query, or an agent's chip and job. Comes from `IrisAgent`'s
   * `navPageSlot` render prop; omit it and the rows are mute.
   */
  onPreview?: (preview: ZeroQueryPreview | null) => void;
  /**
   * An `agent` row was clicked — commit the token the hover showed into the
   * composer. Comes from `IrisAgent`'s `navPageSlot` context as `attach`; omit
   * it and an agent row does nothing, which is `ZeroQueryActions`' own rule.
   */
  onAttach?: (preview: ZeroQueryPreview) => void;
  searchPlaceholder?: string;
  /**
   * A control beside the page's title — "New prompt". A node, not a
   * `{label, icon}` shape, because the glyph has to come from the CONSUMER's
   * Ink. `@ink` inside this file resolves to whichever snapshot the prototype
   * vendored, and an icon a snapshot does not carry renders nothing at all —
   * the same reason `ZeroQueryActions` keeps its per-kind defaults
   * conservative. The page owns the slot; the host owns what sits in it.
   */
  headerAction?: ReactNode;
  /**
   * A trailing control on each row — an edit pencil, say — revealed on hover
   * and on keyboard focus.
   *
   * It is an OVERLAY, not a column: the row is `ZeroQueryActions`' own button
   * and a button cannot nest, so the control is a sibling laid over the row's
   * right edge. That also settles the layout question — nothing appears in
   * flow, so nothing moves when the pointer arrives, and the row's own click
   * still sends or previews exactly as it did.
   *
   * Revealed by `:hover` AND `:focus-within`, and it stays in the tab order at
   * rest, so the keyboard reaches it in the same order the eye does. Hovering
   * the control itself does drop the row's tint — the pointer has left the row
   * button — which is honest about which target is under it.
   *
   * `index` is the item's place in `items`, not in the filtered view, so a
   * search does not renumber what the host is editing.
   */
  rowAction?: (item: ZeroQueryActionItem, index: number) => ReactNode;
}

export function NavPage({
  title,
  subtitle,
  items,
  onSend,
  onPreview,
  onAttach,
  searchPlaceholder = 'Search',
  headerAction,
  rowAction,
}: NavPageProps) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className={styles.page}>
      {/*
        Bottom-anchored, against the composer — `primaryAxisAlignItems: MAX` in
        the frame's `Actions` container, and the same anchoring the cold state
        uses. Back is not here: the frame puts it in the header, left of the
        hamburger, and `IrisAgent` draws it there.
      */}
      <div className={styles.column}>
        <div className={styles.heading}>
          <div className={styles.headingRow}>
            <h2 className={styles.title}>{title}</h2>
            {headerAction}
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.body}>
          <SearchInput
            size="small"
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            aria-label={`Search ${title}`}
          />

          {visible.length > 0 ? (
            rowAction ? (
              /*
                One row per stack, so the action can be laid over it. The gap
                moves up here — `.listCard`'s own 4px has nothing left to space
                — and every other row property stays where it was written.
              */
              <div className={styles.rows}>
                {visible.map((item) => (
                  <div key={item.label} className={styles.rowWrap}>
                    <ZeroQueryActions
                      items={[item]}
                      onSend={onSend}
                      onAttach={onAttach}
                      onPreview={onPreview}
                      appearance="card"
                    />
                    <span className={styles.rowAction}>
                      {rowAction(item, items.indexOf(item))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <ZeroQueryActions
                items={visible}
                onSend={onSend}
                onAttach={onAttach}
                onPreview={onPreview}
                appearance="card"
              />
            )
          ) : (
            <p className={styles.empty}>Nothing matches “{query}”.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NavPage;
