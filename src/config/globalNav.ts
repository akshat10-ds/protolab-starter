/**
 * GlobalNav configuration
 * Defines the top-level navigation tabs for the DocuSign shell.
 * Each tab maps to a hash route and renders a different section.
 */

export type TabId = 'home' | 'agreements' | 'templates' | 'reports' | 'admin';

export interface TabConfig {
  id: TabId;
  label: string;
  /** Default hash route when this tab is clicked */
  defaultHash: string;
}

export const tabs: TabConfig[] = [
  { id: 'home',       label: 'Home',       defaultHash: '#home' },
  { id: 'agreements', label: 'Agreements', defaultHash: '#agreements' },
  { id: 'templates',  label: 'Templates',  defaultHash: '#templates' },
  { id: 'reports',    label: 'Reports',    defaultHash: '#reports' },
  { id: 'admin',      label: 'Admin',      defaultHash: '#admin' },
];

/**
 * Build a GlobalNav-compatible navItems array with an active tab
 * and onClick handlers that navigate via hash.
 */
export function buildNavItems(activeTabId: TabId, navigate: (hash: string) => void) {
  return tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    href: tab.defaultHash,
    active: tab.id === activeTabId,
    onClick: () => navigate(tab.defaultHash),
  }));
}
