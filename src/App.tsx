import { useState } from 'react';
import {
  DocuSignShell,
  AgreementTableView,
  PageHeader,
  FilterBar,
  DataTable,
  Button,
  Badge,
  Icon,
} from '@/design-system';

/* ═══════════════════════════════════════
   GlobalNav Config
   ALWAYS include: logo, 5 navItems, showSearch,
   showNotifications, showSettings, and user.
   ═══════════════════════════════════════ */

const globalNavConfig = {
  logo: <img src="/docusign-logo.svg" alt="DocuSign" />,
  navItems: [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'agreements', label: 'Agreements', href: '#', active: true },
    { id: 'templates', label: 'Templates', href: '#' },
    { id: 'reports', label: 'Reports', href: '#' },
    { id: 'admin', label: 'Admin', href: '#' },
  ],
  showSearch: true,
  showNotifications: true,
  notificationCount: 3,
  showSettings: true,
  user: { name: 'Jane Smith' },
};

/* ═══════════════════════════════════════
   LocalNav Config
   Use headerLabel + headerMenuItems for the
   "Start" button dropdown. Include 4-5 items.
   ═══════════════════════════════════════ */

const localNavConfig = {
  headerLabel: 'Start',
  headerIcon: 'plus' as const,
  headerMenuItems: [
    { id: 'new-agreement', label: 'New Agreement', icon: 'edit' as const },
    { id: 'new-template', label: 'New Template', icon: 'star' as const },
    { id: 'upload', label: 'Upload Document', icon: 'upload' as const },
  ],
  sections: [
    {
      id: 'agreements',
      items: [
        { id: 'all-agreements', label: 'All Agreements', icon: 'inbox' as const, active: true },
        { id: 'drafts', label: 'Drafts', nested: true },
        { id: 'in-progress', label: 'In Progress', nested: true },
        { id: 'completed', label: 'Completed', nested: true },
        { id: 'deleted', label: 'Deleted', nested: true },
      ],
    },
    {
      id: 'folders',
      title: 'Folders',
      collapsible: true,
      defaultExpanded: true,
      items: [
        { id: 'folders-item', label: 'Folders', icon: 'folder' as const, hasMenu: true },
      ],
      hasDivider: true,
    },
    {
      id: 'features',
      hasDivider: true,
      items: [
        { id: 'parties', label: 'Parties', icon: 'users' as const, badge: 'New' },
        { id: 'requests', label: 'Requests', icon: 'send' as const, badge: 'New' },
        { id: 'maestro', label: 'Maestro Workflows', icon: 'list' as const, badge: 'New' },
        { id: 'workspaces', label: 'Workspaces', icon: 'grid' as const },
        { id: 'powerforms', label: 'PowerForms', icon: 'zap' as const },
        { id: 'bulk-send', label: 'Bulk Send', icon: 'copy' as const },
      ],
    },
  ],
};

/* ═══════════════════════════════════════
   DataTable Config
   Data-driven: NO children. Pass columns + data.
   Tables are NOT wrapped in Cards (DocuSign convention).
   ═══════════════════════════════════════ */

interface Agreement {
  id: string;
  name: string;
  status: string;
  statusKind: 'success' | 'warning' | 'info' | 'neutral';
  sender: string;
  lastUpdated: string;
}

const columns = [
  { key: 'name', header: 'Agreement Name', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (row: Agreement) => (
      <Badge kind={row.statusKind} size="small">{row.status}</Badge>
    ),
  },
  { key: 'sender', header: 'Sender' },
  { key: 'lastUpdated', header: 'Last Updated', sortable: true },
];

const agreements: Agreement[] = [
  { id: '1', name: 'NDA - Acme Corporation', status: 'Completed', statusKind: 'success', sender: 'John Doe', lastUpdated: 'Mar 24, 2026' },
  { id: '2', name: 'MSA - TechStart Inc', status: 'Waiting for Review', statusKind: 'warning', sender: 'Jane Smith', lastUpdated: 'Mar 23, 2026' },
  { id: '3', name: 'SOW - Phase 2 Development', status: 'Draft', statusKind: 'neutral', sender: 'Jane Smith', lastUpdated: 'Mar 22, 2026' },
  { id: '4', name: 'Employment Agreement - Senior Engineer', status: 'Completed', statusKind: 'success', sender: 'HR Team', lastUpdated: 'Mar 21, 2026' },
  { id: '5', name: 'Vendor Agreement - CloudCo', status: 'Waiting for Signature', statusKind: 'info', sender: 'John Doe', lastUpdated: 'Mar 20, 2026' },
  { id: '6', name: 'Lease Amendment - Office Space', status: 'Completed', statusKind: 'success', sender: 'Legal Team', lastUpdated: 'Mar 19, 2026' },
  { id: '7', name: 'Consulting Agreement - DesignLab', status: 'Action Required', statusKind: 'warning', sender: 'Jane Smith', lastUpdated: 'Mar 18, 2026' },
];

/* ═══════════════════════════════════════
   App — List Page (Navigator Style)
   DocuSignShell > AgreementTableView > DataTable
   ═══════════════════════════════════════ */

export default function App() {
  const [search, setSearch] = useState('');

  return (
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={localNavConfig}
    >
      <AgreementTableView
        pageHeader={
          <PageHeader
            title="Agreements"
            showAIBadge
            actions={<Button kind="brand">New Agreement</Button>}
          />
        }
        filterBar={
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: 'Try keywords, phrases, or a question',
            }}
            showSearchIndicator
            filters={
              <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>
                Filters
              </Button>
            }
          />
        }
      >
        <DataTable
          columns={columns}
          data={agreements}
          getRowKey={(row) => row.id}
          selectable
          stickyHeader
          pagination={{
            page: 1,
            pageSize: 25,
            totalItems: 127,
            onPageChange: () => {},
            onPageSizeChange: () => {},
            showInfo: true,
          }}
        />
      </AgreementTableView>
    </DocuSignShell>
  );
}
