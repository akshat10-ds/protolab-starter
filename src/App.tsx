import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  DocuSignShell,
  FilterBar,
  Inline,
  LocalNavProps,
  PageHeader,
  Select,
  Text,
} from '@/design-system';

type AgreementStatus = 'Completed' | 'In Progress' | 'Sent' | 'Draft' | 'Voided';

interface AgreementRow {
  id: string;
  name: string;
  recipient: string;
  sender: string;
  status: AgreementStatus;
  lastUpdated: string;
}

const AGREEMENTS: AgreementRow[] = [
  {
    id: 'AGR-2001',
    name: 'MSA Renewal - Northwind Logistics',
    recipient: 'Taylor Brooks',
    sender: 'Legal Ops',
    status: 'In Progress',
    lastUpdated: 'May 14, 2026',
  },
  {
    id: 'AGR-2002',
    name: 'Vendor Addendum - Helios Cloud',
    recipient: 'Priya Shah',
    sender: 'Procurement',
    status: 'Sent',
    lastUpdated: 'May 13, 2026',
  },
  {
    id: 'AGR-2003',
    name: 'NDA - Acme Embedded Systems',
    recipient: 'Avery Chen',
    sender: 'Sales',
    status: 'Completed',
    lastUpdated: 'May 11, 2026',
  },
  {
    id: 'AGR-2004',
    name: 'SOW - Blue Pine Consulting',
    recipient: 'Jordan Diaz',
    sender: 'Customer Success',
    status: 'Draft',
    lastUpdated: 'May 10, 2026',
  },
  {
    id: 'AGR-2005',
    name: 'Reseller Agreement - Summit Point',
    recipient: 'Riley Morgan',
    sender: 'Channel Ops',
    status: 'Voided',
    lastUpdated: 'May 8, 2026',
  },
  {
    id: 'AGR-2006',
    name: 'Order Form - Solstice Labs',
    recipient: 'Mina Patel',
    sender: 'Sales',
    status: 'Completed',
    lastUpdated: 'May 7, 2026',
  },
  {
    id: 'AGR-2007',
    name: 'Enterprise Renewal - Redwood Telecom',
    recipient: 'Noah Kim',
    sender: 'Renewals',
    status: 'In Progress',
    lastUpdated: 'May 6, 2026',
  },
  {
    id: 'AGR-2008',
    name: 'Security Addendum - Fairway Health',
    recipient: 'Sam Rivera',
    sender: 'Security',
    status: 'Sent',
    lastUpdated: 'May 4, 2026',
  },
];

const globalNavConfig = {
  logo: (
    <Text size="sm" weight="semibold" style={{ letterSpacing: '0.04em' }}>
      DOCUSIGN
    </Text>
  ),
  navItems: [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'agreements', label: 'Agreements', href: '#', active: true },
    { id: 'templates', label: 'Templates', href: '#' },
    { id: 'reports', label: 'Reports', href: '#' },
    { id: 'admin', label: 'Admin', href: '#' },
  ],
  showSearch: true,
  searchVariant: 'pill' as const,
  showNotifications: true,
  notificationCount: 4,
  showSettings: true,
  user: {
    name: 'Lamar Jordan',
  },
};

const localNavConfig: Omit<LocalNavProps, 'className'> = {
  headerLabel: 'New',
  sections: [
    {
      id: 'agreements',
      title: 'Agreements',
      items: [
        { id: 'all', label: 'All Agreements', active: true, badge: '128' },
        { id: 'drafts', label: 'Drafts', badge: '13' },
        { id: 'in-progress', label: 'In Progress', badge: '22' },
        { id: 'completed', label: 'Completed', badge: '81' },
      ],
    },
    {
      id: 'manage',
      title: 'Manage',
      hasDivider: true,
      items: [
        { id: 'deleted', label: 'Deleted' },
        { id: 'shared', label: 'Shared with Me' },
      ],
    },
  ],
};

