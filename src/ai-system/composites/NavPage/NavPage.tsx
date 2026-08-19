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
  searchPlaceholder?: string;
}

export function NavPage({
  title,
  subtitle,
  items,
  onSend,
  onPreview,
  searchPlaceholder = 'Search',
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
          <h2 className={styles.title}>{title}</h2>
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
            <ZeroQueryActions
              items={visible}
              onSend={onSend}
              onPreview={onPreview}
              appearance="card"
            />
          ) : (
            <p className={styles.empty}>Nothing matches “{query}”.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NavPage;
