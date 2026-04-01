import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  DocuSignShell,
  AgreementTableView,
  DataTable,
  PageHeader,
  FilterBar,
  Button,
  Banner,
  Badge,
  ComboButton,
  AIIcon,
  AIBadge,
  Accordion,
  Avatar,
  Divider,
  Input,
  IrisIcon,
  Icon,
  IconButton,
  Card,
  Stack,
  Grid,
  Inline,
  Container,
  Heading,
  Tabs,
  Text,
  Chip,
  StatusLight,
  Link,
  dataTableStyles,
} from '@/design-system';

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type TabId = 'home' | 'agreements' | 'templates' | 'insights' | 'admin';
type SidebarView = 'all-agreements' | 'drafts' | 'in-progress' | 'completed' | 'deleted' | 'parties' | 'requests';
type TemplatesSidebarView = 'my-templates' | 'shared-with-me' | 'favorites' | 'all-templates';
type InsightsSidebarView = 'overview' | 'dashboards' | 'reports';

/* ═══════════════════════════════════════
   Agreements Data
   ═══════════════════════════════════════ */

interface Agreement {
  id: string;
  name: string;
  recipient: string;
  status: string;
  statusIcon: 'status-check' | 'status-void' | 'clock' | 'status-warn';
  statusKind: 'success' | 'warning' | 'info' | 'neutral';
  statusSub?: string;
  date: string;
  time: string;
  action: 'Copy' | 'Download';
}

