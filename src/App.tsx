import { useState, useMemo, useCallback } from 'react';
import {
  DocuSignShell,
  AgreementTableView,
  DataTable,
  PageHeader,
  FilterBar,
  Button,
  Badge,
  Icon,
  Card,
  Stack,
  Grid,
} from '@/design-system';

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type TabId = 'home' | 'agreements' | 'templates' | 'insights' | 'admin';
type SidebarView = 'all-agreements' | 'drafts' | 'in-progress' | 'completed' | 'deleted' | 'parties';

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

const agreementColumns = [
  { key: 'name', header: 'Agreement Name', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (row: Agreement) => <Badge kind={row.statusKind} size="small">{row.status}</Badge>,
  },
  { key: 'sender', header: 'Sender' },
  { key: 'lastUpdated', header: 'Last Updated', sortable: true },
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
  active: 'success', pending: 'warning', inactive: 'neutral',
};

const partyColumns = [
  { key: 'name', header: 'Party Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (row: Party) => (
      <Badge kind={STATUS_KIND_MAP[row.status]} size="small">
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  { key: 'documents', header: 'Documents', sortable: true },
];

/* ═══════════════════════════════════════
   Home Page
   ═══════════════════════════════════════ */

function HomePage() {
  const activity = [
    { name: 'Complete with Docusign: rhi.pdf, Sample_Service_Agreement.pdf', time: '6 days ago', status: 'Voided', statusIcon: 'slash' as const },
    { name: 'Here is your signed document: Sample_Service_Agreement.pdf', time: '6 days ago', status: 'Voided', statusIcon: 'slash' as const },
    { name: 'Complete with Docusign: rhi.pdf', time: '6 days ago', status: 'Voided', statusIcon: 'slash' as const },
    { name: 'Change Order.docx', time: 'Expiring on 07/31/2026', status: 'Expiring Soon', statusIcon: 'clock' as const },
    { name: 'SOW(2).docx', time: 'Expiring on 06/30/2026', status: 'Expiring Soon', statusIcon: 'clock' as const },
    { name: 'SOW(1).docx', time: 'Expiring on 06/30/2026', status: 'Expiring Soon', statusIcon: 'clock' as const },
  ];

  const overview = [
    { label: 'Open requests', value: 7 },
    { label: 'Waiting for others', value: 0 },
    { label: 'Expiring soon', value: 0 },
    { label: 'Completed', value: 0 },
    { label: 'Upcoming renewals', value: 0 },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--ink-cobalt-100) 0%, var(--ink-cobalt-90) 100%)',
        color: 'white',
        padding: 'var(--ink-spacing-400) var(--ink-spacing-300)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 'var(--ink-spacing-200)' }}>
          Welcome back, DocuSign User
        </div>
        <div style={{ display: 'flex', gap: 'var(--ink-spacing-100)', justifyContent: 'center' }}>
          <Button kind="brand" size="small">Start</Button>
          <Button kind="secondary" size="small" startElement={<Icon name="play" size={14} />}>Send an Envelope</Button>
          <Button kind="secondary" size="small" startElement={<Icon name="sparkles" size={14} />}>Send with AI</Button>
          <Button kind="secondary" size="small" startElement={<Icon name="layout" size={14} />}>Create a Request</Button>
        </div>
      </div>

      <div style={{ padding: 'var(--ink-spacing-300)', display: 'flex', gap: 'var(--ink-spacing-300)' }}>
        {/* Left column */}
        <div style={{ flex: 1 }}>
          {/* Tasks */}
          <Card>
            <div style={{ padding: 'var(--ink-spacing-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ink-spacing-200)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-font-secondary)' }}>Tasks</span>
                <Icon name="chevron-right" size={16} />
              </div>
              <div style={{ padding: 'var(--ink-spacing-300) 0', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>You don't have any tasks yet</div>
                <div style={{ fontSize: 13, color: 'var(--ink-font-secondary)' }}>When you have new tasks assigned to you, they will show up here.</div>
              </div>
            </div>
          </Card>

          {/* Agreement Activity */}
          <Card style={{ marginTop: 'var(--ink-spacing-200)' }}>
            <div style={{ padding: 'var(--ink-spacing-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-50)', marginBottom: 'var(--ink-spacing-200)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-font-secondary)' }}>Agreement Activity</span>
                <Icon name="info" size={14} />
              </div>
              {activity.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--ink-spacing-150) 0',
                    borderTop: i > 0 ? '1px solid var(--ink-border-default)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-font-secondary)', marginTop: 2 }}>{item.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-100)', flexShrink: 0 }}>
                    <Icon name={item.statusIcon} size={14} />
                    <span style={{ fontSize: 13, color: 'var(--ink-font-secondary)' }}>{item.status}</span>
                    <Icon name="chevron-right" size={14} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column - Overview */}
        <div style={{ width: 240 }}>
          <Card>
            <div style={{ padding: 'var(--ink-spacing-200)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-font-secondary)' }}>Overview</span>
              <div style={{ marginTop: 'var(--ink-spacing-200)' }}>
                {overview.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: 'var(--ink-spacing-150) 0',
                      borderTop: i > 0 ? '1px solid var(--ink-border-default)' : 'none',
                      fontSize: 14,
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Insights Page
   ═══════════════════════════════════════ */

function InsightsPage() {
  const recents = [
    { name: 'Expiring agreements', time: 'viewed 5 days ago' },
    { name: 'Upcoming renewals', time: 'viewed 13 days ago' },
    { name: 'All agreements', time: 'viewed 32 days ago' },
    { name: 'Agreements with renewal notice date', time: 'viewed 34 days ago' },
    { name: 'Obligations by type', time: 'viewed 34 days ago' },
  ];

  const favorites = [
    'Envelope Velocity Report',
    'Agreement Trends',
    'Renewals Dashboard',
  ];

  return (
    <div style={{ padding: 'var(--ink-spacing-300)' }}>
      <PageHeader title="Overview" />

      <div style={{ marginTop: 'var(--ink-spacing-200)', marginBottom: 'var(--ink-spacing-300)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid var(--ink-border-default)',
          borderRadius: 'var(--ink-radius-md)',
          padding: 'var(--ink-spacing-100) var(--ink-spacing-150)',
          gap: 'var(--ink-spacing-100)',
        }}>
          <Icon name="search" size={16} />
          <span style={{ fontSize: 14, color: 'var(--ink-font-secondary)' }}>Find reports or dashboards</span>
        </div>
      </div>

      <Grid columns={2} gap="medium">
        {/* Your Recents */}
        <Card>
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Your Recents</span>
            <Stack gap={0} style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {recents.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--ink-spacing-100) 0',
                  borderTop: i > 0 ? '1px solid var(--ink-border-default)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-100)' }}>
                    <Icon name="bar-chart-2" size={16} />
                    <span style={{ fontSize: 14 }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-font-secondary)' }}>{r.time}</span>
                </div>
              ))}
            </Stack>
            <div style={{ textAlign: 'center', marginTop: 'var(--ink-spacing-150)', borderTop: '1px solid var(--ink-border-default)', paddingTop: 'var(--ink-spacing-100)' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-cobalt-90)', cursor: 'pointer' }}>View all</span>
            </div>
          </div>
        </Card>

        {/* Your Favorites */}
        <Card>
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Your Favorites</span>
            <Stack gap={0} style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {favorites.map((f, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ink-spacing-100)',
                  padding: 'var(--ink-spacing-100) 0',
                  borderTop: i > 0 ? '1px solid var(--ink-border-default)' : 'none',
                }}>
                  <Icon name="bar-chart-2" size={16} />
                  <span style={{ fontSize: 14 }}>{f}</span>
                </div>
              ))}
            </Stack>
          </div>
        </Card>
      </Grid>

      {/* Weekly Insights */}
      <div style={{ marginTop: 'var(--ink-spacing-300)' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Weekly Insights</span>
        <Grid columns={2} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
          <Card>
            <div style={{ padding: 'var(--ink-spacing-200)', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 'var(--ink-spacing-200)' }}>All agreements</div>
              <div style={{ fontSize: 12, color: 'var(--ink-font-secondary)' }}>Count</div>
              <div style={{ fontSize: 36, fontWeight: 600, margin: 'var(--ink-spacing-100) 0' }}>42,357</div>
              <div style={{ fontSize: 13 }}>Agreements</div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--ink-spacing-200)', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 'var(--ink-spacing-200)' }}>New agreements ingested</div>
              <div style={{ fontSize: 12, color: 'var(--ink-font-secondary)' }}>Count</div>
              <div style={{ fontSize: 36, fontWeight: 600, margin: 'var(--ink-spacing-100) 0' }}>25</div>
              <div style={{ fontSize: 13 }}>Agreements</div>
            </div>
          </Card>
        </Grid>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Templates Page
   ═══════════════════════════════════════ */

function TemplatesPage() {
  return (
    <div style={{ padding: 'var(--ink-spacing-300)' }}>
      <PageHeader title="Templates" actions={<Button kind="brand">New Template</Button>} />
      <div style={{
        marginTop: 'var(--ink-spacing-200)',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--ink-border-default)',
        borderRadius: 'var(--ink-radius-md)',
        padding: 'var(--ink-spacing-100) var(--ink-spacing-150)',
        gap: 'var(--ink-spacing-100)',
        maxWidth: 400,
      }}>
        <Icon name="search" size={16} />
        <span style={{ fontSize: 14, color: 'var(--ink-font-secondary)' }}>Search templates</span>
      </div>
      <div style={{ marginTop: 'var(--ink-spacing-400)', textAlign: 'center', color: 'var(--ink-font-secondary)' }}>
        <Icon name="file-text" size={48} />
        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 'var(--ink-spacing-150)', color: 'var(--ink-font-default)' }}>No templates yet</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Create your first template to streamline your workflow.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Admin Page
   ═══════════════════════════════════════ */

