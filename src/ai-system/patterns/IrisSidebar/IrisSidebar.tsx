/**
 * IrisSidebar — Iris agent sidebar pattern
 *
 * Wraps the Ink LocalNav with brand CTA, nav shortcuts (Skills/Agents/Playbooks),
 * and conversation history (Starred/Recent). Inherits LocalNav's proven
 * collapse/expand animation, hover-to-expand overlay, and lock toggle.
 *
 * Collapsed (72px), the history becomes a single "N chats" row. LocalNav renders
 * only icon-bearing items when collapsed and a conversation has no icon, so the
 * list is represented by a count rather than dropped. Decided 2026-08-10.
 *
 * Decided 2026-03-18.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LocalNav, Icon } from '@ink';
import type { LocalNavProps, DropdownItemProps } from '@ink';
import styles from './IrisSidebar.module.css';

/* =============================================================================
   Types
   ============================================================================= */

export interface NavShortcut {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  onClick?: () => void;
}

export interface ConversationItem {
  id: string;
  title: string;
}

export interface ConversationGroup {
  label: string;
  items: ConversationItem[];
}

export interface IrisSidebarProps {
  /** Logo element for expanded state (wordmark) */
  logo?: React.ReactNode;
  /** Logo element for collapsed state (brand mark) */
  logoCollapsed?: React.ReactNode;
  /** Header CTA label (defaults to "New Chat") */
  headerLabel?: string;
  /** Header CTA icon name (defaults to "plus") */
  headerIcon?: string;
  /** New chat / header CTA click handler */
  onNewChat?: () => void;
  /** Navigation shortcuts below the CTA */
  navShortcuts?: NavShortcut[];
  /** Conversation groups (e.g., Starred, Recent) */
  conversationGroups?: ConversationGroup[];
  /** Currently active conversation id */
  activeConversationId?: string;
  /** Conversation click handler */
  onConversationClick?: (id: string) => void;
  /** Whether the sidebar is locked open (true = expanded, false = collapsible) */
  isLocked?: boolean;
  /** Lock state change handler */
  onLockChange?: (locked: boolean) => void;
  /** Optional content pinned to the bottom of the sidebar column (e.g. a secondary CTA) */
  footer?: React.ReactNode;
  /** Hide the top header CTA — use when the primary action lives elsewhere (e.g. in `footer`) */
  hideHeaderCta?: boolean;
  /** Hide the bottom collapse/lock toggle (collapse can still be driven via `isLocked`) */
  hideCollapseToggle?: boolean;
  /** Additional className for the outer wrapper */
  className?: string;
}

/* =============================================================================
   IrisSidebar
   ============================================================================= */

