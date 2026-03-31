import { useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavigatorPage from './NavigatorPage';
import {
  AgreementTableView,
  Badge,
  Button,
  DataTable,
  DocuSignShell,
  FilterBar,
  Icon,
  IconButton,
  Link,
  PageHeader,
  StatusLight,
  Text,
} from '@/design-system';
import type {
  DataTableColumn,
  DataTableSortDirection,
  PageSizeOption,
} from '@/design-system/5-patterns/DataTable/types';

type AgreementStatus = 'active' | 'inactive';
type SubtitleKind = 'completed' | 'uploaded';

interface Agreement {
  id: string;
  fileName: string;
  subtitleKind: SubtitleKind;
  subtitleLink: string;
  subtitleLinkLabel: string;
  hasAI: boolean;
  parties: string[];
  status: AgreementStatus;
  agreementType: string;
}

const AGREEMENTS: Agreement[] = [
  {
    id: 'agr-001',
    fileName: 'Sample_Service_Agreement.pdf',
    subtitleKind: 'completed',
    subtitleLink: '#',
    subtitleLinkLabel: 'Complete with Docusign: rhi.pdf, Sample_Service_Agreement.pdf',
    hasAI: true,
    parties: ['Acme Solutions, Inc.', 'GlobalTech Industries, LLC'],
    status: 'active',
    agreementType: 'Miscellaneous',
  },
  {
    id: 'agr-002',
    fileName: 'rhi.pdf',
    subtitleKind: 'completed',
    subtitleLink: '#',
    subtitleLinkLabel: 'Complete with Docusign: rhi.pdf, Sample_Service_Agreement.pdf',
    hasAI: true,
    parties: ['DocuSign International (EME...', 'ROBERT HALF INTERNATION...'],
    status: 'active',
    agreementType: 'Miscellaneous',
  },
  {
    id: 'agr-003',
    fileName: 'venkaTestFilename.mp3',
    subtitleKind: 'uploaded',
    subtitleLink: '#',
    subtitleLinkLabel: 'View Job',
    hasAI: true,
    parties: [],
    status: 'active',
    agreementType: '',
  },
  {
    id: 'agr-004',
    fileName: 'Screenshot 2026-03-18 at 10.27.30 AM.png',
    subtitleKind: 'completed',
    subtitleLink: '#',
    subtitleLinkLabel: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.30 AM.png',
    hasAI: true,
    parties: [],
    status: 'inactive',
    agreementType: 'Miscellaneous',
  },
  {
    id: 'agr-005',
    fileName: 'Screenshot 2026-03-18 at 10.27.21 AM.png',
    subtitleKind: 'completed',
    subtitleLink: '#',
    subtitleLinkLabel: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.21 AM.png',
    hasAI: true,
    parties: [],
    status: 'inactive',
    agreementType: 'Miscellaneous',
  },
  {
    id: 'agr-006',
    fileName: 'Screenshot 2026-03-18 at 10.27.30 AM.png',
    subtitleKind: 'completed',
    subtitleLink: '#',
    subtitleLinkLabel: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.30 AM.png',
    hasAI: true,
    parties: [],
    status: 'inactive',
    agreementType: 'Miscellaneous',
  },
  {
    id: 'agr-007',
    fileName: 'yourfilename',
    subtitleKind: 'uploaded',
    subtitleLink: '#',
    subtitleLinkLabel: 'View Job',
    hasAI: false,
    parties: [],
    status: 'inactive',
    agreementType: '',
  },
];

const globalNavConfig = {
  logo: <img src="/docusign-logo.svg" alt="DocuSign" />,
  navItems: [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'agreements', label: 'Agreements', href: '#', active: true },
    { id: 'templates', label: 'Templates', href: '#' },
    { id: 'insights', label: 'Insights', href: '#' },
    { id: 'admin', label: 'Admin', href: '#' },
  ],
  showSearch: true,
  showNotifications: true,
  notificationCount: 3,
  showSettings: true,
  user: { name: 'Jane Smith', email: 'jane@example.com' },
};

const localNavConfig = {
  headerLabel: 'Start',
  sections: [
    {
      id: 'main',
      items: [
        { id: 'all-agreements', label: 'All Agreements' },
        { id: 'drafts', label: 'Drafts' },
        { id: 'in-progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed', active: true },
        { id: 'deleted', label: 'Deleted' },
      ],
    },
    {
      id: 'folders',
      title: 'Folders',
      headerLabel: true,
      hasDivider: true,
      items: [
        { id: 'folders-all', label: 'All Folders' },
        { id: 'folders-procurement', label: 'Procurement' },
        { id: 'folders-legal', label: 'Legal' },
      ],
    },
  ],
};

const statusLabelMap: Record<AgreementStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

const statusKindMap: Record<AgreementStatus, 'success' | 'neutral'> = {
  active: 'success',
  inactive: 'neutral',
};

