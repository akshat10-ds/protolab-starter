/**
 * Route configuration — maps hash routes to tab, sidebar item, and page component.
 *
 * Routes are matched by prefix, so '#agreements/drafts' first tries an exact match,
 * then falls back to the tab default for '#agreements'.
 */

import type { TabId } from './globalNav';

export interface RouteConfig {
  /** Which GlobalNav tab is active */
  tab: TabId;
  /** Which LocalNav sidebar item is active */
  sidebarItemId: string;
  /** Page component key (resolved in App.tsx) */
  page: 'dashboard' | 'table' | 'insights' | 'placeholder';
  /** Title passed to PlaceholderPage when page === 'placeholder' */
  placeholderTitle?: string;
}

/**
 * Exact-match routes. The key is the hash (without the '#').
 * For routes not listed here, we fall back to the tab's default route.
 */
export const routes: Record<string, RouteConfig> = {
  // Home tab
  'home':                { tab: 'home', sidebarItemId: 'dashboard', page: 'dashboard' },
  'home/action-required': { tab: 'home', sidebarItemId: 'action-required', page: 'placeholder', placeholderTitle: 'Action Required' },
  'home/waiting':        { tab: 'home', sidebarItemId: 'waiting', page: 'placeholder', placeholderTitle: 'Waiting for Others' },
  'home/expiring':       { tab: 'home', sidebarItemId: 'expiring', page: 'placeholder', placeholderTitle: 'Expiring Soon' },

  // Agreements tab
  'agreements':           { tab: 'agreements', sidebarItemId: 'all-agreements', page: 'table' },
  'agreements/drafts':    { tab: 'agreements', sidebarItemId: 'drafts', page: 'placeholder', placeholderTitle: 'Drafts' },
  'agreements/in-progress': { tab: 'agreements', sidebarItemId: 'in-progress', page: 'placeholder', placeholderTitle: 'In Progress' },
  'agreements/completed': { tab: 'agreements', sidebarItemId: 'completed', page: 'placeholder', placeholderTitle: 'Completed' },
  'agreements/deleted':   { tab: 'agreements', sidebarItemId: 'deleted', page: 'placeholder', placeholderTitle: 'Deleted' },
  'agreements/folders':   { tab: 'agreements', sidebarItemId: 'folders-item', page: 'placeholder', placeholderTitle: 'Folders' },
  'agreements/parties':   { tab: 'agreements', sidebarItemId: 'parties', page: 'placeholder', placeholderTitle: 'Parties' },
  'agreements/requests':  { tab: 'agreements', sidebarItemId: 'requests', page: 'placeholder', placeholderTitle: 'Requests' },
  'agreements/maestro':   { tab: 'agreements', sidebarItemId: 'maestro', page: 'placeholder', placeholderTitle: 'Maestro Workflows' },
  'agreements/workspaces': { tab: 'agreements', sidebarItemId: 'workspaces', page: 'placeholder', placeholderTitle: 'Workspaces' },
  'agreements/powerforms': { tab: 'agreements', sidebarItemId: 'powerforms', page: 'placeholder', placeholderTitle: 'PowerForms' },
  'agreements/bulk-send': { tab: 'agreements', sidebarItemId: 'bulk-send', page: 'placeholder', placeholderTitle: 'Bulk Send' },

  // Templates tab
  'templates':           { tab: 'templates', sidebarItemId: 'all-templates', page: 'placeholder', placeholderTitle: 'Templates' },
  'templates/mine':      { tab: 'templates', sidebarItemId: 'my-templates', page: 'placeholder', placeholderTitle: 'My Templates' },
  'templates/shared':    { tab: 'templates', sidebarItemId: 'shared', page: 'placeholder', placeholderTitle: 'Shared with Me' },
  'templates/favorites': { tab: 'templates', sidebarItemId: 'favorites', page: 'placeholder', placeholderTitle: 'Favorite Templates' },

  // Reports tab
  'reports':             { tab: 'reports', sidebarItemId: 'insights', page: 'insights' },
  'reports/completion':  { tab: 'reports', sidebarItemId: 'completion', page: 'placeholder', placeholderTitle: 'Completion Rates' },
  'reports/usage':       { tab: 'reports', sidebarItemId: 'usage', page: 'placeholder', placeholderTitle: 'Usage Analytics' },
  'reports/audit':       { tab: 'reports', sidebarItemId: 'audit-trail', page: 'placeholder', placeholderTitle: 'Audit Trail' },

  // Admin tab
  'admin':               { tab: 'admin', sidebarItemId: 'admin-overview', page: 'placeholder', placeholderTitle: 'Admin Overview' },
  'admin/users':         { tab: 'admin', sidebarItemId: 'users', page: 'placeholder', placeholderTitle: 'Users & Groups' },
  'admin/integrations':  { tab: 'admin', sidebarItemId: 'integrations', page: 'placeholder', placeholderTitle: 'Integrations' },
  'admin/billing':       { tab: 'admin', sidebarItemId: 'billing', page: 'placeholder', placeholderTitle: 'Billing' },
  'admin/branding':      { tab: 'admin', sidebarItemId: 'branding', page: 'placeholder', placeholderTitle: 'Branding' },
};

/** Default route when hash is empty or unrecognized */
export const defaultRoute: RouteConfig = routes['home'];

/**
 * Resolve a hash string to a RouteConfig.
 * Tries exact match first, then strips trailing segments until a match is found.
 */
export function resolveRoute(hash: string): RouteConfig {
  // Strip leading '#' and trailing '/'
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '');

  if (!path) return defaultRoute;

  // Exact match
  if (routes[path]) return routes[path];

  // Walk up segments until we find a match
  const segments = path.split('/');
  while (segments.length > 1) {
    segments.pop();
    const parent = segments.join('/');
    if (routes[parent]) return routes[parent];
  }

  return defaultRoute;
}
