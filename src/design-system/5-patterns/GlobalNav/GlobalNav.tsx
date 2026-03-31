import React from 'react';
import styles from './GlobalNav.module.css';
import { Avatar } from '../../3-primitives/Avatar';
import { Icon } from '../../3-primitives/Icon';
import { IconButton } from '../../3-primitives/IconButton';
import type { IconName } from '../../3-primitives/Icon';

export interface GlobalNavItem {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface GlobalNavProps {
  /** Logo element (image or component) */
  logo?: React.ReactNode;
  /** Navigation items */
  navItems?: GlobalNavItem[];
  /** Show app switcher icon */
  showAppSwitcher?: boolean;
  /** App switcher click handler */
  onAppSwitcherClick?: () => void;
  /** Show search icon */
  showSearch?: boolean;
  /** Search button variant - 'icon' for icon only, 'pill' for pill-shaped button with text */
  searchVariant?: 'icon' | 'pill';
  /** Search click handler */
  onSearchClick?: () => void;
  /** Show notifications */
  showNotifications?: boolean;
  /** Notification click handler */
  onNotificationClick?: () => void;
  /** Notification count */
  notificationCount?: number;
  /** Show settings */
  showSettings?: boolean;
  /** Settings icon to use */
  settingsIcon?: IconName;
  /** Settings click handler */
  onSettingsClick?: () => void;
  /** User info for avatar */
  user?: {
    name: string;
    avatar?: string;
  };
  /** User menu items */
  onUserMenuClick?: () => void;
  /** Extra actions rendered before help/avatar (e.g., AI assistant button) */
  extraActions?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export const GlobalNav = ({
  logo,
  navItems = [],
  showAppSwitcher = true,
  onAppSwitcherClick,
  showSearch = false,
  searchVariant = 'icon',
  onSearchClick,
  showNotifications = false,
  onNotificationClick,
  notificationCount,
  showSettings = false,
  settingsIcon = 'settings',
  onSettingsClick,
  user,
  onUserMenuClick,
  extraActions,
  className,
}: GlobalNavProps) => {
  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <header data-ink-component="GlobalNav" className={containerClasses}>
      {/* Left Section */}
      <div className={styles.start}>
        {/* Product Section */}
        <div className={styles.product}>
          {/* App Switcher */}
          {showAppSwitcher && (
            <IconButton
              icon="menu"
              variant="tertiary"
              size="medium"
              onClick={onAppSwitcherClick}
              aria-label="App switcher"
              className={styles.appSwitcher}
            />
          )}

          {/* Logo */}
          {logo && <div className={styles.logo}>{logo}</div>}
        </div>

        {/* Navigation Items */}
        {navItems.length > 0 && (
          <nav className={styles.navigation}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href || '#'}
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Right Section */}
      <div className={styles.end}>
        {/* Search */}
        {showSearch && searchVariant === 'icon' && (
          <IconButton
            icon="search"
            variant="tertiary"
            size="medium"
            onClick={onSearchClick}
            aria-label="Search"
            className={styles.iconButton}
          />
        )}
        {showSearch && searchVariant === 'pill' && (
          <button className={styles.searchPill} onClick={onSearchClick} aria-label="Search">
            <Icon name="search" size="small" />
            <span>Search</span>
          </button>
        )}

        {/* Notifications */}
        {showNotifications && (
          <button
            className={styles.iconButton}
            onClick={onNotificationClick}
            aria-label="Notifications"
          >
            <Icon name="bell" size="medium" />
            {notificationCount !== undefined && notificationCount > 0 && (
              <span className={styles.badge}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* Settings */}
        {showSettings && (
          <IconButton
            icon={settingsIcon}
            variant="tertiary"
            size="medium"
            onClick={onSettingsClick}
            aria-label="Settings"
            className={styles.iconButton}
          />
        )}

        {/* Extra actions (e.g., AI assistant) */}
        {extraActions}

        {/* Help Menu */}
        <IconButton
          icon="help"
          variant="tertiary"
          size="medium"
          aria-label="Help"
          className={styles.iconButton}
        />

        {/* User Avatar */}
        {user && (
          <button className={styles.avatarButton} onClick={onUserMenuClick} aria-label="User menu">
            <Avatar name={user.name} src={user.avatar} size="small" />
          </button>
        )}
      </div>
    </header>
  );
};

GlobalNav.displayName = 'GlobalNav';
