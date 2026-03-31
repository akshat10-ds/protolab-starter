import { useState, useCallback } from 'react';
import {
  DocuSignShell,
  AgreementTableView,
  PageHeader,
  FilterBar,
  DataTable,
  Button,
  Badge,
  Icon,
  Card,
  Stack,
  Grid,
  ProgressBar,
} from '@/design-system';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type TabId = 'home' | 'agreements' | 'templates' | 'reports' | 'admin';

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

/* ─── Templates data ─────────────────────────────────────────────────────── */

interface Template {
  id: string;
  name: string;
  category: string;
  lastUsed: string;
  uses: number;
}

const templateColumns = [
  { key: 'name', header: 'Template Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'lastUsed', header: 'Last Used', sortable: true },
  { key: 'uses', header: 'Uses', sortable: true },
];

const templates: Template[] = [
  { id: '1', name: 'Standard NDA', category: 'Legal', lastUsed: 'Mar 24, 2026', uses: 47 },
  { id: '2', name: 'Employment Offer Letter', category: 'HR', lastUsed: 'Mar 22, 2026', uses: 31 },
  { id: '3', name: 'Master Services Agreement', category: 'Legal', lastUsed: 'Mar 20, 2026', uses: 28 },
  { id: '4', name: 'Vendor Onboarding', category: 'Procurement', lastUsed: 'Mar 18, 2026', uses: 15 },
  { id: '5', name: 'Sales Proposal', category: 'Sales', lastUsed: 'Mar 15, 2026', uses: 52 },
];

/* ─── Home Page ──────────────────────────────────────────────────────────── */

function HomePage() {
  const metrics = [
    { label: 'Total Agreements', value: '1,247', icon: 'inbox' as const, kind: 'info' as const },
    { label: 'Pending Review', value: '23', icon: 'clock' as const, kind: 'warning' as const },
    { label: 'Completed', value: '1,189', icon: 'check-circle' as const, kind: 'success' as const },
    { label: 'Action Required', value: '35', icon: 'alert-triangle' as const, kind: 'warning' as const },
  ];

  const recentActivity = [
    { text: 'NDA - Acme Corporation was completed', time: '2 hours ago' },
    { text: 'MSA - TechStart Inc is waiting for review', time: '4 hours ago' },
    { text: 'SOW - Phase 2 Development was created', time: '1 day ago' },
    { text: 'Vendor Agreement - CloudCo sent for signature', time: '2 days ago' },
    { text: 'Employment Agreement signed by all parties', time: '3 days ago' },
  ];

  return (
    <div style={{ padding: 'var(--ink-spacing-300)' }}>
      <PageHeader title="Home" showAIBadge />
      <Grid columns={4} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
        {metrics.map((m) => (
          <Card key={m.label}>
            <Stack gap={8} style={{ padding: 'var(--ink-spacing-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-font-secondary)' }}>{m.label}</span>
                <Icon name={m.icon} size={16} />
              </div>
              <span style={{ fontSize: 28, fontWeight: 600 }}>{m.value}</span>
              <Badge kind={m.kind} size="small">{m.label.split(' ').pop()}</Badge>
            </Stack>
          </Card>
        ))}
      </Grid>

      <Card style={{ marginTop: 'var(--ink-spacing-300)' }}>
        <Stack gap={0} style={{ padding: 'var(--ink-spacing-200)' }}>
          <span style={{ fontSize: 15, fontWeight: 600, marginBottom: 'var(--ink-spacing-100)' }}>Recent Activity</span>
          {recentActivity.map((item, i) => (
            <div
              key={i}
              style={{
                padding: 'var(--ink-spacing-100) 0',
                borderBottom: i < recentActivity.length - 1 ? '1px solid var(--ink-border-default)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13 }}>{item.text}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-font-secondary)', whiteSpace: 'nowrap', marginLeft: 'var(--ink-spacing-200)' }}>{item.time}</span>
            </div>
          ))}
        </Stack>
      </Card>
    </div>
  );
}

/* ─── Reports Page ───────────────────────────────────────────────────────── */

function ReportsPage() {
  const stats = [
    { label: 'Average Completion Time', value: '2.3 days', progress: 65 },
    { label: 'On-Time Rate', value: '94%', progress: 94 },
    { label: 'Templates Reuse Rate', value: '78%', progress: 78 },
  ];

  const topSenders = [
    { name: 'Jane Smith', count: 47, pct: 100 },
    { name: 'John Doe', count: 35, pct: 74 },
    { name: 'Legal Team', count: 28, pct: 60 },
    { name: 'HR Team', count: 19, pct: 40 },
  ];

  return (
    <div style={{ padding: 'var(--ink-spacing-300)' }}>
      <PageHeader title="Reports" showAIBadge />
      <Grid columns={3} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
        {stats.map((s) => (
          <Card key={s.label}>
            <Stack gap={8} style={{ padding: 'var(--ink-spacing-200)' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-font-secondary)' }}>{s.label}</span>
              <span style={{ fontSize: 24, fontWeight: 600 }}>{s.value}</span>
              <ProgressBar value={s.progress} />
            </Stack>
          </Card>
        ))}
      </Grid>

      <Card style={{ marginTop: 'var(--ink-spacing-300)' }}>
        <Stack gap={12} style={{ padding: 'var(--ink-spacing-200)' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Top Senders</span>
          {topSenders.map((s) => (
            <div key={s.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span>{s.name}</span>
                <span style={{ color: 'var(--ink-font-secondary)' }}>{s.count} agreements</span>
              </div>
              <ProgressBar value={s.pct} />
            </div>
          ))}
        </Stack>
      </Card>
    </div>
  );
}

/* ─── Placeholder Page ───────────────────────────────────────────────────── */

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 'var(--ink-spacing-300)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Card>
        <Stack gap={12} align="center" style={{ padding: 'var(--ink-spacing-400)' }}>
          <Icon name="layout" size={32} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-font-secondary)' }}>This page is ready to be built. Try asking AI to create it!</span>
        </Stack>
      </Card>
    </div>
  );
}

/* ─── Sidebar configs per tab ────────────────────────────────────────────── */

function buildAgreementsSidebar(activeItem: string, setActiveItem: (id: string) => void) {
  return {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-agreement', label: 'New Agreement', icon: 'edit' as const },
      { id: 'new-template', label: 'New Template', icon: 'star' as const },
      { id: 'upload', label: 'Upload Document', icon: 'upload' as const },
    ],
    activeItemId: activeItem,
    sections: [
      {
        id: 'agreements',
        items: [
          { id: 'all-agreements', label: 'All Agreements', icon: 'inbox' as const, onClick: () => setActiveItem('all-agreements') },
          { id: 'drafts', label: 'Drafts', nested: true, onClick: () => setActiveItem('drafts') },
          { id: 'in-progress', label: 'In Progress', nested: true, onClick: () => setActiveItem('in-progress') },
          { id: 'completed', label: 'Completed', nested: true, onClick: () => setActiveItem('completed') },
          { id: 'deleted', label: 'Deleted', nested: true, onClick: () => setActiveItem('deleted') },
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
          { id: 'parties', label: 'Parties', icon: 'people' as const, badge: 'New', onClick: () => setActiveItem('parties') },
          { id: 'requests', label: 'Requests', icon: 'send' as const, badge: 'New', onClick: () => setActiveItem('requests') },
          { id: 'maestro', label: 'Maestro Workflows', icon: 'list' as const, badge: 'New', onClick: () => setActiveItem('maestro') },
          { id: 'workspaces', label: 'Workspaces', icon: 'grid' as const, onClick: () => setActiveItem('workspaces') },
          { id: 'powerforms', label: 'PowerForms', icon: 'zap' as const, onClick: () => setActiveItem('powerforms') },
          { id: 'bulk-send', label: 'Bulk Send', icon: 'copy' as const, onClick: () => setActiveItem('bulk-send') },
        ],
      },
    ],
  };
}

/* ─── App ────────────────────────────────────────────────────────────────── */

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('agreements');
  const [activeNavItem, setActiveNavItem] = useState('all-agreements');
  const [search, setSearch] = useState('');

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId as TabId);
    setSearch('');
    if (tabId === 'agreements') setActiveNavItem('all-agreements');
  }, []);

  const globalNavConfig = {
    logo: <img src="/docusign-logo.svg" alt="DocuSign" />,
    navItems: [
      { id: 'home', label: 'Home', active: activeTab === 'home', onClick: () => handleTabClick('home') },
      { id: 'agreements', label: 'Agreements', active: activeTab === 'agreements', onClick: () => handleTabClick('agreements') },
      { id: 'templates', label: 'Templates', active: activeTab === 'templates', onClick: () => handleTabClick('templates') },
      { id: 'reports', label: 'Reports', active: activeTab === 'reports', onClick: () => handleTabClick('reports') },
      { id: 'admin', label: 'Admin', active: activeTab === 'admin', onClick: () => handleTabClick('admin') },
    ],
    showSearch: true,
    showNotifications: true,
    notificationCount: 3,
    showSettings: true,
    user: { name: 'Jane Smith' },
  };

  const isPartiesView = activeNavItem === 'parties';

  // Agreements + Parties table view (OG layout)
  const agreementsContent = (
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
          pagination={{ page: 1, pageSize: 25, totalItems: parties.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }}
        />
      ) : (
        <DataTable
          columns={agreementColumns}
          data={agreements}
          getRowKey={(row) => row.id}
          selectable
          stickyHeader
          pagination={{ page: 1, pageSize: 25, totalItems: 127, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }}
        />
      )}
    </AgreementTableView>
  );

  // Templates table view
  const templatesContent = (
    <AgreementTableView
      pageHeader={<PageHeader title="Templates" showAIBadge actions={<Button kind="brand">New Template</Button>} />}
      filterBar={
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search templates' }}
          filters={<Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>Filters</Button>}
        />
      }
    >
      <DataTable
        columns={templateColumns}
        data={templates}
        getRowKey={(row) => row.id}
        selectable
        stickyHeader
        pagination={{ page: 1, pageSize: 25, totalItems: templates.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }}
      />
    </AgreementTableView>
  );

  // Pick content + sidebar based on active tab
  const showSidebar = activeTab === 'agreements';
  const localNav = showSidebar ? buildAgreementsSidebar(activeNavItem, setActiveNavItem) : undefined;

  let content;
  switch (activeTab) {
    case 'home': content = <HomePage />; break;
    case 'agreements': content = agreementsContent; break;
    case 'templates': content = templatesContent; break;
    case 'reports': content = <ReportsPage />; break;
    case 'admin': content = <PlaceholderPage title="Admin" />; break;
  }

  return (
    <DocuSignShell globalNav={globalNavConfig} localNav={localNav}>
      {content}
    </DocuSignShell>
  );
}