export function IrisSidebar({
  logo,
  logoCollapsed,
  headerLabel = 'New Chat',
  headerIcon = 'plus',
  onNewChat,
  navShortcuts = [],
  conversationGroups = [],
  activeConversationId,
  onConversationClick,
  isLocked = false,
  onLockChange,
  footer,
  hideHeaderCta = false,
  hideCollapseToggle = false,
  className,
}: IrisSidebarProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // LocalNav owns collapse state internally: collapsed = collapsibility on,
  // not locked, not hovered/focused. Mirror its three triggers so we can swap
  // the history list for a rail-sized stand-in. LocalNav drops every item that
  // has no icon when collapsed, and a conversation has none — without this the
  // whole history disappears at 72px.
  const [navHovered, setNavHovered] = useState(false);
  const isCollapsed = !isLocked && !navHovered;

  // Organize menu state
  const [sortBy, setSortBy] = useState<'created' | 'updated'>('updated');
  const [showFilter, setShowFilter] = useState<'all' | 'starred'>('all');
  const [organizeOpen, setOrganizeOpen] = useState(false);
  const [organizePos, setOrganizePos] = useState({ top: 0, left: 0 });

  // Anchor the menu to the button that opened it. LocalNav types
  // `headerAction.onClick` as `() => void`, so the click event never reaches
  // us — measure the rendered button instead.
  const toggleOrganize = useCallback(() => {
    const button = wrapperRef.current?.querySelector('[aria-label="Organize"]');
    if (button) {
      const rect = button.getBoundingClientRect();
      // ponytail: 220 ≈ menu height, used to keep it on screen near the bottom.
      // Measure the node instead if the menu ever grows past that.
      setOrganizePos({
        top: Math.min(rect.bottom + 4, window.innerHeight - 220),
        left: rect.left,
      });
    }
    setOrganizeOpen((v) => !v);
  }, []);

  const organizeMenuItems = useMemo<DropdownItemProps[]>(
    () => [
      { label: 'Sort by', divider: false, disabled: true },
      {
        label: 'Created',
        icon: <Icon name="plus" size={16} />,
        selected: sortBy === 'created',
        onClick: () => setSortBy('created'),
      },
      {
        label: 'Updated',
        icon: <Icon name="pencil" size={16} />,
        selected: sortBy === 'updated',
        onClick: () => setSortBy('updated'),
      },
      { label: '', divider: true },
      { label: 'Show', divider: false, disabled: true },
      {
        label: 'All threads',
        icon: <Icon name="messages" size={16} />,
        selected: showFilter === 'all',
        onClick: () => setShowFilter('all'),
      },
      {
        label: 'Starred only',
        icon: <Icon name="star" size={16} />,
        selected: showFilter === 'starred',
        onClick: () => setShowFilter('starred'),
      },
    ],
    [sortBy, showFilter]
  );

  // Apply organize settings to conversation groups
  const organizedGroups = useMemo(() => {
    let groups = conversationGroups;

    // Filter: "Starred only" keeps only the Starred group
    if (showFilter === 'starred') {
      groups = groups.filter((g) => g.label === 'Starred');
    }

    // Sort: "Created" reverses item order within each group (simulates oldest-first)
    if (sortBy === 'created') {
      groups = groups.map((g) => ({
        ...g,
        items: [...g.items].reverse(),
      }));
    }

    return groups;
  }, [conversationGroups, sortBy, showFilter]);

  // Build LocalNav sections from semantic props
  type SectionType = NonNullable<LocalNavProps['sections']>[number];

  const sections = useMemo<SectionType[]>(() => {
    const result: SectionType[] = [];

    // Nav shortcuts (Skills, Agents, Playbooks)
    if (navShortcuts.length > 0) {
      result.push({
        id: 'shortcuts',
        items: navShortcuts.map((s) => ({
          id: s.id,
          label: s.label,
          icon: s.icon as any,
          badge: s.badge,
          onClick: s.onClick,
        })),
      });
    }

    // Collapsed rail: one count row stands in for the whole history. It carries
    // an icon, so it survives LocalNav's collapsed-item rule; clicking it locks
    // the sidebar open. Hovering the rail still reveals the real list.
    if (isCollapsed) {
      const count = new Set(organizedGroups.flatMap((g) => g.items.map((item) => item.id))).size;
      if (count > 0) {
        result.push({
          id: 'history-count',
          hasDivider: navShortcuts.length > 0,
          items: [
            {
              id: 'history-count-item',
              label: `${count} ${count === 1 ? 'chat' : 'chats'}`,
              icon: 'messages' as any,
              // ponytail: no-op unless the consumer wired onLockChange —
              // hover-to-expand still reaches the list either way.
              onClick: () => onLockChange?.(true),
            },
          ],
        });
      }
      return result;
    }

    // Conversation groups (Starred, Recent, etc.) — uses organized groups
    organizedGroups.forEach((group, i) => {
      result.push({
        id: `group-${group.label.toLowerCase()}`,
        // Divider only separates conversation groups from nav shortcuts above.
        // With no shortcuts (e.g. a standalone chat-history rail) the first
        // group sits flush — no leading divider or spacing.
        hasDivider: i === 0 && navShortcuts.length > 0,
        title: group.label,
        headerLabel: true,
        // Organize action on first group — scrolls with content
        ...(i === 0
          ? {
              headerAction: {
                icon: 'filter' as any,
                label: 'Organize',
                onClick: toggleOrganize,
              },
            }
          : {}),
        items: group.items.map((item) => ({
          id: item.id,
          label: item.title,
          onClick: () => onConversationClick?.(item.id),
        })),
      });
    });

    return result;
  }, [navShortcuts, organizedGroups, onConversationClick, isCollapsed, onLockChange, toggleOrganize]);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${hideHeaderCta ? styles.headerCtaHidden : ''} ${
        hideCollapseToggle ? styles.collapseToggleHidden : ''
      } ${className || ''}`}
    >
      {/* Logo area — mark/wordmark crossfade driven by LocalNav's collapsed class */}
      <div className={styles.logoArea}>
        {/* Collapsed: Docusign mark (existing brand icon) */}
        <svg
          viewBox="0 0 194 194"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.logoMark}
        >
          {logoCollapsed || (
            <>
              <path
                d="M139.5 139.5V189c0 2.6-2.1 4.7-4.7 4.7H4.7C2.1 193.7 0 191.6 0 189V59c0-2.6 2.1-4.7 4.7-4.7h49.4v80.5c0 2.6 2.1 4.7 4.7 4.7h80.7z"
                fill="#4C00FF"
              />
              <path
                d="M193.7 69.7c0 41.6-24.3 69.7-54.2 69.8V87.1c0-1.5-.6-3-1.7-4L110.6 55.9c-1.1-1.1-2.5-1.7-4-1.7H54.2V4.8c0-2.6 2.1-4.7 4.7-4.7h73.3C167 0 193.7 28 193.7 69.7z"
                fill="#FF5252"
              />
              <path
                d="M137.8 83c1.1 1.1 1.7 2.5 1.7 4v52.4H58.9c-2.6 0-4.7-2.1-4.7-4.7V54.2h52.4c1.5 0 3 .6 4 1.7L137.8 83z"
                fill="#130032"
              />
            </>
          )}
        </svg>
        {/* Expanded: docusign | iris lockup */}
        <div className={styles.logoWordmark}>
          {logo || <img src="/assets/docusign-iris-logo.svg" alt="Docusign Iris" />}
        </div>
      </div>

      {/* navArea is sized to exactly the nav box, so its hover/focus fires with
          LocalNav's own — that keeps `isCollapsed` in step with LocalNav. */}
      <div
        className={styles.navArea}
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
        onFocus={() => setNavHovered(true)}
      >
        <LocalNav
          headerLabel={headerLabel}
          headerIcon={headerIcon as LocalNavProps['headerIcon']}
          isLocked={isLocked}
          onLockChange={onLockChange}
          allowCollapsibility={true}
          onHeaderClick={onNewChat}
          activeItemId={activeConversationId}
          className={styles.nav}
          sections={sections}
        />
      </div>

      {/* Footer slot — pinned to the bottom of the column (hidden when collapsed) */}
      {footer && <div className={styles.footerSlot}>{footer}</div>}

      {/* Organize dropdown — custom menu positioned dynamically near headerAction */}
      {organizeOpen && (
        <>
          <div className={styles.organizeBackdrop} onClick={() => setOrganizeOpen(false)} />
          <div className={styles.organizeMenu} style={organizePos}>
            {organizeMenuItems.map((item, i) => {
              if (item.divider) return <div key={i} className={styles.organizeDivider} />;
              if (item.disabled)
                return (
                  <div key={i} className={styles.organizeGroupLabel}>
                    {item.label}
                  </div>
                );
              return (
                <button
                  key={i}
                  className={styles.organizeItem}
                  onClick={() => {
                    item.onClick?.();
                    setOrganizeOpen(false);
                  }}
                >
                  <span className={styles.organizeItemIcon}>{item.icon}</span>
                  <span className={styles.organizeItemLabel}>{item.label}</span>
                  {item.selected && (
                    <span className={styles.organizeItemCheck}>
                      <Icon name="check" size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
