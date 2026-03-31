import React, { useState, useRef, useEffect } from 'react';
import styles from './LocalNav.module.css';
import { Icon } from '../../3-primitives/Icon';
import type { IconName } from '../../3-primitives/Icon';
import { Badge } from '../../3-primitives/Badge';
import { Switch } from '../../3-primitives/Switch';
import { Tooltip } from '../../3-primitives/Tooltip';
import { Button } from '../../3-primitives/Button';
import { IconButton } from '../../3-primitives/IconButton';

export interface LocalNavItem {
  id: string;
  label: string;
  icon?: IconName;
  badge?: string;
  hasMenu?: boolean;
  onMenuClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  active?: boolean;
  nested?: boolean;
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Shows submenu arrow indicator */
  hasSubmenu?: boolean;
  onClick?: () => void;
}

export interface LocalNavSection {
  id: string;
  title?: string;
  icon?: IconName;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  items: LocalNavItem[];
  /** Show as uppercase label header (non-interactive) */
  headerLabel?: boolean;
  /** Action button for header (e.g., "New Folder") */
  headerAction?: {
    icon: IconName;
    label: string;
    onClick: () => void;
  };
  /** Show a divider line above this section */
  hasDivider?: boolean;
}

export interface LocalNavProps {
  /** Header dropdown label */
  headerLabel?: string;
  /** Header icon for collapsed state (defaults to 'plus') */
  headerIcon?: IconName;
  /** Menu items for header dropdown */
  headerMenuItems?: HeaderMenuItem[];
  /** Sections of navigation items */
  sections: LocalNavSection[];
  /** Callback when header dropdown is clicked (only used if no headerMenuItems) */
  onHeaderClick?: () => void;
  /** Active item ID */
  activeItemId?: string;
  /** Custom className */
  className?: string;
  /**
   * Whether the nav is locked open. When locked, nav stays expanded.
   * When unlocked, nav collapses and expands on hover.
   * Defaults to true (locked/expanded).
   */
  isLocked?: boolean;
  /** Callback when lock state changes */
  onLockChange?: (locked: boolean) => void;
  /**
   * Whether collapsibility is enabled. If false, nav is always expanded
   * and lock button is hidden. Defaults to true.
   */
  allowCollapsibility?: boolean;
  /** Footer toggle for feature flags (e.g., "New navigation") */
  footerToggle?: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon?: IconName;
  };
}

