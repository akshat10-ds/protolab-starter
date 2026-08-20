/**
 * HeaderMenu — the hamburger's hover preview.
 *
 * A short popover under the menu button: the nav shortcuts, then the top few
 * conversations, then "See all". It is a *peek* at the sidebar, not the sidebar
 * — clicking the button still opens the real drawer, and "See all" does the
 * same from inside the menu.
 *
 * Figma frame 101:17656. 272 wide, radius 12, one divider between the two
 * sections, the conversations section titled and the shortcuts section not.
 *
 * **Both directions are delayed, for opposite reasons.** The agent switcher sits
 * immediately to the right, so the pointer crosses this button on the way there
 * — opening instantly would flash a menu at someone going somewhere else. And
 * the menu hangs below a 32px button while being 272 wide, so the trip down to
 * it leaves the button's column; closing instantly stranded people mid-reach.
 * The gap itself is bridged in CSS; this delay covers the diagonal.
 *
 * Not exported from the barrel — this is part of one header, not a piece
 * anything else composes.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@ink';

import type { ConversationGroup, NavShortcut } from '@ai/patterns/IrisSidebar/IrisSidebar';
import styles from './HeaderMenu.module.css';

type IconNameLike = React.ComponentProps<typeof Icon>['name'];

export interface HeaderMenuProps {
  /** The button the menu hangs from — rendered by the caller, wrapped by us. */
  children: React.ReactNode;
  navShortcuts: NavShortcut[];
  conversationGroups: ConversationGroup[];
  /** How many conversations to show before "See all". */
  maxConversations?: number;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  /** "See all" — hands off to the real sidebar. */
  onSeeAll: () => void;
  newChatLabel?: string;
}

/** Long enough to ignore a pointer passing through, short enough to feel free. */
const OPEN_DELAY_MS = 180;

/**
 * Grace period before closing.
 *
 * The gap between button and menu is bridged in CSS, but a fast diagonal can
 * still clip a corner and leave the subtree for a frame or two. Forgiving that
 * costs nothing — the menu is a peek, and closing it a beat late is invisible,
 * where closing it early is the whole complaint.
 */
const CLOSE_DELAY_MS = 220;

export function HeaderMenu({
  children,
  navShortcuts,
  conversationGroups,
  maxConversations = 5,
  onNewConversation,
  onSelectConversation,
  onSeeAll,
  newChatLabel = 'New chat',
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** One timer for both directions — an open cancels a pending close, and back. */
  const clearPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(() => {
    clearPending();
    timer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }, [clearPending]);

  const scheduleClose = useCallback(() => {
    clearPending();
    timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [clearPending]);

  /** Escape and item clicks close now, not in a beat. */
  const closeNow = useCallback(() => {
    clearPending();
    setOpen(false);
  }, [clearPending]);

  // A timer that fires after unmount would set state on a dead component.
  useEffect(() => clearPending, [clearPending]);

  // Escape closes, because a hover menu that traps focus is worse than no menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNow();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeNow]);

  /*
   * Flattened across groups, in order. The menu shows the most recent few
   * regardless of which group they belong to — the grouping is the sidebar's
   * job, and repeating it in a 272px peek would spend more space on headings
   * than on conversations.
   */
  const conversations = conversationGroups
    .flatMap((group) => group.items)
    .slice(0, maxConversations);

  const run = (fn: () => void) => () => {
    closeNow();
    fn();
  };

  return (
    <div
      className={styles.wrap}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      /*
       * Focus opens it too, so the menu is reachable without a pointer. `blur`
       * on the wrapper fires as focus moves between children, so the check for
       * "did focus land outside" is what keeps it from closing on every Tab.
       */
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeNow();
      }}
    >
      {children}

      {open && (
        <div className={styles.menu} role="menu">
          {navShortcuts.length > 0 && (
            <>
              <div className={styles.section}>
                {navShortcuts.map((shortcut) => (
                  <button
                    key={shortcut.id}
                    type="button"
                    role="menuitem"
                    className={styles.item}
                    onClick={run(() => shortcut.onClick?.())}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      <Icon name={shortcut.icon as IconNameLike} size="small" />
                    </span>
                    <span className={styles.itemLabel}>{shortcut.label}</span>
                  </button>
                ))}
              </div>
              <div className={styles.divider} />
            </>
          )}

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Conversations</p>

            <button
              type="button"
              role="menuitem"
              className={`${styles.item} ${styles.itemHighlighted}`}
              onClick={run(onNewConversation)}
            >
              <span className={styles.itemLabel}>{newChatLabel}</span>
            </button>

            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                role="menuitem"
                className={styles.item}
                onClick={run(() => onSelectConversation(conversation.id))}
              >
                <span className={styles.itemLabel}>{conversation.title}</span>
              </button>
            ))}

            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={run(onSeeAll)}
            >
              <span className={styles.itemLabel}>See all</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
