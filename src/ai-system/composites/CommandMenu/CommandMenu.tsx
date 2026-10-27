/**
 * CommandMenu — Command palette composed on top of Ink Dropdown
 *
 * Two-section layout matching the INK Menu pattern:
 *   1. Context — direct actions (upload, add from navigator, etc.)
 *   2. Tools  — category drill-downs (skills, agents, playbooks)
 *
 * No trigger built in — the consumer passes one via `children`.
 * Tool categories use Dropdown's native flyout submenu rendering.
 * All styling comes from Dropdown (INK Menu tokens).
 * Positioning is corrected here: Ink has no collision handling, so the menu and
 * its fly-out are measured and kept inside the viewport. See the fit pass below.
 */

import { useCallback, useEffect, useId, useRef } from 'react';
import { Dropdown, Icon } from '@ink';
import type { DropdownItemProps } from '@ink';

/** Ink's own trigger↔menu gap (Dropdown.calculatePosition). */
const GAP = 4;
/** How much of the viewport edge the menu keeps clear. */
const MARGIN = 8;

// =============================================================================
// Types
// =============================================================================

export interface CommandContextItem {
  id: string;
  icon: string;
  label: string;
}

export interface CommandToolChild {
  id: string;
  icon: string;
  label: string;
  description?: string;
  shortcut?: string;
  meta?: string;
}

export interface CommandToolCategory {
  id: string;
  icon: string;
  label: string;
  children: CommandToolChild[];
}

export interface CommandMenuProps {
  /** Direct-action items shown in the top section (context/sources) */
  contextItems?: CommandContextItem[];
  /** Category drill-down items shown below the divider (tools/capabilities) */
  toolCategories: CommandToolCategory[];
  /** Called when a context item or tool sub-item is selected */
  onSelect: (item: CommandContextItem | CommandToolChild) => void;
  /** Trigger element — passed through to Dropdown */
  children: React.ComponentProps<typeof Dropdown>['children'];
  /** Dropdown position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Dropdown alignment */
  align?: 'start' | 'center' | 'end';
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// Component
// =============================================================================

export function CommandMenu({
  contextItems = [],
  toolCategories,
  onSelect,
  children,
  // 'bottom', not 'top': Ink's Dropdown cannot place a 'top' or 'left' menu.
  // In protolab-starter/src/design-system/4-composites/Dropdown/Dropdown.tsx,
  // 'top' sets top = triggerRect.top - gap (line 122) and 'left' sets
  // left = triggerRect.left - gap (line 125). Neither subtracts the menu's own
  // height or width, and the only CSS transform is horizontal (translateX), so
  // the menu overlaps its trigger. Only 'bottom' and 'right' are correct.
  // See projects/iris-system/notes/2026-08-10-ink-dropdown-position-bug.md
  // The fit pass below now makes 'top' correct — 'left' is still Ink's to fix.
  position = 'bottom',
  align = 'start',
  open,
  onOpenChange,
}: CommandMenuProps) {
  /*
    THE MENU STAYS ON SCREEN.

    The composer sits at the bottom of the panel, so a menu that opens downward
    from it runs off the fold: at 1440x900 the six `+` items landed at y=815 to
    y=1012 and the last four — Agents among them — could not be clicked at all.

    Ink's Dropdown has no collision handling, and its snapshots do not even
    agree on the arithmetic: most vendored copies place a `top` menu at
    `triggerRect.top - gap` and never subtract the menu's own height, while
    loan-workspace's copy already subtracts it. So this does not patch Ink's
    number — it measures the trigger and the menu and writes the top that fits,
    which lands on the same value either way.

    Preference is honoured (`position="top"` still opens upward); the other side
    is used only when the preferred one does not fit, and a menu taller than the
    viewport is clamped rather than flipped. The fly-out submenu — absolutely
    positioned by Ink's CSS at `top: -8px; left: 100%` — is nudged back inside
    the same way.

    A MutationObserver, not a timer: Ink positions the portal in a double rAF
    and rewrites it on scroll and resize, and the observer runs as a microtask
    after each of those writes, before paint. Every pass recomputes from the
    trigger, so re-running it is a no-op once it has converged.
  */
  const hostRef = useRef<HTMLSpanElement>(null);
  const menuQa = `ai-command-menu-${useId()}`;

  useEffect(() => {
    if (!open) return;

    const fit = () => {
      const menu = document.querySelector<HTMLElement>(`[data-qa="${menuQa}"]`);
      // Ink's wrapper is our only child; its first child is the trigger it measures.
      const trigger = hostRef.current?.firstElementChild?.firstElementChild as HTMLElement | null;
      if (!menu || !trigger) return;

      const rect = trigger.getBoundingClientRect();
      const height = menu.offsetHeight;
      const { innerHeight: vh, innerWidth: vw } = window;
      const above = rect.top - GAP - height;
      const below = rect.bottom + GAP;
      const fitsAbove = above >= MARGIN;
      const fitsBelow = below + height <= vh - MARGIN;
      const clamped = Math.max(MARGIN, vh - MARGIN - height);

      const top =
        position === 'top'
          ? fitsAbove
            ? above
            : fitsBelow
              ? below
              : clamped
          : fitsBelow
            ? below
            : fitsAbove
              ? above
              : clamped;

      const next = `${Math.round(top)}px`;
      if (menu.style.top !== next) menu.style.top = next;

      // The fly-out, if one is open. Nudge, don't reposition: it keeps Ink's
      // placement and only gives back the pixels that fell off the edge.
      const flyout = menu.querySelector<HTMLElement>('[role="menu"]');
      if (flyout) {
        const box = flyout.getBoundingClientRect();
        const overY = box.bottom - (vh - MARGIN);
        if (overY > 0) flyout.style.top = `${flyout.offsetTop - overY}px`;
        const overX = box.right - (vw - MARGIN);
        if (overX > 0) flyout.style.left = `${flyout.offsetLeft - overX}px`;
      }
    };

    const menu = document.querySelector<HTMLElement>(`[data-qa="${menuQa}"]`);
    if (!menu) return;

    const observer = new MutationObserver(() => {
      fit();
      observer.takeRecords(); // drop the records our own write just queued
    });
    observer.observe(menu, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });
    fit();

    return () => observer.disconnect();
  }, [open, position, menuQa]);