function getStatusBadgeKind(status: AgreementStatus): 'success' | 'warning' | 'emphasis' | 'subtle' {
  if (status === 'Completed') return 'success';
  if (status === 'In Progress') return 'warning';
  if (status === 'Sent') return 'emphasis';
  return 'subtle';
}

export default function App() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AgreementStatus>('All');
  const [senderFilter, setSenderFilter] = useState<'All' | string>('All');

  const senderOptions = useMemo(() => ['All', ...new Set(AGREEMENTS.map((agreement) => agreement.sender))], []);

  const filteredAgreements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return AGREEMENTS.filter((agreement) => {
      const matchesSearch =
        query.length === 0 ||
        agreement.name.toLowerCase().includes(query) ||
        agreement.id.toLowerCase().includes(query) ||
        agreement.recipient.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'All' || agreement.status === statusFilter;
      const matchesSender = senderFilter === 'All' || agreement.sender === senderFilter;

      return matchesSearch && matchesStatus && matchesSender;
    });
  }, [search, statusFilter, senderFilter]);

  const agreementColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Agreement',
        sortable: true,
        width: '44%',
        cell: (row: AgreementRow) => (
          <div>
            <Text size="sm" weight="medium">
              {row.name}
            </Text>
            <Text size="xs" color="secondary">
              {row.id}
            </Text>
          </div>
        ),
        sortValue: (row: AgreementRow) => row.name,
      },
      {
        key: 'recipient',
        header: 'Recipient',
        sortable: true,
        cell: (row: AgreementRow) => <Text size="sm">{row.recipient}</Text>,
      },
      {
        key: 'sender',
        header: 'Sender',
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        cell: (row: AgreementRow) => (
          <Badge text={row.status} kind={getStatusBadgeKind(row.status)} startElement />
        ),
      },
      {
        key: 'lastUpdated',
        header: 'Last Updated',
        sortable: true,
      },
      {
        key: 'actions',
        header: '',
        alignment: 'right' as const,
        cell: (row: AgreementRow) => (
          <Inline gap="small" justify="end">
            <Button
              kind="secondary"
              size="small"
              aria-label={`Open agreement ${row.name}`}
            >
              Open
            </Button>
          </Inline>
        ),
      },
    ],
    []
  );

  return (
    <DocuSignShell globalNav={globalNavConfig} localNav={localNavConfig}>
      <div style={{ padding: 'var(--ink-spacing-6)' }}>
        <PageHeader
          title="Agreements"
          actions={
            <>
              <Button kind="secondary">Export</Button>
              <Button kind="primary">New Agreement</Button>
            </>
          }
        />

        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search by agreement name, ID, or recipient',
          }}
          filters={
            <Inline gap="small" align="center">
              <Select
                label="Status"
                hideLabel
                size="small"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | AgreementStatus)}
                width="180px"
              >
                <option value="All">All statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Sent">Sent</option>
                <option value="Draft">Draft</option>
                <option value="Voided">Voided</option>
              </Select>

              <Select
                label="Sender"
                hideLabel
                size="small"
                value={senderFilter}
                onChange={(event) => setSenderFilter(event.target.value)}
                width="180px"
              >
                {senderOptions.map((sender) => (
                  <option key={sender} value={sender}>
                    {sender === 'All' ? 'All senders' : sender}
                  </option>
                ))}
              </Select>

              <Button
                kind="secondary"
                size="small"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setSenderFilter('All');
                }}
              >
                Clear Filters
              </Button>
            </Inline>
          }
        />

        <div style={{ marginTop: 'var(--ink-spacing-4)' }}>
          <DataTable
            columns={agreementColumns}
            data={filteredAgreements}
            getRowKey={(row) => row.id}
            stickyHeader
            rowHeight="default"
            emptyMessage="No agreements match your current filters."
            pagination={{
              page: 1,
              pageSize: 10,
              totalItems: filteredAgreements.length,
              onPageChange: () => {},
              onPageSizeChange: () => {},
              showInfo: true,
            }}
          />
        </div>
      </div>
    </DocuSignShell>
  );
}