function AdminPage() {
  return (
    <div style={{ padding: 'var(--ink-spacing-300)' }}>
      <PageHeader title="Admin" />
      <div style={{ marginTop: 'var(--ink-spacing-400)', textAlign: 'center' }}>
        <Icon name="settings" size={48} />
        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 'var(--ink-spacing-150)' }}>Account Settings</div>
        <div style={{ fontSize: 13, color: 'var(--ink-font-secondary)', marginTop: 4 }}>Manage users, billing, and account preferences.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   App
   ═══════════════════════════════════════ */

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [sidebarView, setSidebarView] = useState<SidebarView>('all-agreements');
  const [search, setSearch] = useState('');

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId as TabId);
    setSearch('');
    if (tabId === 'agreements') setSidebarView('all-agreements');
  }, []);

  /* ── GlobalNav — matches production DocuSign ── */
  const globalNavConfig = {
    logo: <img src="/docusign-logo.svg" alt="DocuSign" />,
    showAppSwitcher: true,
    onAppSwitcherClick: () => {},
    navItems: [
      { id: 'home', label: 'Home', active: activeTab === 'home', onClick: () => handleTabClick('home') },
      { id: 'agreements', label: 'Agreements', active: activeTab === 'agreements', onClick: () => handleTabClick('agreements') },
      { id: 'templates', label: 'Templates', active: activeTab === 'templates', onClick: () => handleTabClick('templates') },
      { id: 'insights', label: 'Insights', active: activeTab === 'insights', onClick: () => handleTabClick('insights') },
      { id: 'admin', label: 'Admin', active: activeTab === 'admin', onClick: () => handleTabClick('admin') },
    ],
    showSettings: true,
    settingsIcon: 'sliders-horizontal' as const,
    user: { name: 'DocuSign User' },
  };

  /* ── LocalNav — Agreements tab ── */
  const agreementsSidebar = {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-agreement', label: 'New Agreement', icon: 'edit' as const },
      { id: 'new-template', label: 'New Template', icon: 'star' as const },
      { id: 'upload', label: 'Upload Document', icon: 'upload' as const },
    ],
    activeItemId: sidebarView,
    sections: [
      {
        id: 'agreements',
        items: [
          { id: 'all-agreements', label: 'All Agreements', icon: 'inbox' as const, onClick: () => setSidebarView('all-agreements') },
          { id: 'drafts', label: 'Drafts', nested: true, onClick: () => setSidebarView('drafts') },
          { id: 'in-progress', label: 'In Progress', nested: true, onClick: () => setSidebarView('in-progress') },
          { id: 'completed', label: 'Completed', nested: true, onClick: () => setSidebarView('completed') },
          { id: 'deleted', label: 'Deleted', nested: true, onClick: () => setSidebarView('deleted') },
        ],
      },
      { id: 'folders-divider', hasDivider: true, items: [
        { id: 'folders-item', label: 'Folders', icon: 'folder' as const, hasMenu: true },
      ]},
      {
        id: 'features',
        hasDivider: true,
        items: [
          { id: 'parties', label: 'Parties', icon: 'people' as const, badge: 'New', onClick: () => setSidebarView('parties') },
          { id: 'requests', label: 'Requests', icon: 'send' as const, badge: 'New' },
          { id: 'maestro', label: 'Maestro Workflows', icon: 'list' as const, badge: 'New' },
          { id: 'workspaces', label: 'Workspaces', icon: 'grid' as const },
          { id: 'powerforms', label: 'PowerForms', icon: 'zap' as const },
          { id: 'bulk-send', label: 'Bulk Send', icon: 'copy' as const },
        ],
      },
    ],
  };

  /* ── Insights sidebar ── */
  const insightsSidebar = {
    headerLabel: 'Create',
    headerIcon: 'plus' as const,
    sections: [
      {
        id: 'insights-nav',
        items: [
          { id: 'overview', label: 'Overview', icon: 'home' as const, active: true },
          { id: 'dashboards', label: 'Dashboards', icon: 'grid' as const },
          { id: 'reports', label: 'Reports', icon: 'bar-chart-2' as const },
        ],
      },
    ],
  };

  /* ── Filtered data ── */
  const filteredAgreements = useMemo(() => {
    if (!search) return AGREEMENTS_DATA;
    const q = search.toLowerCase();
    return AGREEMENTS_DATA.filter((a) => a.name.toLowerCase().includes(q) || a.sender.toLowerCase().includes(q));
  }, [search]);

  const filteredParties = useMemo(() => {
    if (!search) return PARTIES_DATA;
    const q = search.toLowerCase();
    return PARTIES_DATA.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [search]);

  const VIEW_LABELS: Record<SidebarView, string> = {
    'all-agreements': 'All Agreements', drafts: 'Drafts', 'in-progress': 'In Progress',
    completed: 'Completed', deleted: 'Deleted', parties: 'Parties',
  };

  const isPartiesView = sidebarView === 'parties';

  /* ── Agreements content ── */
  const agreementsContent = (
    <AgreementTableView
      pageHeader={
        <PageHeader
          title={VIEW_LABELS[sidebarView]}
          showAIBadge={!isPartiesView}
          actions={isPartiesView
            ? <Button kind="brand" startElement={<Icon name="plus" size={16} />}>Add Party</Button>
            : <Button kind="brand">New Agreement</Button>
          }
        />
      }
      filterBar={
        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: isPartiesView ? 'Search parties by name, email, or role' : 'Search Envelopes',
          }}
          showSearchIndicator={!isPartiesView}
          filters={<>
            <Button kind="secondary" size="small">Status</Button>
            <Button kind="secondary" size="small">Sender</Button>
            <Button kind="secondary" size="small">Quick views</Button>
          </>}
        />
      }
    >
      {isPartiesView ? (
        <DataTable columns={partyColumns} data={filteredParties} getRowKey={(row) => row.id} selectable stickyHeader emptyMessage="No parties match your search" pagination={{ page: 1, pageSize: 25, totalItems: filteredParties.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : (
        <DataTable columns={agreementColumns} data={filteredAgreements} getRowKey={(row) => row.id} selectable stickyHeader emptyMessage="No agreements match your search" pagination={{ page: 1, pageSize: 25, totalItems: 127, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      )}
    </AgreementTableView>
  );

  /* ── Resolve content + sidebar ── */
  const sidebarMap: Record<TabId, object | undefined> = {
    home: undefined,
    agreements: agreementsSidebar,
    templates: undefined,
    insights: insightsSidebar,
    admin: undefined,
  };

  const contentMap: Record<TabId, JSX.Element> = {
    home: <HomePage />,
    agreements: agreementsContent,
    templates: <TemplatesPage />,
    insights: <InsightsPage />,
    admin: <AdminPage />,
  };

  return (
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={sidebarMap[activeTab]}
    >
      {contentMap[activeTab]}
    </DocuSignShell>
  );
}
