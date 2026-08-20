import { useState, useMemo, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import {
  DocuSignShell,
  AgreementTableView,
  DataTable,
  PageHeader,
  FilterBar,
  Button,
  Badge,
  BarChart,
  ComboButton,
  AIIcon,
  AIBadge,
  IrisIcon,
  IrisIconInverse,
  Dropdown,
  Accordion,
  Avatar,
  Divider,
  Input,
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

/*
 * Iris — Tier 1, and nothing below it.
 *
 * `IrisAgent` + `PanelShell` + `usePanelMode` are the whole chat app, not a
 * shell you finish: the cold-state sequence, the onboarding checklist, the
 * agreement snapshot, the nav pages and the artifact dock all run inside these
 * three. This file supplies content and fixtures; it supplies no behaviour.
 *
 * The panel is a SIBLING of the host page, never its parent — that inversion is
 * what lets the page reflow instead of being overlapped.
 */
import { IrisAgent, NavPage, PanelShell, usePanelMode } from '@ai';
import type { ChatMessage, NavPageEntry } from '@ai';
import {
  AGENTS,
  AGREEMENT_PLACEHOLDER,
  AGREEMENT_STEPS,
  AGREEMENT_SUGGESTIONS,
  ALL_ARTIFACTS,
  COLD_SUGGESTIONS,
  CONTEXT_AGREEMENTS,
  CONTEXT_GREETING,
  CONVERSATIONS,
  FRAME_PLACEHOLDER,
  GET_STARTED_STEPS,
  LIBRARY_PROMPTS,
  NAV_SHORTCUTS,
  PREVIEW_AGREEMENT,
  SCENARIOS,
  SCRIPTED_EXCHANGES,
  FALLBACK_EXCHANGE,
  GENERATED_DOCUMENTS,
  AUTONOMOUS_SEED,
  PARTY_PROACTIVE,
  SEARCH_PREVIEW_COLUMNS,
  SEARCH_RESULTS,
  ScenariosPage,
  WalkthroughCard,
} from './iris/scenarios';
import type { PreviewAgreement, ScenarioId } from './iris/scenarios';

/** Read once at init — the app hash-routes, so the query lives before the #. */
const SHOW_WALKTHROUGH =
  new URLSearchParams(window.location.search).get('walkthrough') === 'true';

/* ═══════════════════════════════════════
   DataTable Row Stagger Animation (CSS)
   ═══════════════════════════════════════ */

const tableRowStaggerStyles = `
@keyframes inkRowEntrance {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Apply staggered entrance to DataTable body rows */
[data-ink-component="DataTable"] tbody tr {
  animation: inkRowEntrance 300ms cubic-bezier(0.33, 0, 0.67, 1) backwards;
}

/* Stagger rows — 20ms increments, capped at 10 rows (200ms) */
[data-ink-component="DataTable"] tbody tr:nth-child(1) { animation-delay: 0ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(2) { animation-delay: 20ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(3) { animation-delay: 40ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(4) { animation-delay: 60ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(5) { animation-delay: 80ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(6) { animation-delay: 100ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(7) { animation-delay: 120ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(8) { animation-delay: 140ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(9) { animation-delay: 160ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(10) { animation-delay: 180ms; }
[data-ink-component="DataTable"] tbody tr:nth-child(n+11) { animation-delay: 200ms; }

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  [data-ink-component="DataTable"] tbody tr {
    animation: none;
  }
}
`;

/* ═══════════════════════════════════════
   Entrance Animation Hooks
   ═══════════════════════════════════════ */

/**
 * Hook for staggered entrance animations.
 * Returns a function that generates style props for each item.
 */
function useStaggerEntrance(itemCount: number, options?: {
  baseDelay?: number;
  staggerInterval?: number;
  duration?: number;
  distance?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const {
    baseDelay = 0,
    staggerInterval = 30,
    duration = 400,
    distance = 8,
  } = options || {};

  return (index: number) => ({
    style: {
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : `translateY(${distance}px)`,
      transition: `opacity ${duration}ms cubic-bezier(0.33, 0, 0.67, 1) ${baseDelay + index * staggerInterval}ms, transform ${duration}ms cubic-bezier(0.35, 0, 0.2, 1) ${baseDelay + index * staggerInterval}ms`,
    } as CSSProperties,
  });
}

/**
 * Hook for a simple fade-in on mount.
 */
function useFadeIn(delay: number = 0, duration: number = 300) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return {
    style: {
      opacity: mounted ? 1 : 0,
      transition: `opacity ${duration}ms cubic-bezier(0.33, 0, 0.67, 1) ${delay}ms`,
    } as CSSProperties,
  };
}

/**
 * Wrapper component that fades in its children.
 * Use key={someValue} on the component to re-trigger on changes.
 */
function FadeIn({ children, keyProp: _keyProp }: { children: React.ReactNode; keyProp: string }) {
  const fade = useFadeIn(0, 250);
  return <div {...fade}>{children}</div>;
}

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type TabId = 'home' | 'agreements' | 'templates' | 'insights' | 'admin' | 'scenarios';
type SidebarView = 'all-agreements' | 'drafts' | 'in-progress' | 'completed' | 'deleted' | 'parties' | 'requests' | 'workspaces';
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
  /** Optional override for the status label (defaults to Active/Inactive) */
  statusLabel?: string;
  /** Secondary line under the status, e.g. "Renews 12/31/2026" */
  statusDate?: string;
  agreementType: string;
  contractValue?: string;
  effectiveDate?: string;
  expirationDate?: string;
  isAIAssisted: boolean;
}

// Mirrors the production Navigator "Completed Documents" table
const NAVIGATOR_DATA: NavigatorAgreement[] = [
  { id: '1', fileName: 'Obligation Management – Supported Extractions (Limited) (1).pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['Acme Technologies, Inc.', 'Brightline Solutions, LLC'], status: 'active', statusDate: 'Renews 12/31/2026', agreementType: 'Master Service Agreement', isAIAssisted: true },
  { id: '2', fileName: 'Stellar_Logical_Fontara_Order_Form_100123 (2).pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['Stellar Logical', 'Fontara'], status: 'inactive', agreementType: 'Order Form', isAIAssisted: true },
  { id: '3', fileName: '3.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['Hamburger, Inc.', 'Sorrel Co.'], status: 'inactive', agreementType: 'Purchase Agreement', isAIAssisted: true },
  { id: '4', fileName: 'White-Label Software Licensing and Integrated Payment Services Agreement (1).pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['CoreStream Processing Corp.', 'SaaS Growth Ventures, LLC'], status: 'active', agreementType: 'License', isAIAssisted: true },
  { id: '5', fileName: 'Global Affiliate Marketing Network Contract (1).pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['Delta Traffic Brokers', 'NexaCharge Gateways'], status: 'active', agreementType: 'Marketing', isAIAssisted: true },
  { id: '6', fileName: 'Test Agreement for Party Cleanup', fileStatus: 'completed', fileStatusDetail: 'View Job', parties: [], status: 'inactive', agreementType: 'Master Service Agreement', isAIAssisted: true },
  { id: '7', fileName: 'Test Agreement for Party Cleanup', fileStatus: 'completed', fileStatusDetail: 'View Job', parties: [], status: 'inactive', agreementType: 'Master Service Agreement', isAIAssisted: true },
  { id: '8', fileName: 'Test Agreement for Party Cleanup', fileStatus: 'completed', fileStatusDetail: 'View Job', parties: [], status: 'inactive', agreementType: 'Master Service Agreement', isAIAssisted: true },
  { id: '9', fileName: 'SpaceX_DocAnalyser-DCF-CX-2026-07-07-004.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['OrbitalNet Solutions', 'SpaceX Orbital Logistics'], status: 'inactive', statusDate: 'Expired 6/21/2024', agreementType: 'SpaceX Launch Agreement', isAIAssisted: true },
  { id: '10', fileName: 'SpaceX_DocAnalyser-DCF-CX-2026-07-07-003.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['SkyReach Satellite Systems GmbH', 'SpaceX Starship Launch Services'], status: 'inactive', statusDate: 'Expired 10/27/2025', agreementType: 'Services Agreement', isAIAssisted: true },
  { id: '11', fileName: 'SpaceX_DocAnalyser-DCF-CX-2026-07-07-001.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['OrbitalNet Solutions Ltd.', 'SpaceX Launch Services'], status: 'active', statusDate: 'Expires 10/31/2026', agreementType: 'SpaceX Launch Agreement', isAIAssisted: true },
  { id: '12', fileName: 'SpaceX_DocAnalyser-DCF-CX-2026-07-07-002.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['Quasar Broadband Holdings, Inc.', 'SpaceX Commercial Launch Division'], status: 'inactive', statusDate: 'Expired 2/19/2026', agreementType: 'SpaceX Launch Agreement', isAIAssisted: true },
  { id: '13', fileName: 'SpaceX_DocAnalyser-DCF-CX-2026-07-07-005.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['SpaceX Starship Launch Services', 'Vela Navigation Services S.A.'], status: 'active', statusDate: 'Expires 2/17/2028', agreementType: 'SpaceX Launch Agreement', isAIAssisted: true },
  { id: '14', fileName: 'SXTesting-DCF-MSA-2026-07-07-002.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: ['NexGen Data Services Ltd.', 'Pinnacle Dynamics Corp.'], status: 'active', statusDate: 'Renews 4/25/2027', agreementType: 'Miscellaneous', isAIAssisted: true },
  { id: '15', fileName: 'ARTSpaceXdemo-DCF-CX-2026-07-06-001.pdf', fileStatus: 'uploaded', fileStatusDetail: 'View Job', parties: [], status: 'active', statusLabel: 'Effective Soon', statusDate: 'Effective 7/16/2026', agreementType: 'SpaceX Launch Agreement', isAIAssisted: true },
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
    header: 'Original File Name',
    sortable: true,
    width: '320px',
    className: dataTableStyles.columnBorderRight,
    cell: (row: NavigatorAgreement) => (
      <div className={dataTableStyles.cellContent} style={{ minWidth: 0 }}>
        <a href="#" className={dataTableStyles.cellPrimary} title={row.fileName} style={{ textDecoration: 'none', color: 'inherit', display: 'block', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
    width: '200px',
    cell: (row: NavigatorAgreement) => (
      <div className={dataTableStyles.cellContent}>
        {row.parties.length > 0 ? (
          row.parties.map((party, i) => {
            const isMoreLink = party.startsWith('+');
            if (isMoreLink) {
              return <a key={i} href="#" className={dataTableStyles.partyMoreLink}>{party}</a>;
            }
            return (
              <span key={i}>
                <a href="#" className={dataTableStyles.partyLink} style={{ textDecoration: 'underline', color: 'var(--ink-font-color, rgba(19,0,50,0.9))', fontWeight: 400 }}>{party}</a>
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
    width: '110px',
    cell: (row: NavigatorAgreement) => (
      <div className={dataTableStyles.statusCell}>
        <span className={dataTableStyles.statusDot} data-status={row.status} />
        <div className={dataTableStyles.statusText}>
          <span className={dataTableStyles.statusLabel}>
            {row.statusLabel ?? (row.status === 'active' ? 'Active' : 'Inactive')}
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
    width: '155px',
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
  requestType: string;
  description: string;
  created: string;
}

const REQUESTS_DATA: RequestItem[] = [
  { id: '1', title: '[Example] General Legal Request by DocuSign User Rename', requestId: 'REQ-0006', status: 'New', lastActivityAt: '6/3/2026 07:16', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'General Request', description: 'Review and advise on the updated vendor master services agreement before the renewal deadline.', created: '6/3/2026' },
  { id: '2', title: '[Example] General Legal Request by DocuSign User JR', requestId: 'REQ-0007', status: 'New', lastActivityAt: '26/2/2026 21:31', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'General Request', description: 'Need legal sign-off on a junior contractor engagement scope of work.', created: '26/2/2026' },
  { id: '3', title: '[Example] General Legal Request by DocuSign User', requestId: 'REQ-0005', status: 'New', lastActivityAt: '9/2/2026 19:19', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'General Request', description: 'General legal review requested for an inbound partnership proposal.', created: '9/2/2026' },
  { id: '4', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0004', status: 'New', lastActivityAt: '18/12/2025 23:10', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'NDA Request', description: 'Mutual non-disclosure agreement needed ahead of early diligence conversations.', created: '18/12/2025' },
  { id: '5', title: '[Example] General Legal Request by DocuSign User', requestId: 'REQ-0003', status: 'New', lastActivityAt: '18/12/2025 21:55', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'General Request', description: 'Requesting standard contract terms review for a new SaaS subscription.', created: '18/12/2025' },
  { id: '6', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0002', status: 'New', lastActivityAt: '15/11/2025 21:25', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'NDA Request', description: 'One-way NDA for a prospective supplier evaluation.', created: '15/11/2025' },
  { id: '7', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0001', status: 'New', lastActivityAt: '23/10/2025 18:35', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'NDA Request', description: 'Standard mutual NDA requested for an upcoming vendor pilot.', created: '23/10/2025' },
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
   Workspaces Data (matches real DocuSign)
   ═══════════════════════════════════════ */

interface Workspace {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created: string;
  owner: string;
}

const WORKSPACES_DATA: Workspace[] = [
  { id: '1', name: '[Example] New Patient Intake', status: 'active', created: '6/12/2026', owner: 'Akshat Mishra' },
  { id: '2', name: 'Acme Corp – Acquisition Due Diligence', status: 'active', created: '5/28/2026', owner: 'Akshat Mishra' },
  { id: '3', name: 'Q3 Vendor Onboarding', status: 'active', created: '5/14/2026', owner: 'Procurement Team' },
  { id: '4', name: '2026 Commercial Lease Closings', status: 'active', created: '4/30/2026', owner: 'Legal Team' },
  { id: '5', name: 'Contractor Statement of Work – DesignLab', status: 'inactive', created: '3/19/2026', owner: 'Akshat Mishra' },
  { id: '6', name: 'Series B Financing Round', status: 'active', created: '2/26/2026', owner: 'Finance Team' },
  { id: '7', name: 'Employee Offer Packages – Spring Cohort', status: 'inactive', created: '1/15/2026', owner: 'HR Department' },
];

const workspaceColumns: any[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    cell: (row: Workspace) => (
      <a href="#" className={dataTableStyles.cellPrimary} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
        {row.name}
      </a>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '160px',
    cell: (row: Workspace) => (
      <div className={dataTableStyles.statusCell}>
        <span className={dataTableStyles.statusDot} data-status={row.status} />
        <div className={dataTableStyles.statusText}>
          <span className={dataTableStyles.statusLabel}>{row.status === 'active' ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    ),
  },
  { key: 'created', header: 'Created', sortable: true, width: '160px' },
  {
    key: 'action',
    header: '',
    align: 'end',
    width: '140px',
    cell: () => (
      <Inline gap="small" align="center" justify="end" style={{ marginLeft: 'auto' }}>
        <Button kind="secondary" size="small">View</Button>
        <IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label="More actions" />
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
  const getStaggerProps = useStaggerEntrance(6, { baseDelay: 100, staggerInterval: 60, duration: 400, distance: 12 });

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
        background: 'radial-gradient(106.11% 145.09% at 50% -23.62%, #4200CA 0%, #260559 100%)',
        color: 'white',
        padding: '70px var(--ink-spacing-300) 63px',
        textAlign: 'center',
      }}>
        <Heading level={3} style={{ color: 'white', fontWeight: 400, marginBottom: 'var(--ink-spacing-700)' }}>
          Welcome, Akshat Mishra
        </Heading>
        <Inline gap="small" justify="center">
          <Dropdown
            position="bottom"
            align="start"
            variant="solid"
            maxHeight={520}
            items={[
              { section: 'Agreements' },
              { label: 'Envelopes', icon: <Icon name="envelope" size={18} />, children: [{ label: 'Send an Envelope' }, { label: 'Sign a Document' }, { label: 'Use a Template' }] },
              { label: 'Workflows', icon: <Icon name="workflow" size={18} />, children: [{ label: 'View Workflows' }, { label: 'Create New Workflow' }] },
              { label: 'Workspaces', icon: <Icon name="transaction" size={18} />, children: [{ label: 'Create a Workspace' }, { label: 'Use a Workspace Template' }] },
              { label: 'Create Request', icon: <Icon name="tag" size={18} />, badge: 'New' },
              { label: 'Create PowerForm', icon: <Icon name="flash" size={18} /> },
              { label: 'Generate Agreement', icon: <Icon name="document-stack" size={18} />, badge: 'New' },
              { divider: true },
              { section: 'Templates' },
              { label: 'Envelope Templates', icon: <Icon name="templates" size={18} />, children: [{ label: 'Create an Envelope Template' }] },
              { label: 'Web Forms', icon: <Icon name="browser" size={18} />, children: [{ label: 'Create a Web Form' }, { label: 'Upload Configuration' }] },
              { label: 'Create Document Template', icon: <Icon name="document" size={18} />, badge: 'New' },
              { label: 'Create Workspace Template', icon: <Icon name="transaction" size={18} /> },
            ]}
          >
            <Button kind="brand" menuTrigger style={{ background: 'var(--ink-cobalt-40)', color: 'var(--ink-font-primary)' }}>Start</Button>
          </Dropdown>
          {[
            { icon: 'send' as const, label: 'Send Envelope' },
            { icon: 'templates' as const, label: 'Create Request' },
            { icon: 'globe-language' as const, label: 'Create Web Form' },
          ].map((btn) => (
            <button
              key={btn.label}
              className="banner-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--ink-spacing-125)',
                padding: 'var(--ink-spacing-100) var(--ink-spacing-250)', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--ink-radius-sm)',
                color: 'white', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name={btn.icon} size={16} color="white" /> {btn.label}
            </button>
          ))}
        </Inline>
      </div>

      {/* Main content */}
      <Container style={{ maxWidth: 1328, padding: 'var(--ink-spacing-400) var(--ink-spacing-300)' }}>
        <Inline gap="large" align="start" className="home-content-row" style={{ gap: 32 }}>
          {/* Left column */}
          <Stack gap="medium" className="home-main-col" style={{ flex: 1 }}>
            {/* Tasks */}
            <div {...getStaggerProps(0)}>
            <Card radius="large" className="home-card">
              <Stack gap="none" style={{ padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                <Inline justify="between" align="center" style={{ paddingBottom: 'var(--ink-spacing-150)' }}>
                  <SectionLabel>Tasks</SectionLabel>
                  <Icon name="chevron-right" size={18} />
                </Inline>
                <Stack gap="none" style={{ gap: 'var(--ink-spacing-50)', padding: 'var(--ink-spacing-250) 0 var(--ink-spacing-150)' }}>
                  <Text size="lg" weight="regular" style={{ fontSize: 'var(--ink-font-size-2xl)', lineHeight: 'var(--ink-line-height-tight)' }}>You don&apos;t have any tasks yet</Text>
                  <Text size="sm" color="secondary">When you have new tasks assigned to you, they will show up here.</Text>
                </Stack>
              </Stack>
            </Card>
            </div>

            {/* Agreement Activity */}
            <div {...getStaggerProps(1)}>
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
                      <Text size="md">{item.name}</Text>
                      <Text size="xs" color="secondary" style={{ textDecoration: 'underline', textDecorationColor: 'var(--ink-border-subtle)' }}>{item.time}</Text>
                    </Stack>
                    <Inline align="center" justify="between" style={{ flexShrink: 0, width: 230 }}>
                      <Inline gap="small" align="center">
                        <Icon name={item.statusIcon} size={20} />
                        <Text size="md" color="secondary">{item.status}</Text>
                      </Inline>
                      <Icon name="chevron-right" size={20} color="var(--ink-font-secondary)" />
                    </Inline>
                  </Inline>
                ))}
              </Stack>
            </Card>
            </div>

            {/* Promo cards */}
            <div {...getStaggerProps(3)}>
            <Grid columns={2} gap="medium">
              <Card radius="large" className="home-card promo-card activity-row" noPadding>
                <Inline gap="none" align="stretch" style={{ minHeight: '100%' }}>
                  <div style={{ width: 120, flexShrink: 0, background: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ink-radius-lg) 0 0 var(--ink-radius-lg)', alignSelf: 'stretch' }}>
                    <img src={`${import.meta.env.BASE_URL}illustration-bulk-send.svg`} alt="" width={72} height={72} />
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
                    <img src={`${import.meta.env.BASE_URL}illustration-help.svg`} alt="" width={72} height={72} />
                  </div>
                  <Stack gap="none" style={{ gap: 'var(--ink-spacing-50)', padding: 'var(--ink-spacing-200) var(--ink-spacing-250)' }}>
                    <Text size="sm" weight="medium">Need help getting started?</Text>
                    <Text size="xs" color="secondary">Get help with basic questions. <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--ink-cobalt-90)' }}>View Our Guide</span></Text>
                  </Stack>
                </Inline>
              </Card>
            </Grid>
            </div>
          </Stack>

          {/* Right column - Overview */}
          <div className="home-overview" style={{ width: 332, flexShrink: 0, ...getStaggerProps(4).style }}>
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

/* Donut chart — inline SVG, matches the Insights report donuts */
function InsightsDonut({
  total,
  totalLabel = 'Total',
  segments,
  size = 150,
  thickness = 22,
}: {
  total: string;
  totalLabel?: string;
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((s, i) => {
          const dash = (s.value / sum) * circ;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-acc}
            />
          );
          acc += dash;
          return el;
        })}
      </g>
      <text x="50%" y="48%" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--ink-font-color, rgba(19,0,50,0.9))' }}>{total}</text>
      <text x="50%" y="60%" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--ink-font-secondary)' }}>{totalLabel}</text>
    </svg>
  );
}

/* Bordered card used across the Insights Overview (square corners, hairline border) */
function OvCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ border: '1px solid var(--ink-border-subtle)', borderRadius: 'var(--ink-radius-md)', background: 'var(--ink-surface, #fff)', ...style }}>
      {children}
    </div>
  );
}

function OvSectionHeading({ children }: { children: React.ReactNode }) {
  return <Heading level={2} style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink-font-color, rgba(19,0,50,0.9))', margin: 0 }}>{children}</Heading>;
}

const OV_TEAL = '#009EB3';
const OV_PURPLE = '#4200CA';

function InsightsOverview() {
  const getStaggerProps = useStaggerEntrance(9, { baseDelay: 40, staggerInterval: 70, duration: 400, distance: 10 });

  const recents = [
    { name: 'All agreements', time: 'viewed today' },
    { name: 'Agreement types', time: 'viewed today' },
    { name: 'Top parties by contract value', time: 'viewed today' },
    { name: 'Envelope Report', time: 'viewed today' },
    { name: 'Envelope Status Report', time: 'viewed 4 days ago' },
  ];

  // Populated as if the user starred a few reports/dashboards
  const favorites = [
    { name: 'All agreements', type: 'Report' },
    { name: 'Agreement types', type: 'Report' },
    { name: 'Renewals Dashboard', type: 'Dashboard' },
  ];

  const suggested = [
    { name: 'Average Liability Cap Amount by Payment Terms', meta: 'Aggregation: Average  •  Measure: Liability Cap Amount  •  Group by: Payment Type', kind: 'bar' as const },
    { name: 'Count of Agreements by Assignment Termination Rights', meta: 'Aggregation: Count  •  Measure: Agreements  •  Group by: Assignment (Termination Rights)', kind: 'donut' as const },
    { name: 'Total Mission Insurance Premium', meta: 'Sum', kind: 'number' as const },
  ];

  const weekly = [
    { title: 'All agreements', sub: 'Count', value: '1,746', unit: 'Agreements' },
    { title: 'New agreements ingested', sub: 'Count', value: '26', unit: 'Agreements' },
    { title: 'Expiring agreements', sub: 'Count', value: '54', unit: 'Agreements' },
  ];

  const explore = [
    { title: 'Review Upcoming Renewal', desc: 'Discover key metrics on your agreements', cta: 'Review', img: 'insights-explore-renewal.svg' },
    { title: 'Review Envelope Dashboard', desc: 'Discover key metrics on your envelopes', cta: 'Review', img: 'insights-explore-envelope.svg' },
    { title: 'Create custom dashboards', desc: 'Customize your dashboard to fit your needs', cta: 'Create', img: 'insights-explore-dashboards.svg' },
    { title: 'Create custom reports', desc: 'Customize your reports to fit your needs', cta: 'Create', img: 'insights-explore-reports.svg' },
  ];

  const resources = [
    { label: 'Suggest a feature', icon: 'flash' as const },
    { label: 'eSignature Report Help Docs', icon: 'document' as const },
    { label: 'Agreement dashboard Help Docs', icon: 'bar-chart-2' as const },
  ];

  const saveBtnStyle: CSSProperties = { background: '#260559', color: '#fff', border: 'none', borderRadius: 'var(--ink-radius-sm)', padding: '4px 12px', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' };

  return (
    <div style={{ padding: 'var(--ink-spacing-300)', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`.ov-link{color:var(--ink-font-color, rgba(19,0,50,0.9));text-decoration:none;cursor:pointer;}.ov-link:hover{text-decoration:underline;}`}</style>
      {/* Announcement banner */}
      <div {...getStaggerProps(0)}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--ink-spacing-150)',
          background: '#ECEAFB', borderRadius: 'var(--ink-radius-md)',
          padding: 'var(--ink-spacing-150) var(--ink-spacing-200)', marginBottom: 'var(--ink-spacing-250)',
          color: 'var(--ink-font-color, rgba(19,0,50,0.9))',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M4 10v4a1 1 0 0 0 1 1h2l4 4V5L7 9H5a1 1 0 0 0-1 1Z" fill="#4200CA" />
            <path d="M15 8.5a4 4 0 0 1 0 7M17.5 6a7 7 0 0 1 0 12" stroke="#4200CA" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <Text size="sm">We&apos;ve updated the Reports page with new dashboards and reports</Text>
          <button style={{ background: 'transparent', color: 'var(--ink-font-color, rgba(19,0,50,0.9))', border: '1px solid rgba(19,0,50,0.5)', borderRadius: 'var(--ink-radius-sm)', padding: '4px 8px', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 'var(--ink-spacing-100)' }}>See what&apos;s new</button>
        </div>
      </div>

      {/* Title */}
      <div {...getStaggerProps(1)}>
        <Heading level={1} style={{ fontSize: 32, fontWeight: 400, color: 'var(--ink-font-color, rgba(19,0,50,0.9))', margin: '0 0 var(--ink-spacing-200)' }}>Overview</Heading>
      </div>

      {/* Search */}
      <div {...getStaggerProps(2)} style={{ ...getStaggerProps(2).style, marginBottom: 'var(--ink-spacing-300)' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 40, border: '1px solid rgba(19,0,50,0.35)', borderRadius: 'var(--ink-radius-sm)', padding: '0 var(--ink-spacing-150)', gap: 'var(--ink-spacing-125)', background: 'var(--ink-surface, #fff)' }}>
          <Icon name="search" size={18} color="var(--ink-font-secondary)" />
          <span style={{ flex: 1, fontSize: 15, color: 'var(--ink-font-secondary)' }}>Find reports or dashboards</span>
          <Icon name="chevron-down" size={18} color="var(--ink-font-secondary)" />
        </div>
      </div>

      {/* Recents + Favorites */}
      <div {...getStaggerProps(3)}>
      <Grid columns={2} gap="medium">
        <OvCard>
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <Text size="md" weight="semibold">Your Recents</Text>
            <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {recents.map((r, i) => (
                <Inline key={i} justify="between" align="center" style={{ padding: 'var(--ink-spacing-125) 0', borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none' }}>
                  <Inline gap="small" align="center">
                    <Icon name="bar-chart-2" size={16} color="var(--ink-font-secondary)" />
                    <Text size="sm"><a href="#" className="ov-link">{r.name}</a></Text>
                  </Inline>
                  <Text size="xs" color="secondary">{r.time}</Text>
                </Inline>
              ))}
            </Stack>
            <div style={{ marginTop: 'var(--ink-spacing-150)' }}>
              <button style={{ width: '100%', background: 'rgba(19,0,50,0.05)', color: 'var(--ink-font-color, rgba(19,0,50,0.9))', border: 'none', borderRadius: 'var(--ink-radius-sm)', padding: '8px 12px', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>View all</button>
            </div>
          </div>
        </OvCard>

        <OvCard>
          <div style={{ padding: 'var(--ink-spacing-200)' }}>
            <Text size="md" weight="semibold">Your Favorites</Text>
            <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
              {favorites.map((f, i) => (
                <Inline key={i} justify="between" align="center" style={{ padding: 'var(--ink-spacing-125) 0', borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none' }}>
                  <Inline gap="small" align="center">
                    <Icon name="star" size={16} color="var(--ink-yellow-80)" />
                    <Text size="sm"><a href="#" className="ov-link">{f.name}</a></Text>
                  </Inline>
                  <Badge kind={f.type === 'Dashboard' ? 'info' : 'neutral'} size="small">{f.type}</Badge>
                </Inline>
              ))}
            </Stack>
          </div>
        </OvCard>
      </Grid>
      </div>

      {/* Suggested Reports */}
      <div {...getStaggerProps(4)} style={{ ...getStaggerProps(4).style, marginTop: 'var(--ink-spacing-400)' }}>
        <Inline gap="small" align="center">
          <OvSectionHeading>Suggested Reports</OvSectionHeading>
          <Badge kind="info" size="small" style={{ background: OV_PURPLE, color: '#fff' }}>Beta</Badge>
        </Inline>
        <Text size="sm" color="secondary" style={{ display: 'block', marginTop: 'var(--ink-spacing-75)' }}>AI Generated Recommendations</Text>
        <Grid columns={3} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
          {suggested.map((s, i) => (
            <OvCard key={i}>
              <div style={{ padding: 'var(--ink-spacing-200)' }}>
                <Inline justify="between" align="start" style={{ gap: 'var(--ink-spacing-100)' }}>
                  <Text size="sm" weight="semibold" style={{ lineHeight: 1.3 }}>{s.name}</Text>
                  <button style={{ ...saveBtnStyle, flexShrink: 0 }}>Save</button>
                </Inline>
                <Text size="xs" color="secondary" style={{ display: 'block', margin: 'var(--ink-spacing-150) 0' }}>{s.meta}</Text>
                <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.kind === 'bar' && (
                    <BarChart
                      data={[50, 2, 0.334, 0.291, 0.05, 0.02]}
                      color={OV_TEAL}
                      showValues={false}
                      height={180}
                      xLabels={[{ index: 0, text: '30 days' }, { index: 2, text: '45 days' }, { index: 5, text: '45 days' }]}
                      xAxisTitle="Payment Type"
                      aria-label="Average liability cap by payment terms"
                    />
                  )}
                  {s.kind === 'donut' && (
                    <Inline gap="medium" align="center" justify="center" style={{ width: '100%' }}>
                      <InsightsDonut total="1,746" segments={[{ value: 1731, color: OV_TEAL }, { value: 15, color: OV_PURPLE }]} />
                      <Stack gap="none" style={{ gap: 'var(--ink-spacing-100)' }}>
                        <Inline gap="small" align="center" justify="between" style={{ minWidth: 120 }}>
                          <Inline gap="small" align="center"><span style={{ width: 10, height: 10, borderRadius: 2, background: OV_TEAL }} /><Text size="xs">Empty</Text></Inline>
                          <Text size="xs" weight="medium">1.7K</Text>
                        </Inline>
                        <Inline gap="small" align="center" justify="between" style={{ minWidth: 120 }}>
                          <Inline gap="small" align="center"><span style={{ width: 10, height: 10, borderRadius: 2, background: OV_PURPLE }} /><Text size="xs">Yes</Text></Inline>
                          <Text size="xs" weight="medium">15</Text>
                        </Inline>
                      </Stack>
                    </Inline>
                  )}
                  {s.kind === 'number' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink-font-color, rgba(19,0,50,0.9))' }}>321,518,500</div>
                      <Text size="sm" color="secondary">Mission Insurance Premium</Text>
                    </div>
                  )}
                </div>
              </div>
            </OvCard>
          ))}
        </Grid>
      </div>

      {/* Weekly Insights */}
      <div {...getStaggerProps(5)} style={{ ...getStaggerProps(5).style, marginTop: 'var(--ink-spacing-400)' }}>
        <OvSectionHeading>Weekly Insights</OvSectionHeading>
        <Grid columns={2} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
          {weekly.map((w, i) => (
            <OvCard key={i}>
              <div style={{ padding: 'var(--ink-spacing-200)' }}>
                <Text size="md" weight="medium">{w.title}</Text>
                <div style={{ textAlign: 'center', padding: 'var(--ink-spacing-400) 0' }}>
                  <Text size="sm" color="secondary">{w.sub}</Text>
                  <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--ink-font-color, rgba(19,0,50,0.9))', margin: 'var(--ink-spacing-75) 0' }}>{w.value}</div>
                  <Text size="md">{w.unit}</Text>
                </div>
              </div>
            </OvCard>
          ))}
          <OvCard>
            <div style={{ padding: 'var(--ink-spacing-200)' }}>
              <Text size="md" weight="medium">Upcoming renewals</Text>
              <Text size="xs" color="secondary" style={{ display: 'block', margin: 'var(--ink-spacing-125) 0' }}>Aggregation: Count  •  Measure: Agreements  •  Group by: Renewal Notice Date  •  Segment by: Agreement Type</Text>
              <BarChart
                data={[3, 0, 6, 5, 4, 13, 10, 5, 7, 2, 5, 7]}
                color={OV_PURPLE}
                showValues={false}
                height={200}
                yMax={16}
                yTicks={[0, 4, 8, 12, 16]}
                xLabels={[{ index: 0, text: 'Jul 26' }, { index: 5, text: 'Dec 26' }, { index: 11, text: 'Jun 27' }]}
                xAxisTitle="Renewal Notice Date"
                aria-label="Upcoming renewals by month"
              />
            </div>
          </OvCard>
        </Grid>
      </div>

      {/* Review your agreements */}
      <div {...getStaggerProps(6)} style={{ ...getStaggerProps(6).style, marginTop: 'var(--ink-spacing-400)' }}>
        <Inline justify="between" align="center">
          <OvSectionHeading>Review your agreements</OvSectionHeading>
          <Button kind="secondary" endElement={<Icon name="chevron-right" size={16} />}>View Agreements Dashboard</Button>
        </Inline>
        <Grid columns={2} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
          <OvCard>
            <div style={{ padding: 'var(--ink-spacing-200)' }}>
              <Text size="md" weight="medium">Upcoming renewals</Text>
              <Text size="xs" color="secondary" style={{ display: 'block', margin: 'var(--ink-spacing-125) 0' }}>Renewal Notice Date: Next 12 Months; Renewal Type: Auto Renew +2</Text>
              <BarChart data={[4, 4, 7, 6, 5, 13, 10, 5, 7, 2, 5, 7]} color={OV_PURPLE} showValues={false} height={200} xLabels={[{ index: 0, text: 'Jul 26' }, { index: 5, text: 'Dec 26' }, { index: 11, text: 'Jun 27' }]} xAxisTitle="Renewal Notice Date" aria-label="Upcoming renewals" />
            </div>
          </OvCard>
          <OvCard>
            <div style={{ padding: 'var(--ink-spacing-200)' }}>
              <Text size="md" weight="medium">Agreement types</Text>
              <Text size="xs" color="secondary" style={{ display: 'block', margin: 'var(--ink-spacing-125) 0' }}>Aggregation: Count  •  Measure: Agreements  •  Group by: Agreement Type</Text>
              <BarChart data={[420, 310, 240, 180, 120, 90, 60]} color={OV_TEAL} showValues={false} height={200} xLabels={[{ index: 0, text: 'MSA' }, { index: 3, text: 'Order Form' }, { index: 6, text: 'Other' }]} xAxisTitle="Agreement Type" aria-label="Agreement types" />
            </div>
          </OvCard>
        </Grid>
      </div>

      {/* Explore Docusign Insights */}
      <div {...getStaggerProps(7)} style={{ ...getStaggerProps(7).style, marginTop: 'var(--ink-spacing-400)' }}>
        <OvSectionHeading>Explore Docusign Insights</OvSectionHeading>
        <Grid columns={4} gap="medium" style={{ marginTop: 'var(--ink-spacing-200)' }}>
          {explore.map((e, i) => (
            <OvCard key={i}>
              <Stack gap="none" style={{ padding: 'var(--ink-spacing-200)', height: '100%', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`${import.meta.env.BASE_URL}${e.img}`} alt="" style={{ maxHeight: 96, maxWidth: '100%' }} />
                </div>
                <Text size="sm" weight="semibold" style={{ marginTop: 'var(--ink-spacing-150)' }}>{e.title}</Text>
                <Text size="xs" color="secondary" style={{ marginTop: 'var(--ink-spacing-75)', flex: 1 }}>{e.desc}</Text>
                <Button kind="secondary" size="small" style={{ marginTop: 'var(--ink-spacing-175)' }}>{e.cta}</Button>
              </Stack>
            </OvCard>
          ))}
        </Grid>
      </div>

      {/* Resources */}
      <div {...getStaggerProps(8)} style={{ ...getStaggerProps(8).style, marginTop: 'var(--ink-spacing-400)' }}>
        <OvSectionHeading>Resources</OvSectionHeading>
        <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>
          {resources.map((r, i) => (
            <Inline key={i} gap="small" align="center" style={{ padding: 'var(--ink-spacing-125) 0', borderTop: i > 0 ? '1px solid var(--ink-border-subtle)' : 'none' }}>
              <Icon name={r.icon} size={16} color="var(--ink-font-secondary)" />
              <a href="#" className="ov-link" style={{ fontSize: 14 }}>{r.label}</a>
            </Inline>
          ))}
        </Stack>
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

/* `scenarios` is a bare `#scenarios` route, deliberately absent from GlobalNav:
   that nav mirrors production Docusign and the trigger page is a jig. */
const VALID_TABS: TabId[] = ['home', 'agreements', 'templates', 'insights', 'admin', 'scenarios'];

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
  const fadeIn = useFadeIn(0, 250);
  const getDetailStagger = useStaggerEntrance(5, { baseDelay: 150, staggerInterval: 50, duration: 350, distance: 8 });

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
      <div {...getDetailStagger(0)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--ink-spacing-100)', flexDirection: 'column' }}>
          <AIBadge infoContent={false}>AI-Assisted</AIBadge>
          <Text size="sm">
            It looks like this agreement type is <strong>{detail.agreementType}</strong>. There are <strong>{detail.fields}</strong> fields and <strong>{detail.suggestions}</strong> new suggestions for you to review.
          </Text>
          <Button kind="secondary" size="small">Review All</Button>
        </div>
      </div>

      <div {...getDetailStagger(1)}>
        <Divider />
      </div>

      {/* Search */}
      <div {...getDetailStagger(2)}>
        <Input placeholder="Find details" />
      </div>

      {/* Agreement Type */}
      <div {...getDetailStagger(3)}>
        <Inline gap="small" align="center">
          <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agreement Type</Text>
          <AIIcon name="ai-spark-filled" size={12} />
        </Inline>
        <Text size="sm">{detail.agreementType}</Text>
      </div>

      {/* Accordion sections */}
      <div {...getDetailStagger(4)}>
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
      </div>
    </Stack>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060,
      ...fadeIn.style,
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

/* ═══════════════════════════════════════
   Detail Page Shell — shared by Workspace + Request
   detail views (full-screen takeover: back bar,
   title + status badge, tab row, content area)
   ═══════════════════════════════════════ */

const detailShellStyles = `
.detail-shell__header {
  background: var(--ink-bg-color-subtle, #f6f5f7);
  padding: 0 var(--ink-spacing-300);
}
.detail-shell__tabbar {
  display: flex;
  gap: var(--ink-spacing-50);
  border-bottom: 1px solid var(--ink-border-subtle);
}
.detail-shell__tab {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
  padding: 10px 16px;
  color: var(--ink-font-color-secondary, rgba(19, 0, 50, 0.7));
  border-radius: 6px 6px 0 0;
}
.detail-shell__tab[data-active='true'] {
  color: var(--ink-iris-70, #4c00b0);
  font-weight: 600;
  background: var(--ink-iris-10, rgba(76, 0, 176, 0.06));
  box-shadow: inset 0 -2px 0 0 var(--ink-iris-70, #4c00b0);
}
.detail-shell__empty {
  border: 1px solid var(--ink-border-subtle);
  border-radius: var(--ink-radius-lg, 12px);
  padding: 64px var(--ink-spacing-300);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--ink-spacing-100);
}
.detail-shell__empty-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--ink-radius-md, 8px);
  background: var(--ink-bg-color-subtle, #f0eff2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--ink-spacing-100);
}
`;

interface DetailTab {
  id: string;
  label: string;
}

function DetailPageShell({
  title,
  statusLabel,
  statusKind = 'success',
  tabs,
  activeTab,
  onTabChange,
  topBarActions,
  onClose,
  children,
}: {
  title: string;
  statusLabel?: string;
  statusKind?: 'success' | 'subtle';
  tabs: DetailTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  topBarActions?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const fadeIn = useFadeIn(0, 250);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1060,
        ...fadeIn.style,
        background: 'var(--ink-bg-color-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <style>{detailShellStyles}</style>
      <div className="detail-shell__header">
        {/* Top bar: back + right-aligned actions */}
        <Inline align="center" style={{ height: 64 }}>
          <IconButton icon="arrow-left" variant="tertiary" aria-label="Back" onClick={onClose} />
          <div style={{ flex: 1 }} />
          <Inline gap="small" align="center">{topBarActions}</Inline>
        </Inline>
        {/* Title + status */}
        <Inline gap="medium" align="center" style={{ padding: 'var(--ink-spacing-100) 0 var(--ink-spacing-300)' }}>
          <Heading level={1} style={{ fontSize: 32, fontWeight: 400, margin: 0, color: 'var(--ink-font-color, rgba(19,0,50,0.9))' }}>
            {title}
          </Heading>
          {statusLabel && <Badge kind={statusKind}>{statusLabel}</Badge>}
        </Inline>
        {/* Tab row */}
        <div className="detail-shell__tabbar" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className="detail-shell__tab"
              data-active={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 'var(--ink-spacing-300)', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function DetailEmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: 'upload' | 'document' | 'stamp' | 'envelope';
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="detail-shell__empty">
      <div className="detail-shell__empty-icon">
        <Icon name={icon} size={22} />
      </div>
      <Text size="lg" weight="medium">{title}</Text>
      <Text size="sm" color="secondary">{subtitle}</Text>
      <div style={{ marginTop: 'var(--ink-spacing-150)' }}>{action}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Workspace Detail View
   ═══════════════════════════════════════ */

interface WorkspaceItem {
  id: string;
  name: string;
  type: string;
  icon: 'envelope' | 'upload';
  recipients: string;
  status: string;
  date: string;
  time: string;
}

const WORKSPACE_ITEMS: WorkspaceItem[] = [
  { id: '1', name: '[Example] Patient Intake Form', type: 'Envelope', icon: 'envelope', recipients: 'Unassigned', status: 'Draft', date: '6/12/2026', time: '8:09 PM' },
  { id: '2', name: '[Example] Photo ID', type: 'Upload Request', icon: 'upload', recipients: 'Unassigned', status: 'Draft', date: '6/12/2026', time: '8:09 PM' },
  { id: '3', name: '[Example] Medical Insurance Card (Front & Back)', type: 'Upload Request', icon: 'upload', recipients: 'Unassigned', status: 'Draft', date: '6/12/2026', time: '8:09 PM' },
];

const WORKSPACE_ITEM_GRID = '40px minmax(0, 1fr) 130px 110px 150px 96px';

function WorkspaceDetailView({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const isActive = workspace.status === 'active';

  const topBarActions = (
    <>
      <IconButton icon="comment" variant="tertiary" aria-label="Messages" />
      <Button kind="secondary" startElement={<Icon name="people" size={16} />}>Share</Button>
      <Button kind="primary" menuTrigger>Add</Button>
      <IconButton icon="overflow-vertical" variant="tertiary" aria-label="More actions" />
    </>
  );

  return (
    <DetailPageShell
      title={workspace.name}
      statusLabel={isActive ? 'Active' : 'Inactive'}
      statusKind={isActive ? 'success' : 'subtle'}
      tabs={[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: 'Documents' }]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      topBarActions={topBarActions}
      onClose={onClose}
    >
      {activeTab === 'overview' ? (
        <Stack gap="small">
          {/* Column header */}
          <div style={{ display: 'grid', gridTemplateColumns: WORKSPACE_ITEM_GRID, alignItems: 'center', gap: 'var(--ink-spacing-150)', padding: '0 var(--ink-spacing-200)' }}>
            <div />
            <Inline gap="small" align="center"><Text size="xs" weight="semibold" color="secondary">Name</Text><Icon name="sort" size={12} color="var(--ink-font-secondary)" /></Inline>
            <Text size="xs" weight="semibold" color="secondary">Recipients</Text>
            <Inline gap="small" align="center"><Text size="xs" weight="semibold" color="secondary">Status</Text><Icon name="sort" size={12} color="var(--ink-font-secondary)" /></Inline>
            <Text size="xs" weight="semibold" color="secondary">Last Change</Text>
            <Text size="xs" weight="semibold" color="secondary" style={{ textAlign: 'right' }}>Actions</Text>
          </div>
          {/* Item cards */}
          {WORKSPACE_ITEMS.map((item) => (
            <Card key={item.id} radius="large" className="activity-row">
              <div style={{ display: 'grid', gridTemplateColumns: WORKSPACE_ITEM_GRID, alignItems: 'center', gap: 'var(--ink-spacing-150)', padding: 'var(--ink-spacing-150) var(--ink-spacing-200)' }}>
                <input type="checkbox" aria-label={`Select ${item.name}`} style={{ width: 18, height: 18 }} />
                <Inline gap="medium" align="center" style={{ minWidth: 0 }}>
                  <Icon name={item.icon} size={20} color="var(--ink-font-secondary)" />
                  <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)', minWidth: 0 }}>
                    <Text size="sm" weight="medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</Text>
                    <Text size="xs" color="secondary">{item.type}</Text>
                  </Stack>
                </Inline>
                <div>
                  <Badge kind="subtle">{item.recipients}</Badge>
                </div>
                <Inline gap="small" align="center">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink-neutral-70, #6b6b6b)', flexShrink: 0 }} />
                  <Text size="sm">{item.status}</Text>
                </Inline>
                <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
                  <Text size="sm">{item.date}</Text>
                  <Text size="xs" color="secondary">{item.time}</Text>
                </Stack>
                <Inline gap="small" align="center" justify="end">
                  <Button kind="secondary" size="small">Edit</Button>
                  <IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label="More actions" />
                </Inline>
              </div>
            </Card>
          ))}
        </Stack>
      ) : (
        <Stack gap="medium">
          <Heading level={2} style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Documents</Heading>
          <DetailEmptyState
            icon="upload"
            title="Upload documents to share"
            subtitle="Add documents that anyone in this workspace can view and download."
            action={<Button kind="primary" menuTrigger>Upload</Button>}
          />
        </Stack>
      )}
    </DetailPageShell>
  );
}

/* ═══════════════════════════════════════
   Request Detail View
   ═══════════════════════════════════════ */

function RequestInfoCard({ request }: { request: RequestItem }) {
  const requestType = request.requestType;
  const created = request.created;
  return (
    <Stack gap="medium">
      <Card radius="large">
        <Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>
          <Inline justify="between" align="center">
            <Text size="md" weight="semibold">Information</Text>
            <IconButton icon="edit" variant="tertiary" size="small" aria-label="Edit request information" />
          </Inline>
          <div>
            <Text size="sm" weight="semibold">Request ID</Text>
            <Text size="sm" color="secondary">{request.requestId}</Text>
          </div>
          <div>
            <Text size="sm" weight="semibold" style={{ display: 'block', marginBottom: 'var(--ink-spacing-50)' }}>Status</Text>
            <Inline gap="small" align="center" style={{ background: 'var(--ink-green-10, #e6f7ee)', borderRadius: 'var(--ink-radius-sm)', padding: '2px 8px', width: 'fit-content' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-green-60)' }} />
              <Text size="sm">{request.status}</Text>
            </Inline>
          </div>
          <div>
            <Text size="sm" weight="semibold">Request type</Text>
            <Text size="sm" color="secondary">{requestType}</Text>
          </div>
          <div>
            <Text size="sm" weight="semibold" style={{ display: 'block', marginBottom: 'var(--ink-spacing-50)' }}>Submitter</Text>
            <Inline gap="small" align="center">
              <Avatar size="small" initials={request.submitterInitials} />
              <Text size="sm">{request.submitterName}</Text>
            </Inline>
          </div>
          <div>
            <Text size="sm" weight="semibold">Owner</Text>
            <Text size="sm" color="secondary">{request.owner === 'Unassigned' ? '—' : request.owner}</Text>
          </div>
          <div>
            <Text size="sm" weight="semibold">Created</Text>
            <Text size="sm" color="secondary">{created}</Text>
          </div>
        </Stack>
      </Card>
      <Card radius="large">
        <button style={{ display: 'flex', alignItems: 'center', gap: 'var(--ink-spacing-100)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--ink-spacing-200)', fontFamily: 'inherit' }}>
          <Icon name="trash" size={18} />
          <Text size="sm">Delete Request</Text>
        </button>
      </Card>
    </Stack>
  );
}

function RequestDetailView({ request, onClose }: { request: RequestItem; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const requestType = request.requestType;
  const created = request.created;
  const time = request.lastActivityAt.split(' ')[1] || '';

  const topBarActions = (
    <>
      <Button kind="secondary">Follow</Button>
      <Button kind="secondary">Share</Button>
    </>
  );

  return (
    <DetailPageShell
      title={request.title.replace(/^\[Example\]\s*/, '')}
      statusLabel={request.status}
      statusKind="success"
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'details', label: 'Details' },
        { id: 'documents', label: 'Documents' },
        { id: 'approvals', label: 'Approvals' },
        { id: 'envelopes', label: 'Envelopes' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      topBarActions={topBarActions}
      onClose={onClose}
    >
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--ink-spacing-300)', alignItems: 'start' }}>
          <Stack gap="medium">
            <Inline justify="between" align="center">
              <Heading level={2} style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Activity Feed</Heading>
              <Inline gap="small" align="center">
                <Button kind="secondary" size="small" menuTrigger>All activity</Button>
                <Button kind="primary" size="small" startElement={<Icon name="comment" size={14} />}>Send Message</Button>
              </Inline>
            </Inline>
            <div>
              <Text size="sm" weight="semibold" color="secondary">{created}</Text>
              <Inline gap="medium" align="center" style={{ marginTop: 'var(--ink-spacing-150)' }}>
                <Avatar size="small" initials={request.submitterInitials} />
                <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
                  <Text size="sm">{request.submitterName} created this request</Text>
                  <Text size="xs" color="secondary">{time}</Text>
                </Stack>
              </Inline>
            </div>
          </Stack>
          <Stack gap="medium">
            <Button kind="secondary" fullWidth startElement={<AIIcon name="ai-spark-filled" size={14} />} style={{ background: 'var(--ink-iris-10, rgba(76,0,176,0.06))', border: 'none', justifyContent: 'center' }}>
              Chat with request
            </Button>
            <RequestInfoCard request={request} />
          </Stack>
        </div>
      )}

      {activeTab === 'details' && (
        <Stack gap="medium">
          <Inline justify="between" align="center">
            <Heading level={2} style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Details</Heading>
            <Button kind="primary">Change Request Type</Button>
          </Inline>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--ink-spacing-300)', alignItems: 'start' }}>
            <Card radius="large">
              <Stack gap="none">
                <Inline justify="between" align="center" style={{ padding: 'var(--ink-spacing-200)', borderBottom: '1px solid var(--ink-border-subtle)' }}>
                  <Text size="md" weight="semibold">Intake Form</Text>
                  <Button kind="secondary" size="small">Edit</Button>
                </Inline>
                <Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>
                  <div>
                    <Text size="sm" weight="semibold">Request type</Text>
                    <Text size="sm" color="secondary">{requestType}</Text>
                  </div>
                  <div>
                    <Text size="sm" weight="semibold">Description</Text>
                    <Text size="sm" color="secondary">{request.description}</Text>
                  </div>
                </Stack>
              </Stack>
            </Card>
            <RequestInfoCard request={request} />
          </div>
        </Stack>
      )}

      {activeTab === 'documents' && (
        <Stack gap="medium">
          <Heading level={2} style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Documents</Heading>
          <DetailEmptyState
            icon="document"
            title="No documents found"
            subtitle="There are currently no documents in this request"
            action={<Button kind="primary" menuTrigger>Add Documents</Button>}
          />
        </Stack>
      )}

      {activeTab === 'approvals' && (
        <Stack gap="medium">
          <Heading level={2} style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Approvals</Heading>
          <DetailEmptyState
            icon="stamp"
            title="No approvals found"
            subtitle="There are currently no approvals in this request"
            action={<Button kind="primary">Add Approval</Button>}
          />
        </Stack>
      )}

      {activeTab === 'envelopes' && (
        <Stack gap="medium">
          <Heading level={2} style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Envelopes</Heading>
          <DetailEmptyState
            icon="envelope"
            title="No envelopes found"
            subtitle="There are currently no envelopes in this request"
            action={<Button kind="primary">Send for signature</Button>}
          />
        </Stack>
      )}
    </DetailPageShell>
  );
}

/* ═══════════════════════════════════════
   Completed → My Insights panel
   Mirrors the production Navigator insights band
   ═══════════════════════════════════════ */

const insightsPanelStyles = `
.ink-insights {
  background: rgb(246, 242, 255);
  border-radius: 8px;
  padding: 16px 20px 20px;
}
.ink-insights__tab {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 2px 8px;
  font-size: 15px;
  font-family: inherit;
  color: var(--ink-font-color-secondary, rgba(19, 0, 50, 0.7));
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ink-insights__tab[data-active='true'] {
  color: var(--ink-font-color, rgba(19, 0, 50, 0.9));
  font-weight: 600;
  box-shadow: inset 0 -2px 0 0 var(--ink-iris-70, #4c00b0);
}
.ink-insights__linkbtn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-font-color-secondary, rgba(19, 0, 50, 0.7));
}
.ink-insights__linkbtn:hover { color: var(--ink-font-color, rgba(19, 0, 50, 0.9)); }
.ink-insights__cta {
  background: #fff;
  border-radius: 8px;
  box-shadow: rgba(19, 0, 50, 0.15) 0px 4px 8px 0px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ink-insights__cta-accent {
  height: 4px;
  background: linear-gradient(to right, #7b2ff7, #f107a3);
}
.ink-insights__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: rgba(19, 0, 50, 0.2);
}
.ink-insights__dot[data-active='true'] { background: rgba(19, 0, 50, 0.7); }
@media (max-width: 900px) {
  .ink-insights__body { flex-direction: column; }
}
`;

// Title segments: key phrases (b: true) render bold, connectors regular — matches production
interface TitleSegment {
  t: string;
  b?: boolean;
}
interface InsightCard {
  title: TitleSegment[];
  body: string;
  action: string;
}

const INSIGHT_CARDS: InsightCard[] = [
  { title: [{ t: 'Stay ahead of your renewals' }], body: 'Review your upcoming renewal data and set up notifications in minutes.', action: 'Review Data' },
  { title: [{ t: '128 Master Service Agreement', b: true }, { t: ' documents have ' }, { t: 'Limitation of Liability Clause', b: true }], body: 'You can now track and compare clauses across your agreements to flag risks and nonstandard terms.', action: 'View Agreements' },
  { title: [{ t: '170 new agreements', b: true }, { t: ' are HR-related' }], body: 'Run our latest AI model to find all the HR agreements in your account, then share them with the right people.', action: 'Run Update' },
];

const titleToString = (segs: TitleSegment[]) => segs.map((s) => s.t).join('');

// 12-month renewal notice histogram (matches production sample)
// 12-month renewal-notice histogram (matches the production sample)
const RENEWAL_BARS = [4, 4, 6, 7, 5, 13, 10, 5, 7, 2, 5, 7, 2];

function RenewalsChart() {
  return (
    <BarChart
      data={RENEWAL_BARS}
      yMax={16}
      yTicks={[0, 4, 8, 12, 16]}
      xLabels={[
        { text: 'Jul 2026', index: 0 },
        { text: 'Dec 2026', index: Math.floor(RENEWAL_BARS.length / 2) },
        { text: 'May 2027', index: RENEWAL_BARS.length - 1 },
      ]}
      xAxisTitle="Renewal Notice Date"
      aria-label="Upcoming renewals by month"
    />
  );
}

function CompletedInsightsPanel() {
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<'insights' | 'review'>('insights');
  const [card, setCard] = useState(0);
  const active = INSIGHT_CARDS[card];

  // Auto-rotate the insight carousel (and the collapsed teaser text)
  useEffect(() => {
    const id = setInterval(() => setCard((c) => (c + 1) % INSIGHT_CARDS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const controls = (
    <Inline gap="medium" align="center" style={{ flexShrink: 0 }}>
      <button
        className="ink-insights__linkbtn"
        style={hidden ? { background: 'rgba(19, 0, 50, 0.05)', borderRadius: 4, padding: '4px 8px' } : undefined}
        onClick={() => setHidden((h) => !h)}
      >
        {hidden ? 'Show Insights' : 'Hide Insights'}
        <Icon name={hidden ? 'chevron-down' : 'chevron-up'} size={14} />
      </button>
      <IconButton icon="close" variant="tertiary" size="small" aria-label="Dismiss insights" onClick={() => setHidden(true)} />
    </Inline>
  );

  return (
    <div className="ink-insights" style={hidden ? { padding: '8px 20px' } : undefined}>
      <style>{insightsPanelStyles}</style>
      {hidden ? (
        /* Collapsed: centered rotating teaser + right-aligned controls */
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: 32 }}>
          <Text size="sm" color="secondary" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
            {titleToString(active.title)}
          </Text>
          <div style={{ marginLeft: 'auto', zIndex: 1 }}>{controls}</div>
        </div>
      ) : (
        /* Expanded: tabs + controls */
        <Inline align="center" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <Inline gap="large" align="center">
            <Inline gap="small" align="center">
              <IrisIcon />
              <button className="ink-insights__tab" data-active={tab === 'insights'} onClick={() => setTab('insights')}>
                My Insights
              </button>
            </Inline>
            <button className="ink-insights__tab" data-active={tab === 'review'} onClick={() => setTab('review')}>
              Data Review
            </button>
          </Inline>
          {controls}
        </Inline>
      )}

      {!hidden && (
        <div className="ink-insights__body" style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          {/* Chart card */}
          <div style={{ flex: '1 1 440px', maxWidth: 560, minWidth: 0, background: '#fff', borderRadius: 8, padding: '20px 24px' }}>
            <Text size="md" weight="semibold" style={{ display: 'block' }}>Upcoming renewals</Text>
            <Text size="sm" color="secondary" style={{ display: 'block', marginBottom: 4 }}>Next 12 months</Text>
            <RenewalsChart />
          </div>
          {/* CTA carousel card */}
          <div className="ink-insights__cta" style={{ flex: '0 1 460px', maxWidth: 500, minWidth: 0 }}>
            <div className="ink-insights__cta-accent" />
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Text weight="regular" style={{ display: 'block', marginBottom: 8, fontSize: 24, lineHeight: 1.25 }}>
                {active.title.map((seg, i) => (seg.b ? <strong key={i} style={{ fontWeight: 600 }}>{seg.t}</strong> : <span key={i}>{seg.t}</span>))}
              </Text>
              <Text size="sm" color="secondary" style={{ display: 'block', marginBottom: 20 }}>{active.body}</Text>
              <Inline gap="small" align="center" style={{ marginTop: 'auto' }}>
                <Button kind="secondary" size="small" startElement={<AIIcon name="ai-spark-filled" size={12} />}>{active.action}</Button>
                <Button kind="tertiary" size="small">Do This Later</Button>
              </Inline>
              <Inline gap="small" align="center" style={{ marginTop: 16 }}>
                {INSIGHT_CARDS.map((_, i) => (
                  <button
                    key={i}
                    className="ink-insights__dot"
                    data-active={i === card}
                    aria-label={`Show insight ${i + 1}`}
                    onClick={() => setCard(i)}
                  />
                ))}
              </Inline>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash as TabId) ? (hash as TabId) : 'agreements';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);
  const [sidebarView, setSidebarView] = useState<SidebarView>('completed');
  const [templatesSidebarView, setTemplatesSidebarView] = useState<TemplatesSidebarView>('my-templates');
  const [insightsSidebarView, setInsightsSidebarView] = useState<InsightsSidebarView>('overview');
  const [search, setSearch] = useState('');
  const [showAgreementDetail, setShowAgreementDetail] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeRequest, setActiveRequest] = useState<RequestItem | null>(null);

  /* ══ Iris ══════════════════════════════════════════════════════════════════
     The mode machine. `panel.hostStyle` reflows the page; `panel.artifact` is
     the dock's machine, and it lives on the hook because opening an artifact
     has to reach `setMode` — a 420px dock does not fit beside the chat in a
     sidebar, so it goes fullscreen first. */
  const panel = usePanelMode({ sidebarWidth: 480, minWidth: 360 });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [agentId, setAgentId] = useState('iris');
  /** Sources arrive by choice: a new chat starts unscoped, the Add pill offers them. */
  const [contextIds, setContextIds] = useState<string[]>([]);
  /** The agreement the host page has open. Drives the snapshot and the cold state. */
  const [previewAgreement, setPreviewAgreement] = useState<PreviewAgreement | null>(null);
  /** A nav page the host is holding open. IrisAgent's own pages win over this. */
  const [navSlot, setNavSlot] = useState<ScenarioId | null>(null);
  /** The left nav gives up its width to Iris: opening the panel unlocks the
      nav so it collapses to its icon rail, closing it locks it back open.
      The lock button still works — this only sets the state, it does not own it. */
  const [navLocked, setNavLocked] = useState(true);
  useEffect(() => {
    setNavLocked(panel.mode === 'closed');
  }, [panel.mode]);

  /** Bumped per scenario run — the cold state is in-memory, so a remount replays it. */
  const [runKey, setRunKey] = useState(0);

  /** Presence of an agreement is the one switch: snapshot in, corpus insights out. */
  const onAgreement = previewAgreement !== null;
  const attachedAgreements = CONTEXT_AGREEMENTS.filter((a) => contextIds.includes(a.id));
  const openSources = useCallback(() => panel.artifact.open('search-acme-fontara'), [panel]);

  /**
   * The host page has an agreement open and it is not already loaded — offer it,
   * and offer Replace beside Add when the conversation already holds others.
   * Iris does not guess which the user meant.
   */
  const suggestedContext =
    previewAgreement && !contextIds.includes(previewAgreement.id)
      ? {
          label: previewAgreement.fileName,
          onAdd: () => setContextIds((ids) => [...ids, previewAgreement.id]),
          onReplace:
            contextIds.length > 0 ? () => setContextIds([previewAgreement.id]) : undefined,
        }
      : contextIds.length === 0
        ? {
            label: `${CONTEXT_AGREEMENTS.length} agreements`,
            onAdd: () => setContextIds(CONTEXT_AGREEMENTS.map((a) => a.id)),
          }
        : undefined;

  /**
   * The starter has no backend. A search question returns its answer line plus a
   * five-row preview carrying an `artifactId` — the table itself is not shown
   * until "See all" asks for it. Anything else shows the thinking state, which
   * is the honest state for a question with no answer behind it.
   */
  const handleSend = useCallback((text: string, meta?: { displayLabel?: string }) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: meta?.displayLabel ?? text },
    ]);
    setIsThinking(true);
    const search = SEARCH_RESULTS.find((r) => r.match.test(text));
    const scripted = search
      ? undefined
      : (SCRIPTED_EXCHANGES.find((x) => x.match.test(text)) ?? FALLBACK_EXCHANGE);
    setTimeout(() => {
      setIsThinking(false);
      if (search) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: search.answer,
            inlineResults: {
              rows: search.rows,
              totalCount: search.totalCount,
              artifactId: search.artifactId,
            },
          },
        ]);
        return;
      }
      if (!scripted) return;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: scripted.content,
          markdownContent: scripted.markdown,
          thinkingSteps: scripted.thinking,
          inlineResults: scripted.inlineResults,
          taskCompletion: scripted.followUps
            ? { status: 'completed', followUps: scripted.followUps }
            : undefined,
        },
      ]);
      if (scripted.openArtifactId) panel.artifact.open(scripted.openArtifactId);
    }, search ? 1200 : scripted.thinking ? 2400 : 1200);
  }, [panel]);

  /** The pages behind the peek menu. Each `id` is the shortcut that opens it. */
  const navPages: NavPageEntry[] = [
    {
      id: 'prompt-library',
      title: 'Prompt Library',
      menuSection: 'prompts',
      render: ({ onPreview, send }) => (
        <NavPage
          title="Prompt Library"
          subtitle="Save suggested prompts"
          items={LIBRARY_PROMPTS}
          onSend={send}
          onPreview={onPreview}
        />
      ),
    },
    {
      id: 'agents',
      title: 'Agents',
      menuSection: 'agents',
      render: ({ onPreview, send, close }) => (
        <NavPage
          title="Agents"
          subtitle="Switch to another agent"
          items={AGENTS.map((agent) => ({
            label: agent.name,
            description: agent.description,
            kind: 'agent' as const,
            icon: 'flash',
            onClick: () => {
              setAgentId(agent.id);
              close();
            },
          }))}
          onSend={send}
          onPreview={onPreview}
        />
      ),
    },
  ];

  /**
   * Every scenario starts from the same clean slate and then sets the one thing
   * that distinguishes it. `runKey` remounts IrisAgent so the cold-state
   * sequence — which is in-memory state, not persisted — replays every time.
   */
  const runScenario = useCallback((id: ScenarioId) => {
    setMessages([]);
    setIsThinking(false);
    setNavSlot(null);
    setPreviewAgreement(null);
    setContextIds(CONTEXT_AGREEMENTS.map((a) => a.id));
    panel.artifact.close();
    setRunKey((k) => k + 1);
    /*
      Open the panel BEFORE the scenario runs, never after: `artifact.open`
      goes fullscreen first — a 420px dock does not fit beside the chat in a
      sidebar — and a trailing `panel.open()` would drop it back to sidebar and
      clip the dock.
    */
    panel.open();

    if (id === 'agreement') setPreviewAgreement(PREVIEW_AGREEMENT);
    if (id === 'assist') {
      setMessages([
        { id: 'p1', role: 'assistant', content: PARTY_PROACTIVE.content,
          taskCompletion: { status: 'completed', followUps: PARTY_PROACTIVE.followUps } },
      ]);
    }
    if (id === 'autonomous') {
      setMessages([
        { id: 'auto1', role: 'assistant', content: AUTONOMOUS_SEED.content,
          inlineResults: AUTONOMOUS_SEED.inlineResults,
          taskCompletion: { status: 'completed', followUps: AUTONOMOUS_SEED.followUps } },
      ]);
    }
    if (id === 'agents' || id === 'prompt-library') setNavSlot(id);
    if (id === 'search') {
      const [first] = SEARCH_RESULTS;
      setMessages([
        { id: 'q1', role: 'user', content: first.question },
        {
          id: 'a1',
          role: 'assistant',
          content: first.answer,
          inlineResults: {
            rows: first.rows,
            totalCount: first.totalCount,
            artifactId: first.artifactId,
          },
        },
      ]);
      panel.artifact.open(first.artifactId);
    }
  }, [panel]);

  /** Ask Iris opens the chat, never whatever page a scenario left standing. */
  const partyProactiveSeeded = useRef(false);
  const openIris = useCallback(() => {
    setNavSlot(null);
    if (sidebarView === 'parties' && !partyProactiveSeeded.current) {
      partyProactiveSeeded.current = true;
      setMessages((prev) =>
        prev.length
          ? prev
          : [
              { id: 'party-proactive', role: 'assistant', content: PARTY_PROACTIVE.content,
                taskCompletion: { status: 'completed', followUps: PARTY_PROACTIVE.followUps } },
            ],
      );
    }
    panel.open();
  }, [panel, sidebarView]);

  /** The host-held nav page. `navPageSlot` is the form a consumer holding state passes. */
  const navSlotPage =
    navSlot === 'agents' || navSlot === 'prompt-library'
      ? navPages.find((p) => p.id === navSlot)
      : undefined;

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
    logo: <img src={`${import.meta.env.BASE_URL}docusign-logo.svg`} alt="DocuSign" />,
    showAppSwitcher: true,
    onAppSwitcherClick: () => {},
    navItems: [
      { id: 'home', label: 'Home', active: activeTab === 'home', onClick: () => handleTabClick('home') },
      { id: 'agreements', label: 'Agreements', active: activeTab === 'agreements', onClick: () => handleTabClick('agreements') },
      { id: 'templates', label: 'Templates', active: activeTab === 'templates', onClick: () => handleTabClick('templates') },
      { id: 'insights', label: 'Insights', active: activeTab === 'insights', onClick: () => handleTabClick('insights') },
      { id: 'admin', label: 'Admin', active: activeTab === 'admin', onClick: () => handleTabClick('admin') },
    ],
    showSearch: true,
    searchVariant: 'pill' as const,
    onSearchClick: () => {},
    showSettings: true,
    settingsIcon: 'sliders-horizontal' as const,
    user: { name: 'Akshat Mishra', org: 'Protolab', avatar: `${import.meta.env.BASE_URL}avatar.jpg?v=1` },
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
          { id: 'workspaces', label: 'Workspaces', icon: 'transaction' as const, badge: 'New', onClick: () => setSidebarView('workspaces') },
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
    workspaces: 'Workspaces',
  };

  const isPartiesView = sidebarView === 'parties';
  const isNavigatorView = sidebarView === 'completed';
  const isRequestsView = sidebarView === 'requests';
  const isWorkspacesView = sidebarView === 'workspaces';

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

  /* ── Workspaces filtered data ── */
  const filteredWorkspaces = useMemo(() => {
    if (!search) return WORKSPACES_DATA;
    const q = search.toLowerCase();
    return WORKSPACES_DATA.filter(w => w.name.toLowerCase().includes(q) || w.owner.toLowerCase().includes(q));
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
      banner={isNavigatorView ? <CompletedInsightsPanel /> : undefined}
      pageHeader={
        isNavigatorView ? (
          <Inline align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Inline gap="medium" align="center">
              <Heading level={1} style={{ fontSize: 32, fontWeight: 400, color: 'var(--ink-font-color, rgba(19,0,50,0.9))', margin: 0 }}>
                Completed
              </Heading>
              <Dropdown
                position="bottom"
                align="start"
                items={[
                  { label: 'Documents', description: 'Analyze agreement data with AI', icon: <Icon name="document" size={18} />, selected: true },
                  { label: 'Envelopes', description: 'View signatures and activity', icon: <Icon name="envelope" size={18} /> },
                ]}
              >
                <button
                  aria-label="Select a view"
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--ink-font-color, rgba(19,0,50,0.9))', cursor: 'pointer', font: 'inherit', fontSize: 32, fontWeight: 500, color: 'var(--ink-font-color, rgba(19,0,50,0.9))', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
                >
                  Documents
                  <Icon name="chevron-down" size={22} />
                </button>
              </Dropdown>
              <AIBadge infoContent={false} style={{ marginLeft: 4, flexShrink: 0 }} />
            </Inline>
            <Inline gap="small" align="center">
              <ComboButton variant="secondary" size="small" startIcon="plus" compact />
              <Button kind="secondary" size="small" menuTrigger startElement={<Icon name="settings" size={14} />}>Manage</Button>
            </Inline>
          </Inline>
        ) : (
        <PageHeader
          title={isPartiesView ? 'Parties' : isRequestsView ? 'Requests' : VIEW_LABELS[sidebarView]}
          showAIBadge={isPartiesView}
          aiBadgeText="AI-Assisted"
          actions={isPartiesView
            ? (<>
                <IconButton icon="bar-chart-2" variant="tertiary" size="small" aria-label="Analytics" />
                <Button kind="secondary" startElement={<Icon name="settings" size={16} />}>Manage Parties</Button>
                <button
                  aria-label="Ask Iris"
                  onClick={openIris}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'linear-gradient(174.22deg, #4C00FB 1.48%, #260559 97.92%)',
                    color: '#fff', border: 'none', borderRadius: 4,
                    padding: '7px 12px', fontSize: 14, fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap',
                  }}
                >
                  <IrisIconInverse size={18} />
                  Ask Iris
                </button>
              </>)
            : isRequestsView
            ? <Button kind="secondary">Create Request</Button>
            : isWorkspacesView
            ? <Button kind="primary">Create Workspace</Button>
            : <Button kind="secondary" menuTrigger>Shared Access</Button>
          }
        />
        )
      }
      filterBar={
        <FilterBar
          viewSelector={isPartiesView ? (
            <Button kind="secondary" size="small" menuTrigger>Role View</Button>
          ) : undefined}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: isNavigatorView
              ? "Try 'which agreements expire in 90 days'"
              : isPartiesView ? 'Search parties...'
              : isRequestsView ? 'Search Request Titles or IDs...'
              : isWorkspacesView ? 'Search Workspaces'
              : 'Search Envelopes',
          }}
          showSearchIndicator={!isPartiesView && !isRequestsView && !isWorkspacesView}
          rightAlignFilters={isNavigatorView}
          quickActions={isNavigatorView ? [
            <IconButton key="bm" icon="bookmark" variant="secondary" size="small" aria-label="Saved searches" />,
            <Button key="filters" kind="secondary" size="small" startElement={<Icon name="filter" size={14} />}>Filters</Button>,
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
          ) : isWorkspacesView ? (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Button kind="secondary" size="small" menuTrigger>Created</Button>
              <Button kind="secondary" size="small" menuTrigger>Owned by</Button>
              <Button kind="secondary" size="small" menuTrigger>Active</Button>
              <Button kind="tertiary" size="small" onClick={() => setSearch('')}>Clear</Button>
            </Inline>
          ) : isNavigatorView ? (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Button kind="secondary" size="small" menuTrigger startElement={<Icon name="layout-grid" size={14} />}>Worksheets</Button>
              <button
                aria-label="Ask Iris"
                onClick={openIris}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(174.22deg, #4C00FB 1.48%, #260559 97.92%)',
                  color: '#fff', border: 'none', borderRadius: 4,
                  padding: '7px 12px', fontSize: 14, fontWeight: 500,
                  fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap',
                }}
              >
                <IrisIconInverse size={18} />
                Ask Iris
              </button>
            </Inline>
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
      {isWorkspacesView ? (
        <DataTable columns={workspaceColumns} data={filteredWorkspaces} getRowKey={(row) => row.id} selectable stickyHeader showColumnControl emptyMessage="No workspaces found" onRowClick={(row) => setActiveWorkspace(row)} pagination={{ page: 1, pageSize: 25, totalItems: filteredWorkspaces.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : isPartiesView ? (
        <DataTable columns={partyColumns} data={filteredParties} getRowKey={(row) => row.id} stickyHeader showColumnControl emptyMessage="No parties match your search" pagination={{ page: 1, pageSize: 25, totalItems: 1334, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : isRequestsView ? (
        <DataTable columns={requestColumns} data={filteredRequests} getRowKey={(row) => row.id} stickyHeader showColumnControl rowHeight="tall" emptyMessage="No requests found" onRowClick={(row) => setActiveRequest(row)} pagination={{ page: 1, pageSize: 10, totalItems: filteredRequests.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : isNavigatorView ? (
        <DataTable bordered columns={navigatorColumns} data={filteredNavigator} getRowKey={(row) => row.id} selectable stickyHeader stickyFooter showColumnControl rowHeight="tall" emptyMessage="No completed documents" onRowClick={() => setShowAgreementDetail(true)} pagination={{ page: 1, pageSize: 25, totalItems: 1659, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
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
    scenarios: undefined,
  };

  const contentMap: Record<TabId, JSX.Element> = {
    home: <HomePage />,
    agreements: agreementsContent,
    templates: templatesContent,
    insights: insightsContent,
    admin: <AdminPage />,
    scenarios: <ScenariosPage onRun={runScenario} />,
  };

  /* ── Transition key — changes on tab OR sidebar view to trigger animation ── */
  const transitionKey = `${activeTab}-${sidebarView}-${templatesSidebarView}-${insightsSidebarView}`;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
    {/*
      The host page. `zIndex: 0` makes it its own stacking context, so the
      detail overlays stay local instead of competing with the panel, and the
      panel's drag handle paints over host content rather than under it.
    */}
    <main style={{ ...panel.hostStyle, overflow: 'auto', position: 'relative', zIndex: 0 }}>
    <style>{tableRowStaggerStyles}</style>
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={
        sidebarMap[activeTab]
          ? { ...sidebarMap[activeTab], isLocked: navLocked, onLockChange: setNavLocked }
          : undefined
      }
    >
      <FadeIn keyProp={transitionKey} key={transitionKey}>
        <div className="page-transition" style={{ flex: 1 }}>
          {contentMap[activeTab]}
        </div>
      </FadeIn>
      <Footer />
    </DocuSignShell>
    {showAgreementDetail && (
      <AgreementDetailView onClose={() => setShowAgreementDetail(false)} />
    )}
    {activeWorkspace && (
      <WorkspaceDetailView workspace={activeWorkspace} onClose={() => setActiveWorkspace(null)} />
    )}
    {activeRequest && (
      <RequestDetailView request={activeRequest} onClose={() => setActiveRequest(null)} />
    )}
    </main>

    {/* The panel — a sibling of the page, which is what lets the page reflow. */}
    <PanelShell {...panel.shellProps} label="Iris">
      <IrisAgent
        key={runKey}
        layout="compact"
        /* The panel owns the mode; IrisAgent is told about it. The rail and the
           lifted chrome are the fullscreen grammar and must not appear while
           the host page is still visible beside the panel. */
        isFullscreen={panel.mode === 'fullscreen'}
        messages={messages}
        onSendMessage={handleSend}
        isLoading={isThinking}
        greeting="Jump back in"
        greetingSubtitle={
          onAgreement
            ? 'Ask about the terms, dates, or obligations in this agreement.'
            : CONTEXT_GREETING
        }
        customSuggestions={onAgreement ? AGREEMENT_SUGGESTIONS : COLD_SUGGESTIONS}
        placeholderHints={onAgreement ? AGREEMENT_PLACEHOLDER : FRAME_PLACEHOLDER}
        /* The snapshot, above everything, and the switch that stands the corpus
           insights down. */
        agreementContext={
          previewAgreement
            ? {
                fileName: previewAgreement.fileName,
                agreementType: previewAgreement.agreementType,
                expiration: previewAgreement.expiration,
                extractionCount: previewAgreement.fields,
              }
            : undefined
        }
        /* ONE THING AT A TIME on a first open: the checklist alone, and the
           zero-query rows only once it is dismissed. `sequence` is that rule. */
        getStarted={{
          steps: (onAgreement ? AGREEMENT_STEPS : GET_STARTED_STEPS).map((step) => ({
            id: step.id,
            label: step.label,
            icon: step.icon,
            query:
              step.id === 'ask-a-question' && previewAgreement
                ? `What are the key terms and dates in ${previewAgreement.fileName}?`
                : step.query,
            opens: step.id === 'explore-different-agents' ? 'agents' : undefined,
            onOpen: step.id === 'add-a-source' ? openSources : undefined,
          })),
          sequence: true,
        }}
        navShortcuts={NAV_SHORTCUTS}
        navPages={navPages}
        navPageSlot={navSlotPage?.render}
        navPageTitle={navSlotPage?.title}
        onNavBack={() => setNavSlot(null)}
        conversations={CONVERSATIONS}
        agents={AGENTS}
        selectedAgentId={agentId}
        onSelectAgent={setAgentId}
        agreements={attachedAgreements}
        onClearAgreements={() => setContextIds([])}
        suggestedContext={suggestedContext}
        inlineResultColumns={SEARCH_PREVIEW_COLUMNS}
        onOpenSources={openSources}
        /* The dock, and everything this starter can put in it. */
        artifact={panel.artifact}
        artifacts={[...ALL_ARTIFACTS, ...GENERATED_DOCUMENTS]}
        onArtifactAction={(action, item, detail) =>
          console.info('artifact action', action, item.id, detail)
        }
        railBrand={
          <img src={`${import.meta.env.BASE_URL}docusign-logo.svg`} height={24} alt="DocuSign" />
        }
        disclaimer="Responses use AI. Not legal advice."
        onNewConversation={() => setMessages([])}
        onFullscreen={panel.toggleFullscreen}
        onClose={panel.close}
      />
    </PanelShell>

    {/* The story rides along, fixed bottom-left, only when asked for. */}
    {SHOW_WALKTHROUGH && <WalkthroughCard />}
    </div>
  );
}