  const buildItems = useCallback((): DropdownItemProps[] => {
    const items: DropdownItemProps[] = [];

    // Context items (direct actions)
    for (const ctx of contextItems) {
      items.push({
        label: ctx.label,
        icon: <Icon name={ctx.icon as any} size="small" />,
        onClick: () => onSelect(ctx),
      });
    }

    // Divider between sections
    if (contextItems.length > 0 && toolCategories.length > 0) {
      items.push({ label: '', divider: true });
    }

    // Tool categories with real children (Dropdown renders flyout submenu)
    for (const cat of toolCategories) {
      items.push({
        label: cat.label,
        icon: <Icon name={cat.icon as any} size="small" />,
        children: cat.children.map((child) => ({
          label: child.label,
          /*
            THE CHILD'S OWN GLYPH. `CommandToolChild.icon` was declared,
            required, and then never read — every row in a flyout drew the
            category's mark, so five agents looked like one agent five times.
            Shipping draws each agent its own. Existing fixtures set the child
            icon to the category's, so nothing else in the menu moves.
          */
          icon: <Icon name={(child.icon ?? cat.icon) as any} size="small" />,
          description: child.description,
          onClick: () => onSelect(child),
        })),
      });
    }

    return items;
  }, [contextItems, toolCategories, onSelect]);

  return (
    // `display: contents` — a handle on Ink's wrapper for the fit pass, with no
    // box of its own, so the composer's row lays out exactly as it did before.
    <span ref={hostRef} style={{ display: 'contents' }}>
      <Dropdown
        items={buildItems()}
        position={position}
        align={align}
        open={open}
        onOpenChange={onOpenChange}
        data-qa={menuQa}
      >
        {children}
      </Dropdown>
    </span>
  );
}
