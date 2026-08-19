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
 */

import { useCallback } from 'react';
import { Dropdown, Icon } from '@ink';
import type { DropdownItemProps } from '@ink';

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
  children: React.ReactElement;
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
  position = 'bottom',
  align = 'start',
  open,
  onOpenChange,
}: CommandMenuProps) {
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
          icon: <Icon name={cat.icon as any} size="small" />,
          description: child.description,
          onClick: () => onSelect(child),
        })),
      });
    }

    return items;
  }, [contextItems, toolCategories, onSelect]);

  return (
    <Dropdown
      items={buildItems()}
      position={position}
      align={align}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </Dropdown>
  );
}
