import { useState, useMemo } from 'react';
import {
  DocuSignShell,
  AgreementTableView,
  DataTable,
  PageHeader,
  FilterBar,
  Button,
  Badge,
  Icon,
} from '@/design-system';
import type { DataTableColumn } from '@/design-system/5-patterns/DataTable/types';
/* ═══════════════════════════════════════
   Nav View Type
   ═══════════════════════════════════════ */

type ActiveView = 'all-agreements' | 'drafts' | 'in-progress' | 'completed' | 'deleted' | 'parties';

/* ═══════════════════════════════════════
   GlobalNav Config
   ═══════════════════════════════════════ */

const globalNavConfig = {
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
   Agreements Data
   ═══════════════════════════════════════ */

interface Agreement {
  id: string;
  name: string;
  status: string;
  statusKind: 'success' | 'warning' | 'info' | 'neutral';
  sender: string;
  lastUpdated: string;
}

const AGREEMENTS_DATA: Agreement[] = [
  { id: '1', name: 'NDA - Acme Corporation', status: 'Completed', statusKind: 'success', sender: 'John Doe', lastUpdated: 'Mar 24, 2026' },
  { id: '2', name: 'MSA - TechStart Inc', status: 'Waiting for Review', statusKind: 'warning', sender: 'Jane Smith', lastUpdated: 'Mar 23, 2026' },
  { id: '3', name: 'SOW - Phase 2 Development', status: 'Draft', statusKind: 'neutral', sender: 'Jane Smith', lastUpdated: 'Mar 22, 2026' },
  { id: '4', name: 'Employment Agreement - Senior Engineer', status: 'Completed', statusKind: 'success', sender: 'HR Team', lastUpdated: 'Mar 21, 2026' },
  { id: '5', name: 'Vendor Agreement - CloudCo', status: 'Waiting for Signature', statusKind: 'info', sender: 'John Doe', lastUpdated: 'Mar 20, 2026' },
  { id: '6', name: 'Lease Amendment - Office Space', status: 'Completed', statusKind: 'success', sender: 'Legal Team', lastUpdated: 'Mar 19, 2026' },
  { id: '7', name: 'Consulting Agreement - DesignLab', status: 'Action Required', statusKind: 'warning', sender: 'Jane Smith', lastUpdated: 'Mar 18, 2026' },
];

const agreementColumns: DataTableColumn<Agreement>[] = [
  { key: 'name', label: 'Agreement Name', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (_value, row) => (
      <Badge kind={row.statusKind} size="small">{row.status}</Badge>
    ),
  },
  { key: 'sender', label: 'Sender' },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true },
];

/* ═══════════════════════════════════════
   Parties Data
   ═══════════════════════════════════════ */

interface Party {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  documents: number;
}

const PARTIES_DATA: Party[] = [
  { id: '1', name: 'Acme Corporation', email: 'contact@acme.com', role: 'Signer', status: 'active', documents: 12 },
  { id: '2', name: 'Global Industries Inc.', email: 'legal@globalind.com', role: 'Reviewer', status: 'active', documents: 8 },
  { id: '3', name: 'Tech Solutions LLC', email: 'admin@techsol.com', role: 'Signer', status: 'pending', documents: 3 },
  { id: '4', name: 'Finance Partners LTD', email: 'finance@finpartners.com', role: 'Witness', status: 'active', documents: 24 },
  { id: '5', name: 'Regional Services Co.', email: 'ops@regionalservices.com', role: 'Signer', status: 'inactive', documents: 5 },
  { id: '6', name: 'International Ventures', email: 'contact@intventures.com', role: 'Reviewer', status: 'active', documents: 18 },
];

const STATUS_KIND_MAP: Record<Party['status'], 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'neutral',
};

