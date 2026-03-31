/**
 * LocalNav sidebar configurations per tab.
 * Each tab can have its own sidebar layout with sections, items, and actions.
 */

import type { TabId } from './globalNav';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  hasMenu?: boolean;
  nested?: boolean;
  /** Hash route this item navigates to */
  hash: string;
}

export interface SidebarSection {
  id: string;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  hasDivider?: boolean;
  items: SidebarItem[];
}

export interface SidebarConfig {
  headerLabel: string;
  headerIcon: string;
  headerMenuItems?: Array<{ id: string; label: string; icon: string }>;
  sections: SidebarSection[];
}

const agreementsSidebar: SidebarConfig = {
  headerLabel: 'Start',
  headerIcon: 'plus',
  headerMenuItems: [
    { id: 'new-agreement', label: 'New Agreement', icon: 'edit' },
    { id: 'new-template', label: 'New Template', icon: 'star' },
    { id: 'upload', label: 'Upload Document', icon: 'upload' },
  ],
  sections: [
    {
      id: 'agreements',
      items: [
        { id: 'all-agreements', label: 'All Agreements', icon: 'inbox', hash: '#agreements' },
        { id: 'drafts', label: 'Drafts', nested: true, hash: '#agreements/drafts' },
        { id: 'in-progress', label: 'In Progress', nested: true, hash: '#agreements/in-progress' },
        { id: 'completed', label: 'Completed', nested: true, hash: '#agreements/completed' },
        { id: 'deleted', label: 'Deleted', nested: true, hash: '#agreements/deleted' },
      ],
    },
    {
      id: 'folders',
      title: 'Folders',
      collapsible: true,
      defaultExpanded: true,
      items: [
        { id: 'folders-item', label: 'Folders', icon: 'folder', hasMenu: true, hash: '#agreements/folders' },
      ],
      hasDivider: true,
    },
    {
      id: 'features',
      hasDivider: true,
      items: [
        { id: 'parties', label: 'Parties', icon: 'users', badge: 'New', hash: '#agreements/parties' },
        { id: 'requests', label: 'Requests', icon: 'send', badge: 'New', hash: '#agreements/requests' },
        { id: 'maestro', label: 'Maestro Workflows', icon: 'list', badge: 'New', hash: '#agreements/maestro' },
        { id: 'workspaces', label: 'Workspaces', icon: 'grid', hash: '#agreements/workspaces' },
        { id: 'powerforms', label: 'PowerForms', icon: 'zap', hash: '#agreements/powerforms' },
        { id: 'bulk-send', label: 'Bulk Send', icon: 'copy', hash: '#agreements/bulk-send' },
      ],
    },
  ],
};

const homeSidebar: SidebarConfig = {
  headerLabel: 'Start',
  headerIcon: 'plus',
  headerMenuItems: [
    { id: 'new-agreement', label: 'New Agreement', icon: 'edit' },
    { id: 'upload', label: 'Upload Document', icon: 'upload' },
  ],
  sections: [
    {
      id: 'home-main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'home', hash: '#home' },
        { id: 'action-required', label: 'Action Required', icon: 'bolt', hash: '#home/action-required' },
        { id: 'waiting', label: 'Waiting for Others', icon: 'clock', hash: '#home/waiting' },
        { id: 'expiring', label: 'Expiring Soon', icon: 'calendar', hash: '#home/expiring' },
      ],
    },
  ],
};

const templatesSidebar: SidebarConfig = {
  headerLabel: 'New Template',
  headerIcon: 'plus',
  sections: [
    {
      id: 'templates-main',
      items: [
        { id: 'all-templates', label: 'All Templates', icon: 'document-stack', hash: '#templates' },
        { id: 'my-templates', label: 'My Templates', nested: true, hash: '#templates/mine' },
        { id: 'shared', label: 'Shared with Me', nested: true, hash: '#templates/shared' },
        { id: 'favorites', label: 'Favorites', icon: 'star', hash: '#templates/favorites' },
      ],
    },
  ],
};

const reportsSidebar: SidebarConfig = {
  headerLabel: 'New Report',
  headerIcon: 'plus',
  sections: [
    {
      id: 'reports-main',
      items: [
        { id: 'insights', label: 'Insights', icon: 'chart-bar', hash: '#reports' },
        { id: 'completion', label: 'Completion Rates', nested: true, hash: '#reports/completion' },
        { id: 'usage', label: 'Usage Analytics', nested: true, hash: '#reports/usage' },
        { id: 'audit-trail', label: 'Audit Trail', icon: 'eye', hash: '#reports/audit' },
      ],
    },
  ],
};

const adminSidebar: SidebarConfig = {
  headerLabel: 'Settings',
  headerIcon: 'settings',
  sections: [
    {
      id: 'admin-main',
      items: [
        { id: 'admin-overview', label: 'Overview', icon: 'shield', hash: '#admin' },
        { id: 'users', label: 'Users & Groups', icon: 'users', hash: '#admin/users' },
        { id: 'integrations', label: 'Integrations', icon: 'link', hash: '#admin/integrations' },
        { id: 'billing', label: 'Billing', icon: 'credit-card', hash: '#admin/billing' },
        { id: 'branding', label: 'Branding', icon: 'image', hash: '#admin/branding' },
      ],
    },
  ],
};

export const sidebars: Record<TabId, SidebarConfig> = {
  home: homeSidebar,
  agreements: agreementsSidebar,
  templates: templatesSidebar,
  reports: reportsSidebar,
  admin: adminSidebar,
};
