import { useState } from 'react';
import {
  AgreementTableView,
  PageHeader,
  FilterBar,
  DataTable,
  Button,
  Badge,
  Icon,
} from '@/design-system';

/* ═══════════════════════════════════════
   DataTable Config
   Data-driven: NO children. Pass columns + data.
   Tables are NOT wrapped in Cards (DocuSign convention).
   ═══════════════════════════════════════ */

interface Agreement {
  id: string;
  name: string;
  status: string;
  statusKind: 'success' | 'warning' | 'emphasis' | 'subtle';
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
      <Badge kind={row.statusKind} text={row.status} />
    ),
  },
  { key: 'sender', header: 'Sender' },
  { key: 'lastUpdated', header: 'Last Updated', sortable: true },
];

const agreements: Agreement[] = [
  { id: '1', name: 'NDA - Acme Corporation', status: 'Completed', statusKind: 'success', sender: 'John Doe', lastUpdated: 'Mar 24, 2026' },
  { id: '2', name: 'MSA - TechStart Inc', status: 'Waiting for Review', statusKind: 'warning', sender: 'Jane Smith', lastUpdated: 'Mar 23, 2026' },
  { id: '3', name: 'SOW - Phase 2 Development', status: 'Draft', statusKind: 'subtle', sender: 'Jane Smith', lastUpdated: 'Mar 22, 2026' },
  { id: '4', name: 'Employment Agreement - Senior Engineer', status: 'Completed', statusKind: 'success', sender: 'HR Team', lastUpdated: 'Mar 21, 2026' },
  { id: '5', name: 'Vendor Agreement - CloudCo', status: 'Waiting for Signature', statusKind: 'emphasis', sender: 'John Doe', lastUpdated: 'Mar 20, 2026' },
  { id: '6', name: 'Lease Amendment - Office Space', status: 'Completed', statusKind: 'success', sender: 'Legal Team', lastUpdated: 'Mar 19, 2026' },
  { id: '7', name: 'Consulting Agreement - DesignLab', status: 'Action Required', statusKind: 'warning', sender: 'Jane Smith', lastUpdated: 'Mar 18, 2026' },
];

/* ═══════════════════════════════════════
   Table Page — Agreements list
   ═══════════════════════════════════════ */

export default function TablePage() {
  const [search, setSearch] = useState('');

  return (
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
  );
}
