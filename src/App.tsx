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
  IrisIcon,
  Icon,
  IconButton,
  Card,
  Stack,
  Grid,
  Inline,
  Container,
  Heading,
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
type SidebarView = 'all-agreements' | 'drafts' | 'in-progress' | 'completed' | 'deleted' | 'parties';

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
          border: '1px solid var(--ink-border-subtle)',
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
        <Card radius="large">
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Your Recents</span>
            <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {recents.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--ink-spacing-100) 0',
                  borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-100)' }}>
                    <Icon name="bar-chart-2" size={16} />
                    <span style={{ fontSize: 14 }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-font-secondary)' }}>{r.time}</span>
                </div>
              ))}
            </Stack>
            <div style={{ textAlign: 'center', marginTop: 'var(--ink-spacing-150)', borderTop: '1px solid var(--ink-border-subtle)', paddingTop: 'var(--ink-spacing-100)' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-cobalt-90)', cursor: 'pointer' }}>View all</span>
            </div>
          </div>
        </Card>

        {/* Your Favorites */}
        <Card radius="large">
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Your Favorites</span>
            <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {favorites.map((f, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ink-spacing-100)',
                  padding: 'var(--ink-spacing-100) 0',
                  borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none',
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
          <Card radius="large">
            <div style={{ padding: 'var(--ink-spacing-200)', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 'var(--ink-spacing-200)' }}>All agreements</div>
              <div style={{ fontSize: 12, color: 'var(--ink-font-secondary)' }}>Count</div>
              <div style={{ fontSize: 36, fontWeight: 600, margin: 'var(--ink-spacing-100) 0' }}>42,357</div>
              <div style={{ fontSize: 13 }}>Agreements</div>
            </div>
          </Card>
          <Card radius="large">
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
        border: '1px solid var(--ink-border-subtle)',
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

function getTabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash as TabId) ? (hash as TabId) : 'home';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);
  const [sidebarView, setSidebarView] = useState<SidebarView>('all-agreements');
  const [search, setSearch] = useState('');

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
    return PARTIES_DATA.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [search]);

  const VIEW_LABELS: Record<SidebarView, string> = {
    'all-agreements': 'All Agreements', drafts: 'Drafts', 'in-progress': 'In Progress',
    completed: 'Completed', deleted: 'Deleted', parties: 'Parties',
  };

  const isPartiesView = sidebarView === 'parties';
  const isNavigatorView = sidebarView === 'completed';

  /* ── Navigator filtered data ── */
  const filteredNavigator = useMemo(() => {
    if (!search) return NAVIGATOR_DATA;
    const q = search.toLowerCase();
    return NAVIGATOR_DATA.filter(a => a.fileName.toLowerCase().includes(q) || a.parties.some(p => p.toLowerCase().includes(q)));
  }, [search]);

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
          title={isNavigatorView ? 'Completed' : VIEW_LABELS[sidebarView]}
          showAIBadge={isNavigatorView}
          aiBadgeText="AI-Assisted"
          actions={isPartiesView
            ? <Button kind="brand" startElement={<Icon name="plus" size={16} />}>Add Party</Button>
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
          ) : undefined}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: isNavigatorView
              ? "Try 'which agreements expire in 90 days'"
              : isPartiesView ? 'Search parties by name, email, or role' : 'Search Envelopes',
          }}
          showSearchIndicator={!isPartiesView}
          quickActions={isNavigatorView ? [
            <IconButton key="bm" icon="bookmark" variant="secondary" size="small" aria-label="Bookmarks" />,
          ] : undefined}
          filters={isPartiesView ? (
            <Button kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>Filters</Button>
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
        <DataTable columns={partyColumns} data={filteredParties} getRowKey={(row) => row.id} selectable stickyHeader emptyMessage="No parties match your search" pagination={{ page: 1, pageSize: 25, totalItems: filteredParties.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : isNavigatorView ? (
        <DataTable columns={navigatorColumns} data={filteredNavigator} getRowKey={(row) => row.id} selectable stickyHeader showColumnControl rowHeight="tall" emptyMessage="No completed documents" pagination={{ page: 1, pageSize: 50, totalItems: 687, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
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

  /* ── Transition key — changes on tab OR sidebar view to trigger animation ── */
  const transitionKey = `${activeTab}-${sidebarView}`;

  return (
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={sidebarMap[activeTab]}
    >
      <div key={transitionKey} className="page-transition" style={{ flex: 1 }}>
        {contentMap[activeTab]}
      </div>
      <Footer />
    </DocuSignShell>
  );
}