const AGREEMENTS_DATA: Agreement[] = [
  { id: '1', name: 'Complete with Docusign: rhi.pdf, Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:26', action: 'Copy' },
  { id: '2', name: 'Here is your signed document: Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra, [Placeholder]', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:23', action: 'Copy' },
  { id: '3', name: 'Complete with Docusign: rhi.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:16', action: 'Copy' },
  { id: '4', name: 'Complete with Docusign: Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:14', action: 'Copy' },
  { id: '5', name: 'Complete with Docusign: Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:10', action: 'Copy' },
  { id: '6', name: 'Complete with Docusign: rhi.pdf, Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purging soon', date: '23/3/2026', time: '20:25', action: 'Download' },
  { id: '7', name: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.30 AM.png', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purging soon', date: '18/3/2026', time: '11:05', action: 'Download' },
  { id: '8', name: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.21 AM.png', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purging soon', date: '18/3/2026', time: '10:57', action: 'Download' },
  { id: '9', name: 'Please sign: test.txt', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purged', date: '26/2/2026', time: '12:15', action: 'Download' },
  { id: '10', name: 'Complete with Docusign: Fontara Financial SOW.pdf', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purged', date: '24/2/2026', time: '10:50', action: 'Download' },
  { id: '11', name: 'Complete with DocuSign: Georgia-Residential-Lease-Agreement.pdf', recipient: 'From: Renewal Management', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', date: '24/2/2026', time: '10:44', action: 'Download' },
];

const agreementColumns = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: '50%',
    cell: (row: Agreement) => (
      <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
        <Text size="sm">{row.name}</Text>
        <Text size="xs" color="secondary">{row.recipient}</Text>
      </Stack>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row: Agreement) => (
      <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
        <Inline gap="small" align="center">
          <Icon name={row.statusIcon} size={16} color={row.statusKind === 'success' ? 'var(--ink-green-80)' : undefined} />
          <Text size="sm">{row.status}</Text>
        </Inline>
        {row.statusSub && (
          <Text size="xs" color="secondary" style={{ textDecoration: 'underline', textDecorationColor: 'var(--ink-border-subtle)' }}>{row.statusSub}</Text>
        )}
      </Stack>
    ),
  },
  {
    key: 'date',
    header: 'Last Change',
    sortable: true,
    cell: (row: Agreement) => (
      <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
        <Text size="sm">{row.date}</Text>
        <Text size="xs" color="secondary">{row.time}</Text>
      </Stack>
    ),
  },
  {
    key: 'action',
    header: '',
    align: 'end',
    cell: (row: Agreement) => (
      <Inline gap="small" align="center" justify="end" style={{ marginLeft: 'auto' }}>
        <Button kind="secondary" size="small">{row.action}</Button>
        <IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label="More actions" />
      </Inline>
    ),
  },
];

/* ═══════════════════════════════════════
   Navigator (Completed) Data — matches Navigator view
   ═══════════════════════════════════════ */

interface NavigatorAgreement {
  id: string;
  fileName: string;
  fileStatus: 'uploaded' | 'completed';
  fileStatusDetail: string;
  parties: string[];
  status: 'active' | 'inactive';
  statusDate?: string;
  agreementType: string;
  contractValue?: string;
  effectiveDate?: string;
  expirationDate?: string;
  isAIAssisted: boolean;
}

const NAVIGATOR_DATA: NavigatorAgreement[] = [
  { id: '1', fileName: '01_people_ai_guidebook.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: [], status: 'inactive', agreementType: 'Handbook', isAIAssisted: true },
  { id: '2', fileName: 'Restricted Access Request Form 1726...', fileStatus: 'completed', fileStatusDetail: 'Please DocuSign this...', parties: ['Akshat Mishra', '+2 More'], status: 'active', agreementType: 'Form', effectiveDate: '5/20/2025', isAIAssisted: true },
  { id: '3', fileName: 'Offer Letter 1.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['KENNETH L. HARRIS', 'UNIVERSAL BIOENERGY INC'], status: 'inactive', statusDate: 'Expired 3/31/2016', agreementType: 'Offer Letter', contractValue: '$27,600.00 USD', effectiveDate: '3/26/2015', expirationDate: '3/31/2016', isAIAssisted: false },
  { id: '4', fileName: '1100.L0005-US01 - Inventor-approved...', fileStatus: 'completed', fileStatusDetail: '[SIGNATURE REQUIRE...', parties: [], status: 'inactive', agreementType: 'Miscellaneous', isAIAssisted: true },
  { id: '5', fileName: '1100.L0005-US01 - Inventor-approved...', fileStatus: 'completed', fileStatusDetail: '[SIGNATURE REQUIRE...', parties: [], status: 'inactive', agreementType: 'Form', isAIAssisted: true },
  { id: '6', fileName: '1100.L0005-US01 Combined Declaration...', fileStatus: 'completed', fileStatusDetail: '[SIGNATURE REQUIRE...', parties: ['INVENTOR', 'Docusign, Inc.'], status: 'active', agreementType: 'Miscellaneous', effectiveDate: '2/4/2025', isAIAssisted: false },
  { id: '7', fileName: 'reseller6.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['[INSERT FULL NAME OF RES...', 'Voyager Worldwide'], status: 'inactive', agreementType: 'C_Mariya_27s...', isAIAssisted: true },
  { id: '8', fileName: 'reseller8.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['MiniQ, Inc.'], status: 'active', agreementType: 'C_Mariya_27s...', effectiveDate: '11/19/2024', isAIAssisted: false },
];

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const navigatorColumns: any[] = [
  {
    key: 'aiAssisted',
    header: '',
    width: '40px',
    cell: (row: NavigatorAgreement) =>
      row.isAIAssisted ? (
        <span className={dataTableStyles.aiSparkle}>
          <AIIcon name="ai-spark-filled" size={14} />
        </span>
      ) : null,
  },
  {
    key: 'fileName',
    header: 'File Name',
    sortable: true,
    width: '280px',
    className: dataTableStyles.columnBorderRight,
    cell: (row: NavigatorAgreement) => (
      <div className={dataTableStyles.cellContent}>
        <a href="#" className={dataTableStyles.cellPrimary} style={{ textDecoration: 'none', color: 'inherit' }}>
          {row.fileName}
        </a>
        <span className={dataTableStyles.cellSecondary}>
          {row.fileStatus === 'uploaded' ? '↑' : '✓'}{' '}
          {row.fileStatus === 'uploaded' ? 'Uploaded: ' : 'Completed envelope: '}
          <a href="#">{row.fileStatusDetail}</a>
        </span>
      </div>
    ),
  },
  {
    key: 'parties',
    header: 'Parties',
    width: '180px',
    cell: (row: NavigatorAgreement) => (
      <div className={dataTableStyles.cellContent}>
        {row.parties.length > 0 ? (
          row.parties.map((party, i) => {
            const isMoreLink = party.startsWith('+');
            if (isMoreLink) {
              return <a key={i} href="#" className={dataTableStyles.partyMoreLink}>{party}</a>;
            }
            return (
              <span key={i} className={dataTableStyles.partyChip}>
                <a href="#" className={dataTableStyles.partyLink}>{party}</a>
              </span>
            );
          })
        ) : (
          <span className={dataTableStyles.cellSecondary}>&mdash;</span>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '120px',
    cell: (row: NavigatorAgreement) => (
      <div className={dataTableStyles.statusCell}>
        <span className={dataTableStyles.statusDot} data-status={row.status} />
        <div className={dataTableStyles.statusText}>
          <span className={dataTableStyles.statusLabel}>
            {row.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          {row.statusDate && (
            <span className={dataTableStyles.statusDate}>{row.statusDate}</span>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'agreementType',
    header: 'Agreement Type',
    sortable: true,
    width: '140px',
  },
  {
    key: 'contractValue',
    header: 'Total Contract Value',
    sortable: true,
    width: '160px',
    alignment: 'right',
    cell: (row: NavigatorAgreement) => row.contractValue || '—',
  },
  {
    key: 'effectiveDate',
    header: 'Effective Date',
    sortable: true,
    width: '130px',
    cell: (row: NavigatorAgreement) => row.effectiveDate || '—',
  },
  {
    key: 'expirationDate',
    header: 'Expiration Date',
    sortable: true,
    width: '140px',
    alignment: 'right',
    cell: (row: NavigatorAgreement) => row.expirationDate || '—',
  },
];

/* ═══════════════════════════════════════
   Parties Data (matches real DocuSign)
   ═══════════════════════════════════════ */

interface Party {
  id: string;
  name: string;
  role: string;
  activeAgreements: number;
  existingAgreements: number;
  starred?: boolean;
}

const PARTIES_DATA: Party[] = [
  { id: '1', name: 'DocuSign, Inc.', role: 'Other', activeAgreements: 1009, existingAgreements: 16, starred: false },
  { id: '2', name: 'Docusign', role: 'Other', activeAgreements: 192, existingAgreements: 6, starred: false },
  { id: '3', name: 'DocuSign Inc.', role: 'Other', activeAgreements: 95, existingAgreements: 3, starred: false },
  { id: '4', name: 'Bio-Logistics Solutions LLC', role: 'Seller', activeAgreements: 19, existingAgreements: 2, starred: false },
  { id: '5', name: 'Docusign Inc', role: 'Other', activeAgreements: 55, existingAgreements: 2, starred: false },
  { id: '6', name: 'Grant Thornton Advisors LLC', role: 'Other', activeAgreements: 2, existingAgreements: 3, starred: false },
  { id: '7', name: 'FinLogic LLC', role: 'Other', activeAgreements: 2, existingAgreements: 3, starred: false },
  { id: '8', name: 'Docusign, Inc', role: 'Other', activeAgreements: 90, existingAgreements: 3, starred: false },
  { id: '9', name: 'Umbrella Corporation', role: 'Buyer', activeAgreements: 19, existingAgreements: 3, starred: false },
  { id: '10', name: 'DocuSign France', role: 'Other', activeAgreements: 3, existingAgreements: 3, starred: false },
];

const partyColumns: any[] = [
  { key: 'name', header: 'Name', sortable: true, width: '280px' },
  { key: 'role', header: 'Role', sortable: true, width: '120px' },
  {
    key: 'activeAgreements',
    header: 'Active agreements',
    sortable: true,
    width: '160px',
    cell: (row: Party) => (
      <Inline gap="small" align="center">
        <Badge kind="success" size="small">Active</Badge>
        <Text size="sm">{row.activeAgreements.toLocaleString()}</Text>
      </Inline>
    ),
  },
  { key: 'existingAgreements', header: 'Existing agreements', sortable: true, width: '160px' },
  {
    key: 'starred',
    header: '',
    width: '48px',
    alignment: 'center' as const,
    cell: (row: Party) => (
      <IconButton icon={row.starred ? 'star' : 'star'} variant="tertiary" size="small" aria-label="Favorite" />
    ),
  },
];

/* ═══════════════════════════════════════
   Requests Data (matches real DocuSign)
   ═══════════════════════════════════════ */

interface RequestItem {
  id: string;
  title: string;
  requestId: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Overdue';
  lastActivityAt: string;
  dueDate: string;
  submitterName: string;
  submitterEmail: string;
  submitterInitials: string;
  owner: string;
}

const REQUESTS_DATA: RequestItem[] = [
  { id: '1', title: '[Example] General Legal Request by DocuSign User Rename', requestId: 'REQ-0006', status: 'New', lastActivityAt: '6/3/2026 07:16', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
  { id: '2', title: '[Example] General Legal Request by DocuSign User JR', requestId: 'REQ-0007', status: 'New', lastActivityAt: '26/2/2026 21:31', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
  { id: '3', title: '[Example] General Legal Request by DocuSign User', requestId: 'REQ-0005', status: 'New', lastActivityAt: '9/2/2026 19:19', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
  { id: '4', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0004', status: 'New', lastActivityAt: '18/12/2025 23:10', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
  { id: '5', title: '[Example] General Legal Request by DocuSign User', requestId: 'REQ-0003', status: 'New', lastActivityAt: '18/12/2025 21:55', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
  { id: '6', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0002', status: 'New', lastActivityAt: '15/11/2025 21:25', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
  { id: '7', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0001', status: 'New', lastActivityAt: '23/10/2025 18:35', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned' },
];

const requestColumns: any[] = [
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    width: '360px',
    cell: (row: RequestItem) => (
      <div className={dataTableStyles.cellContent}>
        <Text size="sm">{row.title}</Text>
        <Text size="xs" color="secondary">{row.requestId}</Text>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '100px',
    cell: (row: RequestItem) => (
      <Inline gap="small" align="center">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink-green-60)', flexShrink: 0 }} />
        <Badge kind="success" size="small">{row.status}</Badge>
      </Inline>
    ),
  },
  { key: 'lastActivityAt', header: 'Last Activity At', sortable: true, width: '170px' },
  { key: 'dueDate', header: 'Due Date', sortable: true, width: '120px', cell: (row: RequestItem) => row.dueDate || '—' },
  {
    key: 'submitter',
    header: 'Submitter',
    sortable: true,
    width: '220px',
    cell: (row: RequestItem) => (
      <Inline gap="small" align="center">
        <Avatar size="small" initials={row.submitterInitials} />
        <div className={dataTableStyles.cellContent}>
          <Text size="sm">{row.submitterName}</Text>
          <Text size="xs" color="secondary">{row.submitterEmail}</Text>
        </div>
      </Inline>
    ),
  },
  {
    key: 'owner',
    header: 'Owner',
    sortable: true,
    width: '140px',
    cell: (row: RequestItem) => (
      <Inline gap="small" align="center">
        <Icon name="person" size={16} color="var(--ink-text-secondary)" />
        <Text size="sm" color="secondary">{row.owner}</Text>
      </Inline>
    ),
  },
];

/* ═══════════════════════════════════════
   Templates Data (matches real DocuSign)
   ═══════════════════════════════════════ */

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  lastModified: string;
  shared: boolean;
  uses: number;
  favorited: boolean;
}

const TEMPLATES_DATA: TemplateItem[] = [
  { id: '1', name: 'quick send', description: 'Default template for quick envelope sending', owner: 'Akshat Mishra', lastModified: '03/13/2026', shared: false, uses: 24, favorited: true },
  { id: '2', name: 'shared template info', description: 'Shared informational template', owner: 'Akshat Mishra', lastModified: '08/12/2025', shared: true, uses: 12, favorited: true },
  { id: '3', name: 'Non-Disclosure Agreement', description: 'Standard NDA for external partners', owner: 'Legal Team', lastModified: '02/28/2026', shared: true, uses: 156, favorited: false },
  { id: '4', name: 'Service Agreement', description: 'Master service agreement template', owner: 'Legal Team', lastModified: '01/15/2026', shared: true, uses: 89, favorited: false },
  { id: '5', name: 'Offer Letter', description: 'Standard offer letter for new hires', owner: 'HR Department', lastModified: '03/05/2026', shared: true, uses: 203, favorited: false },
  { id: '6', name: 'Consulting Agreement', description: 'Independent contractor consulting agreement', owner: 'Akshat Mishra', lastModified: '02/10/2026', shared: false, uses: 7, favorited: false },
  { id: '7', name: 'Sales Contract', description: 'Standard sales contract with payment terms', owner: 'Sales Ops', lastModified: '03/20/2026', shared: true, uses: 342, favorited: false },
  { id: '8', name: 'Vendor Onboarding', description: 'New vendor setup and compliance form', owner: 'Procurement', lastModified: '12/08/2025', shared: true, uses: 45, favorited: false },
  { id: '9', name: 'Employment Agreement', description: 'Full-time employment agreement', owner: 'HR Department', lastModified: '03/01/2026', shared: true, uses: 178, favorited: false },
  { id: '10', name: 'Change Order', description: 'Amendment to existing SOW or contract', owner: 'Akshat Mishra', lastModified: '03/22/2026', shared: false, uses: 3, favorited: false },
];

const templateColumns: any[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: '300px',
    cell: (row: TemplateItem) => (
      <div className={dataTableStyles.cellContent}>
        <Text size="sm">{row.name}</Text>
        <Text size="xs" color="secondary">{row.description}</Text>
      </div>
    ),
  },
  { key: 'owner', header: 'Owner', sortable: true, width: '160px' },
  { key: 'lastModified', header: 'Last Modified', sortable: true, width: '140px' },
  {
    key: 'shared',
    header: 'Shared',
    width: '100px',
    cell: (row: TemplateItem) => row.shared ? <Badge kind="info" size="small">Shared</Badge> : <Text size="sm" color="secondary">Private</Text>,
  },
  { key: 'uses', header: 'Uses', sortable: true, width: '80px', alignment: 'right' as const },
  {
    key: 'actions',
    header: '',
    width: '80px',
    alignment: 'end' as const,
    cell: (row: TemplateItem) => (
      <Inline gap="small" align="center" justify="end">
        <IconButton icon="star" variant="tertiary" size="small" aria-label="Favorite" style={row.favorited ? { color: 'var(--ink-yellow-80)' } : undefined} />
        <IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label="More actions" />
      </Inline>
    ),
  },
];

/* ═══════════════════════════════════════
   Insights Reports Data
   ═══════════════════════════════════════ */

interface ReportItem {
  id: string;
  name: string;
  type: 'dashboard' | 'report';
  owner: string;
  lastViewed: string;
  shared: boolean;
}

const REPORTS_DATA: ReportItem[] = [
  { id: '1', name: 'Expiring agreements', type: 'report', owner: 'System', lastViewed: '03/26/2026', shared: true },
  { id: '2', name: 'Upcoming renewals', type: 'report', owner: 'System', lastViewed: '03/18/2026', shared: true },
  { id: '3', name: 'All agreements', type: 'report', owner: 'System', lastViewed: '02/28/2026', shared: true },
  { id: '4', name: 'Agreements with renewal notice date', type: 'report', owner: 'System', lastViewed: '02/26/2026', shared: true },
  { id: '5', name: 'Obligations by type', type: 'report', owner: 'System', lastViewed: '02/26/2026', shared: true },
  { id: '6', name: 'Envelope Velocity Report', type: 'dashboard', owner: 'Akshat Mishra', lastViewed: '03/25/2026', shared: false },
  { id: '7', name: 'Agreement Trends', type: 'dashboard', owner: 'Akshat Mishra', lastViewed: '03/20/2026', shared: false },
  { id: '8', name: 'Renewals Dashboard', type: 'dashboard', owner: 'Legal Team', lastViewed: '03/15/2026', shared: true },
  { id: '9', name: 'Monthly Signing Activity', type: 'report', owner: 'System', lastViewed: '03/10/2026', shared: true },
  { id: '10', name: 'Compliance Overview', type: 'dashboard', owner: 'Legal Team', lastViewed: '03/01/2026', shared: true },
];

const reportColumns: any[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: '360px',
    cell: (row: ReportItem) => (
      <Inline gap="small" align="center">
        <Icon name={row.type === 'dashboard' ? 'grid' : 'bar-chart-2'} size={16} color="var(--ink-text-secondary)" />
        <Text size="sm">{row.name}</Text>
      </Inline>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    width: '120px',
    cell: (row: ReportItem) => <Badge kind={row.type === 'dashboard' ? 'info' : 'neutral'} size="small">{capitalize(row.type)}</Badge>,
  },
  { key: 'owner', header: 'Owner', sortable: true, width: '160px' },
  { key: 'lastViewed', header: 'Last Viewed', sortable: true, width: '140px' },
  {
    key: 'shared',
    header: 'Shared',
    width: '100px',
    cell: (row: ReportItem) => row.shared ? <Badge kind="info" size="small">Shared</Badge> : <Text size="sm" color="secondary">Private</Text>,
  },
];

/* ═══════════════════════════════════════
   Home Page
   ═══════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text as="span" size="xs" weight="semibold" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
      {children}
    </Text>
  );
}

function HomePage() {
  const activity = [
    { name: 'Complete with Docusign: rhi.pdf, Sample_Service_Agreement.pdf', time: '6 days ago', status: 'Voided', statusIcon: 'status-void' as const },
    { name: 'Here is your signed document: Sample_Service_Agreement.pdf', time: '6 days ago', status: 'Voided', statusIcon: 'status-void' as const },
    { name: 'Complete with Docusign: rhi.pdf', time: '6 days ago', status: 'Voided', statusIcon: 'status-void' as const },
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

  const favoriteTemplates = [
    { name: 'quick send', lastUsed: 'Last used on 03/13/2026' },
    { name: 'shared template info', lastUsed: 'Last used on 08/12/2025' },
  ];

  return (
    <Stack gap="none">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(174deg, var(--ink-cobalt-100, #4C00FB) 1.48%, var(--ink-cobalt-140, #260559) 97.92%)',
        color: 'white',
        padding: '100px var(--ink-spacing-300) 72px',
        textAlign: 'center',
      }}>
        <Heading level={3} style={{ color: 'white', fontWeight: 400, marginBottom: 'var(--ink-spacing-300)' }}>
          Welcome back, Akshat Mishra
        </Heading>
        <Inline gap="small" justify="center">
          <Button kind="brand" menuTrigger>Start</Button>
          {[
            { icon: 'send' as const, label: 'Send an Envelope' },
            { icon: 'ai-spark-filled' as const, label: 'Send with AI' },
            { icon: 'templates' as const, label: 'Create a Request' },
          ].map((btn) => (
            <button
              key={btn.label}
              className="banner-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--ink-spacing-125)',
                padding: 'var(--ink-spacing-125) var(--ink-spacing-250)', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--ink-radius-sm)',
                color: 'white', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name={btn.icon} size={16} color="white" /> {btn.label}
            </button>
          ))}
        </Inline>
      </div>

      {/* Main content */}
      <Container style={{ maxWidth: 1120, padding: 'var(--ink-spacing-400) var(--ink-spacing-400)' }}>
        <Inline gap="large" align="start">
          {/* Left column */}
          <Stack gap="medium" style={{ flex: 1 }}>
            {/* Tasks */}
            <Card radius="large" className="home-card">
              <Stack gap="none" style={{ padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                <Inline justify="between" align="center" style={{ paddingBottom: 'var(--ink-spacing-150)' }}>
                  <SectionLabel>Tasks</SectionLabel>
                  <Icon name="chevron-right" size={18} />
                </Inline>
                <Stack gap="none" style={{ gap: 'var(--ink-spacing-50)', padding: 'var(--ink-spacing-250) 0 var(--ink-spacing-150)' }}>
                  <Text size="lg" weight="regular">You don&apos;t have any tasks yet</Text>
                  <Text size="sm" color="secondary">When you have new tasks assigned to you, they will show up here.</Text>
                </Stack>
              </Stack>
            </Card>

            {/* Agreement Activity */}
            <Card radius="large" className="home-card">
              <Stack gap="none" style={{ padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                <Inline gap="none" align="center" style={{ gap: 'var(--ink-spacing-50)', marginBottom: 'var(--ink-spacing-150)' }}>
                  <SectionLabel>Agreement Activity</SectionLabel>
                  <Icon name="info" size={14} />
                </Inline>
                {activity.map((item, i) => (
                  <Inline
                    key={i}
                    justify="between"
                    align="center"
                    className="activity-row"
                    style={{
                      padding: 'var(--ink-spacing-150) 0',
                      borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none',
                    }}
                  >
                    <Stack gap="none" style={{ gap: "var(--ink-spacing-25)" }}>
                      <Text size="sm">{item.name}</Text>
                      <Text size="xs" color="secondary" style={{ textDecoration: 'underline', textDecorationColor: 'var(--ink-border-subtle)' }}>{item.time}</Text>
                    </Stack>
                    <Inline gap="small" align="center" style={{ flexShrink: 0 }}>
                      <Icon name={item.statusIcon} size={14} />
                      <Text size="xs" color="secondary">{item.status}</Text>
                      <Icon name="chevron-right" size={14} />
                    </Inline>
                  </Inline>
                ))}
              </Stack>
            </Card>

            {/* Favorite Templates */}
            <Card radius="large" className="home-card">
              <Stack gap="none" style={{ padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                <Inline justify="between" align="center" style={{ marginBottom: 'var(--ink-spacing-200)' }}>
                  <SectionLabel>Favorite Templates</SectionLabel>
                  <Icon name="chevron-right" size={18} />
                </Inline>
                <Grid columns={3} gap="medium">
                  {favoriteTemplates.map((t) => (
                    <Card key={t.name} radius="medium" className="home-card activity-row" style={{ padding: 0 }}>
                      <Stack gap="small" style={{ padding: 'var(--ink-spacing-150)' }}>
                        <div style={{ height: 140, background: '#f5f5f5', borderRadius: 'var(--ink-radius-sm)', position: 'relative', overflow: 'hidden', padding: 6 }}>
                          {/* Mock document preview */}
                          <div style={{ background: 'white', borderRadius: 3, height: '100%', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            {/* Header area */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ height: 5, width: '35%', background: '#ddd', borderRadius: 1 }} />
                              <div style={{ height: 5, width: '15%', background: '#e8e8e8', borderRadius: 1 }} />
                            </div>
                            <div style={{ height: 1, background: '#eee' }} />
                            {/* Table-like rows */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              <div style={{ height: 4, width: '25%', background: '#e5e5e5', borderRadius: 1 }} />
                              <div style={{ height: 4, width: '20%', background: '#efefef', borderRadius: 1 }} />
                              <div style={{ height: 4, width: '30%', background: '#efefef', borderRadius: 1 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <div style={{ height: 4, width: '25%', background: '#efefef', borderRadius: 1 }} />
                              <div style={{ height: 4, width: '20%', background: '#f2f2f2', borderRadius: 1 }} />
                              <div style={{ height: 4, width: '30%', background: '#f2f2f2', borderRadius: 1 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <div style={{ height: 4, width: '25%', background: '#efefef', borderRadius: 1 }} />
                              <div style={{ height: 4, width: '20%', background: '#f2f2f2', borderRadius: 1 }} />
                              <div style={{ height: 4, width: '30%', background: '#f2f2f2', borderRadius: 1 }} />
                            </div>
                            <div style={{ height: 1, background: '#eee', marginTop: 2 }} />
                            {/* More text lines */}
                            <div style={{ height: 3, width: '70%', background: '#efefef', borderRadius: 1 }} />
                            <div style={{ height: 3, width: '50%', background: '#f2f2f2', borderRadius: 1 }} />
                          </div>
                          {/* Favorite badge */}
                          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Icon name="star" size={9} color="gold" /> Favorite
                          </div>
                        </div>
                        <Text size="sm" weight="medium" style={{ color: 'var(--ink-cobalt-90)' }}>{t.name}</Text>
                        <Text size="xs" color="secondary">{t.lastUsed}</Text>
                      </Stack>
                    </Card>
                  ))}
                  <Card radius="medium" className="home-card activity-row" style={{ padding: 0 }}>
                    <Stack gap="small" align="center" justify="center" style={{ padding: 'var(--ink-spacing-200)', height: '100%' }}>
                      <Text size="sm" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>Add Favorite Template</Text>
                      <Text size="xs" color="secondary" style={{ textAlign: 'center' }}>Send future documents faster with favorited templates.</Text>
                      <Button kind="secondary" size="small">Browse templates</Button>
                    </Stack>
                  </Card>
                </Grid>
              </Stack>
            </Card>

            {/* Promo cards */}
            <Grid columns={2} gap="medium">
              <Card radius="large" className="home-card promo-card activity-row" noPadding>
                <Inline gap="none" align="stretch" style={{ minHeight: '100%' }}>
                  <div style={{ width: 120, flexShrink: 0, background: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ink-radius-lg) 0 0 var(--ink-radius-lg)', alignSelf: 'stretch' }}>
                    <img src="/illustration-bulk-send.svg" alt="" width={72} height={72} />
                  </div>
                  <Stack gap="none" style={{ gap: 'var(--ink-spacing-50)', padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                    <Text size="sm" weight="medium">Save time with bulk send</Text>
                    <Text size="xs" color="secondary">No need to send separate envelopes. Import a bulk list and each recipient receives a unique copy. <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ink-cobalt-90)' }}>Learn More</span></Text>
                  </Stack>
                </Inline>
              </Card>
              <Card radius="large" className="home-card promo-card activity-row" noPadding>
                <Inline gap="none" align="stretch" style={{ minHeight: '100%' }}>
                  <div style={{ width: 120, flexShrink: 0, background: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ink-radius-lg) 0 0 var(--ink-radius-lg)', alignSelf: 'stretch' }}>
                    <img src="/illustration-help.svg" alt="" width={72} height={72} />
                  </div>
                  <Stack gap="none" style={{ gap: 'var(--ink-spacing-50)', padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                    <Text size="sm" weight="medium">Need help getting started?</Text>
                    <Text size="xs" color="secondary">Get help with basic questions. <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ink-cobalt-90)' }}>View Our Guide</span></Text>
                  </Stack>
                </Inline>
              </Card>
            </Grid>
          </Stack>

          {/* Right column - Overview */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <Card radius="large" className="home-card">
              <Stack gap="none" style={{ padding: 'var(--ink-spacing-200)' }}>
                <SectionLabel>Overview</SectionLabel>
                <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
                  {overview.map((item, i) => (
                    <Inline
                      key={i}
                      justify="between"
                      className="overview-row"
                      style={{
                        padding: 'var(--ink-spacing-150) var(--ink-spacing-50)',
                        borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none',
                        borderRadius: 'var(--ink-radius-sm)',
                      }}
                    >
                      <Text size="sm">{item.label}</Text>
                      <Text size="sm" weight="semibold">{item.value}</Text>
                    </Inline>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </div>
        </Inline>
      </Container>
    </Stack>
  );
}

/* ═══════════════════════════════════════
   Insights — Overview sub-view
   ═══════════════════════════════════════ */

function InsightsOverview() {
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
          display: 'flex', alignItems: 'center',
          border: '1px solid var(--ink-border-subtle)', borderRadius: 'var(--ink-radius-md)',
          padding: 'var(--ink-spacing-100) var(--ink-spacing-150)', gap: 'var(--ink-spacing-100)',
        }}>
          <Icon name="search" size={16} />
          <span style={{ fontSize: 14, color: 'var(--ink-font-secondary)' }}>Find reports or dashboards</span>
        </div>
      </div>

      <Grid columns={2} gap="medium">
        <Card radius="large">
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <Text size="sm" weight="semibold">Your Recents</Text>
            <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {recents.map((r, i) => (
                <Inline key={i} justify="between" align="center" style={{
                  padding: 'var(--ink-spacing-100) 0',
                  borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none',
                }}>
                  <Inline gap="small" align="center">
                    <Icon name="bar-chart-2" size={16} />
                    <Text size="sm">{r.name}</Text>
                  </Inline>
                  <Text size="xs" color="secondary">{r.time}</Text>
                </Inline>
              ))}
            </Stack>
            <div style={{ textAlign: 'center', marginTop: 'var(--ink-spacing-150)', borderTop: '1px solid var(--ink-border-subtle)', paddingTop: 'var(--ink-spacing-100)' }}>
              <Link href="#">View all</Link>
            </div>
          </div>
        </Card>

        <Card radius="large">
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <Text size="sm" weight="semibold">Your Favorites</Text>
            <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {favorites.map((f, i) => (
                <Inline key={i} gap="small" align="center" style={{
                  padding: 'var(--ink-spacing-100) 0',
                  borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none',
                }}>
                  <Icon name="star" size={16} color="var(--ink-yellow-80)" />
                  <Text size="sm">{f}</Text>
                </Inline>
              ))}
            </Stack>
          </div>
        </Card>
      </Grid>

      <div style={{ marginTop: 'var(--ink-spacing-300)' }}>
        <Text size="md" weight="semibold">Weekly Insights</Text>
        <Grid columns={3} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
          <Card radius="large">
            <div style={{ padding: 'var(--ink-spacing-200)', textAlign: 'center' }}>
              <Text size="sm" weight="medium">All agreements</Text>
              <Text size="xs" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>Count</Text>
              <div style={{ fontSize: 36, fontWeight: 600, margin: 'var(--ink-spacing-100) 0', color: 'var(--ink-cobalt-90)' }}>42,357</div>
              <Text size="sm">Agreements</Text>
            </div>
          </Card>
          <Card radius="large">
            <div style={{ padding: 'var(--ink-spacing-200)', textAlign: 'center' }}>
              <Text size="sm" weight="medium">New agreements ingested</Text>
              <Text size="xs" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>Count</Text>
              <div style={{ fontSize: 36, fontWeight: 600, margin: 'var(--ink-spacing-100) 0', color: 'var(--ink-cobalt-90)' }}>25</div>
              <Text size="sm">Agreements</Text>
            </div>
          </Card>
          <Card radius="large">
            <div style={{ padding: 'var(--ink-spacing-200)', textAlign: 'center' }}>
              <Text size="sm" weight="medium">Expiring soon</Text>
              <Text size="xs" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>Next 90 days</Text>
              <div style={{ fontSize: 36, fontWeight: 600, margin: 'var(--ink-spacing-100) 0', color: 'var(--ink-yellow-80)' }}>138</div>
              <Text size="sm">Agreements</Text>
            </div>
          </Card>
        </Grid>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Templates Page — no longer used as standalone
   (rendered inline via AgreementTableView)
   ═══════════════════════════════════════ */

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
   Footer
   ═══════════════════════════════════════ */

function Footer() {
  const links = ['Contact Us', 'Terms of Use', 'Privacy', 'Intellectual Property', 'Trust'];
  return (
    <footer style={{
      borderTop: '1px solid var(--ink-border-subtle)',
      padding: 'var(--ink-spacing-200) var(--ink-spacing-300)',
      marginTop: 'auto',
    }}>
      <Inline justify="between" align="center">
        <Inline gap="small" align="center">
          <Text size="xs" color="secondary">English (US)</Text>
          <Icon name="chevron-down" size={12} />
          <Text size="xs" color="secondary" style={{ margin: '0 var(--ink-spacing-100)' }}>|</Text>
          {links.map((link, i) => (
            <Text key={i} as="span" size="xs" color="secondary" style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent' }}>
              {link}
            </Text>
          ))}
        </Inline>
        <Text size="xs" color="secondary">
          Version: 1.13043 &middot; Copyright &copy; 2026 Docusign, Inc. All rights reserved.
        </Text>
      </Inline>
    </footer>
  );
}

/* ═══════════════════════════════════════
   App
   ═══════════════════════════════════════ */

const VALID_TABS: TabId[] = ['home', 'agreements', 'templates', 'insights', 'admin'];

/* ═══════════════════════════════════════
   Agreement Detail View (Navigator Viewer)
   Full-screen dialog with PDF viewer + detail sidebar
   ═══════════════════════════════════════ */

const AGREEMENT_DETAIL = {
  fileName: 'Batterii MLA_00992.pdf',
  agreementType: 'License',
  status: 'Inactive',
  parties: [
    { name: 'Batterii, LLC', role: 'Licensor' },
    { name: 'ABC COMPANY INC', role: 'Licensee' },
  ],
  lineOfBusiness: 'Unspecified',
  languages: 'English',
  terminationNoticePeriod: '30 days',
  governingLaw: 'Ohio',
  fields: 34,
  suggestions: 5,
  clauses: [
    'Assignment Clause #1', 'Assignment Clause #2',
    'Change of Control Clause #1', 'Change of Control Clause #2',
    'Confidentiality Clause #1', 'Confidentiality Clause #2',
    'Indemnification Clause',
    'Intellectual Property Rights Clause #1', 'Intellectual Property Rights Clause #2', 'Intellectual Property Rights Clause #3',
    'Limitation of Liability Clause',
    'Separation Clause #1', 'Separation Clause #2', 'Separation Clause #3', 'Separation Clause #4',
    'Service Level Agreements Clause',
    'Termination for Breach Clause #1', 'Termination for Breach Clause #2', 'Termination for Breach Clause #3',
  ],
};

const DETAIL_TABS = [
  { id: 'details', icon: 'info' as const, label: 'Details' },
  { id: 'obligations', icon: 'flag' as const, label: 'Obligations' },
  { id: 'sets', icon: 'diamond-stack' as const, label: 'Agreement sets' },
  { id: 'related', icon: 'hierarchy' as const, label: 'Related agreements' },
  { id: 'chat', icon: 'comment' as const, label: 'Chat' },
];

function AgreementDetailView({ onClose }: { onClose: () => void }) {
  const detail = AGREEMENT_DETAIL;
  const [activeDetailTab, setActiveDetailTab] = useState<string | null>('details');

  const handleSidebarTabClick = (tabId: string) => {
    if (activeDetailTab === tabId) {
      setActiveDetailTab(null); // close panel
    } else {
      setActiveDetailTab(tabId); // open/switch panel
    }
  };

  const detailContent = (
    <Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>
      {/* AI suggestion banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--ink-spacing-100)', flexDirection: 'column' }}>
        <AIBadge infoContent={false}>AI-Assisted</AIBadge>
        <Text size="sm">
          It looks like this agreement type is <strong>{detail.agreementType}</strong>. There are <strong>{detail.fields}</strong> fields and <strong>{detail.suggestions}</strong> new suggestions for you to review.
        </Text>
        <Button kind="secondary" size="small">Review All</Button>
      </div>

      <Divider />

      {/* Search */}
      <Input placeholder="Find details" />

      {/* Agreement Type */}
      <div>
        <Inline gap="small" align="center">
          <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agreement Type</Text>
          <AIIcon name="ai-spark-filled" size={12} />
        </Inline>
        <Text size="sm">{detail.agreementType}</Text>
      </div>

      {/* Accordion sections */}
      <Accordion
        allowMultiple
        defaultOpenItems={['general', 'termination', 'clauses', 'legal']}
        bordered
        items={[
          {
            id: 'general',
            title: 'General',
            subtitle: 'AI Suggested',
            content: (
              <Stack gap="medium">
                <div>
                  <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</Text>
                  <Text size="sm">{detail.status}</Text>
                </div>
                <div>
                  <Inline gap="small" align="center">
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parties</Text>
                    <AIIcon name="ai-spark-filled" size={12} />
                  </Inline>
                  {detail.parties.map((p, i) => (
                    <Inline key={i} justify="between" align="center" style={{ padding: 'var(--ink-spacing-50) 0' }}>
                      <Text size="sm">{p.name}</Text>
                      <Link href="#">View</Link>
                    </Inline>
                  ))}
                </div>
                <div>
                  <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>File Name</Text>
                  <Text size="sm">{detail.fileName}</Text>
                </div>
                <div>
                  <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Line of Business</Text>
                  <Text size="sm">{detail.lineOfBusiness}</Text>
                </div>
                <div>
                  <Inline gap="small" align="center">
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</Text>
                    <AIIcon name="ai-spark-filled" size={12} />
                  </Inline>
                  <Text size="sm">{detail.languages}</Text>
                </div>
                <Button kind="secondary" size="small">Show 7 empty fields</Button>
              </Stack>
            ),
          },
          {
            id: 'termination',
            title: 'Termination',
            subtitle: 'AI Suggested',
            content: (
              <Stack gap="medium">
                <div>
                  <Inline gap="small" align="center">
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Termination for Convenience - Notice Period</Text>
                    <AIIcon name="ai-spark-filled" size={12} />
                  </Inline>
                  <Text size="sm">{detail.terminationNoticePeriod}</Text>
                </div>
                <Button kind="secondary" size="small">Show 1 empty field</Button>
              </Stack>
            ),
          },
          { id: 'renewal', title: 'Renewal', content: <Text size="sm" color="secondary">No renewal terms found.</Text> },
          { id: 'payment', title: 'Payment', content: <Text size="sm" color="secondary">No payment terms found.</Text> },
          {
            id: 'legal',
            title: 'Legal and Compliance',
            subtitle: 'AI Suggested',
            content: (
              <Stack gap="medium">
                <div>
                  <Inline gap="small" align="center">
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Governing Law</Text>
                    <AIIcon name="ai-spark-filled" size={12} />
                  </Inline>
                  <Text size="sm">{detail.governingLaw}</Text>
                </div>
                <Button kind="secondary" size="small">Show 4 empty fields</Button>
              </Stack>
            ),
          },
          {
            id: 'clauses',
            title: 'Clauses',
            subtitle: 'AI Suggested',
            content: (
              <Stack gap="small">
                {detail.clauses.map((clause, i) => (
                  <Inline key={i} justify="between" align="center" style={{ padding: 'var(--ink-spacing-50) 0' }}>
                    <Inline gap="small" align="center">
                      <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{clause}</Text>
                      <AIIcon name="ai-spark-filled" size={12} />
                    </Inline>
                    <Text size="sm">Found</Text>
                  </Inline>
                ))}
              </Stack>
            ),
          },
        ]}
      />
    </Stack>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060,
      background: 'var(--ink-bg-color-default)',
      display: 'grid', gridTemplateRows: 'auto auto 1fr',
    }}>
      {/* Row 1: Dark top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-100)',
        padding: '0 var(--ink-spacing-100)',
        background: 'var(--ink-neutral-140)',
        color: 'white',
        height: 64,
      }}>
        <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 64 }}>
          <Icon name="close" size={20} />
        </button>
        <Text size="sm" style={{ flex: 1, color: 'white' }}>{detail.fileName}</Text>
        <button aria-label="Set a notification" style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid transparent', background: 'var(--ink-cobalt-140)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell-slash" size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={{ background: 'var(--ink-cobalt-140)', border: 'none', color: 'white', padding: '0 16px', height: 40, borderRadius: '4px 0 0 4px', cursor: 'pointer', fontSize: 'var(--ink-font-size-sm)', fontFamily: 'var(--ink-font-family-default)' }}>Download</button>
          <button aria-label="More actions" style={{ background: 'var(--ink-cobalt-140)', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.2)', color: 'white', width: 40, height: 40, borderRadius: '0 4px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-down" size={16} />
          </button>
        </div>
      </div>

      {/* Row 2: Document controls bar — full width */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--ink-spacing-200)', padding: 'var(--ink-spacing-50) var(--ink-spacing-100)',
        borderBottom: '1px solid var(--ink-border-subtle)',
        background: 'var(--ink-bg-color-default)',
        minHeight: 40, position: 'relative',
      }}>
        <Inline gap="small" align="center" style={{ whiteSpace: 'nowrap' }}>
          <Input style={{ width: 36, textAlign: 'center', padding: '2px 4px' }} value="1" readOnly />
          <Text size="sm" color="secondary" style={{ whiteSpace: 'nowrap' }}>/ 5</Text>
          <IconButton icon="chevron-up" variant="tertiary" size="small" aria-label="Previous page" />
          <IconButton icon="chevron-down" variant="tertiary" size="small" aria-label="Next page" />
        </Inline>
        <div style={{ width: 1, height: 16, background: 'var(--ink-border-subtle)' }} />
        <Inline gap="small" align="center">
          <IconButton icon="zoom-in" variant="tertiary" size="small" aria-label="Zoom in" />
          <Text size="xs">100%</Text>
          <IconButton icon="zoom-out" variant="tertiary" size="small" aria-label="Zoom out" />
        </Inline>
        <IconButton icon="search" variant="tertiary" size="small" aria-label="Search document" style={{ position: 'absolute', right: 'var(--ink-spacing-100)' }} />
      </div>

      {/* Row 3: left sidebar + detail panel + document */}
      <div style={{ display: 'grid', gridTemplateColumns: activeDetailTab ? '64px 380px 1fr' : '64px 1fr', overflow: 'hidden' }}>
        {/* Left icon sidebar — controls right panel tabs */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 4px', gap: '16px',
          background: 'white',
          width: 64,
        }}>
          {DETAIL_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSidebarTabClick(tab.id)}
              aria-label={tab.label}
              style={{
                width: 40, height: 40,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: activeDetailTab === tab.id ? 'var(--ink-cobalt-140)' : 'transparent',
                color: activeDetailTab === tab.id ? 'rgba(255,255,255,0.9)' : 'var(--ink-neutral-140)',
              }}
            >
              <Icon name={tab.icon} size={20} />
            </button>
          ))}
        </div>

        {/* Detail panel — LEFT side, toggled by sidebar icons, no tab bar */}
        {activeDetailTab && (
          <div style={{
            borderRight: '1px solid var(--ink-border-subtle)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: 'var(--ink-bg-color-default)',
          }}>
            <div style={{ overflow: 'auto', height: 'calc(100vh - 104px)' }}>
              {activeDetailTab === 'details' && (
                <>
                  <div style={{ padding: 'var(--ink-spacing-150) var(--ink-spacing-200)', display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-100)' }}>
                    <Heading level={2}>Details</Heading>
                    <IconButton icon="edit" variant="tertiary" size="small" aria-label="Edit" />
                    <IconButton icon="plus" variant="tertiary" size="small" aria-label="Create new Fields or Clauses" />
                  </div>
                  {detailContent}
                </>
              )}
              {activeDetailTab === 'obligations' && (
                <div style={{ padding: 'var(--ink-spacing-200)' }}>
                  <Heading level={2}>Obligations</Heading>
                  <Text size="sm" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>No obligations found.</Text>
                </div>
              )}
              {activeDetailTab === 'sets' && (
                <div style={{ padding: 'var(--ink-spacing-200)' }}>
                  <Heading level={2}>Agreement sets</Heading>
                  <Text size="sm" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>No agreement sets.</Text>
                </div>
              )}
              {activeDetailTab === 'related' && (
                <div style={{ padding: 'var(--ink-spacing-200)' }}>
                  <Heading level={2}>Related agreements</Heading>
                  <Text size="sm" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>No related agreements.</Text>
                </div>
              )}
              {activeDetailTab === 'chat' && (
                <div style={{ padding: 'var(--ink-spacing-200)' }}>
                  <Heading level={2}>Chat</Heading>
                  <Text size="sm" color="secondary" style={{ marginTop: 'var(--ink-spacing-100)' }}>Start a conversation about this agreement.</Text>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document viewer — RIGHT side */}
        <div style={{
          background: 'var(--ink-bg-color-subtle)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Document */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 'var(--ink-spacing-300)' }}>
            <div style={{
              width: 680, maxWidth: '100%', background: 'white', borderRadius: 'var(--ink-radius-size-m)',
              boxShadow: 'var(--ink-shadow-elevation-2)',
              padding: 'var(--ink-spacing-400) var(--ink-spacing-500)',
              minHeight: 900,
            }}>
              <Stack gap="medium">
                <Text size="xs" color="secondary" style={{ textAlign: 'right' }}>2135C Central Parkway Cincinnati, OH 45214</Text>
                <Heading level={2} style={{ textAlign: 'center', fontFamily: 'serif' }}>batterii</Heading>
                <Text size="xs" color="secondary" style={{ textAlign: 'center' }}>Inspiring Innovation™</Text>
                <Heading level={3}>Master Licensing Agreement</Heading>
                <Text size="sm">
                  This Agreement (the &quot;License&quot;) is for the use of the Batterii SaaS Platform (&quot;Batterii&quot;) as defined below. Use of Batterii SaaS Platform is expressly conditioned upon acceptance of &quot;Company Name&quot; (&quot;Master Licensee&quot;) and compliance with the following terms and conditions.
                </Text>
                <Heading level={4}>1.0 Definitions</Heading>
                <Text size="sm">The following terms have the meaning set forth herein:</Text>
                <Text size="sm"><strong>Customer Data</strong> — All materials, including but not limited to graphic, picture, text, audio, video, software or information not generated by Batterii...</Text>
                <Text size="sm"><strong>Privacy Policy</strong> — The Batterii Privacy Policy identifies the manner in which Batterii obtains, accesses and provides others with access to information obtained by Batterii...</Text>
                <Heading level={4}>2.0 Grant of License</Heading>
                <Text size="sm">Batterii grants Master Licensee, a non-exclusive, non-transferable, worldwide right to use Batterii SaaS as set forth herein.</Text>
                <Heading level={4}>3.0 Fee and Payment</Heading>
                <Text size="sm">The License fee shall be billed in advance of the usage by mutually agreed time periods; typically quarterly, semi-annually or annually.</Text>
                <Heading level={4}>4.0 License Term</Heading>
                <Text size="sm">This license shall be for the agreed term unless terminated in writing by Master Licensee or by Batterii.</Text>
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash as TabId) ? (hash as TabId) : 'home';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);
  const [sidebarView, setSidebarView] = useState<SidebarView>('all-agreements');
  const [templatesSidebarView, setTemplatesSidebarView] = useState<TemplatesSidebarView>('my-templates');
  const [insightsSidebarView, setInsightsSidebarView] = useState<InsightsSidebarView>('overview');
  const [search, setSearch] = useState('');
  const [showAgreementDetail, setShowAgreementDetail] = useState(false);

  /* ── Sync hash ↔ state ── */
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
      setSearch('');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabClick = useCallback((tabId: string) => {
    window.location.hash = tabId;
    if (tabId === 'agreements') setSidebarView('all-agreements');
    if (tabId === 'templates') setTemplatesSidebarView('my-templates');
    if (tabId === 'insights') setInsightsSidebarView('overview');
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
    ],
    showSettings: true,
    settingsIcon: 'sliders-horizontal' as const,
    user: { name: 'Akshat Mishra' },
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
          { id: 'all-agreements', label: 'All Agreements', icon: 'envelope' as const, onClick: () => setSidebarView('all-agreements') },
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
          { id: 'parties', label: 'Parties', icon: 'building-person' as const, badge: 'New', onClick: () => setSidebarView('parties') },
          { id: 'requests', label: 'Requests', icon: 'ticket' as const, badge: 'New', onClick: () => setSidebarView('requests') },
          { id: 'maestro', label: 'Maestro Workflows', icon: 'workflow' as const, badge: 'New' },
          { id: 'workspaces', label: 'Workspaces', icon: 'transaction' as const },
          { id: 'powerforms', label: 'PowerForms', icon: 'flash' as const },
          { id: 'bulk-send', label: 'Bulk Send', icon: 'document-stack' as const },
        ],
      },
    ],
  };

  /* ── Templates sidebar — matches production DocuSign ── */
  const templatesSidebar = {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-template', label: 'Create Template', icon: 'edit' as const },
      { id: 'upload-template', label: 'Upload Template', icon: 'upload' as const },
    ],
    activeItemId: templatesSidebarView,
    sections: [
      {
        id: 'envelope-templates',
        items: [
          { id: 'envelope-templates-header', label: 'Envelope Templates', icon: 'templates' as const, onClick: () => setTemplatesSidebarView('my-templates') },
          { id: 'my-templates', label: 'My Templates', nested: true, onClick: () => setTemplatesSidebarView('my-templates') },
          { id: 'shared-with-me', label: 'Shared with Me', nested: true, onClick: () => setTemplatesSidebarView('shared-with-me') },
          { id: 'favorites', label: 'Favorites', nested: true, onClick: () => setTemplatesSidebarView('favorites') },
        ],
      },
      {
        id: 'other-templates',
        hasDivider: true,
        items: [
          { id: 'document-templates', label: 'Document Templates', icon: 'document' as const, badge: 'New' },
          { id: 'workflow-templates', label: 'Workflow Templates', icon: 'workflow' as const, badge: 'New' },
        ],
      },
      {
        id: 'web-forms',
        hasDivider: true,
        items: [
          { id: 'web-forms-header', label: 'Web Forms', icon: 'globe-language' as const },
          { id: 'my-web-forms', label: 'My Web Forms', nested: true },
          { id: 'shared-web-forms', label: 'Shared with Me', nested: true },
          { id: 'all-web-forms', label: 'All Web Forms', nested: true, onClick: () => setTemplatesSidebarView('all-templates') },
          { id: 'template-gallery', label: 'Template Gallery', nested: true, badge: 'New' },
        ],
      },
    ],
  };

  /* ── Insights sidebar — matches production DocuSign Reports ── */
  const insightsSidebar = {
    headerLabel: 'Create',
    headerIcon: 'plus' as const,
    activeItemId: insightsSidebarView,
    sections: [
      {
        id: 'insights-overview',
        items: [
          { id: 'overview', label: 'Overview', icon: 'home' as const, onClick: () => setInsightsSidebarView('overview') },
        ],
      },
      {
        id: 'insights-dashboards',
        hasDivider: true,
        items: [
          { id: 'dashboards', label: 'Dashboards', icon: 'layout-grid' as const, onClick: () => setInsightsSidebarView('dashboards') },
          { id: 'my-dashboard', label: 'My dashboard', nested: true, onClick: () => setInsightsSidebarView('dashboards') },
          { id: 'admin-dashboard', label: 'Administrator dashboard', nested: true, onClick: () => setInsightsSidebarView('dashboards') },
          { id: 'agreements-dashboard', label: 'Agreements', nested: true, onClick: () => setInsightsSidebarView('dashboards') },
          { id: 'obligations-dashboard', label: 'Obligations', nested: true, onClick: () => setInsightsSidebarView('dashboards') },
          { id: 'renewals-dashboard', label: 'Renewals', nested: true, onClick: () => setInsightsSidebarView('dashboards') },
          { id: 'requests-dashboard', label: 'Requests', nested: true, onClick: () => setInsightsSidebarView('dashboards') },
        ],
      },
      {
        id: 'insights-reports',
        hasDivider: true,
        items: [
          { id: 'reports', label: 'Reports', icon: 'bar-chart-2' as const, onClick: () => setInsightsSidebarView('reports') },
        ],
      },
    ],
  };

  /* ── View-filtered data ── */
  const viewAgreements = useMemo(() => {
    switch (sidebarView) {
      case 'drafts':
        return [
          { id: 'd1', name: 'Q2 Partnership Agreement - Draft', recipient: 'To: Legal Team', status: 'Draft', statusIcon: 'clock' as const, statusKind: 'neutral' as const, date: '31/3/2026', time: '09:15', action: 'Edit' as const },
          { id: 'd2', name: 'Contractor NDA - Pending Review', recipient: 'To: Akshat Mishra', status: 'Draft', statusIcon: 'clock' as const, statusKind: 'neutral' as const, date: '30/3/2026', time: '14:30', action: 'Edit' as const },
          { id: 'd3', name: 'Office Lease Renewal 2026', recipient: 'To: Facilities', status: 'Draft', statusIcon: 'clock' as const, statusKind: 'neutral' as const, date: '28/3/2026', time: '11:00', action: 'Edit' as const },
        ];
      case 'in-progress':
        return [
          { id: 'ip1', name: 'Vendor Agreement - CloudCo Services', recipient: 'To: CloudCo Services', status: 'Sent', statusIcon: 'clock' as const, statusKind: 'info' as const, statusSub: 'Waiting for others', date: '30/3/2026', time: '16:45', action: 'Copy' as const },
          { id: 'ip2', name: 'Consulting Agreement - DesignLab', recipient: 'To: DesignLab Studio', status: 'Sent', statusIcon: 'clock' as const, statusKind: 'info' as const, statusSub: 'Waiting for others', date: '29/3/2026', time: '10:20', action: 'Copy' as const },
          { id: 'ip3', name: 'Software License Agreement - Acme', recipient: 'To: Acme Solutions, Inc.', status: 'Delivered', statusIcon: 'clock' as const, statusKind: 'info' as const, statusSub: '1 of 2 signed', date: '27/3/2026', time: '09:00', action: 'Copy' as const },
          { id: 'ip4', name: 'Service Level Agreement - TechStart', recipient: 'To: TechStart Inc', status: 'Delivered', statusIcon: 'clock' as const, statusKind: 'info' as const, statusSub: 'Viewed', date: '25/3/2026', time: '14:10', action: 'Copy' as const },
        ];
      case 'completed':
        return AGREEMENTS_DATA.filter(a => a.status === 'Completed');
      case 'deleted':
        return [
          { id: 'del1', name: 'Old NDA - Expired', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void' as const, statusKind: 'neutral' as const, statusSub: 'Deleted', date: '15/3/2026', time: '08:30', action: 'Copy' as const },
        ];
      default:
        return AGREEMENTS_DATA;
    }
  }, [sidebarView]);

  const filteredAgreements = useMemo(() => {
    if (!search) return viewAgreements;
    const q = search.toLowerCase();
    return viewAgreements.filter((a) => a.name.toLowerCase().includes(q) || a.recipient.toLowerCase().includes(q));
  }, [search, viewAgreements]);

  const filteredParties = useMemo(() => {
    if (!search) return PARTIES_DATA;
    const q = search.toLowerCase();
    return PARTIES_DATA.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [search]);

  const VIEW_LABELS: Record<SidebarView, string> = {
    'all-agreements': 'All Agreements', drafts: 'Drafts', 'in-progress': 'In Progress',
    completed: 'Completed', deleted: 'Deleted', parties: 'Parties', requests: 'Requests',
  };

  const isPartiesView = sidebarView === 'parties';
  const isNavigatorView = sidebarView === 'completed';
  const isRequestsView = sidebarView === 'requests';

  /* ── Navigator filtered data ── */
  const filteredNavigator = useMemo(() => {
    if (!search) return NAVIGATOR_DATA;
    const q = search.toLowerCase();
    return NAVIGATOR_DATA.filter(a => a.fileName.toLowerCase().includes(q) || a.parties.some(p => p.toLowerCase().includes(q)));
  }, [search]);

  /* ── Requests filtered data ── */
  const filteredRequests = useMemo(() => {
    if (!search) return REQUESTS_DATA;
    const q = search.toLowerCase();
    return REQUESTS_DATA.filter(r => r.title.toLowerCase().includes(q) || r.requestId.toLowerCase().includes(q));
  }, [search]);

  /* ── Templates filtered data ── */
  const viewTemplates = useMemo(() => {
    switch (templatesSidebarView) {
      case 'my-templates':
        return TEMPLATES_DATA.filter(t => t.owner === 'Akshat Mishra');
      case 'shared-with-me':
        return TEMPLATES_DATA.filter(t => t.shared && t.owner !== 'Akshat Mishra');
      case 'favorites':
        return TEMPLATES_DATA.filter(t => t.favorited);
      default:
        return TEMPLATES_DATA;
    }
  }, [templatesSidebarView]);

  const filteredTemplates = useMemo(() => {
    if (!search) return viewTemplates;
    const q = search.toLowerCase();
    return viewTemplates.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [search, viewTemplates]);

  /* ── Reports filtered data ── */
  const viewReports = useMemo(() => {
    if (insightsSidebarView === 'dashboards') return REPORTS_DATA.filter(r => r.type === 'dashboard');
    return REPORTS_DATA;
  }, [insightsSidebarView]);

  const filteredReports = useMemo(() => {
    if (!search) return viewReports;
    const q = search.toLowerCase();
    return viewReports.filter(r => r.name.toLowerCase().includes(q));
  }, [search, viewReports]);

  const TEMPLATE_VIEW_LABELS: Record<TemplatesSidebarView, string> = {
    'my-templates': 'My Templates', 'shared-with-me': 'Shared with Me',
    favorites: 'Favorites', 'all-templates': 'All Templates',
  };

  const INSIGHTS_VIEW_LABELS: Record<InsightsSidebarView, string> = {
    overview: 'Overview', dashboards: 'Dashboards', reports: 'Reports',
  };

  /* ── Templates content ── */
  const templatesContent = (
    <AgreementTableView
      pageHeader={
        <PageHeader
          title={TEMPLATE_VIEW_LABELS[templatesSidebarView]}
          actions={
            <>
              <Button kind="secondary" startElement={<Icon name="upload" size={16} />}>Upload</Button>
              <Button kind="secondary">New Template</Button>
            </>
          }
        />
      }
      filterBar={
        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search templates...',
          }}
          filters={
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Button kind="secondary" size="small" menuTrigger>Owner</Button>
              <Button kind="secondary" size="small" menuTrigger>Shared</Button>
              <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>All Filters</Button>
            </Inline>
          }
        />
      }
    >
      <DataTable
        columns={templateColumns}
        data={filteredTemplates}
        getRowKey={(row) => row.id}
        stickyHeader
        showColumnControl
        emptyMessage="No templates found"
        pagination={{ page: 1, pageSize: 25, totalItems: filteredTemplates.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }}
      />
    </AgreementTableView>
  );

  /* ── Insights content ── */
  const insightsContent = insightsSidebarView === 'overview' ? (
    <InsightsOverview />
  ) : (
    <AgreementTableView
      pageHeader={
        <PageHeader
          title={INSIGHTS_VIEW_LABELS[insightsSidebarView]}
          actions={
            <Button kind="secondary" startElement={<Icon name="plus" size={16} />}>
              {insightsSidebarView === 'dashboards' ? 'New Dashboard' : 'New Report'}
            </Button>
          }
        />
      }
      filterBar={
        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: insightsSidebarView === 'dashboards' ? 'Search dashboards...' : 'Search reports...',
          }}
          filters={
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Button kind="secondary" size="small" menuTrigger>Type</Button>
              <Button kind="secondary" size="small" menuTrigger>Owner</Button>
            </Inline>
          }
        />
      }
    >
      <DataTable
        columns={reportColumns}
        data={filteredReports}
        getRowKey={(row) => row.id}
        stickyHeader
        showColumnControl
        emptyMessage={insightsSidebarView === 'dashboards' ? 'No dashboards found' : 'No reports found'}
        pagination={{ page: 1, pageSize: 25, totalItems: filteredReports.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }}
      />
    </AgreementTableView>
  );

  /* ── Agreements content ── */
  const agreementsContent = (
    <AgreementTableView
      banner={isNavigatorView ? (
        <Banner kind="promo" closable customIcon={<IrisIcon />}>
          <strong>0 agreements</strong> with renewal notice dates in the next 30 days.
        </Banner>
      ) : undefined}
      pageHeader={
        <PageHeader
          title={isNavigatorView ? 'Completed' : isPartiesView ? 'Parties' : isRequestsView ? 'Requests' : VIEW_LABELS[sidebarView]}
          showAIBadge={isNavigatorView || isPartiesView}
          aiBadgeText="AI-Assisted"
          actions={isPartiesView
            ? (<>
                <IconButton icon="bar-chart-2" variant="tertiary" size="small" aria-label="Analytics" />
                <Button kind="secondary" startElement={<Icon name="settings" size={16} />}>Manage Parties</Button>
              </>)
            : isRequestsView
            ? <Button kind="secondary">Create Request</Button>
            : isNavigatorView
            ? (<>
                <ComboButton variant="secondary" startIcon="plus">New</ComboButton>
                <IconButton icon="settings" variant="tertiary" size="small" aria-label="Settings" />
              </>)
            : <Button kind="secondary" menuTrigger>Shared Access</Button>
          }
        />
      }
      filterBar={
        <FilterBar
          viewSelector={isNavigatorView ? (
            <Button kind="secondary" size="small" menuTrigger>Documents</Button>
          ) : isPartiesView ? (
            <Button kind="secondary" size="small" menuTrigger>Role View</Button>
          ) : undefined}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: isNavigatorView
              ? "Try 'which agreements expire in 90 days'"
              : isPartiesView ? 'Search parties...'
              : isRequestsView ? 'Search Request Titles or IDs...'
              : 'Search Envelopes',
          }}
          showSearchIndicator={!isPartiesView && !isRequestsView}
          quickActions={isNavigatorView ? [
            <IconButton key="bm" icon="bookmark" variant="secondary" size="small" aria-label="Bookmarks" />,
          ] : isRequestsView ? [
            <IconButton key="bm" icon="bookmark" variant="secondary" size="small" aria-label="Bookmarks" />,
          ] : undefined}
          filters={isPartiesView ? (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Button kind="secondary" size="small" menuTrigger>Party Roles</Button>
              <Button kind="secondary" size="small" menuTrigger>Party Side</Button>
            </Inline>
          ) : isRequestsView ? (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Chip onRemove={() => {}}>Status Type: Open</Chip>
              <Button kind="secondary" size="small" menuTrigger>Created At</Button>
              <Button kind="secondary" size="small" menuTrigger>Due Date</Button>
              <Button kind="secondary" size="small" menuTrigger>Last Activity At</Button>
              <Button kind="secondary" size="small" menuTrigger>Owner</Button>
              <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>All Filters</Button>
            </Inline>
          ) : isNavigatorView ? (
            <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>Filters</Button>
          ) : (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Chip onRemove={() => {}}>Date: Last 6 Months</Chip>
              <div style={{ width: 1, height: 20, background: 'var(--ink-border-subtle)', flexShrink: 0 }} />
              <Button kind="secondary" size="small" menuTrigger>Status</Button>
              <Button kind="secondary" size="small" menuTrigger>Sender</Button>
              <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>All Filters</Button>
            </Inline>
          )}
        />
      }
    >
      {isPartiesView ? (
        <DataTable columns={partyColumns} data={filteredParties} getRowKey={(row) => row.id} stickyHeader showColumnControl emptyMessage="No parties match your search" pagination={{ page: 1, pageSize: 25, totalItems: 1334, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : isRequestsView ? (
        <DataTable columns={requestColumns} data={filteredRequests} getRowKey={(row) => row.id} stickyHeader showColumnControl rowHeight="tall" emptyMessage="No requests found" pagination={{ page: 1, pageSize: 10, totalItems: filteredRequests.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : isNavigatorView ? (
        <DataTable columns={navigatorColumns} data={filteredNavigator} getRowKey={(row) => row.id} selectable stickyHeader showColumnControl rowHeight="tall" emptyMessage="No completed documents" onRowClick={() => setShowAgreementDetail(true)} pagination={{ page: 1, pageSize: 50, totalItems: 687, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : (
        <DataTable columns={agreementColumns} data={filteredAgreements} getRowKey={(row) => row.id} selectable stickyHeader showColumnControl rowHeight="tall" emptyMessage={
          sidebarView === 'drafts' ? 'No drafts found' :
          sidebarView === 'in-progress' ? 'No documents in progress' :
          sidebarView === 'deleted' ? 'No deleted documents' :
          'No agreements match your search'
        } pagination={{ page: 1, pageSize: 25, totalItems: filteredAgreements.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      )}
    </AgreementTableView>
  );

  /* ── Resolve content + sidebar ── */
  const sidebarMap: Record<TabId, object | undefined> = {
    home: undefined,
    agreements: agreementsSidebar,
    templates: templatesSidebar,
    insights: insightsSidebar,
    admin: undefined,
  };

  const contentMap: Record<TabId, JSX.Element> = {
    home: <HomePage />,
    agreements: agreementsContent,
    templates: templatesContent,
    insights: insightsContent,
    admin: <AdminPage />,
  };

  /* ── Transition key — changes on tab OR sidebar view to trigger animation ── */
  const transitionKey = `${activeTab}-${sidebarView}-${templatesSidebarView}-${insightsSidebarView}`;

  return (
    <>
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={sidebarMap[activeTab]}
    >
      <div key={transitionKey} className="page-transition" style={{ flex: 1 }}>
        {contentMap[activeTab]}
      </div>
      <Footer />
    </DocuSignShell>
    {showAgreementDetail && (
      <AgreementDetailView onClose={() => setShowAgreementDetail(false)} />
    )}
    </>
  );
}