export default function App() {
  const [searchValue, setSearchValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | undefined>('fileName');
  const [sortDirection, setSortDirection] = useState<DataTableSortDirection>('ascending');
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);

  const filteredAgreements = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return AGREEMENTS;
    }

    return AGREEMENTS.filter((agreement) => {
      const haystack = [
        agreement.fileName,
        agreement.parties.join(' '),
        agreement.agreementType,
        statusLabelMap[agreement.status],
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchValue]);

  const sortedAgreements = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredAgreements;
    }

    const sortMultiplier = sortDirection === 'ascending' ? 1 : -1;

    return [...filteredAgreements].sort((a, b) => {
      if (sortColumn === 'parties') {
        return a.parties[0].localeCompare(b.parties[0]) * sortMultiplier;
      }

      if (sortColumn === 'status') {
        return statusLabelMap[a.status].localeCompare(statusLabelMap[b.status]) * sortMultiplier;
      }

      const aValue = String((a as Record<string, unknown>)[sortColumn] ?? '');
      const bValue = String((b as Record<string, unknown>)[sortColumn] ?? '');
      return aValue.localeCompare(bValue) * sortMultiplier;
    });
  }, [filteredAgreements, sortColumn, sortDirection]);

  const totalItems = sortedAgreements.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedAgreements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAgreements.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedAgreements]);

  const columns = useMemo<DataTableColumn<Agreement>[]>(
    () => [
      {
        key: 'fileName',
        header: 'File Name',
        width: '36%',
        sortable: true,
        sortValue: (row) => row.fileName.toLowerCase(),
        cell: (row) => (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            {row.hasAI && (
              <Icon
                name="ai-spark-filled"
                size="small"
                color="var(--ink-cobalt-100)"
                aria-label="AI processed"
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <Text as="div" size="sm" weight="regular">
                {row.fileName}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                {row.subtitleKind === 'completed' ? (
                  <>
                    <Icon name="check" size="small" color="var(--ink-green-80)" aria-hidden />
                    <Text as="span" size="xs" color="secondary">
                      Completed envelope:{' '}
                      <Link href={row.subtitleLink} size="xs">{row.subtitleLinkLabel.replace('Complete with Docusign: ', '')}</Link>
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon name="upload" size="small" color="var(--ink-cobalt-100)" aria-hidden />
                    <Text as="span" size="xs" color="secondary">
                      Uploaded:{' '}
                      <Link href={row.subtitleLink} size="xs">{row.subtitleLinkLabel}</Link>
                    </Text>
                  </>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'parties',
        header: 'Parties',
        width: '24%',
        sortable: true,
        sortValue: (row) => (row.parties[0] ?? '').toLowerCase(),
        cell: (row) =>
          row.parties.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {row.parties.map((party) => (
                <Link
                  href="#"
                  size="xs"
                  key={`${row.id}-${party}`}
                  style={{
                    border: '1px solid var(--ink-cobalt-40)',
                    borderRadius: 'var(--ink-radius-size-xs)',
                    padding: '2px 8px',
                    display: 'inline-block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {party}
                </Link>
              ))}
            </div>
          ) : null,
      },
      {
        key: 'status',
        header: 'Status',
        width: '12%',
        sortable: true,
        sortValue: (row) => statusLabelMap[row.status],
        cell: (row) => (
          <StatusLight
            kind={statusKindMap[row.status]}
            text={statusLabelMap[row.status]}
            noFill
          />
        ),
      },
      {
        key: 'agreementType',
        header: 'Agreement Type',
        width: '18%',
        sortable: true,
        cell: (row) =>
          row.agreementType ? (
            <Badge kind="success" text={row.agreementType} />
          ) : null,
      },
    ],
    []
  );

  const handleSortChange = (column: string, direction: DataTableSortDirection) => {
    setSortColumn(direction ? column : undefined);
    setSortDirection(direction);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const pageTitle = 'Completed Documents';

  const view = (
    <DocuSignShell globalNav={globalNavConfig} localNav={localNavConfig}>
      <AgreementTableView
        paddingVariant="compact"
        pageHeader={
          <PageHeader
            title={pageTitle}
            showAIBadge
            actions={
              <>
                <IconButton
                  icon="plus"
                  variant="tertiary"
                  size="small"
                  aria-label="Add agreement"
                />
                <IconButton
                  icon="settings"
                  variant="tertiary"
                  size="small"
                  aria-label="Table settings"
                />
              </>
            }
          />
        }
        filterBar={
          <FilterBar
            viewSelector={
              <Button kind="secondary" size="small" menuTrigger>
                Completed Documents
              </Button>
            }
            search={{
              value: searchValue,
              onChange: handleSearchChange,
              placeholder: 'Try keywords or phrases',
            }}
            showSearchIndicator
            filters={
              <Button kind="secondary" size="small" menuTrigger>
                Filters
              </Button>
            }
            quickActions={[
              <Button key="canvases" kind="tertiary" size="small" menuTrigger>
                Canvases
              </Button>,
            ]}
          />
        }
      >
        <DataTable
          columns={columns}
          data={paginatedAgreements}
          getRowKey={(row) => row.id}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          pagination={{
            page: currentPage,
            pageSize,
            totalItems,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
          renderRowActions={(row) => (
            <IconButton
              icon="overflow-vertical"
              variant="tertiary"
              size="small"
              aria-label={`More actions for ${row.fileName}`}
            />
          )}
          showColumnControl
          rowHeight="tall"
          stickyHeader
          stickyFooter
          emptyMessage="No agreements match your current filters."
        />
      </AgreementTableView>
    </DocuSignShell>
  );

  return (
    <Routes>
      <Route path="/navigator" element={<NavigatorPage />} />
      <Route path="*" element={<Navigate to="/navigator" replace />} />
    </Routes>
  );
}