export const LocalNav: React.FC<LocalNavProps> = ({
  headerLabel = 'Start',
  headerIcon = 'plus',
  headerMenuItems,
  sections,
  onHeaderClick,
  activeItemId,
  className,
  isLocked: controlledIsLocked,
  onLockChange,
  allowCollapsibility = true,
  footerToggle,
}) => {
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(sections.filter((s) => s.collapsible && !s.defaultExpanded).map((s) => s.id))
  );

  // Support both controlled and uncontrolled lock state
  const isControlled = controlledIsLocked !== undefined;
  const [internalIsLocked, setInternalIsLocked] = useState(true);
  const isLocked = isControlled ? controlledIsLocked : internalIsLocked;

  // Handle lock toggle
  const handleLockToggle = () => {
    const newLocked = !isLocked;
    if (!isControlled) {
      setInternalIsLocked(newLocked);
    }
    onLockChange?.(newLocked);
  };

  // Determine if nav should show expanded
  // If collapsibility is disabled, always expanded
  // If locked, always expanded
  // Otherwise, expand on hover
  const isExpanded = !allowCollapsibility || isLocked || isHovered;

  // Handle mouse enter/leave for hover-to-expand (when unlocked)
  const handleMouseEnter = () => {
    if (allowCollapsibility && !isLocked) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (allowCollapsibility && !isLocked) {
      setIsHovered(false);
      setHeaderMenuOpen(false); // Close menu when leaving collapsed nav
    }
  };

  // Close header menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };

    if (headerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [headerMenuOpen]);

  const handleHeaderClick = () => {
    if (headerMenuItems && headerMenuItems.length > 0) {
      setHeaderMenuOpen(!headerMenuOpen);
    } else if (onHeaderClick) {
      onHeaderClick();
    }
  };

  const handleMenuItemClick = (item: HeaderMenuItem) => {
    item.onClick?.();
    setHeaderMenuOpen(false);
  };

  const handleItemClick = (item: LocalNavItem) => {
    if (item.onClick) {
      item.onClick();
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Compute collapsed state for CSS classes
  // Nav is "collapsed" when collapsibility is enabled AND not locked AND not currently hovered
  const isCollapsed = allowCollapsibility && !isLocked && !isHovered;

  return (
    <nav
      data-ink-component="LocalNav"
      ref={navRef}
      className={`${styles.localNav} ${isCollapsed ? styles.navCollapsed : ''} ${isHovered && !isLocked ? styles.navHovered : ''} ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
    >
      {/* Header */}
      <div className={styles.headerWrapper} ref={headerRef}>
        {/* Both buttons rendered for smooth animation - visibility controlled by CSS */}
        <div className={`${styles.headerButtonExpanded} ${isExpanded ? styles.visible : ''}`}>
          <Button
            kind="primary"
            size="medium"
            fullWidth
            onClick={handleHeaderClick}
            aria-expanded={headerMenuOpen}
            aria-haspopup={headerMenuItems && headerMenuItems.length > 0 ? 'menu' : undefined}
            tabIndex={isExpanded ? 0 : -1}
            endElement={
              <span
                className={`${styles.headerChevron} ${headerMenuOpen ? styles.headerChevronRotated : ''}`}
              >
                <Icon name="chevron-down" size="small" />
              </span>
            }
          >
            {headerLabel}
          </Button>
        </div>
        <div className={`${styles.headerButtonCollapsedWrapper} ${!isExpanded ? styles.visible : ''}`}>
          <IconButton
            icon={headerIcon}
            size="medium"
            variant="primary"
            onClick={handleHeaderClick}
            aria-label={headerLabel}
            tabIndex={isExpanded ? -1 : 0}
            className={styles.headerButtonCollapsed}
          />
        </div>

        {/* Header Dropdown Menu */}
        {headerMenuItems && headerMenuItems.length > 0 && headerMenuOpen && isExpanded && (
          <div className={styles.headerMenu} role="menu">
            {headerMenuItems.map((item) => (
              <button
                key={item.id}
                className={styles.headerMenuItem}
                onClick={() => handleMenuItemClick(item)}
                role="menuitem"
              >
                {item.icon && (
                  <span className={styles.headerMenuItemIcon}>
                    <Icon name={item.icon} size="medium" />
                  </span>
                )}
                <span className={styles.headerMenuItemLabel}>{item.label}</span>
                {item.hasSubmenu && (
                  <span className={styles.headerMenuItemArrow}>
                    <Icon name="chevron-right" size="small" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className={styles.sections}>
        {sections.map((section) => {
          const isSectionCollapsed = collapsedSections.has(section.id);

          // Helper to render an item (reused in multiple places)
          const renderItem = (item: LocalNavItem) => {
            const isItemActive = item.active || item.id === activeItemId;

            // Collapsed nav: show only icon items (skip nested items without icons)
            if (!isExpanded && !item.icon) {
              return null;
            }

            return (
              <li key={item.id}>
                {!isExpanded ? (
                  // Collapsed view: icon only with tooltip
                  <Tooltip content={item.label} side="right">
                    <button
                      className={`${styles.itemCollapsed} ${isItemActive ? styles.active : ''}`}
                      onClick={() => handleItemClick(item)}
                      aria-label={item.label}
                    >
                      {item.icon && <Icon name={item.icon} size="medium" />}
                      {isItemActive && <div className={styles.activeIndicator} />}
                    </button>
                  </Tooltip>
                ) : (
                  // Expanded view: full item (hover handled by CSS)
                  // Use div with role="button" when hasMenu to avoid button-in-button nesting
                  item.hasMenu ? (
                    <div
                      role="button"
                      tabIndex={0}
                      className={`${styles.item} ${isItemActive ? styles.active : ''} ${
                        item.nested ? styles.nested : ''
                      } ${styles.hasMenu} ${item.icon ? styles.hasIcon : ''}`}
                      onClick={() => handleItemClick(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item);
                        }
                      }}
                    >
                      {item.icon && (
                        <span className={styles.itemIcon}>
                          <Icon name={item.icon} size="medium" />
                        </span>
                      )}
                      <span className={styles.itemLabel}>{item.label}</span>
                      {item.badge && <Badge variant="subtle">{item.badge}</Badge>}
                      <IconButton
                        icon="overflow-horizontal"
                        size="small"
                        variant="tertiary"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onMenuClick?.(e);
                        }}
                        aria-label="More options"
                        className={styles.menuButton}
                      />
                      {isItemActive && <div className={styles.activeIndicator} />}
                    </div>
                  ) : (
                    <button
                      className={`${styles.item} ${isItemActive ? styles.active : ''} ${
                        item.nested ? styles.nested : ''
                      } ${item.icon ? styles.hasIcon : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      {item.icon && (
                        <span className={styles.itemIcon}>
                          <Icon name={item.icon} size="medium" />
                        </span>
                      )}
                      <span className={styles.itemLabel}>{item.label}</span>
                      {item.badge && <Badge variant="subtle">{item.badge}</Badge>}
                      {isItemActive && <div className={styles.activeIndicator} />}
                    </button>
                  )
                )}
              </li>
            );
          };

          return (
            <div
              key={section.id}
              className={`${styles.section} ${section.hasDivider ? styles.sectionWithDivider : ''}`}
            >
              {section.headerLabel && section.title ? (
                <>
                  {isExpanded && (
                    <div className={styles.sectionLabelHeader}>
                      {section.icon && (
                        <span className={styles.sectionLabelIcon}>
                          <Icon name={section.icon} size="medium" />
                        </span>
                      )}
                      <span className={styles.sectionLabel}>{section.title}</span>
                      {section.headerAction && (
                        <IconButton
                          icon={section.headerAction.icon}
                          size="small"
                          variant="tertiary"
                          onClick={section.headerAction.onClick}
                          aria-label={section.headerAction.label}
                          title={section.headerAction.label}
                        />
                      )}
                    </div>
                  )}
                  <ul className={styles.itemList}>{section.items.map(renderItem)}</ul>
                </>
              ) : section.collapsible && section.title ? (
                <>
                  {isExpanded && (
                    <button
                      className={`${styles.sectionHeader} ${
                        isSectionCollapsed ? styles.collapsed : ''
                      }`}
                      onClick={() => toggleSection(section.id)}
                    >
                      {section.icon && (
                        <span className={styles.sectionIcon}>
                          <Icon name={section.icon} size="medium" />
                        </span>
                      )}
                      <span className={styles.sectionTitle}>{section.title}</span>
                      <span className={styles.sectionChevron}>
                        <Icon name="chevron-down" size="medium" />
                      </span>
                    </button>
                  )}
                  {isExpanded ? (
                    <div
                      className={`${styles.sectionItems} ${
                        isSectionCollapsed ? styles.collapsed : ''
                      }`}
                    >
                      <ul className={styles.itemList}>{section.items.map(renderItem)}</ul>
                    </div>
                  ) : (
                    <ul className={styles.itemList}>{section.items.map(renderItem)}</ul>
                  )}
                </>
              ) : (
                <>
                  {isExpanded && section.title && (
                    <div className={styles.sectionTitle}>{section.title}</div>
                  )}
                  <ul className={styles.itemList}>{section.items.map(renderItem)}</ul>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {(footerToggle || allowCollapsibility) && (
        <div className={`${styles.footer} ${!isExpanded ? styles.footerCollapsed : ''}`}>
          {isExpanded && footerToggle && (
            <>
              <div className={styles.footerToggle}>
                {footerToggle.icon && (
                  <span className={styles.footerIcon}>
                    <Icon name={footerToggle.icon} size="medium" />
                  </span>
                )}
                <span className={styles.footerLabel}>{footerToggle.label}</span>
              </div>
              <Switch checked={footerToggle.checked} onChange={footerToggle.onChange} />
            </>
          )}
          {allowCollapsibility && (
            <Tooltip content={isLocked ? 'Unlock sidebar' : 'Lock sidebar'} side="right">
              <IconButton
                icon={isLocked ? 'lock' : 'unlock'}
                size="medium"
                variant="tertiary"
                onClick={handleLockToggle}
                aria-label={isLocked ? 'Unlock navigation sidebar' : 'Lock navigation sidebar'}
              />
            </Tooltip>
          )}
        </div>
      )}
    </nav>
  );
};

LocalNav.displayName = 'LocalNav';