const partyColumns: DataTableColumn<Party>[] = [
  { key: 'name', label: 'Party Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (_value, row) => (
      <Badge kind={STATUS_KIND_MAP[row.status]} size="small">
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  { key: 'documents', label: 'Documents', sortable: true },
];

/* ═══════════════════════════════════════
   Page Component
   ═══════════════════════════════════════ */

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('parties');
  const [search, setSearch] = useState('');

  /* ── LocalNav config — built dynamically so active state tracks ── */
  const localNavConfig = {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-agreement', label: 'New Agreement', icon: 'edit' as const },
      { id: 'new-template', label: 'New Template', icon: 'star' as const },
      { id: 'upload', label: 'Upload Document', icon: 'upload' as const },
    ],
    activeItemId: activeView,
    sections: [
      {
        id: 'agreements',
        items: [
          {
            id: 'all-agreements',
            label: 'All Agreements',
            icon: 'inbox' as const,
            onClick: () => setActiveView('all-agreements'),
          },
          {
            id: 'drafts',
            label: 'Drafts',
            nested: true,
            onClick: () => setActiveView('drafts'),
          },
          {
            id: 'in-progress',
            label: 'In Progress',
            nested: true,
            onClick: () => setActiveView('in-progress'),
          },
          {
            id: 'completed',
            label: 'Completed',
            nested: true,
            onClick: () => setActiveView('completed'),
          },
          {
            id: 'deleted',
            label: 'Deleted',
            nested: true,
            onClick: () => setActiveView('deleted'),
          },
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
          {
            id: 'parties',
            label: 'Parties',
            icon: 'people' as const,
            badge: 'New',
            onClick: () => setActiveView('parties'),
          },
          { id: 'requests', label: 'Requests', icon: 'send' as const, badge: 'New' },
          { id: 'maestro', label: 'Maestro Workflows', icon: 'list' as const, badge: 'New' },
          { id: 'workspaces', label: 'Workspaces', icon: 'grid' as const },
          { id: 'powerforms', label: 'PowerForms', icon: 'zap' as const },
          { id: 'bulk-send', label: 'Bulk Send', icon: 'copy' as const },
        ],
      },
    ],
  };

  /* ── Filtered data ── */
  const filteredAgreements = useMemo(() => {
    if (!search) return AGREEMENTS_DATA;
    const q = search.toLowerCase();
    return AGREEMENTS_DATA.filter(
      (a) => a.name.toLowerCase().includes(q) || a.sender.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredParties = useMemo(() => {
    if (!search) return PARTIES_DATA;
    const q = search.toLowerCase();
    return PARTIES_DATA.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
    );
  }, [search]);

  /* ── Resolve view label for "stub" views ── */
  const VIEW_LABELS: Record<ActiveView, string> = {
    'all-agreements': 'All Agreements',
    drafts: 'Drafts',
    'in-progress': 'In Progress',
    completed: 'Completed',
    deleted: 'Deleted',
    parties: 'Parties',
  };

  const isPartiesView = activeView === 'parties';
  const isAgreementsView = !isPartiesView;

  return (
    <DocuSignShell globalNav={globalNavConfig} localNav={localNavConfig}>
      <AgreementTableView
        pageHeader={
          <PageHeader
            title={VIEW_LABELS[activeView]}
            showAIBadge={isAgreementsView}
            actions={
              isPartiesView ? (
                <Button kind="brand" startElement={<Icon name="plus" size={16} />}>
                  Add Party
                </Button>
              ) : (
                <Button kind="brand">New Agreement</Button>
              )
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
            showSearchIndicator={isAgreementsView}
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
            data={filteredParties}
            getRowKey={(row) => row.id}
            selectable
            stickyHeader
            emptyMessage="No parties match your search"
            pagination={{
              page: 1,
              pageSize: 25,
              totalItems: filteredParties.length,
              onPageChange: () => {},
              onPageSizeChange: () => {},
              showInfo: true,
            }}
          />
        ) : (
          <DataTable
            columns={agreementColumns}
            data={filteredAgreements}
            getRowKey={(row) => row.id}
            selectable
            stickyHeader
            emptyMessage="No agreements match your search"
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
