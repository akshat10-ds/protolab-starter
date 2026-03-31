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

/* ─── GlobalNav ──────────────────────────────────────────────────────────── */

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

/* ─── Agreements data ────────────────────────────────────────────────────── */

interface Agreement {
  id: string;
  name: string;
  status: string;
  statusKind: 'success' | 'warning' | 'info' | 'neutral';
  sender: string;
  lastUpdated: string;
}

const agreementColumns = [
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

/* ─── Parties data ───────────────────────────────────────────────────────── */

interface Party {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  statusKind: 'success' | 'warning' | 'info' | 'neutral';
  documents: number;
}

const partyColumns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (row: Party) => (
      <Badge kind={row.statusKind} size="small">{row.status}</Badge>
    ),
  },
  { key: 'documents', header: 'Documents', sortable: true },
];

const parties: Party[] = [
  { id: '1', name: 'Acme Corporation', email: 'legal@acme.com', role: 'Signer', status: 'Active', statusKind: 'success', documents: 14 },
  { id: '2', name: 'TechStart Inc', email: 'contracts@techstart.io', role: 'Recipient', status: 'Active', statusKind: 'success', documents: 6 },
  { id: '3', name: 'DesignLab Studio', email: 'hello@designlab.co', role: 'Approver', status: 'Pending', statusKind: 'warning', documents: 3 },
  { id: '4', name: 'CloudCo Services', email: 'vendor@cloudco.com', role: 'Signer', status: 'Active', statusKind: 'success', documents: 9 },
  { id: '5', name: 'GlobalTech Partners', email: 'partners@globaltech.com', role: 'Recipient', status: 'Inactive', statusKind: 'neutral', documents: 1 },
  { id: '6', name: 'NextGen Solutions', email: 'info@nextgen.dev', role: 'Signer', status: 'Pending', statusKind: 'warning', documents: 2 },
];

/* ─── App ────────────────────────────────────────────────────────────────── */

export default function App() {
  const [activeNavItem, setActiveNavItem] = useState('all-agreements');
  const [search, setSearch] = useState('');

  const isPartiesView = activeNavItem === 'parties';

  const localNavConfig = {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-agreement', label: 'New Agreement', icon: 'edit' as const },
      { id: 'new-template', label: 'New Template', icon: 'star' as const },
      { id: 'upload', label: 'Upload Document', icon: 'upload' as const },
    ],
    activeItemId: activeNavItem,
    sections: [
      {
        id: 'agreements',
        items: [
          { id: 'all-agreements', label: 'All Agreements', icon: 'inbox' as const, onClick: () => setActiveNavItem('all-agreements') },
          { id: 'drafts', label: 'Drafts', nested: true, onClick: () => setActiveNavItem('drafts') },
          { id: 'in-progress', label: 'In Progress', nested: true, onClick: () => setActiveNavItem('in-progress') },
          { id: 'completed', label: 'Completed', nested: true, onClick: () => setActiveNavItem('completed') },
          { id: 'deleted', label: 'Deleted', nested: true, onClick: () => setActiveNavItem('deleted') },
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
          { id: 'parties', label: 'Parties', icon: 'people' as const, badge: 'New', onClick: () => setActiveNavItem('parties') },
          { id: 'requests', label: 'Requests', icon: 'send' as const, badge: 'New', onClick: () => setActiveNavItem('requests') },
          { id: 'maestro', label: 'Maestro Workflows', icon: 'list' as const, badge: 'New', onClick: () => setActiveNavItem('maestro') },
          { id: 'workspaces', label: 'Workspaces', icon: 'grid' as const, onClick: () => setActiveNavItem('workspaces') },
          { id: 'powerforms', label: 'PowerForms', icon: 'zap' as const, onClick: () => setActiveNavItem('powerforms') },
          { id: 'bulk-send', label: 'Bulk Send', icon: 'copy' as const, onClick: () => setActiveNavItem('bulk-send') },
        ],
      },
    ],
  };

  return (
    <DocuSignShell globalNav={globalNavConfig} localNav={localNavConfig}>
      <AgreementTableView
        pageHeader={
          <PageHeader
            title={isPartiesView ? 'Parties' : 'Agreements'}
            showAIBadge
            actions={
              <Button kind="brand">
                {isPartiesView ? 'Add Party' : 'New Agreement'}
              </Button>
            }
          />
        }
        filterBar={
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: isPartiesView
                ? 'Search parties by name, email, or role'
                : 'Try keywords, phrases, or a question',
            }}
            showSearchIndicator={!isPartiesView}
            filters={
              <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>
                Filters
              </Button>
            }
          />
        }
      >
        {isPartiesView ? (
          <DataTable
            columns={partyColumns}
            data={parties}
            getRowKey={(row) => row.id}
            selectable
            stickyHeader
            pagination={{
              page: 1,
              pageSize: 25,
              totalItems: parties.length,
              onPageChange: () => {},
              onPageSizeChange: () => {},
              showInfo: true,
            }}
          />
        ) : (
          <DataTable
            columns={agreementColumns}
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
        )}
      </AgreementTableView>
    </DocuSignShell>
  );
}
