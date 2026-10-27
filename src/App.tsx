import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef, useId, type CSSProperties } from 'react';
import powerFormsEmptyArt from '@/assets/powerforms-empty.svg';
import {
  DocuSignShell,
  AgreementTableView,
  DataTable,
  PageHeader,
  FilterBar,
  Button,
  Badge,
  Banner,
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
  Checkbox,
  Input,
  Select,
  Switch,
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
  TaskCard,
  ProgressBar,
  Modal,
  FileUpload,
  TextArea,
  Spacer,
  SearchInput,
  Link,
  Alert,
  AlertBadge,
  AvatarGroup,
  Radio,
  Slider,
  Skeleton,
  Spinner,
  Tooltip,
  Hotspot,
  Meter,
  Tag,
  ToggleButton,
  Breadcrumb,
  Callout,
  ComboBox,
  DatePicker,
  Drawer,
  FileInput,
  FilterTag,
  List,
  Pagination,
  Popover,
  Stepper,
  Table,
  Timeline,
  Panel,
  Rail,
  ZoomControl,
  SegmentedControl,
  EmptyState,
  PreviewCard,
  SelectTile,
  SelectTileGroup,
  StarRating,
  Toast,
  ToastProvider,
  useToast,
  Tree,
  WorkflowStepper,
  ColorPicker,
  AIChat,
  AgentPanel,
  AgentCanvas,
  AgentActionCard,
  ThinkingSteps,
  LocalNav,
  Portal,
  dataTableStyles,
} from '@/design-system';
import type { DataTableColumn, PageSizeOption, ButtonSize, ButtonKind, FileInputFile, ChatMessage as InkChatMessage } from '@/design-system';

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
  return <Stack gap="none" className="page-view" {...fade}>{children}</Stack>;
}

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type TabId = 'home' | 'agreements' | 'templates' | 'automations' | 'insights' | 'admin' | 'scenarios' | 'tokens';
type SidebarView = 'all-agreements' | 'drafts' | 'in-progress' | 'completed' | 'deleted' | 'parties' | 'requests' | 'workspaces' | 'powerforms';
type TemplatesSidebarView = 'my-templates' | 'shared-with-me' | 'favorites' | 'all-templates' | 'clauses' | 'document-templates' | 'workspace-templates' | 'workflow-templates' | 'my-web-forms' | 'shared-web-forms' | 'all-web-forms' | 'template-gallery' | 'elastic-templates';
type InsightsSidebarView = 'overview' | 'dashboards' | 'reports' | 'my-dashboard' | 'admin-dashboard' | 'agreements-dashboard' | 'obligations-dashboard' | 'renewals-dashboard' | 'requests-dashboard' | 'ai-usage-dashboard' | 'procurement-hub' | 'custom-obligations' | 'custom-dashboard';

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
  progress?: number;
  folder?: string;
  date: string;
  time: string;
  action: 'Copy' | 'Download' | 'Edit' | 'Sign';
  expirationDate?: string;
}

const AGREEMENTS_DATA: Agreement[] = [
  { id: '1', name: 'Brightline Solutions — Superseded Statement of Work', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Replaced by the design & build agreement', date: '10/25/2026', time: '2:40 PM', action: 'Copy' },
  { id: '12', name: 'First Pixel Studio — Product Design Statement of Work', recipient: 'To: Akshat Mishra', status: 'Need to sign', statusIcon: 'clock', statusKind: 'neutral', date: '10/26/2026', time: '10:30 AM', action: 'Sign', progress: 3 },
  { id: '2', name: 'Here is your signed document: Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra, [Placeholder]', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:23', action: 'Copy' },
  { id: '3', name: 'Complete with Docusign: rhi.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:16', action: 'Copy' },
  { id: '4', name: 'Complete with Docusign: Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:14', action: 'Copy' },
  { id: '5', name: 'Complete with Docusign: Sample_Service_Agreement.pdf', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void', statusKind: 'neutral', statusSub: 'Purging soon', date: '24/3/2026', time: '20:10', action: 'Copy' },
  { id: '6', name: 'Northstar — Design System Delivery Acceptance', recipient: 'To: Akshat Mishra, Design Operations', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', date: '10/23/2026', time: '4:15 PM', action: 'Download' },
  { id: '7', name: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.30 AM.png', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purging soon', date: '18/3/2026', time: '11:05', action: 'Download' },
  { id: '8', name: 'Complete with Docusign: Screenshot 2026-03-18 at 10.27.21 AM.png', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purging soon', date: '18/3/2026', time: '10:57', action: 'Download' },
  { id: '9', name: 'Please sign: test.txt', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purged', date: '26/2/2026', time: '12:15', action: 'Download' },
  { id: '10', name: 'Complete with Docusign: Fontara Financial SOW.pdf', recipient: 'To: Akshat Mishra', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Purged', date: '24/2/2026', time: '10:50', action: 'Download' },
  { id: '11', name: 'Complete with DocuSign: Georgia-Residential-Lease-Agreement.pdf', recipient: 'From: Renewal Management', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', date: '24/2/2026', time: '10:44', action: 'Download' },
  { id: 'renewal-first-pixel', name: 'First Pixel Studio — Design Partnership Agreement', recipient: 'To: Akshat Mishra, First Pixel Studio', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Expires Nov 6, 2026', date: '11/6/2025', time: '11:00 AM', action: 'Download', expirationDate: '2026-11-06' },
  { id: 'renewal-protolab', name: 'Brightline Solutions — Annual Support Agreement', recipient: 'To: Akshat Mishra, Design Operations', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Expires Nov 14, 2026', date: '11/14/2025', time: '2:00 PM', action: 'Download', expirationDate: '2026-11-14' },
  { id: 'renewal-ink', name: 'Northstar — Brand Asset License', recipient: 'To: Akshat Mishra, Brand Studio', status: 'Completed', statusIcon: 'status-check', statusKind: 'success', statusSub: 'Expires Nov 20, 2026', date: '11/20/2025', time: '9:30 AM', action: 'Download', expirationDate: '2026-11-20' },
];

const IN_PROGRESS_DATA: Agreement[] = [
  ...AGREEMENTS_DATA.filter(agreement => agreement.status === 'Need to sign'),
  { id: 'ip1', name: 'First Pixel Studio — Hosting Agreement', recipient: 'To: First Pixel Studio', status: 'Sent', statusIcon: 'clock', statusKind: 'info', statusSub: 'Waiting for others', date: '10/26/2026', time: '9:15 AM', action: 'Copy' },
  { id: 'ip2', name: 'Brightline Solutions — Partner Access Agreement', recipient: 'To: Partner Operations', status: 'Sent', statusIcon: 'clock', statusKind: 'info', statusSub: 'Waiting for others', date: '10/23/2026', time: '3:20 PM', action: 'Copy' },
  { id: 'ip3', name: 'Northstar — Product Design Services', recipient: 'To: Design Operations', status: 'Delivered', statusIcon: 'clock', statusKind: 'info', statusSub: '1 of 2 signed', date: '10/22/2026', time: '10:00 AM', action: 'Copy' },
  { id: 'ip4', name: 'First Pixel Studio — Brand Asset Handoff', recipient: 'To: Brand Studio', status: 'Delivered', statusIcon: 'clock', statusKind: 'info', statusSub: 'Viewed', date: '10/21/2026', time: '2:10 PM', action: 'Copy' },
];

function getAgreementColumns(onEditDraft: (agreement: Agreement) => void): DataTableColumn<Agreement>[] {
  return [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    className: 'agreement-list-name',
    cell: (row: Agreement) => (
      <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
        <Text size="sm" title={row.name}>{row.name}</Text>
        <Text size="xs" color="secondary">{row.recipient}</Text>
      </Stack>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '18%',
    cell: (row: Agreement) => (
      <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
        {row.progress !== undefined ? (
          <Stack gap="small">
            <ProgressBar value={row.progress} showLabel={false} label="Envelope progress" />
            <Text size="xs">{row.status}</Text>
          </Stack>
        ) : (
        <Inline gap="small" align="center">
          <Icon name={row.statusIcon} size={16} color={row.statusKind === 'success' ? 'var(--ink-green-80)' : undefined} />
          <Text size="sm">{row.status}</Text>
        </Inline>
        )}
        {row.statusSub && (
          <Text size="xs" color="secondary" style={{ textDecoration: 'underline', textDecorationColor: 'var(--ink-border-subtle)' }}>{row.statusSub}</Text>
        )}
      </Stack>
    ),
  },
  {
    key: 'date',
    header: 'Last Change',
    width: '17%',
    sortable: true,
    cell: (row: Agreement) => (
      <Stack gap="none" style={{ gap: 'var(--ink-spacing-25)' }}>
        <Text size="sm">{row.date}</Text>
        <Text size="xs" color="secondary">{row.time}</Text>
      </Stack>
    ),
  },
  { key: 'folder', header: 'Folder', width: '8%', cell: row => row.folder ?? '' },
  {
    key: 'action',
    header: '',
    alignment: 'right',
    width: '17%',
    cell: (row: Agreement) => (
      <Inline gap="small" align="center" justify="end" style={{ marginLeft: 'auto' }}>
        <Button kind={row.action === 'Sign' ? 'primary' : 'secondary'} size="small" onClick={row.action === 'Edit' ? () => onEditDraft(row) : undefined}>{row.action}</Button>
        <IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label="More actions" />
      </Inline>
    ),
  },
  ];
}

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

const navigatorColumns: DataTableColumn<NavigatorAgreement>[] = [
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
        <Link kind="subtle" size="small" href="#" className={dataTableStyles.cellPrimary} title={row.fileName} style={{ textDecoration: 'none', color: 'inherit', display: 'block', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.fileName}
        </Link>
        <span className={dataTableStyles.cellSecondary}>
          {row.fileStatus === 'uploaded' ? '↑' : '✓'}{' '}
          {row.fileStatus === 'uploaded' ? 'Uploaded: ' : 'Completed envelope: '}
          <Link kind="subtle" size="small" href="#">{row.fileStatusDetail}</Link>
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
              return <Link kind="subtle" size="small" key={i} href="#" className={dataTableStyles.partyMoreLink}>{party}</Link>;
            }
            return (
              <span key={i}>
                <Link kind="subtle" size="small" href="#" className={dataTableStyles.partyLink} style={{ textDecoration: 'underline', color: 'var(--ink-font-default)', fontWeight: "var(--ink-font-weight-regular)" }}>{party}</Link>
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

const partyColumns: DataTableColumn<Party>[] = [
  { key: 'name', header: 'Name', sortable: true, width: '280px' },
  { key: 'role', header: 'Role', sortable: true, width: '120px' },
  {
    key: 'activeAgreements',
    header: 'Active agreements',
    sortable: true,
    width: '160px',
    cell: (row: Party) => (
      <Inline gap="small" align="center">
        <Badge kind="success">Active</Badge>
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
  { id: '4', title: 'Brightline Solutions — Partner Preview NDA', requestId: 'REQ-0004', status: 'New', lastActivityAt: '10/26/2026 09:45', dueDate: '10/29/2026', submitterName: 'Akshat Mishra', submitterEmail: 'akshat@firstpixel.example', submitterInitials: 'AM', owner: 'Legal Team', requestType: 'NDA Request', description: 'Review the mutual NDA before sharing early product concepts and design system assets with Brightline Solutions.', created: '10/26/2026' },
  { id: '5', title: '[Example] General Legal Request by DocuSign User', requestId: 'REQ-0003', status: 'New', lastActivityAt: '18/12/2025 21:55', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'General Request', description: 'Requesting standard contract terms review for a new SaaS subscription.', created: '18/12/2025' },
  { id: '6', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0002', status: 'New', lastActivityAt: '15/11/2025 21:25', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'NDA Request', description: 'One-way NDA for a prospective supplier evaluation.', created: '15/11/2025' },
  { id: '7', title: '[Example] NDA Request by DocuSign User', requestId: 'REQ-0001', status: 'New', lastActivityAt: '23/10/2025 18:35', dueDate: '', submitterName: 'DocuSign User', submitterEmail: 'navigator_test_admin@dsxtr.com', submitterInitials: 'DU', owner: 'Unassigned', requestType: 'NDA Request', description: 'Standard mutual NDA requested for an upcoming vendor pilot.', created: '23/10/2025' },
];

const requestColumns: DataTableColumn<RequestItem>[] = [
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    width: '360px',
    cell: (row: RequestItem) => (
      <div className={dataTableStyles.cellContent}>
        <Link kind="subtle" size="small" discrete href="#" onClick={event => event.preventDefault()}>{row.title}</Link>
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
        <span style={{ width: 8, height: 8, borderRadius: "var(--ink-radius-full)", background: 'var(--ink-green-60)', flexShrink: 0 }} />
        <Badge kind="success">{row.status}</Badge>
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
        <Icon name="person" size={16} color="var(--ink-font-secondary)" />
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
  { id: '2', name: 'First Pixel Studio — Product Launch', status: 'active', created: '10/20/2026', owner: 'Akshat Mishra' },
  { id: '3', name: 'Q3 Vendor Onboarding', status: 'active', created: '5/14/2026', owner: 'Procurement Team' },
  { id: '4', name: '2026 Commercial Lease Closings', status: 'active', created: '4/30/2026', owner: 'Legal Team' },
  { id: '5', name: 'Contractor Statement of Work – DesignLab', status: 'inactive', created: '3/19/2026', owner: 'Akshat Mishra' },
  { id: '6', name: 'Series B Financing Round', status: 'active', created: '2/26/2026', owner: 'Finance Team' },
  { id: '7', name: 'Employee Offer Packages – Spring Cohort', status: 'inactive', created: '1/15/2026', owner: 'HR Department' },
];

const workspaceColumns: DataTableColumn<Workspace>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    cell: (row: Workspace) => (
      <Link kind="subtle" size="small" href="#" className={dataTableStyles.cellPrimary} style={{ textDecoration: 'none', color: 'inherit', fontWeight: "var(--ink-font-weight-semibold)" }}>
        {row.name}
      </Link>
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
    alignment: 'right',
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
  created?: string;
  powerForm?: string;
  folder?: string;
  kind?: TemplateLibraryKind;
  status?: 'Published' | 'Draft';
  document?: { slug: string; pageCount: number };
}

type TemplateLibraryKind = 'envelope' | 'clause' | 'document' | 'workspace' | 'workflow' | 'web-form' | 'elastic';
interface TemplateEditorState { kind: TemplateLibraryKind; upload?: boolean; item?: TemplateItem; }

const TEMPLATE_VIEW_LABELS: Record<TemplatesSidebarView, string> = {
  'my-templates': 'My Templates', 'shared-with-me': 'Shared with Me', favorites: 'Favorites', 'all-templates': 'All Templates',
  clauses: 'Clauses', 'document-templates': 'Document Templates', 'workspace-templates': 'Workspace Templates',
  'workflow-templates': 'Workflow Templates', 'my-web-forms': 'My Web Forms', 'shared-web-forms': 'Shared Web Forms',
  'all-web-forms': 'All Web Forms', 'template-gallery': 'Template Gallery', 'elastic-templates': 'Elastic Templates',
};

const TEMPLATE_KINDS: Record<TemplateLibraryKind, { label: string; icon: string; view: TemplatesSidebarView; description: string }> = {
  envelope: { label: 'Envelope template', icon: 'templates', view: 'my-templates', description: 'Reuse documents, recipients, and fields to prepare agreements faster.' },
  clause: { label: 'Clause', icon: 'bulleted-list', view: 'clauses', description: 'Keep approved contract language in a shared library.' },
  document: { label: 'Document template', icon: 'document', view: 'document-templates', description: 'Start agreements from reusable document content.' },
  workspace: { label: 'Workspace template', icon: 'transactions', view: 'workspace-templates', description: 'Standardize the documents and tasks in each workspace.' },
  workflow: { label: 'Workflow template', icon: 'workflow', view: 'workflow-templates', description: 'Start with a repeatable process for your team.' },
  'web-form': { label: 'Web form', icon: 'globe-language', view: 'my-web-forms', description: 'Collect information and start agreements from a web form.' },
  elastic: { label: 'Elastic template', icon: 'document', view: 'elastic-templates', description: 'Manage reusable agreement content for embedded acceptance.' },
};

function templateKindForView(view: TemplatesSidebarView): TemplateLibraryKind {
  if (view === 'clauses') return 'clause';
  if (view === 'document-templates') return 'document';
  if (view === 'workspace-templates') return 'workspace';
  if (view === 'workflow-templates') return 'workflow';
  if (view.includes('web-forms')) return 'web-form';
  if (view === 'elastic-templates') return 'elastic';
  return 'envelope';
}

const TEMPLATES_DATA: TemplateItem[] = [
  { id: '1', name: 'quick send', description: 'Default template for quick envelope sending', owner: 'Akshat Mishra', lastModified: '03/13/2026', shared: false, uses: 24, favorited: false },
  { id: '2', name: 'shared template info', description: 'Shared informational template', owner: 'Akshat Mishra', lastModified: '08/12/2025', shared: true, uses: 12, favorited: false },
  { id: '3', name: 'Partner Preview NDA', description: 'Share early concepts and product plans with external partners.', owner: 'Akshat Mishra', lastModified: '10/22/2026', shared: true, uses: 24, favorited: true, document: { slug: 'non-disclosure-agreement', pageCount: 2 } },
  { id: '4', name: 'Design & Build Agreement', description: 'Scope discovery, component design, implementation, and handoff in one agreement.', owner: 'Akshat Mishra', lastModified: '10/21/2026', shared: true, uses: 18, favorited: true, document: { slug: 'service-agreement', pageCount: 3 } },
  { id: '5', name: 'Design Team Offer Letter', description: 'Welcome the next maker to a team that sweats the small details.', owner: 'People Team', lastModified: '10/20/2026', shared: true, uses: 12, favorited: true, document: { slug: 'offer-letter', pageCount: 1 } },
  { id: '6', name: 'Consulting Agreement', description: 'Independent contractor consulting agreement', owner: 'Akshat Mishra', lastModified: '02/10/2026', shared: false, uses: 7, favorited: false },
  { id: '7', name: 'Sales Contract', description: 'Standard sales contract with payment terms', owner: 'Sales Ops', lastModified: '03/20/2026', shared: true, uses: 342, favorited: false },
  { id: '8', name: 'Vendor Onboarding', description: 'New vendor setup and compliance form', owner: 'Procurement', lastModified: '12/08/2025', shared: true, uses: 45, favorited: false },
  { id: '9', name: 'Employment Agreement', description: 'Full-time employment agreement', owner: 'HR Department', lastModified: '03/01/2026', shared: true, uses: 178, favorited: false },
  { id: '10', name: 'Change Order', description: 'Amendment to existing SOW or contract', owner: 'Akshat Mishra', lastModified: '03/22/2026', shared: false, uses: 3, favorited: false },
];

function templateDocumentUrl(template: TemplateItem, page?: number) {
  return `${import.meta.env.BASE_URL}template-previews/${template.document!.slug}${page ? `-${page}.png` : '.pdf'}`;
}

function TemplateDocumentPages({ template }: { template: TemplateItem }) {
  if (!template.document) return null;
  return <Stack gap="medium">
    <Inline justify="between" gap="small" wrap>
      <Text size="xs" color="secondary">{template.document.pageCount} {template.document.pageCount === 1 ? 'page' : 'pages'} · Sample agreement</Text>
      <Link size="small" href={templateDocumentUrl(template)} download={`${template.name}.pdf`}>Download sample PDF</Link>
    </Inline>
    {Array.from({ length: template.document.pageCount }, (_, index) => <Card key={index} radius="small">
      <Card.Image src={templateDocumentUrl(template, index + 1)} alt={`${template.name}, page ${index + 1} of ${template.document!.pageCount}`} ratio="1:1" style={{ aspectRatio: '17 / 22' }} />
    </Card>)}
  </Stack>;
}

const TEMPLATE_RESOURCE_SEEDS: Record<Exclude<TemplateLibraryKind, 'envelope'>, Array<[string, string]>> = {
  clause: [
    ['Confidentiality', 'Protect confidential information shared between parties.'],
    ['Limitation of liability', 'Define liability limits and excluded damages.'],
    ['Payment terms', 'Net 30 payment terms and invoicing requirements.'],
    ['Termination for convenience', 'Provide a notice period for ending an agreement.'],
    ['Data protection', 'Standard provisions for processing personal data.'],
  ],
  document: [
    ['Master Service Agreement', 'Services, payment, and legal terms for customer engagements.'],
    ['Non-Disclosure Agreement', 'Mutual confidentiality agreement for new partnerships.'],
    ['Statement of Work', 'Project scope, deliverables, milestones, and acceptance.'],
    ['Consulting Agreement', 'A reusable agreement for independent consultants.'],
    ['Vendor Agreement', 'Standard purchasing terms for new suppliers.'],
  ],
  workspace: [
    ['Customer onboarding', 'Organize the MSA, order form, and launch tasks.'],
    ['Vendor onboarding', 'Collect vendor agreements and compliance documents.'],
    ['New hire', 'Keep offer letters and onboarding documents together.'],
    ['Contract renewal', 'Review renewal terms, approvals, and signatures.'],
    ['Property lease', 'Manage lease documents and tenant requirements.'],
  ],
  workflow: [
    ['NDA review and approval', 'Route a new NDA to Legal before sending for signature.'],
    ['New hire onboarding', 'Prepare an offer letter and coordinate HR tasks.'],
    ['Sales agreement handoff', 'Notify Sales Ops when a customer signs.'],
    ['Vendor agreement review', 'Collect procurement details and request approval.'],
    ['Upcoming renewal reminders', 'Remind an agreement owner before the renewal date.'],
  ],
  'web-form': [
    ['New vendor intake', 'Collect company details and vendor contact information.'],
    ['NDA request', 'Request a confidentiality agreement for a new partner.'],
    ['Sales agreement request', 'Gather customer and deal details before preparing an agreement.'],
    ['Consulting engagement', 'Capture project scope and consultant information.'],
    ['Employee information', 'Collect details for a new employee agreement.'],
  ],
  elastic: [
    ['Terms of service', 'Acceptance terms for the customer application.'],
    ['Privacy acknowledgement', 'Record acknowledgement of the privacy notice.'],
    ['Trial agreement', 'Terms for a new product trial.'],
    ['Partner portal terms', 'Acceptance agreement for the partner portal.'],
    ['Marketing consent', 'Capture customer consent for communications.'],
  ],
};

const TEMPLATE_RESOURCES_DATA: TemplateItem[] = Object.entries(TEMPLATE_RESOURCE_SEEDS).flatMap(([kind, rows]) => rows.map(([name, description], index) => ({
  id: `library-${kind}-${index + 1}`, name, description, kind: kind as TemplateLibraryKind,
  owner: index % 2 === 0 ? 'Akshat Mishra' : 'Legal Team', lastModified: `10/${String(22 - index).padStart(2, '0')}/2026`,
  shared: index !== 2, uses: [48, 31, 12, 0, 6][index], favorited: index === 0, status: index === 3 ? 'Draft' as const : 'Published' as const,
})));

function TemplateEditorDialog({ editor, onClose, onSave }: { editor: TemplateEditorState; onClose: () => void; onSave: (item: TemplateItem) => void }) {
  const [name, setName] = useState(editor.item?.name ?? '');
  const [description, setDescription] = useState(editor.item?.description ?? '');
  const [published, setPublished] = useState(editor.item ? (editor.item.status ?? 'Published') === 'Published' : false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const label = TEMPLATE_KINDS[editor.kind].label.toLowerCase();
  const save = () => {
    setSubmitted(true);
    if (!name.trim() || (editor.upload && !uploadedFile)) return;
    onSave({ ...editor.item, id: editor.item?.id ?? crypto.randomUUID(), name: name.trim(), description: description.trim(), kind: editor.kind, owner: editor.item?.owner ?? 'Akshat Mishra',
      lastModified: new Date().toLocaleDateString('en-US'), shared: editor.item?.shared ?? false, uses: editor.item?.uses ?? 0, favorited: editor.item?.favorited ?? false, status: published ? 'Published' : 'Draft' });
  };
  return <Modal open onClose={onClose} title={`${editor.item ? 'Edit' : editor.upload ? 'Upload' : 'Create'} ${label}`} size="medium" footer={
    <Inline justify="end" gap="small"><Button kind="secondary" onClick={onClose}>Cancel</Button><Button kind="primary" onClick={save}>{editor.item ? 'Save changes' : 'Create'}</Button></Inline>
  }>
    <Stack gap="medium">
      {editor.upload && <><FileUpload label="Template file" accept=".pdf,.doc,.docx,.json" multiple={false} maxFiles={1} onFilesSelect={files => { const file = files[0]; setUploadedFile(file ?? null); if (file && !name) setName(file.name.replace(/\.[^.]+$/, '')); }} />{submitted && !uploadedFile && <Text size="sm" color="error">Choose a file to upload.</Text>}</>}
      <Input label="Name" required value={name} onChange={event => setName(event.target.value)} error={submitted && !name.trim() ? 'Enter a name.' : undefined} />
      <TextArea label="Description" value={description} onChange={event => setDescription(event.target.value)} rows={3} />
      <Switch label="Publish template" description="Published templates are ready for your team to use." checked={published} onChange={setPublished} />
    </Stack>
  </Modal>;
}

function TemplatesLibraryPage({ view, onNavigate, search, onSearchChange, items, onItemsChange, editor, onEditorChange, onUseTemplate }: {
  view: TemplatesSidebarView; onNavigate: (view: TemplatesSidebarView) => void; search: string; onSearchChange: (value: string) => void;
  items: TemplateItem[]; onItemsChange: React.Dispatch<React.SetStateAction<TemplateItem[]>>; editor: TemplateEditorState | null;
  onEditorChange: (editor: TemplateEditorState | null) => void; onUseTemplate: (item: TemplateItem) => void;
}) {
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [status, setStatus] = useState('All statuses');
  const [dateRange, setDateRange] = useState('Any time');
  const [advancedFilters, setAdvancedFilters] = useState({ owner: '', status: 'All statuses', sharedOnly: false });
  const [advancedDraft, setAdvancedDraft] = useState(advancedFilters);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const kind = templateKindForView(view);
  const isGallery = view === 'template-gallery';
  const isEnvelope = ['my-templates', 'shared-with-me', 'favorites', 'all-templates'].includes(view);
  useEffect(() => { setPage(1); setStatus('All statuses'); setDateRange('Any time'); setAdvancedFilters({ owner: '', status: 'All statuses', sharedOnly: false }); setNotice(''); }, [view]);
  useEffect(() => { setPage(1); }, [search, status, dateRange, advancedFilters]);
  const viewTemplates = items.filter(item => {
    if (isGallery) return (item.status ?? 'Published') === 'Published';
    if ((item.kind ?? 'envelope') !== kind) return false;
    if (view === 'my-templates' || view === 'my-web-forms') return item.owner === 'Akshat Mishra';
    if (view === 'shared-with-me' || view === 'shared-web-forms') return item.shared && item.owner !== 'Akshat Mishra';
    if (view === 'favorites') return item.favorited;
    return true;
  });
  const filteredTemplates = viewTemplates.filter(item => {
    if (search && !`${item.name} ${item.description} ${item.owner}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (!isEnvelope) return status === 'All statuses' || (item.status ?? 'Published') === status;
    if (advancedFilters.owner && !item.owner.toLowerCase().includes(advancedFilters.owner.toLowerCase())) return false;
    if (advancedFilters.sharedOnly && !item.shared) return false;
    if (advancedFilters.status !== 'All statuses' && (item.status ?? 'Published') !== advancedFilters.status) return false;
    if (dateRange !== 'Any time') {
      const modified = new Date(item.lastModified);
      const now = new Date();
      if (dateRange === 'This year') return modified.getFullYear() === now.getFullYear();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - (dateRange === 'Last 30 days' ? 30 : 90));
      cutoff.setHours(0, 0, 0, 0);
      if (Number.isNaN(modified.getTime()) || modified < cutoff || modified > now) return false;
    }
    return true;
  });
  const clearFilters = () => { onSearchChange(''); setStatus('All statuses'); setDateRange('Any time'); setAdvancedFilters({ owner: '', status: 'All statuses', sharedOnly: false }); };
  const toggleFavorite = (item: TemplateItem) => onItemsChange(current => current.map(row => row.id === item.id ? { ...row, favorited: !row.favorited } : row));
  const duplicate = (item: TemplateItem) => {
    onItemsChange(current => [{ ...item, id: crypto.randomUUID(), name: `${item.name} (copy)`, owner: 'Akshat Mishra', shared: false, status: 'Draft', uses: 0, lastModified: new Date().toLocaleDateString('en-US') }, ...current]);
    setPreview(null);
    onNavigate(TEMPLATE_KINDS[item.kind ?? 'envelope'].view);
    setNotice(`A draft copy of “${item.name}” was created.`);
  };
  const useTemplate = (item: TemplateItem) => {
    setPreview(null);
    if ((item.kind ?? 'envelope') === 'envelope' || item.kind === 'workflow') onUseTemplate(item);
    else duplicate(item);
  };
  const columns: DataTableColumn<TemplateItem>[] = [
    { key: 'favorite', header: '', width: 'var(--ink-spacing-700)', cell: item => <IconButton icon={item.favorited ? 'star-filled' : 'star'} variant="tertiary" size="small" aria-label={`${item.favorited ? 'Remove' : 'Add'} ${item.name} ${item.favorited ? 'from' : 'to'} favorites`} onClick={event => { event.stopPropagation(); toggleFavorite(item); }} /> },
    { key: 'name', header: 'Name', sortable: true, className: 'template-list-name', width: isEnvelope ? '35%' : undefined, cell: item => <Stack gap="none"><Link href="#templates" kind="subtle" size="small" discrete onClick={event => { event.preventDefault(); event.stopPropagation(); setPreview(item); }}>{item.name}</Link><Text size="xs" color="secondary">{item.description}</Text></Stack> },
    ...(!isEnvelope ? [{ key: 'status', header: 'Status', cell: (item: TemplateItem) => <Badge kind={item.status === 'Draft' ? 'subtle' : 'success'} text={item.status ?? 'Published'} /> }] : []),
    { key: 'owner', header: 'Owner', sortable: true },
    ...(isEnvelope ? [
      { key: 'powerForm', header: 'Powerforms', cell: (item: TemplateItem) => <Text size="sm">{item.powerForm ?? ''}</Text> },
      { key: 'created', header: 'Created Date', sortable: true, sortValue: (item: TemplateItem) => new Date(item.created ?? item.lastModified).getTime(), cell: (item: TemplateItem) => <Text size="sm">{item.created ?? item.lastModified}</Text> },
    ] : []),
    { key: 'lastModified', header: 'Last Change', sortable: true },
    ...(isEnvelope ? [{ key: 'folder', header: 'Folders', cell: (item: TemplateItem) => <Text size="sm">{item.folder ?? ''}</Text> }] : [{ key: 'uses', header: kind === 'web-form' ? 'Responses' : 'Uses', sortable: true }]),
    { key: 'actions', header: '', alignment: 'right', cell: item => <Inline gap="small" justify="end">
      <Button kind="secondary" size="small" onClick={event => { event.stopPropagation(); (isEnvelope || kind === 'workflow') ? useTemplate(item) : setPreview(item); }}>{isEnvelope || kind === 'workflow' ? 'Use' : 'Open'}</Button>
      <Dropdown align="end" items={[
        { label: 'Preview', onClick: () => setPreview(item) },
        { label: 'Edit', onClick: () => onEditorChange({ kind: item.kind ?? 'envelope', item }) },
        { label: 'Create a copy', onClick: () => duplicate(item) },
        { label: item.favorited ? 'Remove from favorites' : 'Add to favorites', onClick: () => toggleFavorite(item) },
      ]}><IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label={`More actions for ${item.name}`} onClick={event => event.stopPropagation()} /></Dropdown>
    </Inline> },
  ];
  const list = <AgreementTableView
    paddingVariant={isEnvelope ? 'compact' : 'default'}
    pageHeader={<PageHeader title={TEMPLATE_VIEW_LABELS[view]} actions={isEnvelope ? undefined : <Button kind="primary" startElement={<Icon name="plus" size="small" />} onClick={() => onEditorChange({ kind })}>Create {TEMPLATE_KINDS[kind].label.toLowerCase()}</Button>} />}
    banner={notice ? <Banner kind="success" closable onClose={() => setNotice('')}>{notice}</Banner> : undefined}
    filterBar={<FilterBar className={isEnvelope ? 'template-list-filters' : undefined} search={{ value: search, onChange: onSearchChange, placeholder: `Search ${TEMPLATE_VIEW_LABELS[view]}` }} filters={<Inline gap="small">
      {isEnvelope ? <>
        <Dropdown items={['Any time', 'Last 30 days', 'Last 90 days', 'This year'].map(value => ({ label: value, selected: dateRange === value, onClick: () => setDateRange(value) }))}><Button kind="secondary" size="small" menuTrigger>{dateRange === 'Any time' ? 'Date' : dateRange}</Button></Dropdown>
        <Button kind="secondary" size="small" menuTrigger onClick={() => { setAdvancedDraft(advancedFilters); setShowAdvancedSearch(true); }}>Advanced search</Button>
        <Button kind="tertiary" size="small" onClick={clearFilters}>Clear</Button>
      </> : <>
        <Dropdown items={['All statuses', 'Published', 'Draft'].map(value => ({ label: value, selected: status === value, onClick: () => setStatus(value) }))}><Button kind="secondary" size="small" menuTrigger>{status}</Button></Dropdown>
        {(search || status !== 'All statuses') && <Button kind="tertiary" size="small" onClick={clearFilters}>Clear</Button>}
      </>}
    </Inline>} />}
  >
    <Stack gap="medium">
    {!isEnvelope && <Text size="sm" color="secondary">{isGallery ? 'Find a starting point, then customize a copy for your team.' : TEMPLATE_KINDS[kind].description}</Text>}
    {isGallery ? <Grid columns="auto" gap="medium">{filteredTemplates.map(item => <Card key={item.id} radius="large">
      {item.document ? <Card.Image src={templateDocumentUrl(item, 1)} alt={`First page of ${item.name}`} imageSpacing="document-preview" ratio="1:1" /> : <Card.Header><Inline justify="between"><Icon name={TEMPLATE_KINDS[item.kind ?? 'envelope'].icon} size="medium" /><Badge kind="subtle" text={TEMPLATE_KINDS[item.kind ?? 'envelope'].label} /></Inline></Card.Header>}
      <Card.Body><Stack gap="small"><Text size="md" weight="semibold">{item.name}</Text><Text size="sm" color="secondary">{item.description}</Text></Stack></Card.Body>
      <Card.Footer><Button kind="secondary" size="small" onClick={() => setPreview(item)}>Preview template</Button></Card.Footer>
    </Card>)}</Grid> : <DataTable className="template-list-table" columns={columns} data={filteredTemplates.slice((page - 1) * pageSize, page * pageSize)} getRowKey={item => item.id} selectable stickyHeader showColumnControl rowHeight="tall" onRowClick={setPreview} emptyMessage="No templates match your search" pagination={{ page, pageSize, totalItems: filteredTemplates.length, onPageChange: setPage, onPageSizeChange: size => { setPageSize(size); setPage(1); }, showInfo: true }} />}
    {isGallery && filteredTemplates.length === 0 && <EmptyState header={<EmptyState.Header text="No templates found" />} callToAction={<Button kind="secondary" onClick={() => onSearchChange('')}>Clear search</Button>}>Try another name or agreement type.</EmptyState>}
    </Stack>
  </AgreementTableView>;
  return <>
    {(isEnvelope || view === 'elastic-templates') ? <Tabs className="template-screen-tabs" value={view === 'elastic-templates' ? 'elastic-template-list' : 'envelope-template-list'} onChange={tab => { onSearchChange(''); onNavigate(tab === 'elastic-template-list' ? 'elastic-templates' : 'my-templates'); }} tabs={[
      { id: 'envelope-template-list', label: 'Templates', content: list }, { id: 'elastic-template-list', label: 'Elastic Templates', content: list },
    ]} /> : list}
    {showAdvancedSearch && <Modal open onClose={() => setShowAdvancedSearch(false)} title="Advanced search" size="medium" footer={<Inline justify="end" gap="small"><Button kind="secondary" onClick={() => setShowAdvancedSearch(false)}>Cancel</Button><Button kind="primary" onClick={() => { setAdvancedFilters(advancedDraft); setShowAdvancedSearch(false); }}>Apply filters</Button></Inline>}>
      <Stack gap="medium">
        <Input label="Owner" placeholder="Search by owner name" value={advancedDraft.owner} onChange={event => setAdvancedDraft(current => ({ ...current, owner: event.target.value }))} />
        <Select label="Status" value={advancedDraft.status} onChange={event => setAdvancedDraft(current => ({ ...current, status: event.target.value }))}>{['All statuses', 'Published', 'Draft'].map(value => <option key={value} value={value}>{value}</option>)}</Select>
        <Checkbox label="Shared templates only" checked={advancedDraft.sharedOnly} onChange={event => setAdvancedDraft(current => ({ ...current, sharedOnly: event.target.checked }))} />
      </Stack>
    </Modal>}
    {editor && <TemplateEditorDialog key={editor.item?.id ?? `${editor.kind}-${editor.upload}`} editor={editor} onClose={() => onEditorChange(null)} onSave={item => {
      onItemsChange(current => editor.item ? current.map(row => row.id === item.id ? item : row) : [item, ...current]); onEditorChange(null); onNavigate(TEMPLATE_KINDS[item.kind ?? 'envelope'].view); setNotice(`“${item.name}” was saved.`);
    }} />}
    {preview && <Modal open onClose={() => setPreview(null)} title={preview.name} size="large" statusBadge={<Badge kind={preview.status === 'Draft' ? 'subtle' : 'success'} text={preview.status ?? 'Published'} />} footer={<Inline justify="end" gap="small"><Button kind="secondary" onClick={() => { onEditorChange({ kind: preview.kind ?? 'envelope', item: preview }); setPreview(null); }}>Edit template</Button><Button kind="primary" onClick={() => useTemplate(preview)}>{(preview.kind ?? 'envelope') === 'envelope' || preview.kind === 'workflow' ? 'Use template' : 'Create a copy'}</Button></Inline>}>
      <Stack gap="large">
        <Text size="md">{preview.description}</Text>
        <Grid columns={3} gap="medium"><Stack gap="small"><Text size="xs" color="secondary">Type</Text><Text size="sm">{TEMPLATE_KINDS[preview.kind ?? 'envelope'].label}</Text></Stack><Stack gap="small"><Text size="xs" color="secondary">Owner</Text><Text size="sm">{preview.owner}</Text></Stack><Stack gap="small"><Text size="xs" color="secondary">Last change</Text><Text size="sm">{preview.lastModified}</Text></Stack></Grid>
        {preview.document ? <TemplateDocumentPages template={preview} /> : <Card radius="small"><Card.Header><Text size="md" weight="semibold">{preview.kind === 'workflow' ? 'Workflow steps' : preview.kind === 'web-form' ? 'Form fields' : preview.kind === 'workspace' ? 'Workspace contents' : 'Template content'}</Text></Card.Header><Card.Body><Stack gap="medium">
          {preview.kind === 'workflow' ? <><Text size="sm">1. Collect agreement information</Text><Text size="sm">2. Request approval from the team</Text><Text size="sm">3. Send the agreement for signature</Text><Text size="sm">4. Notify the owner when completed</Text></> : preview.kind === 'web-form' ? <><Input label="Full name" placeholder="Enter your name" readOnly /><Input label="Email address" placeholder="name@company.com" readOnly /><Input label="Company" placeholder="Company name" readOnly /></> : preview.kind === 'workspace' ? <><Text size="sm">Agreement documents</Text><Text size="sm">Review and approval tasks</Text><Text size="sm">Shared contacts and activity</Text></> : <><Text size="sm" weight="semibold">{preview.name}</Text><Text size="sm">{preview.kind === 'clause' ? `${preview.description} The parties agree to the terms set out in this agreement, subject to the applicable statement of work and any written amendments.` : 'This template includes reusable agreement content. Add the parties, review the terms, and prepare a copy for your next agreement.'}</Text><Text size="xs" color="secondary">Prepared for Protolab · {preview.lastModified}</Text></>}
        </Stack></Card.Body></Card>}
      </Stack>
    </Modal>}
  </>;
}

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
  description: string;
  category: InsightReportCategory;
  starred?: boolean;
  schedule?: string;
}

type InsightReportCategory = 'envelope' | 'recipient' | 'usage' | 'custom' | 'downloads' | 'web-forms';
type InsightReportTab = 'recents' | 'all-envelope' | InsightReportCategory;
const INSIGHTS_VIEW_LABELS: Record<InsightsSidebarView, string> = {
  overview: 'Overview', dashboards: 'Renewals', 'my-dashboard': 'My dashboard', 'admin-dashboard': 'Administrator dashboard',
  'agreements-dashboard': 'Agreements', 'obligations-dashboard': 'Obligations', 'renewals-dashboard': 'Renewals',
  'requests-dashboard': 'Requests', 'ai-usage-dashboard': 'AI Assistant and Agent Usage', 'procurement-hub': 'Procurement Hub',
  'custom-obligations': 'Obligations', 'custom-dashboard': 'Custom dashboard', reports: 'Reports',
};
const INSIGHT_REPORT_SEEDS: Record<InsightReportCategory, Array<[string, string]>> = {
  envelope: [
    ['Envelope Report', 'Information on envelopes sent from this account.'],
    ['Envelope Recipient Report', 'Sender and recipient information on all envelopes sent from this account.'],
    ['Envelope Status Report', 'Totals based on envelope status for this account.'],
    ['Envelope Velocity Report', 'Totals based on envelope completion time for this account.'],
    ['Envelope Volume Report', 'Envelope status totals for a specific time period for this account.'],
    ['Envelope Authentication Report', 'Information on envelope authentication for this account.'],
  ],
  recipient: [
    ['Recipient Activity Report', 'Recipient activity on all envelopes sent from this account.'],
    ['Recipient Authentication Report', 'Identity verification data for this account.'],
    ['Recipient Completion Report', 'Completed signatures by recipient and agreement.'],
    ['Recipient Delivery Report', 'Delivery results for recipient invitations.'],
    ['Recipient Response Times', 'Time between delivery and completed signature.'],
  ],
  usage: [
    ['User Activity Report', 'User activity for this account.'], ['Group Activity Report', 'Activity broken down by group.'],
    ['Account Activity Report', 'Summary of user, envelope, and template data.'], ['Template Usage Report', 'Template activity and usage by sender.'],
    ['AI Assistant Usage', 'Assistant conversations and agreement analysis activity.'],
  ],
  custom: [
    ['parties', 'Agreement activity grouped by party.'], ['The agreements by type', 'Compare agreement types across your portfolio.'],
    ['Obligations by type', 'Monitor obligations across active agreements.'], ['Expiring agreements', 'Agreements approaching their expiration date.'],
    ['Upcoming renewals', 'Review upcoming renewal notice dates.'], ['All agreements', 'Your agreement portfolio at a glance.'],
  ],
  downloads: [
    ['October envelope export', 'Envelope report exported on October 22, 2026.'], ['Weekly usage export', 'Account activity export for this week.'],
    ['Renewals export', 'Upcoming renewals prepared for review.'], ['Recipient activity export', 'Recipient activity for October 2026.'],
    ['Vendor agreements export', 'Procurement agreement details for the team.'],
  ],
  'web-forms': [
    ['Web Form Submissions', 'Submission volume across your web forms.'], ['Web Form Completion', 'Completed and abandoned form sessions.'],
    ['Vendor Intake Responses', 'Information submitted by new vendors.'], ['NDA Request Responses', 'Requests received through the NDA form.'],
    ['Web Form Activity', 'Activity grouped by form and owner.'],
  ],
};
const REPORTS_DATA: ReportItem[] = [
  ...Object.entries(INSIGHT_REPORT_SEEDS).flatMap(([category, rows]) => rows.map(([name, description], index) => ({
    id: `report-${category}-${index}`, name, description, type: 'report' as const, category: category as InsightReportCategory,
    owner: category === 'custom' ? 'Akshat Mishra' : 'Docusign', lastViewed: index < 3 || category === 'custom' ? '10/22/2026' : '', shared: true,
  }))),
  { id: 'dashboard-agreements', name: 'Agreements Dashboard', description: 'Agreement portfolio metrics.', type: 'dashboard', category: 'custom', owner: 'Akshat Mishra', lastViewed: '10/22/2026', shared: true, starred: true },
  { id: 'dashboard-renewals', name: 'Renewals Dashboard', description: 'Upcoming renewal activity.', type: 'dashboard', category: 'custom', owner: 'Legal Team', lastViewed: '10/21/2026', shared: true, starred: true },
];

/* ═══════════════════════════════════════
   Home Page
   ═══════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text as="span" size="xs" weight="semibold" style={{ letterSpacing: "var(--ink-letter-spacing-open)", textTransform: 'uppercase' as const }}>
      {children}
    </Text>
  );
}

interface HomePageProps {
  openRequestCount: number;
  templates: TemplateItem[];
  drafts: LocalEnvelopeDraft[];
  onUseTemplate: (template: TemplateItem) => void;
  onNavigate: (view: SidebarView) => void;
  onViewTemplates: (view?: TemplatesSidebarView) => void;
  onViewRenewals: () => void;
  onAskIris: () => void;
  onBegin: (kind: 'envelope' | 'request', files?: File[]) => void;
}

function HomePage({ openRequestCount, templates, drafts, onUseTemplate, onNavigate, onViewTemplates, onViewRenewals, onAskIris, onBegin }: HomePageProps) {
  const [showDropHint, setShowDropHint] = useState(true);
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const hasTasks = new URLSearchParams(window.location.search).get('homeTasks') !== 'empty';
  const signingAgreement = AGREEMENTS_DATA.find(agreement => agreement.id === '12')!;
  const reviewRequest = REQUESTS_DATA.find(request => request.id === '4')!;
  const reviewWorkspace = WORKSPACES_DATA.find(workspace => workspace.id === '2')!;
  const renewals = AGREEMENTS_DATA.filter(agreement => agreement.expirationDate);
  const waitingCount = IN_PROGRESS_DATA.filter(agreement => agreement.statusSub === 'Waiting for others').length;
  const tasks: { id: string; heading: string; name: string; metadata: string; view: SidebarView }[] = hasTasks ? [
    { id: signingAgreement.id, heading: 'Needs To Sign', name: signingAgreement.name, metadata: 'From: Legal Team', view: 'in-progress' },
    { id: reviewRequest.id, heading: 'Review Request', name: reviewRequest.title, metadata: `From: ${reviewRequest.submitterName}`, view: 'requests' },
    { id: reviewWorkspace.id, heading: 'Review Documents', name: reviewWorkspace.name, metadata: `Owner: ${reviewWorkspace.owner}`, view: 'workspaces' },
    ...(drafts[0] ? [{ id: drafts[0].id, heading: 'Finish Draft', name: drafts[0].name, metadata: 'Prepared by: Akshat Mishra', view: 'drafts' as const }] : []),
  ] : [];
  const activity = [
    { name: signingAgreement.name, time: '2 hours ago', status: 'Need to Sign', icon: 'sign', progress: signingAgreement.progress },
    { name: AGREEMENTS_DATA.find(agreement => agreement.id === '1')!.name, time: 'Yesterday', status: 'Voided', icon: 'status-void' },
    { name: AGREEMENTS_DATA.find(agreement => agreement.id === '6')!.name, time: 'Oct 23, 2026', status: 'Completed', icon: 'status-check' },
    ...renewals.map(agreement => ({ name: agreement.name, time: `Expiring on ${new Date(`${agreement.expirationDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, status: 'Expiring Soon', icon: 'clock', progress: undefined })),
  ];
  const favoriteTemplates = templates.filter(template => template.favorited && (template.kind ?? 'envelope') === 'envelope').slice(0, 3);
  const go = (view: SidebarView) => (event: React.MouseEvent) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <Stack
      gap="none"
      className="home-page"
      onDragOver={event => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault();
      }}
      onDrop={event => {
        const files = Array.from(event.dataTransfer.files);
        if (!files.length) return;
        event.preventDefault();
        onBegin('envelope', files);
      }}
    >
      <Stack gap="none" align="center" className="home-hero">
        <Heading level={1} className="home-welcome">Welcome, Akshat</Heading>
        <Inline gap="none" wrap justify="center" className="home-summary">
          <Button kind="tertiary" size="small" onClick={() => onNavigate('requests')}>
            {openRequestCount} open requests
          </Button>
          <Tooltip text="Next 30 days" location="below" data-qa="home-counter-renewals"><Button kind="tertiary" size="small" onClick={onViewRenewals}>{renewals.length} upcoming renewals</Button></Tooltip>
          <Tooltip text="Awaiting recipients" location="below" data-qa="home-counter-waiting"><Button kind="tertiary" size="small" onClick={() => onNavigate('in-progress')}>{waitingCount} waiting for others</Button></Tooltip>
          <Tooltip text="All completed agreements" location="below" data-qa="home-counter-completed"><Button kind="tertiary" size="small" onClick={() => onNavigate('completed')}>
            {AGREEMENTS_DATA.filter(agreement => agreement.status === 'Completed').length} completed
          </Button></Tooltip>
        </Inline>
        <Inline gap="none" wrap justify="center" className="home-actions">
          <Dropdown position="bottom" align="start" variant="solid" items={[
            { label: 'Send an Envelope', icon: <Icon name="send" size={18} />, onClick: () => onBegin('envelope') },
            { label: 'Sign a Document', icon: <Icon name="sign" size={18} />, onClick: () => onNavigate('in-progress') },
            { label: 'Use a Template', icon: <Icon name="templates" size={18} />, onClick: () => onViewTemplates() },
            { divider: true },
            { label: 'Create Request', icon: <Icon name="tag" size={18} />, onClick: () => onBegin('request') },
            { label: 'Workspaces', icon: <Icon name="transaction" size={18} />, onClick: () => onNavigate('workspaces') },
          ]}>
            <Button kind="tertiary" className="home-action">
              <Stack gap="small" align="center">
                <Stack gap="none" align="center" justify="center" className="home-action-icon"><Icon name="plus" size="small" /></Stack>
                <Inline gap="xs"><Text size="sm" weight="medium">Start</Text><Icon name="chevron-down" size={12} /></Inline>
              </Stack>
            </Button>
          </Dropdown>
          <Button kind="tertiary" className="home-action" onClick={onAskIris}>
            <Stack gap="small" align="center">
              <Stack gap="none" align="center" justify="center" className="home-action-icon"><IrisIconInverse size={20} /></Stack>
              <Text size="sm" weight="medium">Ask Iris to Send</Text>
            </Stack>
          </Button>
          <Button kind="tertiary" className="home-action" onClick={() => onBegin('envelope')}>
            <Stack gap="small" align="center">
              <Stack gap="none" align="center" justify="center" className="home-action-icon"><Icon name="send" size="small" /></Stack>
              <Text size="sm" weight="medium">Send Envelope</Text>
            </Stack>
          </Button>
          <Button kind="tertiary" className="home-action" onClick={() => onBegin('request')}>
            <Stack gap="small" align="center">
              <Stack gap="none" align="center" justify="center" className="home-action-icon"><Icon name="comment" size="small" /></Stack>
              <Text size="sm" weight="medium">Create Request</Text>
            </Stack>
          </Button>
        </Inline>
      </Stack>

      <Container size="xlarge" padded={false} className="home-content">
        <Stack gap="none" className="home-sections">
          {showDropHint && (
            <Inline gap="large" justify="center" className="home-drop-hint">
              <Inline gap="large" justify="center" wrap style={{ flex: 1 }}>
                <Icon name="upload" size={20} />
                <Text size="sm">Drop an agreement here. Take it from first draft to final signature.</Text>
              </Inline>
              <IconButton icon="close" size="small" variant="tertiary" aria-label="Close drop zone banner" onClick={() => setShowDropHint(false)} />
            </Inline>
          )}

          <Card radius="large" className="home-section">
            <Stack gap="large">
              <Inline justify="between">
                <Inline gap="small">
                  <Heading level={2} className="home-section-heading" aria-label={tasks.length ? `Tasks to do (${tasks.length})` : 'Tasks to do'}>Tasks to do</Heading>
                  {tasks.length > 0 && <Stack gap="none" aria-hidden="true"><AlertBadge value={tasks.length} kind="subtle" /></Stack>}
                </Inline>
                <Button kind="tertiary" onClick={() => onNavigate('in-progress')}>View all</Button>
              </Inline>
              {tasks.length ? (
                <Grid columns="auto" gap="medium" data-home-tasks>
                  {tasks.map(task => (
                    <TaskCard key={task.id} style={{ width: '100%', minWidth: 0 }}>
                      <TaskCard.Header heading={task.heading} showIcon={false} />
                      <TaskCard.Body style={{ flex: 1 }}>
                        <Link kind="subtle" discrete href="#agreements" className="home-task-name" title={task.name} onClick={go(task.view)}>{task.name}</Link>
                      </TaskCard.Body>
                      <TaskCard.Footer>
                        <Inline gap="small" justify="between" style={{ width: '100%' }}>
                          <Text size="xs" weight="medium" className="home-task-metadata">{task.metadata}</Text>
                          <IconButton icon="arrow-right" size="small" variant="secondary" aria-label={`Open ${task.name}`} onClick={() => onNavigate(task.view)} style={{ flexShrink: 0 }} />
                        </Inline>
                      </TaskCard.Footer>
                    </TaskCard>
                  ))}
                </Grid>
              ) : (
                <Stack gap="small" style={{ paddingBlock: 'var(--ink-spacing-300)' }}>
                  <Text size="lg">You don&apos;t have any tasks yet</Text>
                  <Text size="sm" color="secondary">When you have new tasks assigned to you, they will show up here.</Text>
                </Stack>
              )}
            </Stack>
          </Card>

          <Card radius="large" className="home-section">
            <Stack gap="medium">
              <Inline justify="between">
                <Inline gap="small">
                  <Heading level={2} className="home-section-heading">Agreement activity</Heading>
                  <IconButton icon="info" variant="tertiary" size="small" aria-label="View agreement activity" onClick={() => onNavigate('all-agreements')} />
                </Inline>
                <Button kind="tertiary" onClick={() => onNavigate('all-agreements')}>View all</Button>
              </Inline>
              <Stack gap="none">
                {activity.map((item, index) => (
                  <Inline key={`${index}-${item.name}`} gap="large" className="home-activity-row" style={{ borderTop: index ? 'var(--ink-border-width-xs) solid var(--ink-border-subtle)' : undefined }}>
                    <Stack gap="none" style={{ flex: 1, minWidth: 0 }}>
                      <Link kind="subtle" size="medium" discrete href="#agreements" className="home-agreement-name" title={item.name} onClick={go(item.status === 'Need to Sign' ? 'in-progress' : 'all-agreements')}>{item.name}</Link>
                      <Stack gap="none" justify="center" className="home-activity-time-row"><Text as="span" size="xs" color="secondary" className="home-activity-time">{item.time}</Text></Stack>
                    </Stack>
                    <Stack gap="small" className="home-activity-status">
                      {item.progress !== undefined && <ProgressBar value={item.progress} showLabel={false} label="Envelope progress" />}
                      <Inline gap="small">
                        {item.progress === undefined && <Icon name={item.icon} size={20} color={item.status === 'Completed' ? 'var(--ink-icon-color-success)' : undefined} />}
                        <Text size={item.progress !== undefined ? 'xs' : 'sm'}>{item.status}</Text>
                      </Inline>
                    </Stack>
                    <IconButton icon="chevron-right" variant="tertiary" size="small" aria-label={`View ${item.name}`} onClick={() => onNavigate(item.status === 'Need to Sign' ? 'in-progress' : 'all-agreements')} />
                  </Inline>
                ))}
              </Stack>
            </Stack>
          </Card>

          <Card radius="large" className="home-section">
            <Stack gap="large">
              <Inline justify="between">
                <Heading level={2} className="home-section-heading">Favorite templates</Heading>
                <Button kind="tertiary" onClick={() => onViewTemplates('favorites')}>View all</Button>
              </Inline>
              <Grid columns="auto" gap="medium">
                {favoriteTemplates.map(template => (
                  <PreviewCard key={template.id} onOpen={() => setPreview(template)} openLabel={`Preview ${template.name}`} heading={<PreviewCard.Heading text={template.name} description={<Stack gap="small"><Text size="xs" color="secondary">{template.document ? `${template.document.pageCount} ${template.document.pageCount === 1 ? 'page' : 'pages'} · ` : ''}{template.owner}</Text><Inline gap="small"><Text size="xs" color="secondary">Preview template</Text><Icon name="arrow-right" size="small" /></Inline></Stack>} />}>
                    {template.document ? <PreviewCard.Image src={templateDocumentUrl(template, 1)} alt={`First page of ${template.name}`} ratio="1:1" badge={<Badge kind="promoSubtle" text="Favorite" />} /> : <Stack gap="small" align="center" justify="center" style={{ aspectRatio: '1', background: 'var(--ink-bg-color-canvas-page)' }}><Icon name="document" size="medium" /><Text size="sm" color="secondary">Preview unavailable</Text></Stack>}
                  </PreviewCard>
                ))}
                <Stack gap="medium" align="start" justify="center" style={{ padding: 'var(--ink-spacing-200)' }}>
                  <Text size="md" weight="medium" className="home-template-aside-heading">A few well-crafted starting points</Text>
                  <Text size="sm" color="secondary">Reusable agreements, with the details already considered.</Text>
                  <Button kind="tertiary" onClick={() => onViewTemplates('all-templates')}>Browse templates</Button>
                </Stack>
              </Grid>
            </Stack>
          </Card>
        </Stack>
      </Container>
      {preview && <Modal open title={preview.name} size="large" onClose={() => setPreview(null)} footer={<Inline gap="small" justify="end"><Button kind="secondary" onClick={() => setPreview(null)}>Close</Button><Button kind="primary" onClick={() => { setPreview(null); onUseTemplate(preview); }}>Use template</Button></Inline>}>
        <Stack gap="large"><Text size="md">{preview.description}</Text><Text size="sm" color="secondary">Owner: {preview.owner}</Text>{preview.document ? <TemplateDocumentPages template={preview} /> : <Text size="sm">This template has no document preview. Use it to prepare a new envelope.</Text>}</Stack>
      </Modal>}
    </Stack>
  );
}

interface HomeCreationData {
  title: string;
  recipient: string;
  description: string;
  files: File[];
  signingOrder: boolean;
  recipients: EnvelopeRecipient[];
}

interface EnvelopeRecipient {
  id: number;
  name: string;
  email: string;
  role: string;
  emailDelivery: boolean;
}

interface LocalEnvelopeDraft extends Agreement {
  details: HomeCreationData;
}

const INITIAL_HOME_DRAFT: LocalEnvelopeDraft = {
  id: 'draft-first-pixel-support', name: 'Northstar — Support Services Addendum', recipient: 'To: Northstar',
  status: 'Draft', statusIcon: 'clock', statusKind: 'neutral', date: '10/26/2026', time: '9:00 AM', action: 'Edit',
  details: {
    title: 'Northstar — Support Services Addendum', recipient: 'Northstar',
    description: 'Extend support for the product experience, reusable components, and launch handoff. Prepared by Akshat Mishra.',
    files: [], signingOrder: false,
    recipients: [{ id: 1, name: 'Northstar', email: '', role: 'Needs to Sign', emailDelivery: true }],
  },
};

function HomeCreationDialog({ kind, initialFiles, initialData, onClose, onSave }: {
  kind: 'envelope' | 'request';
  initialFiles: File[];
  initialData?: HomeCreationData;
  onClose: () => void;
  onSave: (data: HomeCreationData) => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? initialFiles[0]?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [files, setFiles] = useState(initialFiles);
  const [submitted, setSubmitted] = useState(false);
  const [signingOrder, setSigningOrder] = useState(initialData?.signingOrder ?? false);
  const [envelopeRecipients, setEnvelopeRecipients] = useState<EnvelopeRecipient[]>(initialData?.recipients ?? [{ id: 1, name: '', email: '', role: 'Needs to Sign', emailDelivery: true }]);
  const [reviewingEnvelope, setReviewingEnvelope] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const updateEnvelopeRecipient = (id: number, updates: Partial<{ name: string; email: string; role: string; emailDelivery: boolean }>) => {
    setEnvelopeRecipients(current => current.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const save = () => {
    setSubmitted(true);
    if (!title.trim()) {
      if (kind === 'envelope') setReviewingEnvelope(true);
      return;
    }
    const savedRecipient = kind === 'envelope'
      ? envelopeRecipients.map(item => [item.name.trim(), item.email.trim()].filter(Boolean).join(' — ')).filter(Boolean).join('; ')
      : '';
    onSave({ title: title.trim(), recipient: savedRecipient, description: description.trim(), files, signingOrder, recipients: envelopeRecipients });
  };
  if (kind === 'envelope') {
    const addRecipient = () => setEnvelopeRecipients(current => [...current, { id: Math.max(0, ...current.map(item => item.id)) + 1, name: '', email: '', role: 'Needs to Sign', emailDelivery: true }]);
    return (
      <Modal
        open
        onClose={onClose}
        title="Upload a Document and Add Envelope Recipients"
        className="envelope-composer"
        closeOnBackdropClick={false}
        footer={
          <Inline justify="between" gap="medium" style={{ width: '100%' }}>
            <Button kind="tertiary" onClick={save}>Save draft</Button>
            <Inline gap="small">
              {reviewingEnvelope ? (
                <>
                  <Button kind="secondary" onClick={() => setReviewingEnvelope(false)}>Back</Button>
                  <Button kind="primary" onClick={save}>Save draft</Button>
                </>
              ) : (
                <>
                  <Button kind="secondary" menuTrigger disabled>Send Now</Button>
                  <Button kind="primary" onClick={() => { setSubmitted(true); setReviewingEnvelope(true); }}>Next</Button>
                </>
              )}
            </Inline>
          </Inline>
        }
      >
        <Inline className="envelope-composer-tools" gap="small">
          <IconButton icon="help" aria-label="Help" disabled />
          <Button kind="secondary" disabled>Advanced Options</Button>
        </Inline>
        <Container size="medium" padded={false} className="envelope-composer-content">
          {reviewingEnvelope ? (
            <Stack gap="large">
              <Heading level={2} className="envelope-composer-review-heading">Review draft</Heading>
              <Banner kind="information" closable={false} lineWrap>Review the documents, recipients, and message before saving your draft.</Banner>
              <Input label="Subject" required value={title} onChange={event => setTitle(event.target.value)} error={submitted && !title.trim() ? 'Enter a subject to save your draft.' : undefined} />
              <Stack gap="small">
                <Text size="sm" weight="semibold">Documents</Text>
                <Text size="sm">{files.length ? files.map(file => file.name).join(', ') : 'No documents added'}</Text>
              </Stack>
              <Stack gap="small">
                <Text size="sm" weight="semibold">Recipients</Text>
                {envelopeRecipients.map((item, index) => <Text key={item.id} size="sm">{signingOrder ? `${index + 1}. ` : ''}{[item.name, item.email].filter(Boolean).join(' — ') || 'No recipient details added'} · {item.role}</Text>)}
              </Stack>
              <Text size="sm" color="secondary">{description || 'No message added'}</Text>
            </Stack>
          ) : (
            <Accordion
              className="envelope-composer-sections"
              allowMultiple
              defaultOpenItems={['envelope-documents', 'envelope-recipients', 'envelope-message']}
              itemHeight="tall"
              items={[
                {
                  id: 'envelope-documents',
                  title: 'Add documents',
                  noPadding: true,
                  content: (
                    <Stack gap="medium" className="envelope-composer-section-body">
                      <Stack gap="none" className="envelope-composer-upload">
                        <FileUpload
                          ref={uploadRef}
                          showFileList={false}
                          primaryAction={<Button kind="primary" menuTrigger onClick={() => uploadRef.current?.click()}>Upload</Button>}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          placeholder="Drop your files here or"
                          onFilesSelect={selected => {
                            setFiles(current => [...current, ...selected]);
                            if (!title && selected[0]) setTitle(selected[0].name);
                          }}
                        />
                      </Stack>
                      {files.length > 0 && <Stack gap="small">{files.map((file, index) => (
                        <Inline key={`${file.name}-${index}`} justify="between" gap="small">
                          <Inline gap="small"><Icon name="document" size="small" /><Text size="sm">{file.name}</Text></Inline>
                          <IconButton icon="trash" size="small" aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter((_, fileIndex) => fileIndex !== index))} />
                        </Inline>
                      ))}</Stack>}
                    </Stack>
                  ),
                },
                {
                  id: 'envelope-recipients',
                  title: 'Add recipients',
                  noPadding: true,
                  content: (
                    <Stack gap="large" className="envelope-composer-section-body envelope-composer-recipients">
                      <Inline gap="large" wrap>
                        <Checkbox label="Set signing order" checked={signingOrder} onChange={event => setSigningOrder(event.target.checked)} />
                        <Button kind="tertiary" size="small" disabled>View</Button>
                        <Button kind="tertiary" size="small" disabled>Bulk send</Button>
                      </Inline>
                      {envelopeRecipients.map((item, index) => (
                        <Card key={item.id} radius="small" className="envelope-composer-recipient">
                          <Stack gap="medium" style={{ padding: 'var(--ink-spacing-300)' }}>
                            <Inline justify="between" gap="medium" wrap>
                              <Text size="sm" color="secondary">{signingOrder ? `Signing order ${index + 1}` : ' '}</Text>
                              <Inline gap="large">
                                <Dropdown variant="solid" items={[
                                  { label: 'Needs to Sign', onClick: () => updateEnvelopeRecipient(item.id, { role: 'Needs to Sign' }) },
                                  { label: 'Receives a Copy', onClick: () => updateEnvelopeRecipient(item.id, { role: 'Receives a Copy' }) },
                                ]}>
                                  <Button kind="tertiary" startElement={<Icon name="pencil" size="small" />} menuTrigger>{item.role}</Button>
                                </Dropdown>
                                <Button kind="tertiary" menuTrigger disabled>Customize</Button>
                                <IconButton icon="trash" aria-label={`Remove recipient ${index + 1}`} disabled={envelopeRecipients.length === 1} onClick={() => setEnvelopeRecipients(current => current.filter(entry => entry.id !== item.id))} />
                              </Inline>
                            </Inline>
                            <Input label="Name" required value={item.name} onChange={event => updateEnvelopeRecipient(item.id, { name: event.target.value })} />
                            <Stack gap="small">
                              <Text size="sm">Delivery *</Text>
                              <Inline gap="large" wrap>
                                <Checkbox label="Email" checked={item.emailDelivery} onChange={event => updateEnvelopeRecipient(item.id, { emailDelivery: event.target.checked })} />
                                <Checkbox label="SMS (Text)" disabled />
                                <Checkbox label="WhatsApp" disabled />
                                <Icon name="info" size="small" />
                              </Inline>
                            </Stack>
                            <Input label="Email" required type="email" hideLabel placeholder="Email *" disabled={!item.emailDelivery} value={item.email} onChange={event => updateEnvelopeRecipient(item.id, { email: event.target.value })} />
                          </Stack>
                        </Card>
                      ))}
                      <Inline gap="small">
                        <ComboButton variant="secondary" startIcon="person-plus" onClick={addRecipient} onDropdownClick={addRecipient}>Add Recipient</ComboButton>
                        <Button kind="tertiary" startElement={<Icon name="plus" size="small" />} disabled>Add Delay</Button>
                      </Inline>
                    </Stack>
                  ),
                },
                {
                  id: 'envelope-custom-fields',
                  title: 'Add envelope custom fields',
                  noPadding: true,
                  content: <Stack gap="medium" className="envelope-composer-section-body"><Text size="sm" color="secondary">No custom fields configured.</Text></Stack>,
                },
                {
                  id: 'envelope-message',
                  title: 'Add message',
                  noPadding: true,
                  content: (
                    <Stack gap="large" className="envelope-composer-section-body">
                      <Input label="Subject" required value={title} onChange={event => setTitle(event.target.value)} error={submitted && !title.trim() ? 'Enter a subject to save your draft.' : undefined} />
                      <TextArea label="Message" value={description} onChange={event => setDescription(event.target.value)} rows={4} />
                    </Stack>
                  ),
                },
              ]}
            />
          )}
        </Container>
      </Modal>
    );
  }
  return (
    <Modal open onClose={onClose} title="Create Request" footer={
      <Inline justify="end" gap="small">
        <Button kind="secondary" onClick={onClose}>Cancel</Button>
        <Button kind="primary" onClick={save}>Create Request</Button>
      </Inline>
    }>
      <Stack gap="large">
        <Input label="Request title" required value={title} onChange={event => setTitle(event.target.value)} error={submitted && !title.trim() ? 'Enter a name to continue.' : undefined} />
        <TextArea label="Description" value={description} onChange={event => setDescription(event.target.value)} rows={4} />
      </Stack>
    </Modal>
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
      <text x="50%" y="48%" textAnchor="middle" style={{ fontSize: "var(--ink-font-heading-xs-size)", fontWeight: "var(--ink-font-weight-bold)", fill: 'var(--ink-font-default)' }}>{total}</text>
      <text x="50%" y="60%" textAnchor="middle" style={{ fontSize: "var(--ink-font-detail-s-size)", fill: 'var(--ink-font-secondary)' }}>{totalLabel}</text>
    </svg>
  );
}

/* Bordered card used across the Insights Overview (square corners, hairline border) */
function OvCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <Card noPadding radius="medium" style={{ border: 'var(--ink-border-width-xs) solid var(--ink-border-subtle)', ...style }}>
      {children}
    </Card>
  );
}

function OvSectionHeading({ children }: { children: React.ReactNode }) {
  return <Heading level={2} style={{ fontSize: "var(--ink-font-heading-xs-size)", fontWeight: "var(--ink-font-weight-medium)", color: 'var(--ink-font-default)', margin: 0 }}>{children}</Heading>;
}

const OV_TEAL = 'var(--ink-cyan-70)';
const OV_PURPLE = 'var(--ink-cobalt-110)';

function InsightsOverview({ reports, search, onSearchChange, onOpen, onNavigate, onCreate, onSave }: {
  reports: ReportItem[]; search: string; onSearchChange: (value: string) => void; onOpen: (item: ReportItem) => void;
  onNavigate: (view: InsightsSidebarView) => void; onCreate: (kind: 'report' | 'dashboard') => void; onSave: (name: string) => void;
}) {
  const openName = (name: string) => onOpen(reports.find(item => item.name === name) ?? { id: `suggested-${name}`, name, description: 'Agreement portfolio analysis for your team.', type: 'report', category: 'custom', owner: 'Akshat Mishra', lastViewed: '', shared: false });
  const recents = reports.filter(item => item.lastViewed && item.category === 'custom' && item.type === 'report').slice(0, 5);
  const starred = reports.filter(item => item.starred);
  const suggested = [
    { name: 'Average Total Contract Value by Line of Business', meta: 'Aggregation: Average · Measure: Total Contract Value · Group by: Line of Business', data: [85, 16, 2.8, 0.032], labels: ['SALES', 'Empty', 'HR', 'PROCUREMENT'] },
    { name: 'Count of Agreements by Status', meta: 'Aggregation: Count · Measure: Agreements · Group by: Status', data: [1993, 621, 92], labels: ['Active', 'Inactive', 'Empty'] },
    { name: 'Count of Agreements by Location', meta: 'Aggregation: Count · Measure: Agreements · Group by: Location', data: [2704, 1, 1], labels: ['Empty', 'San Francisco', 'Chicago'] },
  ];
  const reportLink = (name: string) => <Link href="#insights" kind="subtle" size="small" discrete onClick={event => { event.preventDefault(); openName(name); }}>{name}</Link>;
  return <Container size="full" style={{ padding: 'var(--ink-spacing-400) var(--ink-spacing-600)' }}><Stack gap="large">
    <PageHeader title="Overview" />
    <SearchInput aria-label="Find reports or dashboards" placeholder="Find reports or dashboards" size="medium" value={search} onChange={onSearchChange} />
    {search ? <Stack gap="medium"><OvSectionHeading>Search results</OvSectionHeading><OvCard><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>{reports.filter(item => `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())).map(item => <Inline key={item.id} gap="small"><Icon name={item.type === 'dashboard' ? 'layout-grid' : 'chart-bar'} size="small" />{reportLink(item.name)}</Inline>)}</Stack></OvCard></Stack> : <Grid columns={2} gap="large" className="insights-live-recents-grid">
      <Stack gap="medium"><OvSectionHeading>Your Recents</OvSectionHeading><OvCard style={{ height: '100%' }}><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>{recents.map(item => <Inline key={item.id} justify="between" gap="medium" style={{ paddingBlock: 'var(--ink-spacing-100)' }}><Inline gap="small"><Icon name="chart-bar" size="small" />{reportLink(item.name)}</Inline><Text size="xs" color="secondary">viewed today</Text></Inline>)}<Button kind="tertiary" fullWidth onClick={() => onNavigate('reports')}>View all</Button></Stack></OvCard></Stack>
      <Stack gap="medium"><OvSectionHeading>Your Starred</OvSectionHeading><OvCard style={{ height: '100%' }}><Stack gap="large" style={{ padding: 'var(--ink-spacing-300)' }}>{starred.map(item => <Inline key={item.id} gap="small"><Icon name={item.type === 'dashboard' ? 'layout-grid' : 'chart-bar'} size="small" />{reportLink(item.name)}</Inline>)}{starred.length === 0 && <Text size="sm" color="secondary">Star reports to keep them close.</Text>}</Stack></OvCard></Stack>
    </Grid>}
    <Stack gap="medium"><Inline gap="medium"><OvSectionHeading>Suggested Reports</OvSectionHeading><Badge kind="promo" text="Beta" /></Inline><Text size="md">AI Generated Recommendations</Text>
      <Grid columns={2} gap="large">{suggested.map((item, index) => <OvCard key={item.name}><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}><Inline justify="between" gap="medium">{reportLink(item.name)}<Button kind="primary" size="small" onClick={() => onSave(item.name)}>{reports.some(report => report.name === item.name && report.starred) ? 'Saved' : 'Save'}</Button></Inline><Divider /><Text size="xs" color="secondary">{item.meta}</Text>
        {index === 1 ? <Inline gap="large" justify="center"><InsightsDonut total="2,706" segments={[{ value: 1993, color: OV_TEAL }, { value: 621, color: OV_PURPLE }, { value: 92, color: 'var(--ink-purple-60)' }]} /><Stack gap="medium"><Text size="sm">Active · 2K</Text><Text size="sm">Inactive · 621</Text><Text size="sm">Empty · 92</Text></Stack></Inline> : <BarChart data={item.data} color={OV_TEAL} height={200} showValues xLabels={item.labels.map((text, labelIndex) => ({ index: labelIndex, text }))} xAxisTitle={index === 0 ? 'Line of Business' : 'Location'} aria-label={item.name} />}
      </Stack></OvCard>)}</Grid>
    </Stack>
    <Stack gap="medium"><OvSectionHeading>Weekly Insights</OvSectionHeading><Grid columns={2} gap="large">{[{ name: 'All agreements', value: '2,706' }, { name: 'New agreements ingested', value: '11' }, { name: 'Expiring agreements', value: '1,713' }].map(item => <OvCard key={item.name}><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>{reportLink(item.name)}<Stack gap="small" align="center" style={{ paddingBlock: 'var(--ink-spacing-400)' }}><Text size="sm" color="secondary">Count</Text><Text weight="bold" style={{ fontSize: 'var(--ink-font-display-xs-size)' }}>{item.value}</Text><Text size="md">Agreements</Text></Stack></Stack></OvCard>)}<OvCard><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>{reportLink('Upcoming renewals')}<BarChart data={[2, 8, 21, 16, 41, 22, 7, 19]} color={OV_PURPLE} height={200} showValues={false} xLabels={[{ index: 0, text: 'Oct 26' }, { index: 4, text: 'Nov 26' }, { index: 7, text: 'Jan 27' }]} aria-label="Upcoming renewals" /></Stack></OvCard></Grid></Stack>
    <Stack gap="medium"><Inline justify="between"><OvSectionHeading>Review your agreements</OvSectionHeading><Button kind="secondary" onClick={() => onNavigate('agreements-dashboard')}>View Agreements Dashboard</Button></Inline><Grid columns={2} gap="large">{['Upcoming renewals', 'Agreement types'].map((name, index) => <OvCard key={name}><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}>{reportLink(name)}<Text size="xs" color="secondary">Aggregation: Count · Measure: Agreements</Text><BarChart data={index === 0 ? [7, 11, 24, 17, 32, 14] : [2305, 93, 29, 29, 23, 166]} color={index === 0 ? OV_PURPLE : OV_TEAL} height={200} showValues={false} xLabels={[{ index: 0, text: index === 0 ? 'Oct 26' : 'MSA' }, { index: 5, text: index === 0 ? 'Mar 27' : 'Other' }]} aria-label={name} /></Stack></OvCard>)}</Grid></Stack>
    <Stack gap="medium"><OvSectionHeading>Explore Docusign Insights</OvSectionHeading><Grid columns={4} gap="medium">{[
      { title: 'Review Upcoming Renewals', desc: 'Discover key metrics on your agreements', image: 'insights-explore-renewal.svg', action: () => onNavigate('renewals-dashboard'), label: 'Review' },
      { title: 'Review Envelope Dashboard', desc: 'Discover key metrics on your envelopes', image: 'insights-explore-envelope.svg', action: () => onNavigate('admin-dashboard'), label: 'Review' },
      { title: 'Create custom dashboards', desc: 'Customize your dashboard to fit your needs', image: 'insights-explore-dashboards.svg', action: () => onCreate('dashboard'), label: 'Create' },
      { title: 'Create custom reports', desc: 'Customize your reports to fit your needs', image: 'insights-explore-reports.svg', action: () => onCreate('report'), label: 'Create' },
    ].map(item => <OvCard key={item.title}><Stack gap="medium" align="center" style={{ padding: 'var(--ink-spacing-200)', height: '100%', textAlign: 'center' }}><img src={`${import.meta.env.BASE_URL}${item.image}`} alt="" style={{ height: 'var(--ink-spacing-700)' }} /><Text size="sm" weight="semibold">{item.title}</Text><Text size="xs" color="secondary" style={{ flex: 1 }}>{item.desc}</Text><Button kind="secondary" size="small" onClick={item.action}>{item.label}</Button></Stack></OvCard>)}</Grid></Stack>
    <Stack gap="medium"><OvSectionHeading>Resources</OvSectionHeading><Link size="small" href="https://community.docusign.com/ideas" target="_blank">Suggest a feature</Link><Link size="small" href="https://support.docusign.com/s/document-item?bundleId=cnu1642812012214&topicId=wou1578456440763.html&language=en_US" target="_blank">eSignature Report Help Docs</Link><Link size="small" href="https://support.docusign.com/s/document-item?bundleId=pqz1702943441912&topicId=jyq1749000353004.html&language=en_US" target="_blank">Agreement dashboard Help Docs</Link></Stack>
  </Stack></Container>;
}

function InsightCreateDialog({ kind, onClose, onSave }: { kind: 'report' | 'dashboard'; onClose: () => void; onSave: (name: string, description: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <Modal open onClose={onClose} title={`Create ${kind}`} footer={<Inline justify="end" gap="small"><Button kind="secondary" onClick={onClose}>Cancel</Button><Button kind="primary" onClick={() => { setSubmitted(true); if (name.trim()) onSave(name.trim(), description.trim()); }}>Create</Button></Inline>}><Stack gap="medium"><Input label="Name" required value={name} onChange={event => setName(event.target.value)} error={submitted && !name.trim() ? 'Enter a name.' : undefined} /><TextArea label="Description" value={description} onChange={event => setDescription(event.target.value)} rows={3} /></Stack></Modal>;
}

function InsightsPage({ view, onNavigate, reports, onReportsChange, creator, onCreatorChange, search, onSearchChange }: {
  view: InsightsSidebarView; onNavigate: (view: InsightsSidebarView) => void; reports: ReportItem[]; onReportsChange: React.Dispatch<React.SetStateAction<ReportItem[]>>;
  creator: 'report' | 'dashboard' | null; onCreatorChange: (kind: 'report' | 'dashboard' | null) => void; search: string; onSearchChange: (value: string) => void;
}) {
  const [reportTab, setReportTab] = useState<InsightReportTab>('recents');
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [period, setPeriod] = useState('Last 30 days');
  const [scheduleReport, setScheduleReport] = useState<ReportItem | null>(null);
  const [frequency, setFrequency] = useState('Weekly');
  const [notice, setNotice] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const navigate = (next: InsightsSidebarView) => { onSearchChange(''); onNavigate(next); };
  const open = (item: ReportItem) => {
    if (item.type === 'dashboard') {
      setActiveDashboardId(item.id);
      navigate(item.id === 'dashboard-renewals' ? 'renewals-dashboard' : item.id === 'dashboard-agreements' ? 'agreements-dashboard' : 'custom-dashboard');
      return;
    }
    setActiveReport(item);
    onReportsChange(current => current.map(report => report.id === item.id ? { ...report, lastViewed: new Date().toLocaleDateString('en-US') } : report));
  };
  const saveSuggested = (name: string) => {
    onReportsChange(current => current.some(item => item.name === name) ? current.map(item => item.name === name ? { ...item, starred: true } : item) : [{ id: crypto.randomUUID(), name, description: 'Saved agreement analysis.', type: 'report', category: 'custom', owner: 'Akshat Mishra', lastViewed: '', shared: false, starred: true }, ...current]);
    setNotice(`“${name}” was added to Your Starred.`);
  };
  const copy = (item: ReportItem) => { onReportsChange(current => [{ ...item, id: crypto.randomUUID(), name: `${item.name} (copy)`, category: 'custom', owner: 'Akshat Mishra', schedule: undefined, lastViewed: '' }, ...current]); setNotice(`A copy of “${item.name}” was added to Custom reports.`); };
  const tableReports = reports.filter(item => item.type === 'report' && (reportTab === 'recents' ? !!item.lastViewed : reportTab === 'all-envelope' ? ['envelope', 'recipient', 'usage'].includes(item.category) : item.category === reportTab) && (!search || `${item.name} ${item.description} ${item.owner}`.toLowerCase().includes(search.toLowerCase())));
  const actionColumn: DataTableColumn<ReportItem> = { key: 'actions', header: 'Actions', alignment: 'right', cell: item => <Inline justify="end" gap="small"><Button kind="primary" size="small" onClick={event => { event.stopPropagation(); open(item); }}>View</Button><Dropdown align="end" items={[{ label: item.starred ? 'Remove star' : 'Star report', onClick: () => onReportsChange(current => current.map(report => report.id === item.id ? { ...report, starred: !report.starred } : report)) }, { label: 'Schedule', onClick: () => { setFrequency(item.schedule ?? 'Weekly'); setScheduleReport(item); } }, { label: 'Create a copy', onClick: () => copy(item) }]}><IconButton icon="overflow-vertical" size="small" variant="tertiary" aria-label={`More actions for ${item.name}`} onClick={event => event.stopPropagation()} /></Dropdown></Inline> };
  const columns: DataTableColumn<ReportItem>[] = reportTab === 'recents' ? [
    { key: 'name', header: 'Name', sortable: true, cell: item => <Link href="#insights" kind="subtle" size="small" discrete onClick={event => { event.preventDefault(); event.stopPropagation(); open(item); }}>{item.name}</Link> },
    { key: 'owner', header: 'Owner', sortable: true }, { key: 'lastViewed', header: 'Last accessed', sortable: true }, actionColumn,
  ] : [
    { key: 'name', header: 'Name', cell: item => <Stack gap="none"><Text size="sm" weight="semibold">{item.name}</Text><Text size="sm" color="secondary">{item.description}</Text></Stack> },
    { key: 'schedule', header: 'Schedule', cell: item => <Text size="sm">{item.schedule ?? ''}</Text> }, actionColumn,
  ];
  const tabs: Array<{ id: InsightReportTab; label: string }> = [{ id: 'recents', label: 'Recents' }, { id: 'all-envelope', label: 'All Envelope' }, { id: 'envelope', label: 'Envelope' }, { id: 'recipient', label: 'Recipient' }, { id: 'usage', label: 'Usage' }, { id: 'custom', label: 'Custom' }, { id: 'downloads', label: 'Downloads' }, { id: 'web-forms', label: 'Web forms' }];
  const isMyDashboard = view === 'my-dashboard';
  const customDashboard = reports.find(item => item.id === activeDashboardId && item.type === 'dashboard') ?? reports.find(item => item.type === 'dashboard' && !item.id.startsWith('dashboard-'));
  const dashboardTitle = view === 'custom-dashboard' ? customDashboard?.name ?? INSIGHTS_VIEW_LABELS[view] : INSIGHTS_VIEW_LABELS[view];
  const dashboardRows = AGREEMENTS_DATA.slice(0, 5);
  const dashboardColumns: DataTableColumn<Agreement>[] = [{ key: 'name', header: 'Agreement' }, { key: 'recipient', header: 'Recipient' }, { key: 'status', header: 'Status', cell: item => <Badge kind={item.status === 'Completed' ? 'success' : 'subtle'} text={item.status} /> }, { key: 'date', header: 'Last activity' }];
  let content: React.ReactNode;
  if (view === 'overview') content = <InsightsOverview reports={reports} search={search} onSearchChange={onSearchChange} onOpen={open} onNavigate={navigate} onCreate={onCreatorChange} onSave={saveSuggested} />;
  else if (view === 'reports') content = <AgreementTableView paddingVariant="compact" pageHeader={<PageHeader title="Reports" />} filterBar={<SearchInput aria-label="Find reports" placeholder="Find reports" size="medium" value={search} onChange={value => { onSearchChange(value); setPage(1); }} />}><Tabs value={reportTab} onChange={id => { setReportTab(id as InsightReportTab); setPage(1); }} tabs={tabs.map(tab => ({ ...tab, label: tab.id === 'web-forms' ? tab.label : `${tab.label} (${reports.filter(item => item.type === 'report' && (tab.id === 'recents' ? !!item.lastViewed : tab.id === 'all-envelope' ? ['envelope', 'recipient', 'usage'].includes(item.category) : item.category === tab.id)).length})`, content: <DataTable key={reportTab} columns={columns} data={tableReports.slice((page - 1) * pageSize, page * pageSize)} getRowKey={item => item.id} stickyHeader showColumnControl rowHeight="tall" onRowClick={open} emptyMessage="No reports match your search" pagination={{ page, pageSize, totalItems: tableReports.length, onPageChange: setPage, onPageSizeChange: size => { setPageSize(size); setPage(1); }, showInfo: true }} /> }))} /></AgreementTableView>;
  else content = <Container size="full" style={{ padding: 'var(--ink-spacing-500)' }}><Stack gap="large">
    <Banner kind="promo" icon="megaphone">Get ready for a better reporting experience! We’re rolling out updates to make your reports easier to find and manage.</Banner>
    <PageHeader title={dashboardTitle} actions={<Tooltip content="Data is refreshed within the last 24 hours."><IconButton icon="info" aria-label="About dashboard data" onClick={() => setInfoOpen(true)} /></Tooltip>} />
    {isMyDashboard ? <><OvSectionHeading>Docusign’s environmental impact</OvSectionHeading><OvCard><Stack gap="large" style={{ padding: 'var(--ink-spacing-300)' }}><Text size="sm">All Time</Text>{[
      { label: '7,885,939,343 lb of carbon emissions reduced', value: 79 }, { label: '9,892,420,952 gal of water conserved', value: 99 },
      { label: '3,359,690,134 lb of wood saved', value: 34 }, { label: '545,949,646 lb of waste eliminated', value: 6 },
    ].map(item => <Stack key={item.label} gap="medium"><Divider /><Text size="md" weight="semibold">{item.label}</Text><ProgressBar kind="success" value={item.value} label={item.label} showLabel={false} /></Stack>)}<Button kind="tertiary" onClick={() => setInfoOpen(true)}>How is this calculated?</Button></Stack></OvCard><Card variant="secondary" radius="medium"><Card.Header><OvSectionHeading>This compares to:</OvSectionHeading></Card.Header><Card.Body><Stack gap="medium"><Text size="sm">Removing 716,057 cars from the road</Text><Text size="sm">Skipping 7,137,388 loads of laundry</Text><Text size="sm">Conserving 10,079,070 trees</Text><Link href="https://www.docusign.com/forests" target="_blank" size="small">Learn how to save more</Link></Stack></Card.Body></Card></> : <>
      <Grid columns={3} gap="medium">{[{ label: view === 'procurement-hub' ? 'Active suppliers' : 'Active agreements', value: view === 'procurement-hub' ? '48' : '1,993' }, { label: view.includes('renewals') || view === 'dashboards' ? 'Renewals this quarter' : 'Awaiting action', value: '42' }, { label: view === 'ai-usage-dashboard' ? 'Assistant conversations' : 'Completed this month', value: view === 'ai-usage-dashboard' ? '128' : '86' }].map(item => <OvCard key={item.label}><Stack gap="small" style={{ padding: 'var(--ink-spacing-300)' }}><Text size="sm" color="secondary">{item.label}</Text><Text size="xl" weight="semibold">{item.value}</Text></Stack></OvCard>)}</Grid>
      <Grid columns={2} gap="medium"><OvCard><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}><OvSectionHeading>{view === 'procurement-hub' ? 'Procurement activity' : `${INSIGHTS_VIEW_LABELS[view]} activity`}</OvSectionHeading><BarChart data={[28, 42, 35, 51, 48, 64]} color={OV_TEAL} height={220} showValues={false} xLabels={[{ index: 0, text: 'May' }, { index: 3, text: 'Aug' }, { index: 5, text: 'Oct' }]} aria-label="Dashboard activity by month" /></Stack></OvCard><OvCard><Stack gap="medium" style={{ padding: 'var(--ink-spacing-200)' }}><OvSectionHeading>Agreement status</OvSectionHeading><Inline justify="center"><InsightsDonut total="2,706" segments={[{ value: 1993, color: OV_TEAL }, { value: 621, color: OV_PURPLE }, { value: 92, color: 'var(--ink-purple-60)' }]} /></Inline><Text size="sm">1,993 Active · 621 Inactive · 92 Empty</Text></Stack></OvCard></Grid>
      <OvSectionHeading>{view === 'procurement-hub' ? 'Supplier agreements' : 'Recent agreements'}</OvSectionHeading><DataTable key={`dashboard-${view}`} columns={dashboardColumns} data={dashboardRows} getRowKey={item => item.id} stickyHeader showColumnControl emptyMessage="No agreements" pagination={{ page: 1, pageSize: 5, totalItems: dashboardRows.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
    </>}
  </Stack></Container>;
  return <Stack gap="none">
    {notice && <Banner kind="success" closable onClose={() => setNotice('')}>{notice}</Banner>}{content}
    {creator && <InsightCreateDialog kind={creator} onClose={() => onCreatorChange(null)} onSave={(name, description) => {
      const kind = creator;
      const id = crypto.randomUUID();
      onReportsChange(current => [{ id, name, description, type: kind, category: 'custom', owner: 'Akshat Mishra', lastViewed: new Date().toLocaleDateString('en-US'), shared: false }, ...current]);
      if (kind === 'dashboard') setActiveDashboardId(id);
      onCreatorChange(null); navigate(kind === 'dashboard' ? 'custom-dashboard' : 'reports'); setReportTab('custom'); setNotice(`“${name}” was created.`);
    }} />}
    {activeReport && <Modal open onClose={() => setActiveReport(null)} title={activeReport.name} size="xlarge" footer={<Inline justify="end" gap="small"><Button kind="secondary" onClick={() => { setFrequency(activeReport.schedule ?? 'Weekly'); setScheduleReport(activeReport); setActiveReport(null); }}>Schedule</Button><Button kind="primary" onClick={() => setActiveReport(null)}>Done</Button></Inline>}><Stack gap="large"><Text size="sm" color="secondary">{activeReport.description}</Text><Select label="Reporting period" value={period} onChange={event => setPeriod(event.target.value)}>{['Last 7 days', 'Last 30 days', 'This year'].map(value => <option key={value} value={value}>{value}</option>)}</Select><BarChart data={period === 'Last 7 days' ? [4, 8, 5, 12, 7, 16, 8] : period === 'This year' ? [128, 174, 168, 209, 191, 231] : [28, 42, 35, 51, 48, 64]} color={OV_TEAL} height={200} showValues={false} aria-label={`${activeReport.name} for ${period}`} /><DataTable key={`report-detail-${activeReport.id}`} columns={dashboardColumns} data={dashboardRows} getRowKey={item => item.id} showColumnControl stickyHeader pagination={{ page: 1, pageSize: 5, totalItems: dashboardRows.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} /></Stack></Modal>}
    {scheduleReport && <Modal open onClose={() => setScheduleReport(null)} title={`Schedule ${scheduleReport.name}`} footer={<Inline justify="end" gap="small"><Button kind="secondary" onClick={() => setScheduleReport(null)}>Cancel</Button><Button kind="primary" onClick={() => { onReportsChange(current => current.map(item => item.id === scheduleReport.id ? { ...item, schedule: frequency } : item)); setNotice(`“${scheduleReport.name}” is scheduled ${frequency.toLowerCase()} in this prototype.`); setScheduleReport(null); }}>Save schedule</Button></Inline>}><Select label="Frequency" value={frequency} onChange={event => setFrequency(event.target.value)}>{['Daily', 'Weekly', 'Monthly'].map(value => <option key={value} value={value}>{value}</option>)}</Select></Modal>}
    {infoOpen && <Modal open onClose={() => setInfoOpen(false)} title={isMyDashboard ? 'How is this calculated?' : 'About dashboard data'} footer={<Button kind="primary" onClick={() => setInfoOpen(false)}>Done</Button>}><Text size="md">{isMyDashboard ? 'Environmental impact estimates describe the potential paper, water, wood, and emissions savings associated with digital agreements. This prototype displays representative figures from the reference dashboard.' : 'Dashboard data is displayed in UTC and refreshed within the last 24 hours. The prototype uses sample data for review.'}</Text></Modal>}
  </Stack>;
}

/* ═══════════════════════════════════════
   Templates Page — no longer used as standalone
   (rendered inline via AgreementTableView)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   Automations and Admin
   ═══════════════════════════════════════ */

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Draft' | 'Paused';
  trigger: string;
  action: string;
  lastRun: string;
  lastModified?: string;
  runs: number;
  owner: string;
}

const WORKFLOWS_DATA: Workflow[] = [
  { id: 'workflow-1', name: 'New hire onboarding', description: 'Keep offer letters and onboarding moving.', status: 'Active', trigger: 'Agreement completed', action: 'Create a task', lastRun: 'Today, 9:42 AM', runs: 128, owner: 'Akshat Mishra' },
  { id: 'workflow-2', name: 'Upcoming renewal reminders', description: 'Follow up before an agreement renews.', status: 'Active', trigger: 'Renewal approaching', action: 'Send a reminder', lastRun: 'Today, 8:00 AM', runs: 64, owner: 'Maya Patel' },
  { id: 'workflow-3', name: 'NDA review and approval', description: 'Route new requests to the legal team.', status: 'Active', trigger: 'Request submitted', action: 'Request approval', lastRun: 'Yesterday, 3:15 PM', runs: 42, owner: 'Ryan Chen' },
  { id: 'workflow-4', name: 'Sales agreement handoff', description: 'Start the next step after signature.', status: 'Paused', trigger: 'Agreement completed', action: 'Create a task', lastRun: 'Oct 16, 2026', runs: 23, owner: 'Akshat Mishra' },
  { id: 'workflow-5', name: 'Vendor agreement review', description: 'Review procurement requests in one place.', status: 'Draft', trigger: 'Request submitted', action: 'Request approval', lastRun: '—', runs: 0, owner: 'Jamie Morgan' },
];

function WorkflowDialog({ workflow, onClose, onSave, isNew = !workflow }: { workflow: Workflow | null; onClose: () => void; onSave: (workflow: Workflow) => void; isNew?: boolean }) {
  const formId = useId();
  const [name, setName] = useState(workflow?.name ?? '');
  const [description, setDescription] = useState(workflow?.description ?? '');
  const [trigger, setTrigger] = useState(workflow?.trigger ?? 'Agreement completed');
  const [action, setAction] = useState(workflow?.action ?? 'Create a task');
  const [active, setActive] = useState(workflow?.status === 'Active');
  return <Modal open onClose={onClose} title={isNew ? 'Create workflow' : 'Edit workflow'} size="medium" footer={
    <Inline gap="small" justify="end">
      <Button kind="secondary" onClick={onClose}>Cancel</Button>
      <Button kind="primary" type="submit" form={formId}>{isNew ? 'Create workflow' : 'Save changes'}</Button>
    </Inline>
  }>
    <form id={formId} onSubmit={event => {
      event.preventDefault();
      if (!name.trim()) return;
      onSave({ id: workflow?.id ?? crypto.randomUUID(), name: name.trim(), description: description.trim(), trigger, action,
        status: active ? 'Active' : workflow && workflow.status !== 'Draft' ? 'Paused' : 'Draft',
        lastRun: workflow?.lastRun ?? '—', lastModified: 'Just now', runs: workflow?.runs ?? 0, owner: workflow?.owner ?? 'Akshat Mishra' });
    }}>
      <Stack gap="large">
        <Input label="Workflow name" value={name} onChange={event => setName(event.target.value)} required maxLength={100} />
        <TextArea label="Description" value={description} onChange={event => setDescription(event.target.value)} rows={2} />
        <Select label="When this happens" value={trigger} onChange={event => setTrigger(event.target.value)}>
          {['Agreement completed', 'Renewal approaching', 'Request submitted'].map(value => <option key={value}>{value}</option>)}
        </Select>
        <Select label="Take this action" value={action} onChange={event => setAction(event.target.value)}>
          {['Create a task', 'Send a reminder', 'Request approval'].map(value => <option key={value}>{value}</option>)}
        </Select>
        <Switch label="Activate workflow" description="Active workflows are ready to run when their trigger occurs." checked={active} onChange={setActive} />
      </Stack>
    </form>
  </Modal>;
}

type AutomationView = 'agents' | 'rules' | 'workflows' | 'active-workflows' | 'draft-workflows' | 'activity' | 'workflow-templates' | 'create-workflow';
const AUTOMATION_DEFAULT_VIEW: AutomationView = 'agents';

function getAutomationSidebar(view: AutomationView, onNavigate: (view: AutomationView) => void): React.ComponentProps<typeof LocalNav> {
  return {
    className: 'automation-live-nav',
    allowCollapsibility: false,
    activeItemId: view === 'agents' || view === 'rules' ? view : 'workflows',
    sections: [{ id: 'automations', items: [
      { id: 'agents', label: 'Agents', icon: 'ai-spark', badge: 'New', onClick: () => onNavigate('agents') },
      { id: 'rules', label: 'Rules', icon: 'logic', badge: 'New', onClick: () => onNavigate('rules') },
      { id: 'workflows', label: 'Workflows', icon: 'workflow', onClick: () => onNavigate('workflows') },
    ] }],
  };
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  agreement: string;
  status: 'Completed' | 'Running' | 'Needs attention';
  started: string;
  duration: string;
}

const WORKFLOW_RUNS_DATA: WorkflowRun[] = [
  { id: 'RUN-20481', workflowId: 'workflow-1', workflowName: 'New hire onboarding', agreement: 'Consulting Agreement', status: 'Completed', started: 'Oct 22, 2026, 9:42 AM', duration: '2 min 14 sec' },
  { id: 'RUN-20480', workflowId: 'workflow-2', workflowName: 'Upcoming renewal reminders', agreement: 'Office Lease Renewal 2026', status: 'Completed', started: 'Oct 22, 2026, 8:00 AM', duration: '18 sec' },
  { id: 'RUN-20479', workflowId: 'workflow-3', workflowName: 'NDA review and approval', agreement: 'Mutual Non-Disclosure Agreement', status: 'Running', started: 'Oct 21, 2026, 3:15 PM', duration: 'Waiting for approval' },
  { id: 'RUN-20478', workflowId: 'workflow-4', workflowName: 'Sales agreement handoff', agreement: 'Acme Services Agreement', status: 'Needs attention', started: 'Oct 16, 2026, 2:30 PM', duration: '1 min 06 sec' },
  { id: 'RUN-20477', workflowId: 'workflow-1', workflowName: 'New hire onboarding', agreement: 'Employee Offer Letter', status: 'Completed', started: 'Oct 15, 2026, 10:12 AM', duration: '1 min 48 sec' },
];

const WORKFLOW_STARTER_TEMPLATES = [
  { id: 'onboarding', name: 'New hire onboarding', description: 'Create onboarding tasks when an offer letter is signed.', category: 'Human resources', trigger: 'Agreement completed', action: 'Create a task' },
  { id: 'renewals', name: 'Renewal reminders', description: 'Remind agreement owners before their renewal dates.', category: 'Operations', trigger: 'Renewal approaching', action: 'Send a reminder' },
  { id: 'nda', name: 'NDA review and approval', description: 'Route incoming NDA requests to your legal team.', category: 'Legal', trigger: 'Request submitted', action: 'Request approval' },
  { id: 'sales', name: 'Sales agreement handoff', description: 'Give your account team the next step after signature.', category: 'Sales', trigger: 'Agreement completed', action: 'Create a task' },
  { id: 'procurement', name: 'Vendor agreement review', description: 'Review new supplier requests before an agreement is sent.', category: 'Procurement', trigger: 'Request submitted', action: 'Request approval' },
  { id: 'follow-up', name: 'Customer follow-up', description: 'Create a follow-up task when a customer signs.', category: 'Customer success', trigger: 'Agreement completed', action: 'Create a task' },
];

interface AutomationAgent {
  id: string;
  name: string;
  description: string;
  status: 'Published' | 'Draft';
  owner: string;
  modified: string;
  hasDraft?: boolean;
}

const FEATURED_AUTOMATION_AGENTS: AutomationAgent[] = [
  { id: 'featured-triage', name: 'Request Triage Agent', description: 'Automatically analyzes incoming requests against your playbook and governing agreements, then routes them to the right reviewers.', status: 'Published', owner: 'Docusign', modified: '06/10/2026' },
  { id: 'featured-clause', name: 'Clause Deviation Analysis Agent', description: 'Compare legal clauses, identify key differences and review deviations from your baseline agreement.', status: 'Published', owner: 'Docusign', modified: '06/10/2026' },
  { id: 'featured-chat', name: 'Clause Deviation Chat Agent', description: 'Explore clause differences in a conversation and understand the changes that matter to your agreement.', status: 'Published', owner: 'Docusign', modified: '06/10/2026' },
];

const MY_AUTOMATION_AGENTS: AutomationAgent[] = [
  { id: 'agent-helpful', name: 'My Helpful Assistant', description: 'A helpful assistant agent for general queries.', status: 'Published', hasDraft: true, owner: 'Akshat Mishra', modified: '09/01/2026' },
  { id: 'agent-parties', name: 'Test Party Classifier Agent', description: 'Classifies a party name as Internal or External given an account name and organization name.', status: 'Published', owner: 'Maya Patel', modified: '06/02/2026' },
  { id: 'agent-search', name: 'Slim Canvas Search Agent', description: 'Determine whether a search can be answered through standard and custom agreement fields.', status: 'Draft', owner: 'Maya Patel', modified: '06/01/2026' },
  { id: 'agent-extraction-prompt', name: 'Extraction Prompt Builder', description: 'Create a ready-to-review extraction prompt for your agreement data.', status: 'Published', owner: 'Ryan Chen', modified: '05/28/2026' },
  { id: 'agent-extraction', name: 'Data Extraction Agent', description: 'Extract and organize important agreement details for your team.', status: 'Published', owner: 'Ryan Chen', modified: '05/28/2026' },
  { id: 'agent-canvas', name: 'Canvas Creation Agent', description: 'Bring agreement fields and connected data together in a canvas.', status: 'Published', owner: 'Akshat Mishra', modified: '05/28/2026' },
];

function AutomationAgentDialog({ agent, isNew, onClose, onSave }: { agent: AutomationAgent | null; isNew: boolean; onClose: () => void; onSave: (agent: AutomationAgent) => void }) {
  const formId = useId();
  const [name, setName] = useState(agent?.name ?? '');
  const [description, setDescription] = useState(agent?.description ?? '');
  const [published, setPublished] = useState(!isNew && agent?.status === 'Published');
  return <Modal open title={isNew ? 'Create agent' : 'Edit agent'} size="medium" onClose={onClose} footer={<Inline justify="end" gap="small"><Button kind="secondary" onClick={onClose}>Cancel</Button><Button kind="primary" type="submit" form={formId}>{isNew ? 'Create agent' : 'Save changes'}</Button></Inline>}>
    <form id={formId} onSubmit={event => { event.preventDefault(); if (!name.trim()) return; onSave({ id: isNew ? crypto.randomUUID() : agent!.id, name: name.trim(), description: description.trim(), status: published ? 'Published' : 'Draft', owner: isNew ? 'Akshat Mishra' : agent!.owner, modified: '10/22/2026' }); }}>
      <Stack gap="large"><Input label="Agent name" value={name} onChange={event => setName(event.target.value)} required maxLength={100} /><TextArea label="Description" value={description} onChange={event => setDescription(event.target.value)} rows={4} /><Switch label="Publish agent" description="Published agents are available for your team to use." checked={published} onChange={setPublished} /></Stack>
    </form>
  </Modal>;
}

function AutomationAgentCard({ agent, featured = false, onOpen, onDuplicate, onToggleStatus }: { agent: AutomationAgent; featured?: boolean; onOpen: () => void; onDuplicate?: () => void; onToggleStatus?: () => void }) {
  return <Card className="automation-live-agent-card"><Card.Body style={{ padding: 'var(--ink-spacing-250)' }}><Stack gap="medium">
    <Inline gap="medium" align="start"><Icon name="ai-spark" /><Stack gap="small" style={{ minWidth: 0, flex: 1 }}><Link href="#automations" kind="subtle" discrete onClick={event => { event.preventDefault(); onOpen(); }} className="automation-live-agent-name">{agent.name}</Link><Inline gap="small"><Badge kind={agent.status === 'Published' ? 'success' : 'subtle'} text={agent.status} />{agent.hasDraft && <Badge kind="subtle" text="Draft" />}</Inline></Stack><Dropdown align="end" variant="solid" items={featured ? [{ label: 'Use agent', onClick: onOpen }] : [{ label: 'Edit agent', onClick: onOpen }, { label: agent.status === 'Published' ? 'Unpublish' : 'Publish', onClick: onToggleStatus }, { label: 'Duplicate', onClick: onDuplicate }]}><IconButton icon="overflow-horizontal" size="small" variant="tertiary" aria-label={`Agent menu, ${agent.name}`} /></Dropdown></Inline>
    <Text size="sm" className="automation-live-agent-description">{agent.description}</Text>
    <Inline gap="small" align="center" style={{ paddingTop: 'var(--ink-spacing-200)' }}><Text size="xs" color="secondary">{featured ? 'Created by Docusign' : `Last modified: ${agent.modified}`}</Text>{!featured && <Avatar initials={agent.owner.split(' ').map(part => part[0]).join('')} alt={agent.owner} size="xsmall" />}</Inline>
  </Stack></Card.Body></Card>;
}

function AutomationAgentsPage({ agents, onChange }: { agents: AutomationAgent[]; onChange: React.Dispatch<React.SetStateAction<AutomationAgent[]>> }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [creator, setCreator] = useState('Anyone');
  const [date, setDate] = useState('Any date');
  const [layout, setLayout] = useState<'tiles' | 'list'>('tiles');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ agent: AutomationAgent | null; isNew: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const filtered = agents.filter(agent => `${agent.name} ${agent.description}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All statuses' || agent.status === status || (status === 'Draft' && agent.hasDraft)) && (creator === 'Anyone' || agent.owner === creator) && (date === 'Any date' || agent.modified === '10/22/2026'));
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 6)));
  const openAgent = (agent: AutomationAgent, isNew = false) => { setShowAllFeatured(false); setEditor({ agent, isNew }); };
  const duplicate = (agent: AutomationAgent) => { onChange(rows => [{ ...agent, id: crypto.randomUUID(), name: `${agent.name} (copy)`, status: 'Draft', hasDraft: false, owner: 'Akshat Mishra', modified: '10/22/2026' }, ...rows]); setNotice('Agent duplicated as a draft.'); setPage(1); };
  const toggleStatus = (agent: AutomationAgent) => onChange(rows => rows.map(row => row.id === agent.id ? { ...row, status: row.status === 'Published' ? 'Draft' : 'Published', hasDraft: false, modified: '10/22/2026' } : row));
  const agentColumns: DataTableColumn<AutomationAgent>[] = [
    { key: 'name', header: 'Name', sortable: true, cell: agent => <Link href="#automations" kind="subtle" onClick={event => { event.preventDefault(); openAgent(agent); }}>{agent.name}</Link> },
    { key: 'status', header: 'Status', cell: agent => <Badge kind={agent.status === 'Published' ? 'success' : 'subtle'} text={agent.status} /> },
    { key: 'modified', header: 'Last modified' }, { key: 'owner', header: 'Created by' },
    { key: 'actions', header: 'Actions', alignment: 'right', cell: agent => <Button kind="tertiary" size="small" onClick={() => openAgent(agent)}>Edit</Button> },
  ];
  return <Stack gap="large" className="automation-live-page">
    <PageHeader title="Agents" actions={<Button kind="primary" onClick={() => setEditor({ agent: null, isNew: true })}>Create New</Button>} />
    <Text size="sm" color="secondary">AI agents let you move agreements forward with confidence by identifying relevant tasks, surfacing key agreement data, and helping you take the right next step.</Text>
    {notice && <Banner kind="success" onClose={() => setNotice('')}>{notice}</Banner>}
    <Inline justify="between" align="center"><Text size="md" weight="medium">Featured</Text><Link href="#automations" onClick={event => { event.preventDefault(); setShowAllFeatured(true); }}>Show All</Link></Inline>
    <Grid columns={3} gap="medium" className="automation-live-agent-grid automation-live-featured-grid">{FEATURED_AUTOMATION_AGENTS.map(agent => <AutomationAgentCard key={agent.id} agent={agent} featured onOpen={() => openAgent(agent, true)} />)}</Grid>
    <FilterBar search={{ value: search, onChange: value => { setSearch(value); setPage(1); }, placeholder: 'Search agents' }} filters={<Inline gap="small" wrap>
      <Dropdown variant="solid" items={['All statuses', 'Published', 'Draft'].map(value => ({ label: value, selected: value === status, onClick: () => { setStatus(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{status === 'All statuses' ? 'Status' : status}</Button></Dropdown>
      <Dropdown variant="solid" items={['Anyone', ...new Set(agents.map(agent => agent.owner))].map(value => ({ label: value, selected: value === creator, onClick: () => { setCreator(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{creator === 'Anyone' ? 'Created by' : creator}</Button></Dropdown>
      <Dropdown variant="solid" items={['Any date', 'Modified today'].map(value => ({ label: value, selected: value === date, onClick: () => { setDate(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{date === 'Any date' ? 'Date' : date}</Button></Dropdown>
      <Button kind="tertiary" size="small" onClick={() => { setSearch(''); setStatus('All statuses'); setCreator('Anyone'); setDate('Any date'); setPage(1); }}>Clear</Button>
      <IconButton icon="bulleted-list" size="small" variant="tertiary" aria-label="List view" aria-pressed={layout === 'list'} onClick={() => setLayout('list')} /><IconButton icon="layout-grid" size="small" variant="tertiary" aria-label="Tile view" aria-pressed={layout === 'tiles'} onClick={() => setLayout('tiles')} />
    </Inline>} />
    <Text size="md" weight="medium">My agents</Text>
    {layout === 'tiles' ? filtered.length ? <Grid columns={3} gap="medium" className="automation-live-agent-grid">{filtered.slice((visiblePage - 1) * 6, visiblePage * 6).map(agent => <AutomationAgentCard key={agent.id} agent={agent} onOpen={() => openAgent(agent)} onDuplicate={() => duplicate(agent)} onToggleStatus={() => toggleStatus(agent)} />)}</Grid> : <Text size="sm" color="secondary">No agents match your filters.</Text> : <DataTable key="automation-agent-list" columns={agentColumns} data={filtered.slice((visiblePage - 1) * 6, visiblePage * 6)} getRowKey={agent => agent.id} stickyHeader showColumnControl emptyMessage="No agents match your filters" />}
    <Pagination currentPage={visiblePage} totalPages={Math.max(1, Math.ceil(filtered.length / 6))} onPageChange={setPage} showFirstLast={false} />
    {showAllFeatured && <Modal open title="Featured agents" size="large" onClose={() => setShowAllFeatured(false)} footer={<Button kind="secondary" onClick={() => setShowAllFeatured(false)}>Close</Button>}><Grid columns={3} gap="medium" className="automation-live-agent-grid">{FEATURED_AUTOMATION_AGENTS.map(agent => <AutomationAgentCard key={agent.id} agent={agent} featured onOpen={() => openAgent(agent, true)} />)}</Grid></Modal>}
    {editor && <AutomationAgentDialog key={editor.agent?.id ?? 'new'} agent={editor.agent} isNew={editor.isNew} onClose={() => setEditor(null)} onSave={agent => { onChange(rows => editor.isNew ? [agent, ...rows] : rows.map(row => row.id === agent.id ? agent : row)); setEditor(null); setSearch(''); setStatus('All statuses'); setCreator('Anyone'); setDate('Any date'); setPage(1); setNotice(editor.isNew ? 'Agent created.' : 'Agent updated.'); }} />}
  </Stack>;
}

interface AutomationRule { id: string; name: string; trigger: string; action: string; active: boolean; }
const AUTOMATION_RULE_TEMPLATES = [
  { name: 'Create a request to renew the agreement before the renewal date', trigger: 'Renewal approaching', action: 'Create a request', icon: 'ticket' },
  { name: "Notify Slack before an agreement's expiration date", trigger: 'Agreement expiring', action: 'Notify Slack', icon: 'messages' },
  { name: "Notify by email before an agreement's expiration date", trigger: 'Agreement expiring', action: 'Send an email', icon: 'envelope' },
  { name: 'Send an approval email when an agreement exceeds a set dollar amount', trigger: 'Agreement value exceeds threshold', action: 'Request approval', icon: 'ticket' },
  { name: 'Notify by email when a new agreement request is submitted', trigger: 'Request submitted', action: 'Send an email', icon: 'ticket' },
  { name: 'Email notification when an envelope is sent for a specific Request Type', trigger: 'Envelope sent', action: 'Send an email', icon: 'ticket' },
  { name: 'Email notification when an envelope is completed for a specific Request Type', trigger: 'Agreement completed', action: 'Send an email', icon: 'ticket' },
  { name: 'When an envelope is completed, archive it to the cloud storage of your choice', trigger: 'Agreement completed', action: 'Archive document', icon: 'document' },
  { name: 'Notify Slack when an envelope is completed', trigger: 'Agreement completed', action: 'Notify Slack', icon: 'messages' },
  { name: 'Notify Slack when an envelope is declined', trigger: 'Envelope declined', action: 'Notify Slack', icon: 'messages' },
  { name: 'Notify by email when an envelope is declined', trigger: 'Envelope declined', action: 'Send an email', icon: 'envelope' },
];

function AutomationRuleDialog({ rule, withAI, onClose, onSave }: { rule: Partial<AutomationRule> | null; withAI: boolean; onClose: () => void; onSave: (rule: AutomationRule) => void }) {
  const formId = useId();
  const [name, setName] = useState(rule?.name ?? '');
  const [trigger, setTrigger] = useState(rule?.trigger ?? 'Agreement completed');
  const [action, setAction] = useState(rule?.action ?? 'Send an email');
  const [active, setActive] = useState(rule?.active ?? true);
  const [prompt, setPrompt] = useState('');
  return <Modal open title={withAI ? 'Build a rule with AI' : rule?.id ? 'Edit rule' : 'Add a Rule'} size="medium" onClose={onClose} footer={<Inline gap="small" justify="end"><Button kind="secondary" onClick={onClose}>Cancel</Button><Button kind="primary" form={formId} type="submit">{rule?.id ? 'Save changes' : 'Add rule'}</Button></Inline>}><form id={formId} onSubmit={event => { event.preventDefault(); if (!name.trim()) return; onSave({ id: rule?.id ?? crypto.randomUUID(), name: name.trim(), trigger, action, active }); }}><Stack gap="large">
    {withAI && <TextArea label="Describe the task you want to automate" value={prompt} onChange={event => { setPrompt(event.target.value); if (!name || name === prompt) setName(event.target.value); }} rows={3} />}
    <Input label="Rule name" value={name} onChange={event => setName(event.target.value)} required maxLength={150} />
    <Select label="When this happens" value={trigger} onChange={event => setTrigger(event.target.value)}>{[...new Set(AUTOMATION_RULE_TEMPLATES.map(item => item.trigger))].map(value => <option key={value}>{value}</option>)}</Select>
    <Select label="Take this action" value={action} onChange={event => setAction(event.target.value)}>{[...new Set(AUTOMATION_RULE_TEMPLATES.map(item => item.action))].map(value => <option key={value}>{value}</option>)}</Select>
    <Switch label="Enable rule" checked={active} onChange={setActive} />
  </Stack></form></Modal>;
}

function AutomationRulesPage({ rules, onChange }: { rules: AutomationRule[]; onChange: React.Dispatch<React.SetStateAction<AutomationRule[]>> }) {
  const [editor, setEditor] = useState<{ rule: Partial<AutomationRule> | null; withAI: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const columns: DataTableColumn<AutomationRule>[] = [
    { key: 'name', header: 'Rule', cell: rule => <Link href="#automations" kind="subtle" onClick={event => { event.preventDefault(); setEditor({ rule, withAI: false }); }}>{rule.name}</Link> },
    { key: 'trigger', header: 'Trigger' }, { key: 'action', header: 'Action' },
    { key: 'active', header: 'Status', cell: rule => <Badge kind={rule.active ? 'success' : 'subtle'} text={rule.active ? 'Enabled' : 'Disabled'} /> },
    { key: 'toggle', header: 'Actions', alignment: 'right', cell: rule => <Button kind="tertiary" size="small" onClick={() => onChange(rows => rows.map(row => row.id === rule.id ? { ...row, active: !row.active } : row))}>{rule.active ? 'Disable' : 'Enable'}</Button> },
  ];
  return <Stack gap="large" className="automation-live-page">
    <PageHeader title="Handle routine tasks with rules" />
    <Text size="sm" color="secondary">Choose what triggers a rule and what it does, like notifying your team or moving a file.</Text>
    <Link href="https://support.docusign.com/s/document-item?bundleId=ugf550dff6-bf19-47be-82a7-2d1ff5798724&topicId=conced2b284-d5cc-4f2f-a099-c028c2225473.html" target="_blank" rel="noreferrer">Learn how Rules work</Link>
    <Inline gap="large"><Button kind="primary" onClick={() => setEditor({ rule: null, withAI: false })}>Add a Rule</Button><Button kind="secondary" startElement={<Icon name="ai-spark" />} onClick={() => setEditor({ rule: null, withAI: true })}>Build with AI</Button></Inline>
    {notice && <Banner kind="success" onClose={() => setNotice('')}>{notice}</Banner>}
    {rules.length > 0 && <Stack gap="medium"><Text size="md" weight="medium">My rules</Text><DataTable key="automation-rule-list" columns={columns} data={rules} getRowKey={rule => rule.id} stickyHeader showColumnControl /></Stack>}
    <Text size="lg" weight="medium">Rule templates</Text>
    <Grid columns={3} gap="medium" className="automation-live-rule-grid">{AUTOMATION_RULE_TEMPLATES.map(template => <PreviewCard key={template.name} className="automation-live-rule-card" heading={<PreviewCard.Heading text={template.name} />} onOpen={() => setEditor({ rule: template, withAI: false })} openLabel={template.name}><Stack gap="none" className="automation-live-rule-icon"><Icon name={template.icon} /></Stack></PreviewCard>)}</Grid>
    {editor && <AutomationRuleDialog key={editor.rule?.id ?? editor.rule?.name ?? (editor.withAI ? 'ai' : 'new')} rule={editor.rule} withAI={editor.withAI} onClose={() => setEditor(null)} onSave={rule => { onChange(rows => editor.rule?.id ? rows.map(row => row.id === rule.id ? rule : row) : [rule, ...rows]); setEditor(null); setNotice(editor.rule?.id ? 'Rule updated.' : 'Rule added.'); }} />}
  </Stack>;
}

const WORKFLOW_LAST_MODIFIED: Record<string, string> = { 'workflow-1': '4 hours', 'workflow-2': '6 hours', 'workflow-3': 'Yesterday', 'workflow-4': '10/16/2026', 'workflow-5': '10/14/2026' };
function getWorkflowStartedFrom(workflow: Workflow) { return workflow.trigger === 'Request submitted' ? 'Web form' : workflow.trigger === 'Renewal approaching' ? 'Scheduled' : 'eSignature'; }

function AutomationsPage({ workflows, onChange, view, onNavigate }: {
  workflows: Workflow[];
  onChange: React.Dispatch<React.SetStateAction<Workflow[]>>;
  view: AutomationView;
  onNavigate: (view: AutomationView) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [creator, setCreator] = useState('Anyone');
  const [startedFrom, setStartedFrom] = useState('All sources');
  const [agents, setAgents] = useState(MY_AUTOMATION_AGENTS);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runStatus, setRunStatus] = useState('All statuses');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const [editor, setEditor] = useState<{ workflow: Workflow | null; isNew?: boolean } | null>(null);
  const [runs, setRuns] = useState(WORKFLOW_RUNS_DATA);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { setSearch(''); setStatus('All statuses'); setRunStatus('All statuses'); setCreator('Anyone'); setStartedFrom('All sources'); setPage(1); }, [view]);
  useEffect(() => {
    if (view === 'create-workflow') {
      setEditor({ workflow: null });
      onNavigate('workflows');
    }
  }, [view, onNavigate]);
  const isActivity = view === 'activity';
  const isTemplates = view === 'workflow-templates';
  const effectiveStatus = view === 'active-workflows' ? 'Published' : view === 'draft-workflows' ? 'Draft' : status;
  const query = search.toLowerCase();
  const filtered = workflows.filter(row => (effectiveStatus === 'All statuses' || (effectiveStatus === 'Published' && row.status === 'Active') || (effectiveStatus === 'Unpublished' && row.status !== 'Active') || row.status === effectiveStatus) && (creator === 'Anyone' || row.owner === creator) && (startedFrom === 'All sources' || getWorkflowStartedFrom(row) === startedFrom) && `${row.name} ${row.id} ${row.description} ${row.owner}`.toLowerCase().includes(query));
  const filteredRuns = runs.filter(row => (runStatus === 'All statuses' || row.status === runStatus) && `${row.id} ${row.workflowName} ${row.agreement}`.toLowerCase().includes(query));
  const filteredTemplates = WORKFLOW_STARTER_TEMPLATES.filter(row => `${row.name} ${row.description} ${row.category}`.toLowerCase().includes(query));
  const pageRows = isActivity ? filteredRuns : filtered;
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(pageRows.length / pageSize)));
  const selectedRun = runs.find(row => row.id === selectedRunId);
  const selectedWorkflow = selectedRun ? workflows.find(row => row.id === selectedRun.workflowId) : undefined;
  const title = isActivity ? 'Activity' : isTemplates ? 'Workflow templates' : view === 'active-workflows' ? 'Published workflows' : view === 'draft-workflows' ? 'Draft workflows' : 'Workflows';
  const columns: DataTableColumn<Workflow>[] = [
    { key: 'name', header: 'Name', sortable: true, cell: row => <Stack gap="small">
      <Link href="#automations" kind="subtle" onClick={event => { event.preventDefault(); setEditor({ workflow: row }); }}>{row.name}</Link>
      {row.status !== 'Active' && <Inline gap="small" align="center"><Icon name="pencil" size="small" /><Text size="xs" color="secondary">Draft saved</Text><Link href="#automations" onClick={event => { event.preventDefault(); setEditor({ workflow: row }); }}>Edit</Link></Inline>}
    </Stack> },
    { key: 'status', header: 'Status', cell: row => <Badge kind={row.status === 'Active' ? 'success' : 'subtle'} text={row.status === 'Active' ? 'Published' : 'Unpublished'} /> },
    { key: 'lastModified', header: 'Last modified', cell: row => <Text size="sm">{row.lastModified ?? WORKFLOW_LAST_MODIFIED[row.id] ?? 'Just now'}</Text> },
    { key: 'owner', header: 'Created by' },
    { key: 'actions', header: 'Actions', alignment: 'right', cell: row => <Dropdown variant="solid" align="end" items={[
      { label: 'Edit workflow', onClick: () => setEditor({ workflow: row }) },
      { label: row.status === 'Active' ? 'Unpublish workflow' : 'Publish workflow', onClick: () => {
        const next = row.status === 'Active' ? 'Paused' : 'Active';
        onChange(rows => rows.map(item => item.id === row.id ? { ...item, status: next, lastModified: 'Just now' } : item));
        setNotice(`${row.name} ${next === 'Active' ? 'published' : 'unpublished'}.`);
      } },
      { label: 'Duplicate workflow', onClick: () => {
        onChange(rows => [{ ...row, id: crypto.randomUUID(), name: `${row.name} (copy)`, status: 'Draft', runs: 0, lastRun: '—', lastModified: 'Just now' }, ...rows]);
        setNotice('Workflow duplicated as a draft.');
      } },
      { label: 'View activity', onClick: () => onNavigate('activity') },
    ]}><IconButton icon="overflow-vertical" size="small" variant="tertiary" aria-label={`Actions for ${row.name}`} /></Dropdown> },
  ];
  const runColumns: DataTableColumn<WorkflowRun>[] = [
    { key: 'id', header: 'Run', cell: row => <Link href="#automations" kind="subtle" onClick={event => { event.preventDefault(); setSelectedRunId(row.id); }}>{row.id}</Link> },
    { key: 'workflowName', header: 'Workflow', sortable: true, cell: row => <Stack gap="none"><Text size="sm">{row.workflowName}</Text><Text size="xs" color="secondary">{row.agreement}</Text></Stack> },
    { key: 'status', header: 'Status', cell: row => <Badge kind={row.status === 'Completed' ? 'success' : row.status === 'Needs attention' ? 'warning' : 'emphasis'} text={row.status} /> },
    { key: 'started', header: 'Started' },
    { key: 'duration', header: 'Duration' },
    { key: 'details', header: 'Details', alignment: 'right', cell: row => <Button kind="tertiary" size="small" onClick={() => setSelectedRunId(row.id)}>View run</Button> },
  ];
  const pagination = { page: visiblePage, pageSize, totalItems: pageRows.length, onPageChange: setPage, onPageSizeChange: (value: PageSizeOption) => { setPageSize(value); setPage(1); }, showInfo: true };
  if (view === 'agents') return <AutomationAgentsPage agents={agents} onChange={setAgents} />;
  if (view === 'rules') return <AutomationRulesPage rules={rules} onChange={setRules} />;
  return <>
    <AgreementTableView
      pageHeader={<PageHeader title={title} actions={<Inline gap="small">
        <Button kind="primary" onClick={() => setEditor({ workflow: null })}>Create Workflow</Button>
        <Dropdown variant="solid" align="end" items={[
          { label: 'All workflows', onClick: () => onNavigate('workflows') },
          { label: 'Published workflows', onClick: () => onNavigate('active-workflows') },
          { label: 'Draft workflows', onClick: () => onNavigate('draft-workflows') },
          { label: 'Activity', onClick: () => onNavigate('activity') },
          { label: 'Workflow templates', onClick: () => onNavigate('workflow-templates') },
        ]}><IconButton icon="overflow-vertical" variant="tertiary" aria-label="Workflow menu" /></Dropdown>
      </Inline>} />}
      banner={notice ? <Banner kind="success" onClose={() => setNotice('')}>{notice}</Banner> : isTemplates ? <Banner kind="information">Start with a workflow template, then choose your trigger and action.</Banner> : undefined}
      filterBar={<FilterBar search={{ value: search, onChange: value => { setSearch(value); setPage(1); }, placeholder: isActivity ? 'Search workflow runs' : isTemplates ? 'Search workflow templates' : 'Search workflow name or ID' }} filters={
        isTemplates ? undefined : isActivity ? <Dropdown variant="solid" items={['All statuses', 'Completed', 'Running', 'Needs attention'].map(value => ({ label: value, selected: runStatus === value, onClick: () => { setRunStatus(value); setPage(1); } }))}>
          <Button kind="secondary" size="small" menuTrigger>{runStatus}</Button>
        </Dropdown> : <Inline gap="small" wrap>
          {view === 'workflows' || view === 'create-workflow' ? <Dropdown variant="solid" items={['All statuses', 'Published', 'Unpublished'].map(value => ({ label: value, selected: status === value, onClick: () => { setStatus(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{status === 'All statuses' ? 'Status' : status}</Button></Dropdown> : <Chip onRemove={() => onNavigate('workflows')}>{effectiveStatus}</Chip>}
          <Dropdown variant="solid" items={['Anyone', ...new Set(workflows.map(row => row.owner))].map(value => ({ label: value, selected: creator === value, onClick: () => { setCreator(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{creator === 'Anyone' ? 'Created by' : creator}</Button></Dropdown>
          <Dropdown variant="solid" items={['All sources', 'eSignature', 'Web form', 'Scheduled'].map(value => ({ label: value, selected: startedFrom === value, onClick: () => { setStartedFrom(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{startedFrom === 'All sources' ? 'Started From' : startedFrom}</Button></Dropdown>
        </Inline>
      } />}
    >
      {isTemplates ? <>
        {filteredTemplates.length ? <Grid columns={2} gap="large">{filteredTemplates.map(template => <Card key={template.id} radius="large">
          <Card.Header><Inline gap="small" justify="between"><Icon name="workflow" /><Badge kind="subtle" text={template.category} /></Inline></Card.Header>
          <Card.Body><Stack gap="medium"><Text size="md" weight="semibold">{template.name}</Text><Text size="sm" color="secondary">{template.description}</Text><Stack gap="small"><Text size="xs" color="secondary">When: {template.trigger}</Text><Text size="xs" color="secondary">Then: {template.action}</Text></Stack></Stack></Card.Body>
          <Card.Footer><Button kind="secondary" onClick={() => setEditor({ isNew: true, workflow: { id: crypto.randomUUID(), name: template.name, description: template.description, trigger: template.trigger, action: template.action, status: 'Draft', lastRun: '—', runs: 0, owner: 'Akshat Mishra' } })}>Use template</Button></Card.Footer>
        </Card>)}</Grid> : <Text size="sm" color="secondary">No workflow templates match your search.</Text>}
      </> : isActivity ? <DataTable key="workflow-runs" columns={runColumns} data={filteredRuns.slice((visiblePage - 1) * pageSize, visiblePage * pageSize)} getRowKey={row => row.id} rowHeight="tall" stickyHeader showColumnControl emptyMessage="No workflow runs match your search" pagination={pagination} /> :
        <DataTable key="workflow-list" columns={columns} data={filtered.slice((visiblePage - 1) * pageSize, visiblePage * pageSize)} getRowKey={row => row.id} rowHeight="tall" stickyHeader showColumnControl emptyMessage="No workflows match your search" pagination={pagination} />}
    </AgreementTableView>
    {editor && <WorkflowDialog key={editor.workflow?.id ?? 'new'} workflow={editor.workflow} isNew={editor.isNew ?? !editor.workflow} onClose={() => setEditor(null)} onSave={workflow => {
      const isNew = editor.isNew ?? !editor.workflow;
      onChange(rows => isNew ? [workflow, ...rows] : rows.map(row => row.id === workflow.id ? workflow : row));
      setEditor(null); onNavigate('workflows'); setSearch(''); setStatus('All statuses'); setCreator('Anyone'); setStartedFrom('All sources'); setPage(1);
      setNotice(isNew ? 'Workflow created.' : 'Workflow updated.');
    }} />}
    {selectedRun && <Modal open title={`Workflow run ${selectedRun.id}`} size="medium" onClose={() => setSelectedRunId(null)} footer={<Inline gap="small" justify="end">
      <Button kind="secondary" onClick={() => setSelectedRunId(null)}>Close</Button>
      {selectedRun.status === 'Needs attention' && <Button kind="primary" onClick={() => {
        setRuns(rows => rows.map(row => row.id === selectedRun.id ? { ...row, status: 'Running', duration: 'In progress' } : row));
        setNotice(`Retry started for ${selectedRun.id}.`);
      }}>Retry run</Button>}
    </Inline>}>
      <Stack gap="large">
        <Inline justify="between"><Text size="md" weight="semibold">{selectedRun.workflowName}</Text><Badge kind={selectedRun.status === 'Completed' ? 'success' : selectedRun.status === 'Needs attention' ? 'warning' : 'emphasis'} text={selectedRun.status} /></Inline>
        <Text size="sm" color="secondary">{selectedRun.agreement} · {selectedRun.started}</Text>
        <Timeline items={[
          { id: 'trigger', label: selectedWorkflow?.trigger ?? 'Agreement completed', timestamp: selectedRun.started, description: 'The workflow received its triggering event.', status: 'complete' },
          { id: 'action', label: selectedWorkflow?.action ?? 'Create a task', description: selectedRun.status === 'Needs attention' ? 'A required recipient could not be reached. Review the workflow and retry.' : selectedRun.status === 'Running' ? 'Waiting for the next action to finish.' : 'The configured action finished successfully.', status: selectedRun.status === 'Needs attention' ? 'error' : selectedRun.status === 'Running' ? 'current' : 'complete' },
          { id: 'complete', label: selectedRun.status === 'Completed' ? 'Workflow completed' : 'Awaiting completion', description: selectedRun.status === 'Completed' ? `Finished in ${selectedRun.duration}.` : 'The run will finish after all actions are complete.', status: selectedRun.status === 'Completed' ? 'success' : 'incomplete' },
        ]} />
      </Stack>
    </Modal>}
  </>;
}

interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending' | 'Inactive';
  lastActive: string;
}

const ACCOUNT_USERS: AccountUser[] = [
  { id: 'user-1', name: 'Akshat Mishra', email: 'akshat@example.com', role: 'Administrator', status: 'Active', lastActive: 'Today' },
  { id: 'user-2', name: 'Maya Patel', email: 'maya.patel@example.com', role: 'Sender', status: 'Active', lastActive: 'Today' },
  { id: 'user-3', name: 'Ryan Chen', email: 'ryan.chen@example.com', role: 'Sender', status: 'Active', lastActive: 'Yesterday' },
  { id: 'user-4', name: 'Jamie Morgan', email: 'jamie.morgan@example.com', role: 'Viewer', status: 'Pending', lastActive: '—' },
  { id: 'user-5', name: 'Alex Rivera', email: 'alex.rivera@example.com', role: 'Sender', status: 'Inactive', lastActive: 'Oct 12, 2026' },
];

interface AccountSettings {
  name: string;
  language: string;
  timezone: string;
  notifications: boolean;
  reminders: boolean;
}

const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = { name: 'Protolab', language: 'English (US)', timezone: 'Pacific Time (US & Canada)', notifications: true, reminders: true };

function AddUserDialog({ users, onClose, onSave }: { users: AccountUser[]; onClose: () => void; onSave: (user: AccountUser) => void }) {
  const formId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Sender');
  const [error, setError] = useState('');
  return <Modal open onClose={onClose} title="Add user" size="medium" footer={<Inline gap="small" justify="end">
    <Button kind="secondary" onClick={onClose}>Cancel</Button><Button kind="primary" type="submit" form={formId}>Add user</Button>
  </Inline>}>
    <form id={formId} onSubmit={event => {
      event.preventDefault();
      if (!name.trim()) return;
      if (users.some(user => user.email.toLowerCase() === email.trim().toLowerCase())) { setError('This email address is already on the account.'); return; }
      onSave({ id: crypto.randomUUID(), name: name.trim(), email: email.trim(), role, status: 'Pending', lastActive: '—' });
    }}>
      <Stack gap="large">
        <Input label="Full name" value={name} onChange={event => setName(event.target.value)} required />
        <Input label="Email address" type="email" value={email} onChange={event => { setEmail(event.target.value); setError(''); }} error={error} required />
        <Select label="Permission profile" value={role} onChange={event => setRole(event.target.value)}>
          {['Administrator', 'Sender', 'Viewer'].map(value => <option key={value}>{value}</option>)}
        </Select>
      </Stack>
    </form>
  </Modal>;
}

const ADMIN_VIEW_LABELS = {
  overview: 'Overview', 'plan-billing': 'Plan and Billing', 'account-settings': 'Account Profile',
  'system-status': 'System Status', security: 'Security Settings', 'regional-settings': 'Regional Settings', branding: 'Brands',
  updates: 'Updates', sandbox: 'Sandbox', 'value-calculator': 'Value Calculator', 'sound-settings': 'Sound Settings', 'ai-controls': 'AI Control Settings',
  users: 'Users', 'permission-profiles': 'Permission Profiles', groups: 'Groups', 'signing-groups': 'Signing Groups',
  'signing-settings': 'Signing Settings', 'sending-settings': 'Sending Settings', 'workspace-settings': 'Workspaces Settings',
  'identity-verification': 'Identity Verification', 'email-preferences': 'Email Preferences', 'email-archive': 'Email Archive Configuration',
  'custody-transfer': 'Custody Transfer', 'document-retention': 'Document Retention', 'legal-disclosure': 'Legal Disclosure',
  'reminders-expiration': 'Reminders and Expiration', comments: 'Comments', 'document-custom-fields': 'Document Custom Fields', 'envelope-custom-fields': 'Envelope Custom Fields',
  integrations: 'App Center', 'mcp-connections': 'MCP Connections', connect: 'Connect', 'apps-and-keys': 'Apps and Keys', 'api-usage': 'API Usage Center', cors: 'CORS', payments: 'Payments',
  rules: 'Rules', 'agreement-connections': 'Connections', 'audit-logs': 'Audit Logs', 'bulk-actions': 'Bulk Actions',
} as const;
export type AdminView = keyof typeof ADMIN_VIEW_LABELS;
const ADMIN_DEFAULT_VIEW: AdminView = 'overview';

const ADMIN_NAV_GROUPS: { id: string; title: string; views: AdminView[] }[] = [
  { id: 'account', title: 'Account', views: ['plan-billing', 'account-settings', 'system-status', 'security', 'regional-settings', 'branding', 'updates', 'sandbox', 'value-calculator', 'sound-settings', 'ai-controls'] },
  { id: 'users', title: 'Users and Groups', views: ['users', 'permission-profiles', 'groups', 'signing-groups'] },
  { id: 'signing', title: 'Signing and Sending', views: ['signing-settings', 'sending-settings', 'workspace-settings', 'identity-verification', 'email-preferences', 'email-archive', 'custody-transfer', 'document-retention', 'legal-disclosure', 'reminders-expiration', 'comments', 'document-custom-fields', 'envelope-custom-fields'] },
  { id: 'integrations', title: 'Integrations', views: ['integrations', 'mcp-connections', 'connect', 'apps-and-keys', 'api-usage', 'cors', 'payments'] },
  { id: 'actions', title: 'Agreement Actions', views: ['rules', 'agreement-connections'] },
  { id: 'auditing', title: 'Auditing', views: ['audit-logs', 'bulk-actions'] },
];

function getAdminSidebar(view: AdminView, onNavigate: (view: AdminView) => void, accountName = 'Protolab'): Omit<React.ComponentProps<typeof LocalNav>, 'className'> {
  const item = (id: AdminView) => ({ id, label: ADMIN_VIEW_LABELS[id], badge: id === 'system-status' ? 'Beta' : undefined, onClick: () => onNavigate(id) });
  return {
    headerLabel: `${accountName} (48217603)`, headerIcon: 'building-person', activeItemId: view,
    headerMenuItems: [{ id: 'current-account', label: `${accountName} (48217603)`, icon: 'check', onClick: () => onNavigate('overview') }],
    sections: [
      { id: 'admin-summary', title: 'Account ID: 48217603', headerLabel: true, items: [item('overview')] },
      ...ADMIN_NAV_GROUPS.map(group => ({ id: `admin-${group.id}`, title: group.title, headerLabel: true, hasDivider: true, items: group.views.map(item) })),
    ],
  };
}

interface AdminSettingField { id: string; label: string; description?: string; options?: string[]; initial?: string; }
const ADMIN_SETTING_PAGES: Partial<Record<AdminView, { description: string; fields: AdminSettingField[] }>> = {
  'regional-settings': { description: 'Choose the language, time zone, and date format used by your account.', fields: [{ id: 'language', label: 'Default language', options: ['English (US)', 'English (UK)', 'French', 'German', 'Spanish'] }, { id: 'timezone', label: 'Time zone', options: ['Pacific Time (US & Canada)', 'Eastern Time (US & Canada)', 'London'] }, { id: 'date-format', label: 'Date format', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] }] },
  'sound-settings': { description: 'Choose when Docusign plays a sound.', fields: [{ id: 'completion-sound', label: 'Play a sound when signing is complete' }, { id: 'notification-sound', label: 'Play notification sounds' }] },
  'ai-controls': { description: 'Manage access to AI features for your account.', fields: [{ id: 'iris-enabled', label: 'Allow users to use Iris' }, { id: 'agreement-insights', label: 'Enable AI agreement insights' }] },
  'workspace-settings': { description: 'Set how teams organize and share agreements in workspaces.', fields: [{ id: 'workspace-creation', label: 'Allow users to create workspaces' }, { id: 'external-collaboration', label: 'Allow external collaborators' }] },
  'identity-verification': { description: 'Choose the identity verification options available to senders.', fields: [{ id: 'phone-verification', label: 'Allow phone authentication' }, { id: 'id-verification', label: 'Allow identity verification' }, { id: 'access-code', label: 'Allow recipient access codes' }] },
  'email-preferences': { description: 'Set which agreement updates are sent by email.', fields: [{ id: 'recipient-updates', label: 'Notify recipients when an agreement is completed' }, { id: 'sender-updates', label: 'Notify senders about recipient activity' }] },
  'email-archive': { description: 'Send a copy of completed agreements to an archive address.', fields: [{ id: 'archive-enabled', label: 'Enable email archiving' }, { id: 'archive-address', label: 'Archive email address', initial: 'agreements@example.com' }] },
  'custody-transfer': { description: 'Choose how agreement ownership is transferred between users.', fields: [{ id: 'allow-transfer', label: 'Allow administrators to transfer agreement custody' }, { id: 'transfer-owner', label: 'Default receiving user', options: ['Akshat Mishra', 'Maya Patel', 'Ryan Chen'] }] },
  'document-retention': { description: 'Set how long completed and declined documents are retained.', fields: [{ id: 'retention-enabled', label: 'Enable a document retention policy' }, { id: 'retention-days', label: 'Retain documents for', options: ['7 years', '5 years', '3 years', '1 year'] }] },
  'legal-disclosure': { description: 'Show the electronic record and signature disclosure before signing.', fields: [{ id: 'disclosure-required', label: 'Require recipients to accept the disclosure' }, { id: 'disclosure-language', label: 'Disclosure language', options: ['English (US)', 'English (UK)', 'French', 'German'] }] },
  'reminders-expiration': { description: 'Set default reminders and expiration for new envelopes.', fields: [{ id: 'reminders-enabled', label: 'Send automatic reminders' }, { id: 'reminder-frequency', label: 'Remind recipients every', options: ['3 days', '1 day', '7 days', '14 days'] }, { id: 'expiration-default', label: 'Expire envelopes after', options: ['120 days', '30 days', '60 days', '90 days'] }] },
  comments: { description: 'Manage how senders and recipients discuss agreements.', fields: [{ id: 'comments-enabled', label: 'Allow agreement comments' }, { id: 'comment-notifications', label: 'Send email notifications for new comments' }] },
  'document-custom-fields': { description: 'Create reusable fields for documents sent by your team.', fields: [{ id: 'field-label', label: 'Field label', initial: 'Department' }, { id: 'field-type', label: 'Field type', options: ['Text', 'Dropdown', 'Number'] }, { id: 'field-shared', label: 'Share field with all users' }] },
  'envelope-custom-fields': { description: 'Collect account-specific information when envelopes are sent.', fields: [{ id: 'envelope-field-label', label: 'Field label', initial: 'Cost center' }, { id: 'envelope-field-required', label: 'Require a value before sending' }, { id: 'envelope-field-visible', label: 'Show field to recipients' }] },
  'mcp-connections': { description: 'Control the tools and services that AI assistants can access.', fields: [{ id: 'mcp-enabled', label: 'Allow MCP connections' }, { id: 'mcp-approval', label: 'Require administrator approval for new connections' }] },
  'apps-and-keys': { description: 'Manage application access to the Docusign API.', fields: [{ id: 'application-name', label: 'Application name', initial: 'Protolab integration' }, { id: 'application-environment', label: 'Environment', options: ['Developer', 'Production'] }, { id: 'application-enabled', label: 'Enable application access' }] },
  cors: { description: 'Choose which browser origins can make API requests to your account.', fields: [{ id: 'cors-origin', label: 'Allowed origin', initial: 'https://app.example.com' }, { id: 'cors-methods', label: 'Allowed methods', options: ['GET, POST', 'GET', 'GET, POST, PUT, DELETE'] }] },
  payments: { description: 'Allow senders to request payments with an agreement.', fields: [{ id: 'payments-enabled', label: 'Allow payment requests' }, { id: 'currency', label: 'Default currency', options: ['USD', 'EUR', 'GBP', 'CAD'] }] },
  connect: { description: 'Configure the endpoint that receives agreement events from Docusign Connect.', fields: [{ id: 'connect-name', label: 'Configuration name', initial: 'Completed agreements' }, { id: 'connect-url', label: 'URL to publish to', initial: 'https://app.example.com/docusign/events' }, { id: 'connect-enabled', label: 'Enable Connect configuration' }] },
  'agreement-connections': { description: 'Choose where agreement actions send documents and data.', fields: [{ id: 'agreement-connection-name', label: 'Connection name', initial: 'Agreement archive' }, { id: 'agreement-connection-provider', label: 'Provider', options: ['Google Drive', 'Microsoft SharePoint', 'Box'] }, { id: 'agreement-connection-enabled', label: 'Enable connection' }] },
  rules: { description: 'Apply automatic actions when an agreement changes status.', fields: [{ id: 'rule-name', label: 'Rule name', initial: 'Archive completed agreements' }, { id: 'rule-trigger', label: 'Trigger', options: ['Agreement completed', 'Agreement sent', 'Agreement declined'] }, { id: 'rule-enabled', label: 'Enable rule' }] },
};

interface AdminGroup { id: string; name: string; description: string; memberIds: string[]; }
interface AdminPermissionProfile { id: string; name: string; description: string; canSend: boolean; canUseTemplates: boolean; canManage: boolean; }
interface AdminConnection { id: string; name: string; description: string; connected: boolean; }

const ADMIN_GROUPS: AdminGroup[] = [
  { id: 'group-1', name: 'Everyone', description: 'All account members', memberIds: ACCOUNT_USERS.map(user => user.id) },
  { id: 'group-2', name: 'Sales', description: 'Customer agreements and sales operations', memberIds: ['user-1', 'user-2', 'user-3'] },
  { id: 'group-3', name: 'Legal', description: 'Contract review and legal operations', memberIds: ['user-1', 'user-4'] },
  { id: 'group-4', name: 'People operations', description: 'Employee onboarding and policies', memberIds: ['user-2', 'user-5'] },
  { id: 'group-5', name: 'Finance', description: 'Purchasing and vendor agreements', memberIds: ['user-1', 'user-3'] },
];
const ADMIN_PERMISSION_PROFILES: AdminPermissionProfile[] = [
  { id: 'profile-1', name: 'Administrator', description: 'Manage the account, users, and agreements', canSend: true, canUseTemplates: true, canManage: true },
  { id: 'profile-2', name: 'Sender', description: 'Create and send agreements using shared templates', canSend: true, canUseTemplates: true, canManage: false },
  { id: 'profile-3', name: 'Viewer', description: 'View agreements shared with this user', canSend: false, canUseTemplates: false, canManage: false },
];
const ADMIN_CONNECTIONS: AdminConnection[] = [
  { id: 'salesforce', name: 'Salesforce', description: 'Prepare and send agreements from customer records', connected: true },
  { id: 'google-drive', name: 'Google Drive', description: 'Import documents and save completed agreements', connected: true },
  { id: 'sharepoint', name: 'Microsoft SharePoint', description: 'Connect your team’s document library', connected: false },
  { id: 'box', name: 'Box', description: 'Send documents from your cloud content library', connected: false },
  { id: 'slack', name: 'Slack', description: 'Receive agreement status updates in your workspace', connected: true },
];

function AdminSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <Card><Card.Body><Stack gap="large">
    <Stack gap="small"><Heading level={2} style={{ fontSize: 'var(--ink-font-heading-s-size)', fontWeight: 'var(--ink-font-weight-regular)', margin: 0 }}>{title}</Heading>{description && <Text size="sm" color="secondary">{description}</Text>}</Stack>
    {children}
  </Stack></Card.Body></Card>;
}

function AdminPage({ users, onUsersChange, settings, onSettingsChange, view, onNavigate }: {
  users: AccountUser[]; onUsersChange: React.Dispatch<React.SetStateAction<AccountUser[]>>;
  settings: AccountSettings; onSettingsChange: (settings: AccountSettings) => void;
  view: AdminView; onNavigate: (view: AdminView) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Active and pending');
  const [permissionFilter, setPermissionFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [settingSearch, setSettingSearch] = useState('');
  const [userLookup, setUserLookup] = useState('');
  const [userLookupType, setUserLookupType] = useState('Name');
  const pendingUserSearch = useRef('');
  const [showPermissionsBanner, setShowPermissionsBanner] = useState(true);
  const [notificationType, setNotificationType] = useState('All');
  const [notificationDate, setNotificationDate] = useState('Last 3 Months');
  const [bulkAction, setBulkAction] = useState<'add' | 'update' | null>(null);
  const [bulkFile, setBulkFile] = useState('');
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [genericValues, setGenericValues] = useState<Record<string, string | boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const [addingUser, setAddingUser] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState(settings);
  const [groups, setGroups] = useState(ADMIN_GROUPS);
  const [groupDraft, setGroupDraft] = useState<AdminGroup | null>(null);
  const [profiles, setProfiles] = useState(ADMIN_PERMISSION_PROFILES);
  const [profileDraft, setProfileDraft] = useState<AdminPermissionProfile | null>(null);
  const [connections, setConnections] = useState(ADMIN_CONNECTIONS);
  const [connectionDraft, setConnectionDraft] = useState<AdminConnection | null>(null);
  const [dialogError, setDialogError] = useState('');
  const [preferences, setPreferences] = useState({
    brandName: 'Protolab', emailName: 'Protolab agreements', emailSubject: 'Please sign your agreement',
    allowDraw: true, allowUpload: true, adoptSignature: true, mobileSigning: true,
    allowComments: true, allowReassign: true, expirationDays: '120', reminderDays: '3',
    requireMfa: true, allowPasswordReset: true, sessionTimeout: '30 minutes',
  });
  const settingsFormId = useId();
  const resourceFormId = useId();
  useEffect(() => { setSearch(view === 'users' ? pendingUserSearch.current : ''); pendingUserSearch.current = ''; setStatus('Active and pending'); setPermissionFilter('All'); setGroupFilter('All'); setPage(1); }, [view]);
  const userGroups = (user: AccountUser) => groups.filter(group => group.id === 'group-1' || group.memberIds.includes(user.id)).map(group => group.name);
  const filtered = users.filter(user => (status === 'All statuses' || (status === 'Active and pending' ? user.status !== 'Inactive' : user.status === status)) && (permissionFilter === 'All' || user.role === permissionFilter) && (groupFilter === 'All' || userGroups(user).includes(groupFilter)) && `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const columns: DataTableColumn<AccountUser>[] = [
    { key: 'name', header: 'Name', sortable: true, cell: user => <Stack gap="none"><Text size="sm" weight="medium">{user.name}</Text><Text size="xs" color="secondary">{user.email}</Text></Stack> },
    { key: 'added', header: 'Added', cell: user => <Stack gap="none"><Text size="sm">{({ 'user-1': '01/14/2026', 'user-2': '02/03/2026', 'user-3': '03/18/2026', 'user-4': '10/15/2026', 'user-5': '04/22/2026' } as Record<string, string>)[user.id] || '10/22/2026'}</Text><Text size="xs" color="secondary">9:30 am</Text></Stack> },
    { key: 'status', header: 'Status', cell: user => <StatusLight text={user.status} kind={user.status === 'Active' ? 'success' : user.status === 'Pending' ? 'warning' : 'neutral'} /> },
    { key: 'role', header: 'Permission Profile' },
    { key: 'groups', header: 'Groups', cell: user => <Text size="sm">{userGroups(user).join(', ')}</Text> },
    { key: 'actions', header: 'Actions', alignment: 'right', cell: user => <Dropdown variant="solid" align="end" items={[
      { label: 'Edit user', onClick: () => { setDialogError(''); setEditingUser({ ...user }); } },
      ...(user.status === 'Pending' ? [{ label: 'Resend invitation', onClick: () => setNotice(`Invitation sent to ${user.email}.`) }] : []),
      ...(user.id === 'user-1' ? [] : [{ label: user.status === 'Inactive' ? 'Reactivate user' : 'Close user', onClick: () => {
        const next = user.status === 'Inactive' ? 'Active' : 'Inactive';
        onUsersChange(rows => rows.map(row => row.id === user.id ? { ...row, status: next } : row));
        setNotice(`${user.name} ${next === 'Active' ? 'reactivated' : 'deactivated'}.`);
      } }]),
    ]}><Button kind="secondary" size="small" menuTrigger accessibilityText={`Actions for ${user.name}`}>Actions</Button></Dropdown> },
  ];
  const groupColumns: DataTableColumn<AdminGroup>[] = [
    { key: 'name', header: 'Group', sortable: true, cell: group => <Stack gap="none"><Text size="sm" weight="medium">{group.name}</Text><Text size="xs" color="secondary">{group.description}</Text></Stack> },
    { key: 'members', header: 'Members', cell: group => <Text size="sm">{group.id === 'group-1' ? users.length : group.memberIds.filter(id => users.some(user => user.id === id)).length}</Text> },
    { key: 'actions', header: 'Actions', alignment: 'right', cell: group => <Button kind="tertiary" size="small" onClick={() => { setDialogError(''); setGroupDraft({ ...group, memberIds: group.id === 'group-1' ? users.map(user => user.id) : [...group.memberIds] }); }}>Manage group</Button> },
  ];
  const profileColumns: DataTableColumn<AdminPermissionProfile>[] = [
    { key: 'name', header: 'Permission profile', sortable: true, cell: profile => <Stack gap="none"><Text size="sm" weight="medium">{profile.name}</Text><Text size="xs" color="secondary">{profile.description}</Text></Stack> },
    { key: 'users', header: 'Users', cell: profile => <Text size="sm">{users.filter(user => user.role === profile.name).length}</Text> },
    { key: 'access', header: 'Access', cell: profile => <Badge text={profile.canManage ? 'Account administration' : profile.canSend ? 'Sending' : 'View only'} kind="subtle" /> },
    { key: 'actions', header: 'Actions', alignment: 'right', cell: profile => <Button kind="tertiary" size="small" onClick={() => { setDialogError(''); setProfileDraft({ ...profile, id: '', name: `${profile.name} copy` }); }}>Duplicate profile</Button> },
  ];
  const connectionColumns: DataTableColumn<AdminConnection>[] = [
    { key: 'name', header: 'Application', sortable: true, cell: connection => <Stack gap="none"><Text size="sm" weight="medium">{connection.name}</Text><Text size="xs" color="secondary">{connection.description}</Text></Stack> },
    { key: 'status', header: 'Status', cell: connection => <Badge text={connection.connected ? 'Connected' : 'Available'} kind={connection.connected ? 'success' : 'subtle'} /> },
    { key: 'actions', header: 'Actions', alignment: 'right', cell: connection => <Button kind="secondary" size="small" onClick={() => setConnectionDraft({ ...connection })}>{connection.connected ? 'Manage' : 'Connect'}</Button> },
  ];
  const overview = <Stack gap="large">
    {showPermissionsBanner && <Alert kind="information" icon={null} role="region" aria-label="Account permissions">
      <Stack gap="large">
        <Heading level={2} style={{ fontSize: 'var(--ink-font-heading-s-size)', fontWeight: 'var(--ink-font-weight-semibold)', margin: 0 }}>Allow your users greater access to signed agreements</Heading>
        <Text size="md">Now you can grant users or groups access to more agreements. By default, users can only view their sent, received and shared agreements.</Text>
        <Inline gap="small" wrap><Button kind="primary" onClick={() => onNavigate('permission-profiles')}>Set permissions</Button><Button kind="secondary" onClick={() => setShowPermissionsBanner(false)}>Dismiss</Button></Inline>
      </Stack>
    </Alert>}
    <AdminSection title="Find a Setting or User">
      <Stack gap="large">
        <Stack gap="small"><Text size="sm">Find a Setting</Text><SearchInput aria-label="Find a Setting" placeholder="Enter keyword" value={settingSearch} onChange={setSettingSearch} suggestions={Object.entries(ADMIN_VIEW_LABELS).filter(([id]) => id !== 'overview' && id !== 'users').map(([id, label]) => ({ id, label }))} onSuggestionSelect={suggestion => { setSettingSearch(''); onNavigate(suggestion.id as AdminView); }} /></Stack>
        <Inline gap="small" align="end" wrap><Select label="Find a User" value={userLookupType} onChange={event => setUserLookupType(event.target.value)} width="calc(var(--ink-spacing-700) * 2)"><option>Name</option><option>Email</option></Select><Input label="Search Query" hideLabel placeholder={userLookupType === 'Name' ? 'Enter name' : 'Enter email'} value={userLookup} onChange={event => setUserLookup(event.target.value)} width="calc(var(--ink-spacing-700) * 4)" /><Button kind="secondary" disabled={!userLookup.trim()} onClick={() => { pendingUserSearch.current = userLookup.trim(); onNavigate('users'); }}>Search</Button></Inline>
      </Stack>
    </AdminSection>
    <AdminSection title="Notifications">
      <Inline gap="small" align="center" wrap>
        <Dropdown variant="solid" items={['Last 3 Months', 'Last Month', 'Last 7 Days', 'All dates'].map(value => ({ label: value, selected: notificationDate === value, onClick: () => setNotificationDate(value) }))}><Button kind="secondary" size="small" menuTrigger>Date: {notificationDate}</Button></Dropdown>
        <Dropdown variant="solid" items={['All', 'Account Health', 'Product Updates'].map(value => ({ label: value, selected: notificationType === value, onClick: () => setNotificationType(value) }))}><Button kind="secondary" size="small" menuTrigger>{notificationType === 'All' ? 'Type' : notificationType}</Button></Dropdown>
        <Button kind="tertiary" size="small" onClick={() => { setNotificationDate('All dates'); setNotificationType('All'); }}>Clear All</Button><Spacer flexible direction="horizontal" /><IconButton icon="gear" variant="tertiary" aria-label="Notification settings" onClick={() => onNavigate('email-preferences')} />
      </Inline>
      <Stack gap="large">
        {[
          { id: 'connect-failure', type: 'Account Health', time: '28 minutes', title: 'Connect Failure - Endpoint', description: 'A Connect notification could not be delivered. Review the endpoint configuration and try again.', action: 'Connect Failures', target: 'connect' as const },
          { id: 'certificate', type: 'Account Health', time: '2 hours', title: 'Connect Certificate Renewal', description: 'The Docusign certificate is being renewed. Review the certificates used by your Connect configurations.', action: 'Connect Certificates', target: 'connect' as const },
          { id: 'product-update', type: 'Product Updates', time: 'Yesterday', title: 'Your account updates', description: 'Review the latest features and settings available to your team.', action: 'View Updates', target: 'updates' as const },
        ].filter(item => notificationType === 'All' || item.type === notificationType).map(item => <Stack key={item.id} gap="medium"><Divider /><Inline justify="between" align="center"><Text size="sm" color="secondary">{item.type}</Text><Text size="sm" color="secondary">{item.time}</Text></Inline><Text size="lg" weight="semibold">{item.title}</Text><Text size="sm">{item.description}</Text><Inline><Button kind="secondary" size="small" onClick={() => onNavigate(item.target)}>{item.action}</Button></Inline></Stack>)}
      </Stack>
    </AdminSection>
    <AdminSection title="Admin Resources"><Grid columns={2} gap="large" className="admin-details">
      {[
        { title: 'Docusign Community', description: 'Ask and answer questions, join groups and grow together.', href: 'https://community.docusign.com/' },
        { title: 'Docusign University', description: 'Access on-demand and live training to expand your product knowledge.', href: 'https://dsucustomers.docusign.com/' },
        { title: 'Template Library', description: 'Start building eSignature templates and workflows.', href: 'https://dsucustomers.docusign.com/page/km-template-library' },
        { title: 'Docusign Welcome Center', description: 'Get up and running with a step-by-step checklist.', href: 'https://dsucustomers.docusign.com/' },
        { title: 'Trust Center', description: 'Find security, compliance, privacy and system performance information.', href: 'https://www.docusign.com/trust' },
        { title: 'Support Center', description: 'Find answers, troubleshooting articles, and Customer Support.', href: 'https://support.docusign.com/' },
      ].map(resource => <Stack key={resource.title} gap="small"><Link href={resource.href} target="_blank">{resource.title}</Link><Text size="sm" color="secondary">{resource.description}</Text></Stack>)}
    </Grid></AdminSection>
  </Stack>;
  const userList = <DataTable key="admin-users" columns={columns} data={filtered.slice((visiblePage - 1) * pageSize, visiblePage * pageSize)} getRowKey={user => user.id} rowHeight="tall" stickyHeader showColumnControl emptyMessage="No users match your search"
    pagination={{ page: visiblePage, pageSize, totalItems: filtered.length, onPageChange: setPage, onPageSizeChange: value => { setPageSize(value); setPage(1); }, showInfo: true }} />;
  const settingsView = <Stack gap="large">
    <AdminSection title="General" description="Set the account name and defaults for your team.">
      <Input label="Account name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} required />
      <Grid columns={2} gap="large" className="admin-details">
        <Select label="Default language" value={draft.language} onChange={event => setDraft({ ...draft, language: event.target.value })}>{['English (US)', 'English (UK)', 'French', 'German', 'Spanish'].map(value => <option key={value}>{value}</option>)}</Select>
        <Select label="Time zone" value={draft.timezone} onChange={event => setDraft({ ...draft, timezone: event.target.value })}>{['Pacific Time (US & Canada)', 'Mountain Time (US & Canada)', 'Central Time (US & Canada)', 'Eastern Time (US & Canada)', 'London'].map(value => <option key={value}>{value}</option>)}</Select>
      </Grid>
    </AdminSection>
    <AdminSection title="Notifications" description="Choose the updates and reminders your account sends.">
      <Switch label="Agreement updates" description="Receive notifications when an agreement changes status." checked={draft.notifications} onChange={value => setDraft({ ...draft, notifications: value })} /><Divider />
      <Switch label="Automatic reminders" description="Remind recipients when an agreement is waiting for their signature." checked={draft.reminders} onChange={value => setDraft({ ...draft, reminders: value })} />
    </AdminSection>
  </Stack>;
  const configuration = view === 'branding' ? <Stack gap="large">
    <AdminSection title="Default brand" description="Use a consistent identity on signing pages and agreement emails.">
      <Input label="Brand name" value={preferences.brandName} onChange={event => setPreferences({ ...preferences, brandName: event.target.value })} required />
      <Input label="Email display name" value={preferences.emailName} onChange={event => setPreferences({ ...preferences, emailName: event.target.value })} required />
      <Input label="Default email subject" value={preferences.emailSubject} onChange={event => setPreferences({ ...preferences, emailSubject: event.target.value })} required />
    </AdminSection>
    <AdminSection title="Signing preview"><Stack gap="medium"><Badge text="Default brand" kind="subtle" /><Text size="lg" weight="medium">{preferences.brandName || settings.name}</Text><Text size="sm">{preferences.emailSubject}</Text><Text size="sm" color="secondary">Review and sign the agreement sent by {preferences.emailName || settings.name}.</Text></Stack></AdminSection>
  </Stack> : view === 'signing-settings' ? <Stack gap="large">
    <AdminSection title="Signature adoption" description="Choose how recipients can add their signature.">
      <Switch label="Use a signature style" description="Let recipients choose a preformatted signature." checked={preferences.adoptSignature} onChange={value => setPreferences({ ...preferences, adoptSignature: value })} /><Divider />
      <Switch label="Draw a signature" checked={preferences.allowDraw} onChange={value => setPreferences({ ...preferences, allowDraw: value })} /><Divider />
      <Switch label="Upload a signature" checked={preferences.allowUpload} onChange={value => setPreferences({ ...preferences, allowUpload: value })} />
    </AdminSection>
    <AdminSection title="Recipient experience" description="Set the signing experience for recipients."><Switch label="Allow signing on mobile devices" checked={preferences.mobileSigning} onChange={value => setPreferences({ ...preferences, mobileSigning: value })} /><Divider /><Switch label="Allow recipients to reassign an agreement" checked={preferences.allowReassign} onChange={value => setPreferences({ ...preferences, allowReassign: value })} /></AdminSection>
  </Stack> : view === 'sending-settings' ? <Stack gap="large">
    <AdminSection title="Sending options" description="Set the default options for new envelopes."><Switch label="Allow comments" description="Senders and recipients can discuss an agreement." checked={preferences.allowComments} onChange={value => setPreferences({ ...preferences, allowComments: value })} /><Divider /><Switch label="Send automatic reminders" checked={draft.reminders} onChange={value => setDraft({ ...draft, reminders: value })} /></AdminSection>
    <AdminSection title="Reminders and expiration" description="Senders can adjust these defaults before sending."><Grid columns={2} gap="large" className="admin-details"><Select label="Remind recipients every" value={preferences.reminderDays} onChange={event => setPreferences({ ...preferences, reminderDays: event.target.value })}>{['1', '3', '7', '14'].map(value => <option key={value} value={value}>{value} {value === '1' ? 'day' : 'days'}</option>)}</Select><Select label="Expire envelopes after" value={preferences.expirationDays} onChange={event => setPreferences({ ...preferences, expirationDays: event.target.value })}>{['30', '60', '90', '120', '180'].map(value => <option key={value} value={value}>{value} days</option>)}</Select></Grid></AdminSection>
  </Stack> : <Stack gap="large">
    <AdminSection title="User authentication" description="Control how your team accesses this account."><Switch label="Require multi-factor authentication" description="Ask users to verify their identity when signing in." checked={preferences.requireMfa} onChange={value => setPreferences({ ...preferences, requireMfa: value })} /><Divider /><Switch label="Allow users to reset their password" checked={preferences.allowPasswordReset} onChange={value => setPreferences({ ...preferences, allowPasswordReset: value })} /></AdminSection>
    <AdminSection title="Session management" description="Protect account access on shared or unattended devices."><Select label="Sign users out after inactivity" value={preferences.sessionTimeout} onChange={event => setPreferences({ ...preferences, sessionTimeout: event.target.value })}>{['15 minutes', '30 minutes', '1 hour', '2 hours'].map(value => <option key={value}>{value}</option>)}</Select><Text size="sm" color="secondary">Changes apply the next time a user signs in.</Text></AdminSection>
  </Stack>;
  const pageConfiguration = ADMIN_SETTING_PAGES[view];
  const isCoreSettingsView = ['account-settings', 'branding', 'signing-settings', 'sending-settings', 'security'].includes(view);
  const isSettingsView = isCoreSettingsView || !!pageConfiguration;
  const genericSettings = pageConfiguration && <AdminSection title={ADMIN_VIEW_LABELS[view]} description={pageConfiguration.description}>
    {pageConfiguration.fields.map(field => field.options ? <Select key={field.id} label={field.label} value={String(genericValues[field.id] ?? field.options[0])} onChange={event => setGenericValues(values => ({ ...values, [field.id]: event.target.value }))}>{field.options.map(option => <option key={option}>{option}</option>)}</Select>
      : field.initial !== undefined ? <Input key={field.id} label={field.label} description={field.description} value={String(genericValues[field.id] ?? field.initial)} onChange={event => setGenericValues(values => ({ ...values, [field.id]: event.target.value }))} />
      : <Switch key={field.id} label={field.label} description={field.description} checked={Boolean(genericValues[field.id] ?? true)} onChange={value => setGenericValues(values => ({ ...values, [field.id]: value }))} />)}
  </AdminSection>;
  const activityRows = [
    { id: 'activity-1', name: 'Account settings updated', user: 'Akshat Mishra', date: 'Oct 22, 2026, 9:30 am', status: 'Complete' },
    { id: 'activity-2', name: 'User invitation sent', user: 'Akshat Mishra', date: 'Oct 21, 2026, 2:15 pm', status: 'Complete' },
    { id: 'activity-3', name: 'Permission profile updated', user: 'Maya Patel', date: 'Oct 20, 2026, 11:45 am', status: 'Complete' },
    { id: 'activity-4', name: 'Group membership updated', user: 'Ryan Chen', date: 'Oct 19, 2026, 4:10 pm', status: 'Complete' },
    { id: 'activity-5', name: 'Bulk user update', user: 'Akshat Mishra', date: 'Oct 18, 2026, 10:00 am', status: 'Complete' },
  ];
  const activityColumns: DataTableColumn<typeof activityRows[number]>[] = [{ key: 'name', header: 'Activity' }, { key: 'user', header: 'User' }, { key: 'date', header: 'Date and time' }, { key: 'status', header: 'Status', cell: row => <StatusLight kind="success" text={row.status} /> }];
  const secondaryPage = view === 'plan-billing' ? <Stack gap="large"><AdminSection title="Your plan" description="Review your subscription and the users on your account."><Inline justify="between" align="center" wrap><Stack gap="small"><Text size="lg" weight="semibold">Business Pro</Text><Text size="sm" color="secondary">{users.filter(user => user.status !== 'Inactive').length} of 25 seats in use</Text></Stack><Badge kind="success" text="Active" /></Inline><Divider /><Grid columns={2} gap="large"><Stack gap="small"><Text size="sm" color="secondary">Next renewal</Text><Text size="sm">January 14, 2027</Text></Stack><Stack gap="small"><Text size="sm" color="secondary">Billing contact</Text><Text size="sm">akshat@example.com</Text></Stack></Grid><Inline><Button kind="secondary" onClick={() => setNotice('Your current Business Pro plan has 25 user seats.')}>View plan details</Button></Inline></AdminSection></Stack>
    : view === 'system-status' ? <Stack gap="large"><Banner kind="success" closable={false}>All systems operational</Banner><AdminSection title="Service availability" description="Current status of the services used by your account.">{['eSignature', 'Docusign Admin', 'Connect', 'API'].map(service => <Inline key={service} justify="between" align="center"><Text size="sm">{service}</Text><StatusLight kind="success" text="Operational" /></Inline>)}</AdminSection></Stack>
    : view === 'sandbox' ? <AdminSection title="Sandbox accounts" description="Use a separate account to test settings and integrations before rolling them out to your team."><Text size="sm">No sandbox accounts have been created.</Text><Inline><Button kind="primary" onClick={() => setNotice('Sandbox account request created.')}>Create Sandbox</Button></Inline></AdminSection>
    : view === 'value-calculator' ? <AdminSection title="Estimate your time savings" description="Compare your agreement volume with the time saved per agreement."><Grid columns={2} gap="large" className="admin-details"><Input type="number" min="0" label="Agreements per month" value={String(genericValues['monthly-agreements'] ?? '250')} onChange={event => setGenericValues(values => ({ ...values, 'monthly-agreements': event.target.value }))} /><Input type="number" min="0" label="Minutes saved per agreement" value={String(genericValues['minutes-saved'] ?? '20')} onChange={event => setGenericValues(values => ({ ...values, 'minutes-saved': event.target.value }))} /></Grid><Text size="xl" weight="semibold">{Math.round(Number(genericValues['monthly-agreements'] ?? 250) * Number(genericValues['minutes-saved'] ?? 20) / 60).toLocaleString()} hours saved per month</Text></AdminSection>
    : view === 'updates' ? <AdminSection title="Recent updates" description="New capabilities and account improvements."><Stack gap="large">{[{ title: 'More control over agreement access', description: 'Grant users and groups access with permission profiles.' }, { title: 'Connected account health', description: 'Review delivery and certificate notifications in Admin.' }].map(update => <Stack key={update.title} gap="small"><Text size="md" weight="semibold">{update.title}</Text><Text size="sm" color="secondary">{update.description}</Text><Divider /></Stack>)}</Stack></AdminSection>
    : view === 'api-usage' ? <AdminSection title="API usage" description="Requests made by applications connected to your account."><Grid columns={3} gap="medium" className="admin-metrics">{[{ label: 'Requests this month', value: '1,284' }, { label: 'Successful requests', value: '99.7%' }, { label: 'Connected applications', value: '3' }].map(metric => <Stack key={metric.label} gap="small"><Text size="sm" color="secondary">{metric.label}</Text><Text size="xl" weight="semibold">{metric.value}</Text></Stack>)}</Grid></AdminSection>
    : <DataTable key={`admin-activity-${view}`} columns={activityColumns} data={view === 'bulk-actions' ? activityRows.filter(row => row.name.startsWith('Bulk')) : activityRows} getRowKey={row => row.id} showColumnControl stickyHeader pagination={{ page: 1, pageSize: 25, totalItems: view === 'bulk-actions' ? 1 : activityRows.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />;
  const searchableRows = view === 'groups' || view === 'signing-groups' ? groups : view === 'permission-profiles' ? profiles : connections;
  const matchingRows = searchableRows.filter(row => `${row.name} ${row.description}`.toLowerCase().includes(search.toLowerCase()));
  const resourcePagination = { page: Math.min(page, Math.max(1, Math.ceil(matchingRows.length / pageSize))), pageSize, totalItems: matchingRows.length, onPageChange: setPage, onPageSizeChange: (value: PageSizeOption) => { setPageSize(value); setPage(1); }, showInfo: true };
  const matchingIds = new Set(matchingRows.slice((resourcePagination.page - 1) * pageSize, resourcePagination.page * pageSize).map(row => row.id));
  const actions = isSettingsView ? <Button kind="primary" type="submit" form={settingsFormId}>Save changes</Button>
    : view === 'groups' || view === 'signing-groups' ? <Button kind="primary" startElement={<Icon name="plus" />} onClick={() => { setDialogError(''); setGroupDraft({ id: '', name: '', description: '', memberIds: [] }); }}>Add group</Button>
    : view === 'permission-profiles' ? <Button kind="primary" startElement={<Icon name="plus" />} onClick={() => { setDialogError(''); setProfileDraft({ id: '', name: '', description: '', canSend: true, canUseTemplates: true, canManage: false }); }}>Add permission profile</Button> : undefined;
  const usersToolbar = <Stack gap="large"><Text size="sm">Add new users and find, edit, close, or reactivate existing users.</Text><Inline gap="small" wrap><Button kind="primary" onClick={() => setAddingUser(true)}>Add User</Button><Button kind="secondary" onClick={() => setNotice(`User export prepared with ${filtered.length} users.`)}>Download Users</Button><Button kind="secondary" onClick={() => { setBulkFile(''); setBulkAction('add'); }}>Bulk Add</Button><Button kind="secondary" onClick={() => { setBulkFile(''); setBulkAction('update'); }}>Bulk Update</Button></Inline></Stack>;
  const listViews: AdminView[] = ['users', 'groups', 'signing-groups', 'permission-profiles', 'integrations'];
  const userFilters = <Inline gap="small" align="center" wrap>
    <Dropdown variant="solid" items={['Active and pending', 'All statuses', 'Active', 'Pending', 'Inactive'].map(value => ({ label: value, selected: status === value, onClick: () => { setStatus(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{status === 'Active and pending' ? 'Status · 2' : status === 'All statuses' ? 'Status: All' : `Status: ${status}`}</Button></Dropdown>
    <Dropdown variant="solid" items={['All', ...profiles.map(profile => profile.name)].map(value => ({ label: value, selected: permissionFilter === value, onClick: () => { setPermissionFilter(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>Permissions: {permissionFilter}</Button></Dropdown>
    <Dropdown variant="solid" items={['All', ...groups.map(group => group.name)].map(value => ({ label: value, selected: groupFilter === value, onClick: () => { setGroupFilter(value); setPage(1); } }))}><Button kind="secondary" size="small" menuTrigger>{groupFilter === 'All' ? 'Groups' : groupFilter}</Button></Dropdown>
    <Button kind="tertiary" size="small" onClick={() => { setSearch(''); setStatus('All statuses'); setPermissionFilter('All'); setGroupFilter('All'); setPage(1); }}>Clear All</Button>
  </Inline>;
  return <>
    <AgreementTableView paddingVariant="compact" pageHeader={view === 'overview' ? null : <Stack gap="large"><PageHeader title={ADMIN_VIEW_LABELS[view]} actions={actions} />{view === 'users' && usersToolbar}</Stack>} banner={notice ? <Banner kind="success" onClose={() => setNotice('')}>{notice}</Banner> : undefined} filterBar={listViews.includes(view) ? <FilterBar search={{ value: search, onChange: value => { setSearch(value); setPage(1); }, placeholder: view === 'users' ? 'Search Here' : `Search ${ADMIN_VIEW_LABELS[view].toLowerCase()}` }} filters={view === 'users' ? userFilters : undefined} /> : null}>
      {view === 'overview' ? overview : view === 'users' ? userList : view === 'groups' || view === 'signing-groups' ? <DataTable key={`admin-${view}`} columns={groupColumns} data={groups.filter(group => matchingIds.has(group.id))} getRowKey={group => group.id} rowHeight="tall" stickyHeader showColumnControl emptyMessage="No groups match your search" pagination={resourcePagination} />
        : view === 'permission-profiles' ? <DataTable key="admin-profiles" columns={profileColumns} data={profiles.filter(profile => matchingIds.has(profile.id))} getRowKey={profile => profile.id} rowHeight="tall" stickyHeader showColumnControl emptyMessage="No permission profiles match your search" pagination={resourcePagination} />
        : view === 'integrations' ? <DataTable key="admin-connections" columns={connectionColumns} data={connections.filter(connection => matchingIds.has(connection.id))} getRowKey={connection => connection.id} rowHeight="tall" stickyHeader showColumnControl emptyMessage="No connected apps match your search" pagination={resourcePagination} />
        : isSettingsView ? <form id={settingsFormId} onSubmit={event => { event.preventDefault(); if (!draft.name.trim()) return; const saved = { ...draft, name: draft.name.trim() }; setDraft(saved); onSettingsChange(saved); setNotice(`${ADMIN_VIEW_LABELS[view]} saved.`); }}>{view === 'account-settings' ? settingsView : pageConfiguration ? genericSettings : configuration}</form>
        : secondaryPage}
    </AgreementTableView>
    {addingUser && <AddUserDialog users={users} onClose={() => setAddingUser(false)} onSave={user => { onUsersChange(rows => [...rows, user]); setAddingUser(false); setSearch(''); setStatus('All statuses'); setPage(1); setNotice('User added.'); }} />}
    {groupDraft && <Modal open onClose={() => setGroupDraft(null)} title={groupDraft.id ? 'Manage group' : 'Add group'} size="medium" footer={<Inline gap="small" justify="end"><Button kind="secondary" onClick={() => setGroupDraft(null)}>Cancel</Button><Button kind="primary" type="submit" form={resourceFormId}>Save group</Button></Inline>}>
      <form id={resourceFormId} onSubmit={event => { event.preventDefault(); const name = groupDraft.name.trim(); if (!name) return; if (groups.some(group => group.id !== groupDraft.id && group.name.toLowerCase() === name.toLowerCase())) { setDialogError('A group with this name already exists.'); return; } const saved = { ...groupDraft, name, id: groupDraft.id || crypto.randomUUID() }; setGroups(rows => groupDraft.id ? rows.map(row => row.id === saved.id ? saved : row) : [...rows, saved]); setGroupDraft(null); setNotice(`${name} saved.`); }}><Stack gap="large"><Input label="Group name" value={groupDraft.name} onChange={event => { setGroupDraft({ ...groupDraft, name: event.target.value }); setDialogError(''); }} required error={dialogError} readOnly={groupDraft.id === 'group-1'} /><Input label="Description" value={groupDraft.description} onChange={event => setGroupDraft({ ...groupDraft, description: event.target.value })} /><Stack gap="medium"><Text size="sm" weight="semibold">Group members</Text>{users.map(user => <Checkbox key={user.id} label={user.name} description={user.email} checked={groupDraft.memberIds.includes(user.id)} disabled={groupDraft.id === 'group-1'} onChange={event => setGroupDraft({ ...groupDraft, memberIds: event.target.checked ? [...groupDraft.memberIds, user.id] : groupDraft.memberIds.filter(id => id !== user.id) })} />)}</Stack></Stack></form>
    </Modal>}
    {profileDraft && <Modal open onClose={() => setProfileDraft(null)} title="Add permission profile" size="medium" footer={<Inline gap="small" justify="end"><Button kind="secondary" onClick={() => setProfileDraft(null)}>Cancel</Button><Button kind="primary" type="submit" form={resourceFormId}>Save profile</Button></Inline>}><form id={resourceFormId} onSubmit={event => { event.preventDefault(); const name = profileDraft.name.trim(); if (!name) return; if (profiles.some(profile => profile.name.toLowerCase() === name.toLowerCase())) { setDialogError('A permission profile with this name already exists.'); return; } setProfiles(rows => [...rows, { ...profileDraft, id: crypto.randomUUID(), name }]); setProfileDraft(null); setNotice(`${name} created.`); }}><Stack gap="large"><Input label="Profile name" required value={profileDraft.name} error={dialogError} onChange={event => { setProfileDraft({ ...profileDraft, name: event.target.value }); setDialogError(''); }} /><Input label="Description" value={profileDraft.description} onChange={event => setProfileDraft({ ...profileDraft, description: event.target.value })} /><Checkbox label="Send envelopes" checked={profileDraft.canSend} onChange={event => setProfileDraft({ ...profileDraft, canSend: event.target.checked })} /><Checkbox label="Use and create templates" checked={profileDraft.canUseTemplates} onChange={event => setProfileDraft({ ...profileDraft, canUseTemplates: event.target.checked })} /><Checkbox label="Manage account settings and users" checked={profileDraft.canManage} onChange={event => setProfileDraft({ ...profileDraft, canManage: event.target.checked })} /></Stack></form></Modal>}
    {connectionDraft && <Modal open onClose={() => setConnectionDraft(null)} title={connectionDraft.name} size="medium" footer={<Inline gap="small" justify="end"><Button kind="secondary" onClick={() => setConnectionDraft(null)}>Cancel</Button><Button kind="primary" onClick={() => { setConnections(rows => rows.map(row => row.id === connectionDraft.id ? connectionDraft : row)); setNotice(`${connectionDraft.name} ${connectionDraft.connected ? 'connected' : 'disconnected'}.`); setConnectionDraft(null); }}>Save connection</Button></Inline>}><Stack gap="large"><Text size="sm" color="secondary">{connectionDraft.description}</Text><Switch label={`Enable ${connectionDraft.name} connection`} checked={connectionDraft.connected} onChange={value => setConnectionDraft({ ...connectionDraft, connected: value })} /><Text size="sm" color="secondary">Connection owner: Akshat Mishra</Text></Stack></Modal>}
  </>;
}

/* ═══════════════════════════════════════
   Footer
   ═══════════════════════════════════════ */

function Footer() {
  const links = [
    { label: 'Contact Us', href: 'https://support.docusign.com/contactSupport' },
    { label: 'Terms of Use', href: 'https://www.docusign.com/legal/terms-and-conditions' },
    { label: 'Privacy', href: 'https://www.docusign.com/privacy' },
    { label: 'Intellectual Property', href: 'https://www.docusign.com/ip' },
    { label: 'Trust', href: 'https://www.docusign.com/trust' },
  ];
  return (
    <footer style={{
      borderTop: 'var(--ink-border-width-xs) solid var(--ink-border-subtle)',
      padding: 'var(--ink-spacing-200) var(--ink-spacing-300)',
      marginTop: 'auto',
    }}>
      <Inline justify="between" align="center" gap="small" wrap>
        <Inline gap="small" align="center" wrap>
          <Text size="xs" color="secondary">English (US)</Text>
          <Icon name="chevron-down" size={12} />
          <Text size="xs" color="secondary" style={{ margin: '0 var(--ink-spacing-100)' }}>|</Text>
          {links.map(link => (
            <Link key={link.label} href={link.href} kind="subtle" size="xs" discrete target="_blank">
              {link.label}
            </Link>
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
const VALID_TABS: TabId[] = ['home', 'agreements', 'templates', 'automations', 'insights', 'admin', 'scenarios', 'tokens'];

interface TokenPreviewData {
  capturedDate: string;
  snapshotHash: string;
  groups: {id:string;attributes:Record<string,string>;checks:[string,string][]}[];
}

function TokenPreviewPage() {
  const [fixture,setFixture]=useState<TokenPreviewData|null>(null);
  const [result,setResult]=useState<{checked:number;failures:string[]}|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`${import.meta.env.BASE_URL}figma-token-preview.json`,{signal:controller.signal})
      .then(response=>{if(!response.ok) throw new Error('Unable to load the token reference.');return response.json() as Promise<TokenPreviewData>;})
      .then(setFixture).catch(error=>{if(error.name!=='AbortError')setError(error.message);});
    return ()=>controller.abort();
  },[]);
  const verify=useCallback(()=>{
    if(!fixture) return;
    let checked=0;
    const failures:string[]=[];
    for(const group of fixture.groups) {
      const element=document.querySelector<HTMLElement>(`[data-token-check-group="${group.id}"]`);
      if(!element){failures.push(`Missing scope: ${group.id}`);continue;}
      const style=getComputedStyle(element);
      for(const [token,expected] of group.checks){checked++;const actual=style.getPropertyValue(token).trim();if(actual!==expected)failures.push(`${group.id}: ${token}`);}
    }
    setResult({checked,failures});
  },[fixture]);
  useEffect(()=>{verify();},[verify]);
  const modes=[{id:'standard',label:'Standard'},{id:'inverse',label:'Inverse'},{id:'standard-touch',label:'Standard (Touch)'},{id:'inverse-touch',label:'Inverse (Touch)'}];
  return <Container size="xlarge" className="token-preview-page">
    <Stack gap="large">
      <PageHeader title="Figma token preview" actions={<Inline gap="small" wrap><Button kind="secondary" href={`${import.meta.env.BASE_URL}components`}>Component gallery</Button><Button kind="primary" onClick={verify} disabled={!fixture}>Run token check</Button></Inline>} />
      <Text color="secondary">Live CSS checked against the Figma export from {fixture?.capturedDate ?? 'the current snapshot'}. This verifies token values and modes; component layout is reviewed separately.</Text>
      {error && <Banner kind="danger" closable={false}>{error}</Banner>}
      {result && <Banner kind={result.failures.length?'danger':'success'} closable={false}>
        {result.failures.length?`${result.failures.length} token checks failed.`:`All ${result.checked.toLocaleString('en-US')} browser token checks passed.`}
      </Banner>}
      <Grid columns={2} gap="large" className="token-preview-modes">
        {modes.map(mode=><Card key={mode.id}><Card.Body>
          <Stack gap="large" data-ink-mode={mode.id} className="token-mode-sample">
            <Heading level={2}>{mode.label}</Heading>
            <Text>Agreement ready for review</Text>
            <Text size="sm" color="secondary">Semantic colors, typography and controls on the current surface.</Text>
            <Inline gap="small" wrap><Button kind="primary" size="medium" inverted={mode.id.includes('inverse')}>Review agreement</Button><Button kind="secondary" size="medium" inverted={mode.id.includes('inverse')}>Save draft</Button></Inline>
            <Text size="xs" color="secondary">Both actions: medium · {mode.id.includes('touch') ? '48px' : '40px'}. Compare all sizes in the component gallery.</Text>
            <Input label={`Agreement name · ${mode.label}`} defaultValue="Consulting agreement" />
            <Inline gap="small"><Badge kind="success" text="Completed" /><Badge kind="warning" text="Pending" /></Inline>
            <Stack gap="none" className="token-gradient-sample" aria-label={`Pearl gradient · ${mode.label}`}>{null}</Stack>
          </Stack>
        </Card.Body></Card>)}
      </Grid>
      {result?.failures.length ? <Banner kind="danger" closable={false}>{result.failures.slice(0,5).join('; ')}</Banner> : null}
      <Stack gap="none" hidden aria-hidden>
        {fixture?.groups.map(group=><Stack key={group.id} gap="none" {...group.attributes} data-token-check-group={group.id}>{null}</Stack>)}
      </Stack>
    </Stack>
  </Container>;
}

/* The component gallery is a separate review surface, outside the product shell.
   Examples use the same public Ink components that build the prototype. */
const GALLERY_MODES = [
  { id: 'standard', label: 'Standard' },
  { id: 'inverse', label: 'Inverse' },
  { id: 'standard-touch', label: 'Standard (Touch)' },
  { id: 'inverse-touch', label: 'Inverse (Touch)' },
];

function GalleryButtons() {
  const [mode, setMode] = useState('standard');
  const { toast } = useToast();
  const inverted = mode.includes('inverse');
  const touch = mode.includes('touch');
  const sizes: { size: ButtonSize; label: string; height: string }[] = [
    { size: 'small', label: 'Small', height: touch ? '48px' : '32px' },
    { size: 'medium', label: 'Medium · default', height: touch ? '48px' : '40px' },
    { size: 'large', label: 'Large', height: '48px' },
    { size: 'xlarge', label: 'Extra large', height: '56px' },
  ];
  const kinds: ButtonKind[] = ['brand', 'primary', 'secondary', 'tertiary', 'danger'];
  return <Stack gap="large">
    <Select label="Button mode" value={mode} onChange={event => setMode(event.target.value)}>
      {GALLERY_MODES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>
    <Stack gap="large" data-ink-mode={mode} className="token-mode-sample" data-gallery-button-mode={mode}>
      <Grid columns={4} gap="large" className="gallery-button-sizes">
        {sizes.map(item => <Stack key={item.size} gap="small" align="start">
          <Text size="sm" weight="semibold">{item.label}</Text>
          <Text size="xs" color="secondary">{item.height} high</Text>
          <Button size={item.size} kind="primary" inverted={inverted} onClick={() => toast({ children: `${item.label} button selected.` })}>Continue</Button>
        </Stack>)}
      </Grid>
      <Divider />
      <Text size="sm" weight="semibold">Kinds · all medium</Text>
      <Inline gap="small" wrap>
        {kinds.map(kind => <Button key={kind} kind={kind} size="medium" inverted={inverted} onClick={() => toast({ children: `${kind} button selected.` })}>{kind.charAt(0).toUpperCase() + kind.slice(1)}</Button>)}
      </Inline>
      <Text size="sm" weight="semibold">States and content · all medium</Text>
      <Inline gap="small" wrap>
        <Button kind="primary" inverted={inverted} disabled>Disabled</Button>
        <Button kind="primary" inverted={inverted} loading>Loading</Button>
        <Button kind="secondary" inverted={inverted} active>Active</Button>
        <Button kind="secondary" inverted={inverted} startElement={<Icon name="plus" />} onClick={() => toast({ children: 'Add action selected.' })}>With icon</Button>
        <Dropdown items={[{ label: 'Review agreement', onClick: () => toast({ children: 'Review selected.' }) }, { label: 'Save draft', onClick: () => toast({ children: 'Save draft selected.' }) }]}><Button kind="secondary" inverted={inverted} menuTrigger>Menu trigger</Button></Dropdown>
      </Inline>
    </Stack>
    <Text size="sm" color="secondary">Small and medium follow Figma CTA sizing; Touch makes both 48px high. Large and extra large are additional code sizes. Hover or Tab to a button to inspect hover and focus.</Text>
  </Stack>;
}

function GalleryInputs() {
  return <Stack gap="medium">
    <Input label="Agreement name" defaultValue="Consulting agreement" description="Default medium input" />
    <Input label="Small input" size="small" placeholder="Enter a name" />
    <Input label="Recipient email" type="email" defaultValue="alex" error="Enter a valid email address." required />
    <Input label="Read only" value="AGR-2026-104" readOnly />
    <Input label="Disabled input" defaultValue="Unavailable" disabled />
    <TextArea label="Message to recipients" placeholder="Add a message" />
  </Stack>;
}

function GallerySelection() {
  const radioName = useId();
  const [enabled, setEnabled] = useState(true);
  return <Stack gap="medium">
    <Checkbox label="Include a signed copy" defaultChecked />
    <Checkbox label="Select some recipients" indeterminate />
    <Checkbox label="Disabled checkbox" disabled />
    <Divider />
    <Radio label="Send in signing order" name={radioName} value="ordered" defaultChecked />
    <Radio label="Send to everyone at once" name={radioName} value="all" />
    <Radio label="Disabled option" name={radioName} value="disabled" disabled />
    <Switch label="Automatic reminders" checked={enabled} onChange={setEnabled} />
    <Switch label="Disabled switch" disabled />
    <Inline gap="small" wrap><ToggleButton text="Favorite" icon={<Icon name="star" />} /><ToggleButton text="Selected" defaultSelected /><ToggleButton text="Disabled" disabled /></Inline>
  </Stack>;
}

function GalleryChoices() {
  const [owner, setOwner] = useState('akshat');
  return <Stack gap="medium">
    <Select label="Agreement type" defaultValue="consulting"><option value="consulting">Consulting agreement</option><option value="nda">Non-disclosure agreement</option><option value="services">Services agreement</option></Select>
    <ComboBox label="Owner" value={owner} onChange={setOwner} clearable options={[{ value: 'akshat', label: 'Akshat Mishra' }, { value: 'alex', label: 'Alex Morgan' }, { value: 'riley', label: 'Riley Chen', disabled: true }]} />
    <ComboBox label="Editable combo box" editable value={owner} onChange={setOwner} options={[{ value: 'akshat', label: 'Akshat Mishra' }, { value: 'alex', label: 'Alex Morgan' }]} />
  </Stack>;
}

function GallerySearch() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  return <Stack gap="medium"><SearchInput aria-label="Search sample documents" placeholder="Search sample documents" value={query} onChange={setQuery} suggestions={[{ id: 'consulting', label: 'Consulting agreement' }, { id: 'nda', label: 'Non-disclosure agreement' }].filter(item => item.label.toLowerCase().includes(query.toLowerCase()))} onSuggestionSelect={item => { setQuery(item.label); setSelected(item.label); }} /><SearchInput aria-label="Disabled search" placeholder="Disabled search" disabled /><Text size="sm" color="secondary" role="status">{selected ? `Selected: ${selected}` : 'Focus the search field to try suggestions.'}</Text></Stack>;
}

function GalleryTags() {
  const [removed, setRemoved] = useState(false);
  const [filter, setFilter] = useState(true);
  return <Stack gap="medium">
    <Inline gap="small" wrap><Chip selected>Selected chip</Chip><Chip kind="AI">AI chip</Chip><Chip disabled>Disabled chip</Chip></Inline>
    <Inline gap="small" wrap>
      {!removed && <Tag text="Legal review" onRemove={() => setRemoved(true)} />}
      <Tag text="Read only" />
      <FilterTag label="Completed" active={filter} onClick={() => setFilter(value => !value)} />
    </Inline>
    {removed && <Button kind="tertiary" size="small" onClick={() => setRemoved(false)}>Restore tag</Button>}
  </Stack>;
}

function GalleryRanges() {
  const [value, setValue] = useState(60);
  return <Stack gap="large"><Slider label="Review progress" value={value} onChange={setValue} showValue /><Slider label="Disabled slider" value={40} onChange={setValue} disabled /><ZoomControl direction="row" /><StarRating label="Rate this experience" defaultValue={3} /></Stack>;
}

function GalleryDates() {
  const [date, setDate] = useState<Date | null>(new Date(2026, 9, 21));
  return <Stack gap="large"><DatePicker label="Due date" value={date} onChange={setDate} /><DatePicker label="Calendar" value={date} onChange={setDate} standalone /></Stack>;
}

function GalleryUploads() {
  const [files, setFiles] = useState<FileInputFile[]>([]);
  return <Stack gap="large"><FileInput label="Attach documents" value={files} onChange={setFiles} multiple /><FileUpload label="Upload area" small helperText="Files stay in this local preview." /><FileUpload label="Disabled upload" small disabled /></Stack>;
}

function GalleryMenus() {
  const [lastAction, setLastAction] = useState('Choose an action');
  const [open, setOpen] = useState(false);
  const items = [{ label: 'Edit draft', onClick: () => setLastAction('Edit draft selected') }, { label: 'Duplicate', onClick: () => setLastAction('Duplicate selected') }, { label: 'Unavailable action', disabled: true }, { label: 'More options', children: [{ label: 'Download a copy', onClick: () => setLastAction('Download selected') }] }];
  return <Stack gap="medium">
    <Inline gap="small" wrap>
      <Dropdown items={items}><Button kind="secondary" menuTrigger>Actions</Button></Dropdown>
      <Dropdown items={items} open={open} onOpenChange={setOpen}><ComboButton variant="secondary" onClick={event => { event.preventDefault(); setLastAction('Main split action selected'); }} onDropdownClick={() => setOpen(value => !value)} dropdownExpanded={open} dropdownLabel="More send options">Send</ComboButton></Dropdown>
    </Inline>
    <Text size="sm" color="secondary" role="status">{lastAction}</Text>
    <Popover label="About agreement review" content={<Text size="sm">Review every field before sending an agreement.</Text>}><Button kind="secondary">Open popover</Button></Popover>
    <Tooltip text="More information about this field"><Button kind="tertiary">Hover or focus for tooltip</Button></Tooltip>
  </Stack>;
}

function GalleryNavigation() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  return <Stack gap="large">
    <Breadcrumb items={[{ label: 'Agreements', href: `${import.meta.env.BASE_URL}#agreements` }, { label: 'Consulting agreement', current: true }]} />
    <Tabs aria-label="Example agreement tabs" tabs={[{ id: 'details', label: 'Details', content: <Text size="sm">Agreement details appear here.</Text> }, { id: 'activity', label: 'Activity', content: <Text size="sm">The agreement was created on October 21, 2026.</Text> }, { id: 'unavailable', label: 'Disabled', disabled: true }]} />
    <SegmentedControl label="View" value={view} onChange={setView} items={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }, { value: 'disabled', label: 'Disabled', disabled: true }]} />
    <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
  </Stack>;
}

function GalleryCards() {
  const { toast } = useToast();
  return <Grid columns={3} gap="medium" className="gallery-three-columns">
    <Card radius="large"><Card.Header><Text weight="semibold">Card</Text></Card.Header><Card.Body><Text size="sm">A simple surface for related content.</Text></Card.Body><Card.Footer><Button kind="secondary" size="small" onClick={() => toast({ children: 'Card action selected.' })}>View details</Button></Card.Footer></Card>
    <TaskCard><TaskCard.Header heading="Review agreement" showIcon={false} /><TaskCard.Body><Text size="sm">The consulting agreement is ready.</Text></TaskCard.Body><TaskCard.Footer metadata="Due October 23" actionLabel="Review" onActionClick={() => toast({ children: 'Task action selected.' })} /></TaskCard>
    <PreviewCard heading={<PreviewCard.Heading text="Document collection" description="Preview card" />} onOpen={() => toast({ children: 'Preview opened.' })} openLabel="Open document collection"><PreviewCard.Image src={powerFormsEmptyArt} alt="Document collection illustration" kind="image" /></PreviewCard>
  </Grid>;
}

function GallerySelectableTiles() {
  return <SelectTileGroup label="Choose how to start" defaultValue="upload"><SelectTile value="upload" label="Upload a document" description="Start with your own file." icon={<Icon name="upload" />} /><SelectTile value="template" label="Use a template" description="Reuse a saved agreement." icon={<Icon name="document" />} /><SelectTile value="disabled" label="Unavailable" disabled /></SelectTileGroup>;
}

function GalleryAccordions() {
  return <Accordion defaultOpenItems={['details']} items={[{ id: 'details', title: 'Agreement details', content: <Text size="sm">Consulting agreement · Acme Technologies</Text> }, { id: 'recipients', title: 'Recipients', subtitle: 'Two people', content: <Text size="sm">Akshat Mishra and Alex Morgan</Text> }, { id: 'disabled', title: 'Disabled section', content: null, disabled: true }]} />;
}

function GalleryLists() {
  const { toast } = useToast();
  return <Stack gap="large">
    <List variant="divided"><List.Item startElement={<Avatar initials="AM" size="small" />} description="Agreement owner" meta="Today" clickable onClick={() => toast({ children: 'Akshat Mishra selected.' })}>Akshat Mishra</List.Item><List.Item startElement={<Avatar initials="AC" size="small" colorIndex={2} />} description="Recipient" selected>Acme Technologies</List.Item></List>
    <Tree label="Agreement folders" defaultExpandedIds={['agreements']} items={[{ id: 'agreements', label: 'Agreements', icon: <Icon name="folder" />, children: [{ id: 'legal', label: 'Legal' }, { id: 'sales', label: 'Sales' }, { id: 'archive', label: 'Archive', disabled: true }] }]} />
  </Stack>;
}

function GalleryProgress() {
  return <Stack gap="large"><ProgressBar label="Uploading agreement" value={65} /><ProgressBar label="Completed upload" kind="success" value={100} /><Meter label="Agreement health" content="Healthy" kind="semantic-high" value={80} /><Inline gap="large"><Spinner size="small" label="Small spinner" /><Spinner size="medium" label="Medium spinner" /><Spinner size="large" label="Large spinner" /></Inline><Skeleton lines={3} /><Inline gap="small"><Skeleton variant="circular" size="md" /><Skeleton variant="rounded" width="60%" height="var(--ink-spacing-500)" /></Inline></Stack>;
}

function GalleryWorkflows() {
  const [step, setStep] = useState(1);
  return <Stack gap="large"><Stepper activeStep={step} clickable onStepClick={setStep} steps={[{ id: 'prepare', title: 'Prepare', completed: step > 0 }, { id: 'review', title: 'Review', completed: step > 1 }, { id: 'send', title: 'Send' }]} /><WorkflowStepper items={[{ id: 'upload', text: 'Upload documents', status: 'visited', isComplete: true }, { id: 'recipients', text: 'Add recipients', description: 'Choose who needs to sign.', status: 'current', children: <Text size="sm">Akshat Mishra · Needs to sign</Text>, defaultExpanded: true }, { id: 'finish', text: 'Send agreement' }]} /><Timeline items={[{ id: 'created', label: 'Agreement created', timestamp: 'Oct 21, 2026', status: 'complete' }, { id: 'review', label: 'In review', description: 'Awaiting the legal team', status: 'current' }, { id: 'signed', label: 'Signed', status: 'incomplete' }]} /></Stack>;
}

function GalleryNotifications() {
  const { toast } = useToast();
  return <Stack gap="medium"><Banner kind="information" closable={false}>Review all fields before sending.</Banner><Banner kind="success" closable={false}>Your agreement is ready.</Banner><Banner kind="warning" closable={false}>One recipient still needs an email.</Banner><Banner kind="danger" closable={false}>The document could not be processed.</Banner><Alert kind="information" title="Inline alert">A compact message with a title.</Alert><Toast duration={0} closeButton={false} kind="success">Persistent toast specimen</Toast><Inline gap="small" wrap><Button kind="secondary" onClick={() => toast({ children: 'Agreement saved in this demo.', kind: 'success' })}>Show success toast</Button><Button kind="secondary" onClick={() => toast({ children: 'A demonstration error.', kind: 'danger' })}>Show error toast</Button></Inline></Stack>;
}

function GalleryOverlays() {
  const [overlay, setOverlay] = useState<'modal' | 'drawer' | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = () => {
    setOverlay(null);
    requestAnimationFrame(() => { if (opener.current?.isConnected) opener.current.focus(); });
  };
  return <Stack gap="medium">
    <Text size="sm" color="secondary">Open an overlay to inspect its real size, backdrop, focus and dismissal behavior.</Text>
    <Inline gap="small" wrap><Button kind="secondary" onClick={event => { opener.current = event.currentTarget; setOverlay('modal'); }}>Open modal</Button><Button kind="secondary" onClick={event => { opener.current = event.currentTarget; setOverlay('drawer'); }}>Open drawer</Button></Inline>
    <Modal open={overlay === 'modal'} onClose={close} title="Review agreement" footer={<Inline gap="small" justify="end"><Button kind="secondary" onClick={close}>Cancel</Button><Button kind="primary" onClick={close}>Done</Button></Inline>}><Stack gap="medium"><Text>Make sure the recipients and agreement details are correct.</Text><Input label="Agreement name" defaultValue="Consulting agreement" /></Stack></Modal>
    <Drawer open={overlay === 'drawer'} onClose={close} title="Agreement details" footer={<Button kind="primary" onClick={close}>Done</Button>}><Stack gap="medium"><Text>Consulting agreement</Text><Badge kind="success" text="Completed" /><Text size="sm" color="secondary">Signed October 21, 2026</Text></Stack></Drawer>
    <Callout heading="Ready for review" closeButton={false} enableArrow={false} width="small"><Text size="sm">Use a callout for contextual guidance.</Text></Callout>
  </Stack>;
}

function GalleryPanels() {
  return <Inline gap="medium" align="stretch" wrap><Panel header={<Text weight="semibold">Agreement summary</Text>} closeButton={false} collapsible rail={<Icon name="document" />} footer={<Text size="xs" color="secondary">Supplemental panel</Text>}><Text size="sm">Consulting agreement · Acme Technologies</Text></Panel><Rail background="secondary"><Stack gap="small" align="center"><Icon name="document" /><Text size="xs">Rail</Text></Stack></Rail></Inline>;
}

const GALLERY_AGREEMENTS = [AGREEMENTS_DATA[1], AGREEMENTS_DATA[6], AGREEMENTS_DATA[10]];
const GALLERY_COLUMNS: DataTableColumn<Agreement>[] = [
  { key: 'name', header: 'Agreement', sortable: true },
  { key: 'status', header: 'Status', cell: row => <Badge kind={row.status === 'Completed' ? 'success' : 'warning'} text={row.status} /> },
  { key: 'date', header: 'Last changed' },
];

function GalleryTableLayout() {
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState('default');
  const rows = GALLERY_AGREEMENTS.filter(row => row.name.toLowerCase().includes(search.toLowerCase()));
  return <Stack gap="large"><Select label="Table row density" value={density} onChange={event => setDensity(event.target.value)}><option value="compact">Compact</option><option value="default">Default</option><option value="tall">Tall</option></Select><AgreementTableView paddingVariant="compact" pageHeader={<PageHeader title="Agreements" />} filterBar={<FilterBar search={{ value: search, onChange: setSearch, placeholder: 'Search sample agreements' }} />}><DataTable columns={GALLERY_COLUMNS} data={rows} getRowKey={row => row.id} rowHeight={density as 'compact' | 'default' | 'tall'} selectable showColumnControl emptyMessage="No sample agreements match" /></AgreementTableView></Stack>;
}

function GallerySimpleTable() {
  return <Table columns={GALLERY_COLUMNS} data={GALLERY_AGREEMENTS} getRowKey={row => row.id} selectable />;
}

function GalleryLocalNavigation() {
  const [active, setActive] = useState('inbox');
  return <LocalNav headerLabel="Agreements" activeItemId={active} sections={[{ id: 'manage', title: 'Manage', items: [{ id: 'inbox', label: 'Inbox', icon: 'inbox', onClick: () => setActive('inbox') }, { id: 'drafts', label: 'Drafts', icon: 'document', onClick: () => setActive('drafts') }, { id: 'completed', label: 'Completed', icon: 'check', onClick: () => setActive('completed') }] }]} />;
}

function GalleryChat() {
  const [messages, setMessages] = useState<InkChatMessage[]>([{ id: 'welcome', role: 'assistant', content: 'What would you like to know about this agreement?', timestamp: new Date(2026, 9, 21, 9) }]);
  const send = (content: string) => setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date() }, { id: crypto.randomUUID(), role: 'assistant', content: 'This is a local component example. The consulting agreement is ready for review.', timestamp: new Date() }]);
  return <AIChat messages={messages} onSendMessage={send} maxHeight="var(--gallery-chat-height)" showHeader={false} showTimestamps={false} showActions={false} showFeedback={false} disableAutoScroll />;
}

function GalleryAgent() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'proposed' | 'complete' | 'cancelled'>('proposed');
  return <Stack gap="large"><ThinkingSteps steps={[{ id: 'read', title: 'Read agreement', status: 'complete' }, { id: 'review', title: 'Review terms', status: 'active', progress: 65 }, { id: 'summarize', title: 'Summarize findings', status: 'pending' }]} /><AgentActionCard action={{ id: 'review', type: 'analyze', label: 'Review agreement', description: 'Check the consulting agreement for missing details.', status, result: status === 'complete' ? { output: 'Review complete. No missing details in this sample.' } : undefined }} onExecute={() => setStatus('complete')} onCancel={() => setStatus('cancelled')} />{status !== 'proposed' && <Button kind="tertiary" size="small" onClick={() => setStatus('proposed')}>Reset action</Button>}<Button kind="secondary" onClick={() => setOpen(true)}>Open agent panel</Button><Portal><AgentPanel isOpen={open} onClose={() => setOpen(false)} title="Agreement assistant" subtitle="Local component example"><GalleryChat /></AgentPanel></Portal><Stack gap="none" className="gallery-canvas"><AgentCanvas mode="custom"><Text size="sm">Agent canvas · Agreement preview</Text></AgentCanvas></Stack></Stack>;
}

function GalleryTypography() {
  return <Stack gap="medium"><Heading level={2}>Heading two</Heading><Heading level={3}>Heading three</Heading><Heading level={4}>Heading four</Heading>{(['xl', 'lg', 'md', 'sm', 'xs'] as const).map(size => <Text key={size} size={size}>Body text · {size}</Text>)}<Inline gap="small" wrap><Text weight="regular">Regular</Text><Text weight="medium">Medium</Text><Text weight="semibold">Semibold</Text><Text weight="bold">Bold</Text></Inline><Text color="secondary">Secondary text</Text><Link href={`${import.meta.env.BASE_URL}#home`}>Open prototype</Link><Divider /></Stack>;
}

function GalleryIcons() {
  const { toast } = useToast();
  return <Stack gap="large"><Inline gap="large" wrap>{['document', 'folder', 'search', 'plus', 'check', 'settings', 'star', 'calendar'].map(name => <Stack key={name} gap="small" align="center"><Icon name={name} /><Text size="xs" color="secondary">{name}</Text></Stack>)}</Inline><Inline gap="small" wrap><IconButton icon="plus" size="small" variant="primary" aria-label="Small add button" onClick={() => toast({ children: 'Small icon button selected.' })} /><IconButton icon="plus" size="medium" variant="primary" aria-label="Medium add button" onClick={() => toast({ children: 'Medium icon button selected.' })} /><IconButton icon="bell" badge={3} aria-label="Notifications, three unread" onClick={() => toast({ children: 'Notifications selected.' })} /><IconButton icon="plus" disabled aria-label="Disabled add button" /><Hotspot label="Explain this agreement field" onClick={() => toast({ children: 'Hotspot selected.' })} /></Inline><Inline gap="large"><AIIcon name="ai-spark-filled" /><IrisIcon /><IrisIconInverse /><AIBadge /></Inline></Stack>;
}

function GalleryAvatars() {
  return <Stack gap="large"><Inline gap="medium" wrap align="center">{(['xsmall', 'small', 'medium', 'large'] as const).map(size => <Stack key={size} gap="small" align="center"><Avatar initials="AM" alt="Akshat Mishra" size={size} /><Text size="xs" color="secondary">{size}</Text></Stack>)}<Avatar size="large" src={`${import.meta.env.BASE_URL}avatar.jpg`} alt="Akshat Mishra" /><Avatar initials="AC" shape="square" colorIndex={2} /></Inline><AvatarGroup avatars={[{ initials: 'AM', alt: 'Akshat Mishra' }, { initials: 'AC', alt: 'Acme Technologies', colorIndex: 2 }, { initials: 'RC', alt: 'Riley Chen', colorIndex: 4 }, { initials: 'JD', alt: 'Jordan Davis', colorIndex: 6 }]} max={3} /></Stack>;
}

function GalleryBadges() {
  return <Stack gap="large"><Inline gap="small" wrap>{(['subtle', 'emphasis', 'success', 'warning', 'alert', 'promo', 'promoSubtle'] as const).map(kind => <Badge key={kind} kind={kind} text={kind} />)}</Inline><Inline gap="small" wrap>{(['neutral', 'success', 'warning', 'alert'] as const).map(kind => <StatusLight key={kind} kind={kind} text={kind} />)}</Inline><Inline gap="medium"><AlertBadge value={3} /><AlertBadge value="99+" /><AlertBadge dot /></Inline></Stack>;
}

function GalleryEmptyState() {
  const { toast } = useToast();
  return <EmptyState direction="column" alignment="center" size="small" header={<EmptyState.Header level={3} text="No agreements yet" />} image={<Icon name="document" />} callToAction={<Button kind="primary" onClick={() => toast({ children: 'Create agreement selected.' })}>Create agreement</Button>}>Create an agreement to start collecting signatures.</EmptyState>;
}

function GalleryLayoutUtilities() {
  return <Container size="full" padded={false}><Stack gap="medium"><Inline gap="small"><Text size="sm">Inline</Text><Spacer /><Text size="sm" color="secondary">Spacer</Text></Inline><Grid columns={3} gap="small">{['One', 'Two', 'Three'].map(label => <Card key={label}><Text size="sm">{label}</Text></Card>)}</Grid><Text size="xs" color="secondary">Container, Stack, Inline and Grid also compose this entire gallery. Portal renders the overlay examples.</Text></Stack></Container>;
}

type GalleryCategory = 'primitives' | 'composites' | 'patterns' | 'layouts';
interface GalleryEntry { id: string; title: string; category: GalleryCategory; alsoIn?: GalleryCategory[]; components: string[]; preview: React.ComponentType; wide?: boolean; }
const COMPONENT_GALLERY: GalleryEntry[] = [
  { id: 'buttons', title: 'Button sizes, kinds and states', category: 'primitives', components: ['Button'], preview: GalleryButtons, wide: true },
  { id: 'typography', title: 'Typography and links', category: 'primitives', components: ['Heading', 'Text', 'Link', 'Divider'], preview: GalleryTypography },
  { id: 'icons', title: 'Icons and icon actions', category: 'primitives', alsoIn: ['composites'], components: ['Icon', 'AIIcon', 'IconButton', 'Hotspot', 'IrisIcon', 'IrisIconInverse', 'AIBadge'], preview: GalleryIcons },
  { id: 'inputs', title: 'Text fields', category: 'primitives', components: ['Input', 'TextArea'], preview: GalleryInputs },
  { id: 'selection', title: 'Selection controls', category: 'primitives', components: ['Checkbox', 'Radio', 'Switch', 'ToggleButton'], preview: GallerySelection },
  { id: 'avatars', title: 'Avatars', category: 'primitives', components: ['Avatar', 'AvatarGroup'], preview: GalleryAvatars },
  { id: 'badges', title: 'Badges and status', category: 'primitives', components: ['Badge', 'StatusLight', 'AlertBadge'], preview: GalleryBadges },
  { id: 'progress', title: 'Progress and loading', category: 'primitives', components: ['ProgressBar', 'Meter', 'Spinner', 'Skeleton'], preview: GalleryProgress },
  { id: 'ranges', title: 'Sliders, zoom and rating', category: 'composites', alsoIn: ['primitives'], components: ['Slider', 'ZoomControl', 'StarRating'], preview: GalleryRanges },
  { id: 'cards', title: 'Cards', category: 'composites', alsoIn: ['primitives'], components: ['Card', 'TaskCard', 'PreviewCard'], preview: GalleryCards, wide: true },
  { id: 'choices', title: 'Selects and combo boxes', category: 'composites', alsoIn: ['primitives'], components: ['Select', 'ComboBox'], preview: GalleryChoices },
  { id: 'search', title: 'Search inputs', category: 'composites', components: ['SearchInput'], preview: GallerySearch },
  { id: 'tags', title: 'Chips, tags and filters', category: 'composites', alsoIn: ['primitives'], components: ['Chip', 'Tag', 'FilterTag'], preview: GalleryTags },
  { id: 'dates', title: 'Dates and calendars', category: 'composites', components: ['DatePicker'], preview: GalleryDates },
  { id: 'uploads', title: 'File controls', category: 'composites', components: ['FileInput', 'FileUpload'], preview: GalleryUploads },
  { id: 'tiles', title: 'Selectable tiles', category: 'composites', components: ['SelectTile', 'SelectTileGroup'], preview: GallerySelectableTiles },
  { id: 'menus', title: 'Menus and contextual help', category: 'composites', alsoIn: ['primitives'], components: ['Dropdown', 'ComboButton', 'Popover', 'Tooltip'], preview: GalleryMenus },
  { id: 'navigation', title: 'Navigation controls', category: 'composites', components: ['Breadcrumb', 'Tabs', 'SegmentedControl', 'Pagination'], preview: GalleryNavigation },
  { id: 'accordion', title: 'Accordion', category: 'composites', components: ['Accordion'], preview: GalleryAccordions },
  { id: 'lists', title: 'Lists and trees', category: 'composites', components: ['List', 'Tree'], preview: GalleryLists },
  { id: 'workflows', title: 'Steps and timeline', category: 'composites', components: ['Stepper', 'WorkflowStepper', 'Timeline'], preview: GalleryWorkflows },
  { id: 'notifications', title: 'Alerts and notifications', category: 'composites', components: ['Banner', 'Alert', 'Toast', 'ToastProvider'], preview: GalleryNotifications },
  { id: 'overlays', title: 'Modal, drawer and callout', category: 'composites', components: ['Modal', 'Drawer', 'Callout'], preview: GalleryOverlays },
  { id: 'panels', title: 'In-flow panels', category: 'composites', components: ['Panel', 'Rail'], preview: GalleryPanels },
  { id: 'empty', title: 'Empty state', category: 'composites', components: ['EmptyState'], preview: GalleryEmptyState },
  { id: 'color', title: 'Color picker', category: 'composites', components: ['ColorPicker'], preview: ColorPicker },
  { id: 'table', title: 'Table', category: 'composites', components: ['Table'], preview: GallerySimpleTable, wide: true },
  { id: 'local-nav', title: 'Local navigation', category: 'patterns', components: ['LocalNav'], preview: GalleryLocalNavigation },
  { id: 'chart', title: 'Bar chart', category: 'primitives', components: ['BarChart'], preview: GalleryChart },
  { id: 'chat', title: 'AI chat', category: 'patterns', components: ['AIChat'], preview: GalleryChat },
  { id: 'agent', title: 'Agent components', category: 'patterns', components: ['AgentPanel', 'AgentCanvas', 'AgentActionCard', 'ThinkingSteps'], preview: GalleryAgent },
  { id: 'agreement-layout', title: 'Agreement list layout', category: 'layouts', alsoIn: ['patterns'], components: ['AgreementTableView', 'DataTable', 'PageHeader', 'FilterBar'], preview: GalleryTableLayout, wide: true },
  { id: 'utilities', title: 'Layout utilities', category: 'layouts', components: ['Container', 'Stack', 'Inline', 'Grid', 'Spacer', 'Portal'], preview: GalleryLayoutUtilities },
  { id: 'product-shell', title: 'Product shell', category: 'layouts', components: ['DocuSignShell', 'GlobalNav'], preview: GalleryProductShell },
];

function GalleryChart() {
  return <BarChart data={[8, 14, 11, 19, 16]} xLabels={[{ index: 0, text: 'Mon' }, { index: 1, text: 'Tue' }, { index: 2, text: 'Wed' }, { index: 3, text: 'Thu' }, { index: 4, text: 'Fri' }]} xAxisTitle="Agreements completed" aria-label="Agreements completed by weekday" />;
}

function GalleryProductShell() {
  return <Stack gap="medium"><Text size="sm">The prototype demonstrates the full product shell and global navigation. Open it to review the shell in context.</Text><Button kind="secondary" href={`${import.meta.env.BASE_URL}#home`}>Open product shell</Button></Stack>;
}

function ComponentGalleryContent() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const normalized = query.trim().toLowerCase();
  const entries = COMPONENT_GALLERY.filter(entry => (category === 'all' || entry.category === category || entry.alsoIn?.some(item => item === category)) && `${entry.title} ${entry.components.join(' ')}`.toLowerCase().includes(normalized));
  const componentCount = new Set(COMPONENT_GALLERY.flatMap(entry => entry.components)).size;
  return <Stack gap="none" className="component-gallery-root" role="main" aria-label="Component gallery">
    <Container size="xlarge" className="component-gallery-page">
      <Stack gap="large">
        <PageHeader title="Component gallery" actions={<Inline gap="small" wrap><Button kind="tertiary" href={`${import.meta.env.BASE_URL}#home`}>Back to prototype</Button><Button kind="secondary" href={`${import.meta.env.BASE_URL}#tokens`}>Figma token checks</Button></Inline>} />
        <Text color="secondary">Browse {componentCount} public Ink components in one place. Compare sizes and states, try controls, and open overlays. This playground is separate from the prototype.</Text>
        <Stack gap="medium" className="gallery-filters">
          <SearchInput aria-label="Search components" placeholder="Search components, e.g. Button, Modal, DataTable…" value={query} onChange={setQuery} />
          <SegmentedControl label="Component category" value={category} onChange={setCategory} items={[{ value: 'all', label: 'All components' }, { value: 'primitives', label: 'Primitives' }, { value: 'composites', label: 'Composites' }, { value: 'patterns', label: 'Patterns' }, { value: 'layouts', label: 'Layouts' }]} />
          <Text size="xs" color="secondary" role="status">{entries.length} of {COMPONENT_GALLERY.length} examples · Representative states, not every possible prop combination. Product shell opens in context.</Text>
        </Stack>
        {entries.length ? <Grid columns={2} gap="large" className="gallery-examples">
          {entries.map(entry => <Stack key={entry.id} gap="large" role="region" aria-labelledby={`gallery-${entry.id}`} className="gallery-example" data-gallery-example={entry.id} style={entry.wide ? { gridColumn: '1 / -1' } : undefined}>
            <Stack gap="small"><Heading level={2} id={`gallery-${entry.id}`} className="gallery-example-heading">{entry.title}</Heading><Text size="xs" color="secondary">{entry.components.join(' · ')}</Text></Stack>
            <entry.preview />
          </Stack>)}
        </Grid> : <EmptyState direction="column" header={<EmptyState.Header text="No components found" />} callToAction={<Button kind="secondary" onClick={() => { setQuery(''); setCategory('all'); }}>Clear filters</Button>}>Try a component name or another category.</EmptyState>}
      </Stack>
    </Container>
  </Stack>;
}

function ComponentGalleryPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Component gallery · ProtoLab';
    return () => { document.title = previousTitle; };
  }, []);
  return <ToastProvider><ComponentGalleryContent /></ToastProvider>;
}

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

/** Focus follows full-page record views and returns to their invoking control. */
function useRecordViewFocus(onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeCallback = useRef(onClose);
  useEffect(() => { closeCallback.current = onClose; }, [onClose]);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.stopPropagation();
      closeCallback.current();
    }
  };
  return { closeRef, onKeyDown };
}

function AgreementDetailView({ onClose }: { onClose: () => void }) {
  const viewFocus = useRecordViewFocus(onClose);
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
        <Stack gap="small" align="start">
          <AIBadge infoContent={false}>AI-Assisted</AIBadge>
          <Text size="sm">
            It looks like this agreement type is <strong>{detail.agreementType}</strong>. There are <strong>{detail.fields}</strong> fields and <strong>{detail.suggestions}</strong> new suggestions for you to review.
          </Text>
          <Button kind="secondary" size="small">Review All</Button>
        </Stack>
      </div>

      <div {...getDetailStagger(1)}>
        <Divider />
      </div>

      {/* Search */}
      <div {...getDetailStagger(2)}>
        <Input label="Find details" hideLabel placeholder="Find details" />
      </div>

      {/* Agreement Type */}
      <div {...getDetailStagger(3)}>
        <Inline gap="small" align="center">
          <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Agreement Type</Text>
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
                  <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Status</Text>
                  <Text size="sm">{detail.status}</Text>
                </div>
                <div>
                  <Inline gap="small" align="center">
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Parties</Text>
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
                  <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>File Name</Text>
                  <Text size="sm">{detail.fileName}</Text>
                </div>
                <div>
                  <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Line of Business</Text>
                  <Text size="sm">{detail.lineOfBusiness}</Text>
                </div>
                <div>
                  <Inline gap="small" align="center">
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Languages</Text>
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
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Termination for Convenience - Notice Period</Text>
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
                    <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>Governing Law</Text>
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
                      <Text size="xs" weight="semibold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: "var(--ink-letter-spacing-open)" }}>{clause}</Text>
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
    <Stack gap="none" role="region" aria-label={detail.fileName} onKeyDown={viewFocus.onKeyDown} style={{ position: 'fixed', inset: 0, zIndex: 1060, ...fadeIn.style, background: 'var(--ink-bg-color-default)' }}>
      {/* Row 1: Dark top bar */}
      <Inline gap="small" align="center" style={{ padding: '0 var(--ink-spacing-100)', background: 'var(--ink-neutral-140)', color: "var(--ink-font-color-inverse)", height: 64, flexShrink: 0 }}>
        <IconButton ref={viewFocus.closeRef} icon="close" variant="tertiary" aria-label="Close agreement" onClick={onClose} style={{ color: 'var(--ink-font-color-inverse)' }} />
        <Text size="sm" style={{ flex: 1, color: "var(--ink-font-color-inverse)" }}>{detail.fileName}</Text>
        <IconButton icon="bell-slash" variant="primary" aria-label="Set a notification" />
        <ComboButton variant="primary" dropdownLabel="More download actions">Download</ComboButton>
      </Inline>

      {/* Row 2: Document controls bar — full width */}
      <Inline gap="large" align="center" justify="center" style={{ padding: 'var(--ink-spacing-50) var(--ink-spacing-100)', borderBottom: '1px solid var(--ink-border-subtle)', background: 'var(--ink-bg-color-default)', minHeight: 40, position: 'relative' }}>
        <Inline gap="small" align="center" style={{ whiteSpace: 'nowrap' }}>
          <Input label="Page number" hideLabel width="var(--ink-spacing-500)" size="small" style={{ textAlign: 'center' }} value="1" readOnly />
          <Text size="sm" color="secondary" style={{ whiteSpace: 'nowrap' }}>/ 5</Text>
          <IconButton icon="chevron-up" variant="tertiary" size="small" aria-label="Previous page" />
          <IconButton icon="chevron-down" variant="tertiary" size="small" aria-label="Next page" />
        </Inline>
        <Divider orientation="vertical" style={{ height: 'var(--ink-spacing-200)' }} />
        <Inline gap="small" align="center">
          <IconButton icon="zoom-in" variant="tertiary" size="small" aria-label="Zoom in" />
          <Text size="xs">100%</Text>
          <IconButton icon="zoom-out" variant="tertiary" size="small" aria-label="Zoom out" />
        </Inline>
        <IconButton icon="search" variant="tertiary" size="small" aria-label="Search document" style={{ position: 'absolute', right: 'var(--ink-spacing-100)' }} />
      </Inline>

      {/* Row 3: left sidebar + detail panel + document */}
      <Inline align="stretch" gap="none" style={{ overflow: 'hidden', flex: 1, minHeight: 0 }}>
        {/* Left icon sidebar — controls right panel tabs */}
        <Stack gap="medium" align="center" style={{ padding: "var(--ink-spacing-300) var(--ink-spacing-50)", background: "var(--ink-bg-color-default)", width: 64, flexShrink: 0 }}>
          {DETAIL_TABS.map(tab => (
            <IconButton key={tab.id} icon={tab.icon} variant={activeDetailTab === tab.id ? 'primary' : 'tertiary'} aria-label={tab.label} aria-pressed={activeDetailTab === tab.id} onClick={() => handleSidebarTabClick(tab.id)} />
          ))}
        </Stack>

        {/* Detail panel — LEFT side, toggled by sidebar icons, no tab bar */}
        {activeDetailTab && (
          <Stack gap="none" style={{ borderRight: '1px solid var(--ink-border-subtle)', overflow: 'hidden', width: 380, flexShrink: 0, background: 'var(--ink-bg-color-default)' }}>
            <div style={{ overflow: 'auto', height: 'calc(100vh - 104px)' }}>
              {activeDetailTab === 'details' && (
                <>
                  <Inline gap="small" align="center" style={{ padding: 'var(--ink-spacing-150) var(--ink-spacing-200)' }}>
                    <Heading level={2}>Details</Heading>
                    <IconButton icon="edit" variant="tertiary" size="small" aria-label="Edit" />
                    <IconButton icon="plus" variant="tertiary" size="small" aria-label="Create new Fields or Clauses" />
                  </Inline>
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
          </Stack>
        )}

        {/* Document viewer — RIGHT side */}
        <Stack gap="none" style={{ background: 'var(--ink-bg-color-subtle)', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {/* Document */}
          <Inline gap="none" align="stretch" justify="center" style={{ flex: 1, overflow: 'auto', padding: 'var(--ink-spacing-300)' }}>
            <div style={{
              width: 680, maxWidth: '100%', background: "var(--ink-bg-color-default)", borderRadius: 'var(--ink-radius-size-m)',
              boxShadow: 'var(--ink-shadow-md)',
              padding: 'var(--ink-spacing-400) var(--ink-spacing-500)',
              minHeight: 900,
            }}>
              <Stack gap="medium">
                <Text size="xs" color="secondary" style={{ textAlign: 'right' }}>2135C Central Parkway Cincinnati, OH 45214</Text>
                <Heading level={2} style={{ textAlign: 'center', fontFamily: "var(--ink-font-family)" }}>batterii</Heading>
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
          </Inline>
        </Stack>
      </Inline>
    </Stack>
  );
}

/* ═══════════════════════════════════════
   Detail Page Shell — shared by Workspace + Request
   detail views (full-screen takeover: back bar,
   title + status badge, tab row, content area)
   ═══════════════════════════════════════ */

const detailShellStyles = `
.detail-shell {
  position: fixed;
  inset: 0;
  z-index: var(--ink-z-popover);
  background: var(--ink-bg-color-default);
  overflow: auto;
}
.detail-shell__header {
  background: var(--ink-bg-color-canvas-page);
  padding: var(--ink-spacing-250) var(--ink-spacing-300) 0;
  flex-shrink: 0;
}
.detail-shell__tabs {
  flex: 1;
}
.detail-shell__tabs > [role="tablist"] {
  padding-inline: var(--ink-spacing-300);
  background: var(--ink-bg-color-canvas-page);
}
.detail-shell__tabs > [role="tablist"] > [role="tab"] {
  min-width: calc(var(--ink-spacing-600) * 2);
  min-height: var(--ink-spacing-600);
  padding: var(--ink-spacing-150) var(--ink-spacing-250);
  border-radius: 0;
  color: var(--ink-font-color-neutral);
  font-size: var(--ink-font-body-s-size);
  font-weight: var(--ink-font-weight-regular);
  line-height: var(--ink-font-body-s-line-height);
  border-bottom-color: var(--ink-border-color-subtle);
}
.detail-shell__tabs > [role="tablist"] > [role="tab"][aria-selected="true"] {
  color: var(--ink-font-color-default);
  font-weight: var(--ink-font-weight-semibold);
  background: transparent;
  border-bottom-color: var(--ink-border-color-emphasis);
}
.detail-shell__tabs > [role="tabpanel"] {
  padding: 0;
}
.detail-shell__content {
  max-width: 1200px;
  padding: var(--ink-spacing-300);
}
.detail-shell__empty {
  border: var(--ink-border-width-xs) solid var(--ink-border-color-subtle);
  border-radius: var(--ink-radius-size-m);
  padding: var(--ink-spacing-700) var(--ink-spacing-300);
  text-align: center;
}
.detail-shell__empty-icon {
  width: var(--ink-spacing-600);
  height: var(--ink-spacing-600);
  border-radius: var(--ink-radius-size-s);
  background: var(--ink-bg-color-subtle);
  margin-bottom: var(--ink-spacing-100);
}
.workspace-items-table table {
  table-layout: fixed;
  min-width: calc(var(--ink-spacing-700) * 12);
  border-spacing: 0 var(--ink-spacing-200);
}
.detail-shell .workspace-items-table[data-ink-component="DataTable"] thead th {
  height: var(--ink-spacing-400);
  min-height: var(--ink-spacing-400);
  padding-block: 0;
  border-bottom: 0;
}
.detail-shell .workspace-items-table[data-ink-component="DataTable"] tr > :first-child {
  width: var(--ink-spacing-600);
  padding-inline: 0 var(--ink-spacing-300);
  border: 0;
}
.detail-shell .workspace-items-table[data-ink-component="DataTable"] tbody tr td:not(:first-child) {
  height: calc(var(--ink-spacing-600) * 2);
  border-top: var(--ink-border-width-xs) solid var(--ink-border-color-subtle);
  border-bottom: var(--ink-border-width-xs) solid var(--ink-border-color-subtle);
}
.detail-shell .workspace-items-table[data-ink-component="DataTable"] tbody tr td:nth-child(2) {
  border-inline-start: var(--ink-border-width-xs) solid var(--ink-border-color-subtle);
  border-start-start-radius: var(--ink-radius-size-s);
  border-end-start-radius: var(--ink-radius-size-s);
}
.detail-shell .workspace-items-table[data-ink-component="DataTable"] tbody tr td:last-child {
  border-inline-end: var(--ink-border-width-xs) solid var(--ink-border-color-subtle);
  border-start-end-radius: var(--ink-radius-size-s);
  border-end-end-radius: var(--ink-radius-size-s);
}
.workspace-items-table .workspace-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.workspace-items-table .workspace-item-name-icon {
  flex-shrink: 0;
}
.workspace-items-table .workspace-sort-button {
  min-width: 0;
  height: auto;
  padding: 0;
  background: transparent;
  font-size: var(--ink-font-size-xs);
  font-weight: var(--ink-font-weight-semibold);
  line-height: var(--ink-font-body-s-line-height);
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
  const tabNamespace = useId();
  const viewFocus = useRecordViewFocus(onClose);
  return (
    <Stack gap="none" role="region" aria-label={title} onKeyDown={viewFocus.onKeyDown} className="detail-shell" style={fadeIn.style}>
      <style>{detailShellStyles}</style>
      <Stack gap="none" className="detail-shell__header">
        {/* Top bar: back + right-aligned actions */}
        <Inline align="center" style={{ height: 'var(--ink-spacing-700)' }}>
          <IconButton ref={viewFocus.closeRef} icon="arrow-left" variant="tertiary" aria-label="Back" onClick={onClose} />
          <Spacer flexible />
          <Inline gap="small" align="center">{topBarActions}</Inline>
        </Inline>
        {/* Title + status */}
        <Inline gap="medium" align="center" style={{ padding: 'var(--ink-spacing-100) 0 var(--ink-spacing-300)' }}>
          <Heading level={1} style={{ fontSize: 'var(--ink-font-heading-m-size)', fontWeight: 'var(--ink-font-weight-regular)', lineHeight: 'var(--ink-font-heading-m-line-height)', margin: 0, color: 'var(--ink-font-default)' }}>
            {title}
          </Heading>
          {statusLabel && <Badge kind={statusKind} text={statusLabel} />}
        </Inline>
      </Stack>
      <Tabs
        className="detail-shell__tabs"
        value={`${tabNamespace}-${activeTab}`}
        onChange={id => {
          const nextTab = tabs.find(tab => `${tabNamespace}-${tab.id}` === id);
          if (nextTab) onTabChange(nextTab.id);
        }}
        tabs={tabs.map(tab => ({
          id: `${tabNamespace}-${tab.id}`,
          label: tab.label,
          content: <Container size="full" padded={false} className="detail-shell__content">{children}</Container>,
        }))}
      />
    </Stack>
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
    <Stack gap="small" align="center" className="detail-shell__empty">
      <Inline justify="center" className="detail-shell__empty-icon">
        <Icon name={icon} size={22} />
      </Inline>
      <Text size="lg" weight="medium">{title}</Text>
      <Text size="sm" color="secondary">{subtitle}</Text>
      <Stack gap="none" style={{ marginTop: 'var(--ink-spacing-150)' }}>{action}</Stack>
    </Stack>
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

const workspaceItemColumns: DataTableColumn<WorkspaceItem>[] = [
  {
    key: 'name',
    header: <Button kind="tertiary" size="small" className="workspace-sort-button">Name</Button>,
    sortable: true,
    sortValue: item => item.name.toLowerCase(),
    cell: item => (
      <Inline gap="medium" style={{ minWidth: 0 }}>
        <Icon name={item.icon} size="medium" color="var(--ink-icon-color-default)" className="workspace-item-name-icon" />
        <Stack gap="small" style={{ minWidth: 0 }}>
          <Text size="sm" weight="medium" className="workspace-item-name" title={item.name}>{item.name}</Text>
          <Text size="sm">{item.type}</Text>
        </Stack>
      </Inline>
    ),
  },
  { key: 'recipients', header: 'Recipients', width: '14%', cell: item => <Badge kind="subtle" text={item.recipients} /> },
  {
    key: 'status',
    header: <Button kind="tertiary" size="small" className="workspace-sort-button">Status</Button>,
    width: '12%',
    sortable: true,
    cell: item => <StatusLight kind="neutral" opaque={false} text={item.status} />,
  },
  {
    key: 'lastChange',
    header: <Button kind="tertiary" size="small" className="workspace-sort-button">Last Change</Button>,
    width: '19%',
    sortable: true,
    sortValue: item => new Date(`${item.date} ${item.time}`).getTime(),
    cell: item => <Stack gap="none"><Text size="sm">{item.date}</Text><Text size="sm">{item.time}</Text></Stack>,
  },
  {
    key: 'actions',
    header: 'Actions',
    width: '14%',
    alignment: 'right',
    cell: item => (
      <Inline gap="small" justify="end">
        <Button kind="secondary" size="small" accessibilityText={`Edit ${item.name}`}>Edit</Button>
        <IconButton icon="overflow-vertical" variant="tertiary" size="small" aria-label={`More actions for ${item.name}`} />
      </Inline>
    ),
  },
];

function WorkspaceDetailView({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [sortColumn, setSortColumn] = useState('lastChange');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending' | null>('ascending');
  const isActive = workspace.status === 'active';

  const topBarActions = (
    <>
      <IconButton icon="comment" variant="tertiary" aria-label="Messages" />
      <Button kind="secondary" startElement={<Icon name="people" size={16} />}>Share</Button>
      <Button kind="primary" menuTrigger>Add</Button>
      <IconButton icon="overflow-vertical" variant="tertiary" aria-label={`More actions for ${workspace.name}`} />
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
        <DataTable<WorkspaceItem>
          className="workspace-items-table"
          columns={workspaceItemColumns}
          data={WORKSPACE_ITEMS}
          getRowKey={item => item.id}
          rowHeight="tall"
          selectable
          selectedRows={selectedItems}
          onSelectionChange={setSelectedItems}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={(column, direction) => { setSortColumn(column); setSortDirection(direction); }}
          stickyHeader
          emptyMessage="No items in this workspace"
        />
      ) : (
        <Stack gap="medium">
          <Heading level={2} style={{ fontSize: 'var(--ink-font-heading-s-size)', fontWeight: 'var(--ink-font-weight-regular)', margin: 0 }}>Documents</Heading>
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
            <StatusLight kind="success" text={request.status} />
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
        <Button kind="tertiary" fullWidth startElement={<Icon name="trash" size={20} />} style={{ justifyContent: 'flex-start', padding: 'var(--ink-spacing-200)' }}>Delete Request</Button>
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
        <Grid columns={3} gap="large" align="start">
          <Stack style={{ gridColumn: 'span 2' }} gap="medium">
            <Inline justify="between" align="center">
              <Heading level={2} style={{ fontSize: "var(--ink-font-heading-s-size)", fontWeight: "var(--ink-font-weight-regular)", margin: 0 }}>Activity Feed</Heading>
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
            <Button kind="secondary" fullWidth startElement={<AIIcon name="ai-spark-filled" size={14} />} style={{ background: 'var(--ink-cobalt-10)', border: 'none', justifyContent: 'center' }}>
              Chat with request
            </Button>
            <RequestInfoCard request={request} />
          </Stack>
        </Grid>
      )}

      {activeTab === 'details' && (
        <Stack gap="medium">
          <Inline justify="between" align="center">
            <Heading level={2} style={{ fontSize: "var(--ink-font-heading-s-size)", fontWeight: "var(--ink-font-weight-regular)", margin: 0 }}>Details</Heading>
            <Button kind="primary">Change Request Type</Button>
          </Inline>
          <Grid columns={3} gap="large" align="start">
            <Card style={{ gridColumn: 'span 2' }} radius="large">
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
          </Grid>
        </Stack>
      )}

      {activeTab === 'documents' && (
        <Stack gap="medium">
          <Heading level={2} style={{ fontSize: "var(--ink-font-heading-s-size)", fontWeight: "var(--ink-font-weight-regular)", margin: 0 }}>Documents</Heading>
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
          <Heading level={2} style={{ fontSize: "var(--ink-font-heading-s-size)", fontWeight: "var(--ink-font-weight-regular)", margin: 0 }}>Approvals</Heading>
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
          <Heading level={2} style={{ fontSize: "var(--ink-font-heading-s-size)", fontWeight: "var(--ink-font-weight-regular)", margin: 0 }}>Envelopes</Heading>
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
      <Button kind="tertiary" size="small" endElement={<Icon name={hidden ? 'chevron-down' : 'chevron-up'} size={20} />} onClick={() => setHidden((h) => !h)}>{hidden ? 'Show Insights' : 'Hide Insights'}</Button>
      <IconButton icon="close" variant="tertiary" size="small" aria-label="Dismiss insights" onClick={() => setHidden(true)} />
    </Inline>
  );

  const body = (
        <Inline gap="xl" align="stretch" className="ink-insights__body">
          {/* Chart card */}
          <Card noPadding radius="medium" style={{ flex: '1 1 440px', maxWidth: 560, minWidth: 0, background: "var(--ink-bg-color-default)", borderRadius: "var(--ink-radius-size-s)", padding: "var(--ink-spacing-250) var(--ink-spacing-300)" }}>
            <Text size="md" weight="semibold" style={{ display: 'block' }}>Upcoming renewals</Text>
            <Text size="sm" color="secondary" style={{ display: 'block', marginBottom: "var(--ink-spacing-50)" }}>Next 12 months</Text>
            <RenewalsChart />
          </Card>
          {/* CTA carousel card */}
          <Card noPadding radius="medium" className="ink-insights__cta" style={{ flex: '0 1 460px', maxWidth: 500, minWidth: 0 }}>
            <div className="ink-insights__cta-accent" />
            <Stack gap="none" style={{ padding: "var(--ink-spacing-250) var(--ink-spacing-300)", flex: 1 }}>
              <Text weight="regular" style={{ display: 'block', marginBottom: "var(--ink-spacing-100)", fontSize: "var(--ink-font-heading-s-size)", lineHeight: "var(--ink-line-height-tight)" }}>
                {active.title.map((seg, i) => (seg.b ? <strong key={i} style={{ fontWeight: "var(--ink-font-weight-semibold)" }}>{seg.t}</strong> : <span key={i}>{seg.t}</span>))}
              </Text>
              <Text size="sm" color="secondary" style={{ display: 'block', marginBottom: "var(--ink-spacing-250)" }}>{active.body}</Text>
              <Inline gap="small" align="center" style={{ marginTop: 'auto' }}>
                <Button kind="secondary" size="small" startElement={<AIIcon name="ai-spark-filled" size={12} />}>{active.action}</Button>
                <Button kind="tertiary" size="small">Do This Later</Button>
              </Inline>
              <Inline gap="small" align="center" style={{ marginTop: "var(--ink-spacing-200)" }}>
                {INSIGHT_CARDS.map((_, i) => (
                  <Button key={i} kind="tertiary" size="small" className="ink-insights__dot" data-active={i === card} accessibilityText={`Show insight ${i + 1}`} onClick={() => setCard(i)} />
                ))}
              </Inline>
            </Stack>
          </Card>
        </Inline>
  );

  return (
    <div className="ink-insights" style={hidden ? { padding: "var(--ink-spacing-100) var(--ink-spacing-250)" } : undefined}>
      {hidden ? (
        /* Collapsed: centered rotating teaser + right-aligned controls */
        <Inline gap="none" align="center" style={{ position: 'relative', minHeight: 32 }}>
          <Text size="sm" color="secondary" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
            {titleToString(active.title)}
          </Text>
          <div style={{ marginLeft: 'auto', zIndex: 1 }}>{controls}</div>
        </Inline>
      ) : (
        /* Expanded: associated Tabs panels retain the existing shared fixture content. */
        <>
          <Tabs className="ink-insights__tabs" aria-label="Agreement insights" value={tab} onChange={id => setTab(id === 'review' ? 'review' : 'insights')} tabs={[
            { id: 'insights', label: 'My Insights', icon: <IrisIcon />, content: body },
            { id: 'review', label: 'Data Review', content: body },
          ]} />
          <div className="ink-insights__controls">{controls}</div>
        </>
      )}


    </div>
  );
}

function getTabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash as TabId) ? (hash as TabId) : 'agreements';
}

function PrototypeApp() {
  const hostRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);
  const [workflows, setWorkflows] = useState<Workflow[]>(WORKFLOWS_DATA);
  const [automationView, setAutomationView] = useState<AutomationView>(AUTOMATION_DEFAULT_VIEW);
  const [accountUsers, setAccountUsers] = useState<AccountUser[]>(ACCOUNT_USERS);
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(DEFAULT_ACCOUNT_SETTINGS);
  const [adminView, setAdminView] = useState<AdminView>(ADMIN_DEFAULT_VIEW);
  const [sidebarView, setSidebarView] = useState<SidebarView>('completed');
  const [templatesSidebarView, setTemplatesSidebarView] = useState<TemplatesSidebarView>('my-templates');
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>(() => [...TEMPLATES_DATA, ...TEMPLATE_RESOURCES_DATA]);
  const [templateEditor, setTemplateEditor] = useState<TemplateEditorState | null>(null);
  const [templateLoadError, setTemplateLoadError] = useState('');
  const templateLoading = useRef(false);
  const [insightsSidebarView, setInsightsSidebarView] = useState<InsightsSidebarView>('overview');
  const [insightReports, setInsightReports] = useState<ReportItem[]>(REPORTS_DATA);
  const [insightCreator, setInsightCreator] = useState<'report' | 'dashboard' | null>(null);
  const [search, setSearch] = useState('');
  const [agreementDateFilter, setAgreementDateFilter] = useState(true);
  const [showAgreementDetail, setShowAgreementDetail] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeRequest, setActiveRequest] = useState<RequestItem | null>(null);
  const recordOpener = useRef<HTMLElement | null>(null);
  const recordWasOpen = useRef(false);
  const recordViewOpen = showAgreementDetail || !!activeWorkspace || !!activeRequest;
  useEffect(() => {
    // Restore after React removes inert from the covered shell.
    if (recordWasOpen.current && !recordViewOpen) {
      const target = recordOpener.current?.isConnected ? recordOpener.current : document.querySelector<HTMLElement>('[data-protolab-record-background] a[href], [data-protolab-record-background] button:not([disabled])');
      target?.focus();
    }
    recordWasOpen.current = recordViewOpen;
  }, [recordViewOpen]);
  const [homeCreation, setHomeCreation] = useState<{ kind: 'envelope' | 'request'; files: File[]; draftId?: string; initialData?: HomeCreationData } | null>(null);
  const [createdDrafts, setCreatedDrafts] = useState<LocalEnvelopeDraft[]>(() => [INITIAL_HOME_DRAFT]);
  const [createdRequests, setCreatedRequests] = useState<RequestItem[]>([]);

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
    }, search ? 1200 : scripted?.thinking ? 2400 : 1200);
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
    if (tabId === 'automations') setAutomationView(AUTOMATION_DEFAULT_VIEW);
    if (tabId === 'admin') setAdminView(ADMIN_DEFAULT_VIEW);
  }, []);

  /* ── GlobalNav — matches production DocuSign ── */
  const globalNavConfig = {
    className: 'prototype-global-nav',
    logo: <img src={`${import.meta.env.BASE_URL}docusign-logo.svg`} alt="DocuSign" />,
    showAppSwitcher: true,
    onAppSwitcherClick: () => {},
    navItems: [
      { id: 'home', label: 'Home', active: activeTab === 'home', onClick: () => handleTabClick('home') },
      { id: 'agreements', label: 'Agreements', active: activeTab === 'agreements', onClick: () => handleTabClick('agreements') },
      { id: 'templates', label: 'Templates', active: activeTab === 'templates', onClick: () => handleTabClick('templates') },
      { id: 'automations', label: 'Automations', active: activeTab === 'automations', onClick: () => handleTabClick('automations') },
      { id: 'insights', label: 'Insights', active: activeTab === 'insights', onClick: () => handleTabClick('insights') },
      { id: 'admin', label: 'Admin', active: activeTab === 'admin', onClick: () => handleTabClick('admin') },
    ],
    showSearch: true,
    searchVariant: 'icon' as const,
    onSearchClick: () => {},
    showNotifications: true,
    extraActions: <IconButton icon="task-list" variant="tertiary" size="medium" aria-label="Tasks" onClick={() => handleTabClick('home')} />,
    user: { name: 'Akshat Mishra', org: 'Protolab', avatar: `${import.meta.env.BASE_URL}avatar.jpg?v=1` },
  };

  /* ── LocalNav — Agreements tab ── */
  const agreementsSidebar = {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-agreement', label: 'New Agreement', icon: 'edit' as const, onClick: () => setHomeCreation({ kind: 'envelope', files: [] }) },
      { id: 'new-template', label: 'New Template', icon: 'star' as const, onClick: () => handleTabClick('templates') },
      { id: 'upload', label: 'Upload Document', icon: 'upload' as const, onClick: () => setHomeCreation({ kind: 'envelope', files: [] }) },
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
          { id: 'parties', label: 'Parties', icon: 'building-person' as const, onClick: () => setSidebarView('parties') },
          { id: 'requests', label: 'Requests', icon: 'ticket' as const, onClick: () => setSidebarView('requests') },
          { id: 'signatories', label: 'Signatories', icon: 'person-circle' as const },
          { id: 'maestro', label: 'Workflows', icon: 'workflow' as const, badge: 'New', onClick: () => { handleTabClick('automations'); setAutomationView('workflows'); } },
          { id: 'workspaces', label: 'Workspaces', icon: 'transaction' as const, onClick: () => setSidebarView('workspaces') },
          { id: 'powerforms', label: 'PowerForms', icon: 'flash' as const, onClick: () => setSidebarView('powerforms') },
          { id: 'bulk-send', label: 'Bulk Send', icon: 'document-stack' as const },
        ],
      },
    ],
  };

  /* ── Templates sidebar — matches production DocuSign ── */
  const navigateTemplateView = (view: TemplatesSidebarView) => { setTemplatesSidebarView(view); setSearch(''); };
  const templatesSidebar = {
    headerLabel: 'Start',
    headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'new-template', label: 'Create Template', icon: 'edit' as const, onClick: () => setTemplateEditor({ kind: templateKindForView(templatesSidebarView) }) },
      { id: 'upload-template', label: 'Upload Template', icon: 'upload' as const, onClick: () => setTemplateEditor({ kind: templateKindForView(templatesSidebarView), upload: true }) },
    ],
    activeItemId: templatesSidebarView,
    sections: [
      {
        id: 'envelope-templates',
        title: 'Envelope Templates',
        icon: 'templates' as const,
        collapsible: true,
        defaultExpanded: true,
        items: [
          { id: 'my-templates', label: 'My Templates', icon: 'user' as const, nested: true, onClick: () => navigateTemplateView('my-templates') },
          { id: 'shared-with-me', label: 'Shared with Me', icon: 'people' as const, nested: true, onClick: () => navigateTemplateView('shared-with-me') },
          { id: 'favorites', label: 'Favorites', icon: 'star' as const, nested: true, onClick: () => navigateTemplateView('favorites') },
          { id: 'all-templates', label: templatesSidebarView === 'all-templates' ? 'All Templates' : 'Show More', nested: true, onClick: () => navigateTemplateView('all-templates') },
        ],
      },
      {
        id: 'other-templates',
        hasDivider: true,
        items: [
          { id: 'clauses', label: 'Clauses', icon: 'bulleted-list' as const, badge: 'New', onClick: () => navigateTemplateView('clauses') },
          { id: 'document-templates', label: 'Document Templates', icon: 'document' as const, onClick: () => navigateTemplateView('document-templates') },
          { id: 'workspace-templates', label: 'Workspace Templates', icon: 'transaction' as const, onClick: () => navigateTemplateView('workspace-templates') },
          { id: 'workflow-templates', label: 'Workflow Templates', icon: 'workflow' as const, onClick: () => navigateTemplateView('workflow-templates') },
        ],
      },
      {
        id: 'web-forms',
        title: 'Web Forms',
        icon: 'globe-language' as const,
        collapsible: true,
        defaultExpanded: true,
        hasDivider: true,
        items: [
          { id: 'my-web-forms', label: 'My Web Forms', icon: 'user' as const, nested: true, onClick: () => navigateTemplateView('my-web-forms') },
          { id: 'shared-web-forms', label: 'Shared with Me', icon: 'people' as const, nested: true, onClick: () => navigateTemplateView('shared-web-forms') },
          { id: 'all-web-forms', label: 'All Web Forms', icon: 'globe-language' as const, nested: true, onClick: () => navigateTemplateView('all-web-forms') },
        ],
      },
      { id: 'template-gallery', items: [{ id: 'template-gallery', label: 'Template Gallery', icon: 'layout-grid' as const, onClick: () => navigateTemplateView('template-gallery') }] },
    ],
  };

  /* ── Insights sidebar — matches production Docusign Reports ── */
  const navigateInsightView = (view: InsightsSidebarView) => { setInsightsSidebarView(view); setSearch(''); };
  const insightsSidebar = {
    headerLabel: 'Create', headerIcon: 'plus' as const,
    headerMenuItems: [
      { id: 'create-report', label: 'Report', icon: 'chart-bar' as const, onClick: () => setInsightCreator('report') },
      { id: 'create-dashboard', label: 'Dashboard', icon: 'layout-grid' as const, onClick: () => setInsightCreator('dashboard') },
    ],
    activeItemId: insightsSidebarView === 'dashboards' ? 'renewals-dashboard' : insightsSidebarView,
    sections: [
      { id: 'insights-overview', items: [
        { id: 'overview', label: 'Overview', icon: 'home' as const, onClick: () => navigateInsightView('overview') },
        { id: 'procurement-hub', label: 'Procurement Hub', icon: 'shopping-cart' as const, onClick: () => navigateInsightView('procurement-hub') },
      ] },
      { id: 'insights-dashboards', title: 'Dashboards', icon: 'layout-grid' as const, collapsible: true, defaultExpanded: true, items: [
        { id: 'my-dashboard', label: 'My dashboard', nested: true, onClick: () => navigateInsightView('my-dashboard') },
        { id: 'admin-dashboard', label: 'Administrator dashboard', nested: true, onClick: () => navigateInsightView('admin-dashboard') },
        { id: 'agreements-dashboard', label: 'Agreements', nested: true, onClick: () => navigateInsightView('agreements-dashboard') },
        { id: 'obligations-dashboard', label: 'Obligations', nested: true, onClick: () => navigateInsightView('obligations-dashboard') },
        { id: 'renewals-dashboard', label: 'Renewals', nested: true, onClick: () => navigateInsightView('renewals-dashboard') },
        { id: 'requests-dashboard', label: 'Requests', nested: true, onClick: () => navigateInsightView('requests-dashboard') },
        { id: 'ai-usage-dashboard', label: 'AI Assistant and Agent Usage', nested: true, onClick: () => navigateInsightView('ai-usage-dashboard') },
      ] },
      { id: 'insights-custom-dashboards', title: 'Custom Dashboards', collapsible: true, defaultExpanded: true, items: [
        { id: 'custom-obligations', label: 'Obligations', nested: true, onClick: () => navigateInsightView('custom-obligations') },
        { id: 'custom-dashboard', label: 'Custom dashboard', nested: true, onClick: () => navigateInsightView('custom-dashboard') },
      ] },
      { id: 'insights-reports', items: [{ id: 'reports', label: 'Reports', icon: 'chart-bar' as const, onClick: () => navigateInsightView('reports') }] },
    ],
  };

  /* ── View-filtered data ── */
  const viewAgreements = useMemo(() => {
    switch (sidebarView) {
      case 'drafts':
        return [
          ...createdDrafts,
          { id: 'd1', name: 'Q2 Partnership Agreement - Draft', recipient: 'To: Legal Team', status: 'Draft', statusIcon: 'clock' as const, statusKind: 'neutral' as const, date: '31/3/2026', time: '09:15', action: 'Edit' as const },
          { id: 'd2', name: 'Contractor NDA - Pending Review', recipient: 'To: Akshat Mishra', status: 'Draft', statusIcon: 'clock' as const, statusKind: 'neutral' as const, date: '30/3/2026', time: '14:30', action: 'Edit' as const },
          { id: 'd3', name: 'Office Lease Renewal 2026', recipient: 'To: Facilities', status: 'Draft', statusIcon: 'clock' as const, statusKind: 'neutral' as const, date: '28/3/2026', time: '11:00', action: 'Edit' as const },
        ];
      case 'in-progress':
        return IN_PROGRESS_DATA;
      case 'completed':
        return AGREEMENTS_DATA.filter(a => a.status === 'Completed');
      case 'deleted':
        return [
          { id: 'del1', name: 'Old NDA - Expired', recipient: 'To: Akshat Mishra', status: 'Voided', statusIcon: 'status-void' as const, statusKind: 'neutral' as const, statusSub: 'Deleted', date: '15/3/2026', time: '08:30', action: 'Copy' as const },
        ];
      default:
        return [...AGREEMENTS_DATA, ...IN_PROGRESS_DATA.filter(agreement => !AGREEMENTS_DATA.some(existing => existing.id === agreement.id))];
    }
  }, [sidebarView, createdDrafts]);

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
    workspaces: 'Workspaces', powerforms: 'PowerForms',
  };

  const isPartiesView = sidebarView === 'parties';
  const isNavigatorView = sidebarView === 'completed';
  const isRequestsView = sidebarView === 'requests';
  const isWorkspacesView = sidebarView === 'workspaces';
  const isPowerFormsView = sidebarView === 'powerforms';
  const isEnvelopeListView = !isPartiesView && !isNavigatorView && !isRequestsView && !isWorkspacesView && !isPowerFormsView;

  /* ── Navigator filtered data ── */
  const filteredNavigator = useMemo(() => {
    if (!search) return NAVIGATOR_DATA;
    const q = search.toLowerCase();
    return NAVIGATOR_DATA.filter(a => a.fileName.toLowerCase().includes(q) || a.parties.some(p => p.toLowerCase().includes(q)));
  }, [search]);

  /* ── Requests filtered data ── */
  const filteredRequests = useMemo(() => {
    const requests = [...createdRequests, ...REQUESTS_DATA];
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter(r => r.title.toLowerCase().includes(q) || r.requestId.toLowerCase().includes(q));
  }, [search, createdRequests]);

  /* ── Workspaces filtered data ── */
  const filteredWorkspaces = useMemo(() => {
    if (!search) return WORKSPACES_DATA;
    const q = search.toLowerCase();
    return WORKSPACES_DATA.filter(w => w.name.toLowerCase().includes(q) || w.owner.toLowerCase().includes(q));
  }, [search]);

  /* ── Templates content ── */
  const useLibraryTemplate = async (item: TemplateItem) => {
    if (templateLoading.current) return;
    templateLoading.current = true;
    setTemplateLoadError('');
    try {
      const files: File[] = [];
      if (item.document) {
        const response = await fetch(templateDocumentUrl(item));
        if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) throw new Error('Template document unavailable');
        files.push(new File([await response.blob()], `${item.name}.pdf`, { type: 'application/pdf' }));
      }
      setTemplateItems(current => current.map(row => row.id === item.id ? { ...row, uses: row.uses + 1 } : row));
      if (item.kind === 'workflow') {
        setWorkflows(current => [{ id: crypto.randomUUID(), name: item.name, description: item.description, status: 'Draft', trigger: 'Request submitted', action: 'Request approval', lastRun: '—', runs: 0, owner: 'Akshat Mishra' }, ...current]);
        handleTabClick('automations');
        setAutomationView('workflows');
      } else {
        setHomeCreation({ kind: 'envelope', files, initialData: { title: item.name, description: item.description, recipient: '', files, signingOrder: false, recipients: [{ id: 1, name: '', email: '', role: 'Needs to Sign', emailDelivery: true }] } });
      }
    } catch {
      setTemplateLoadError(`We couldn't load the document for “${item.name}”. Please try again.`);
    } finally {
      templateLoading.current = false;
    }
  };
  const templatesContent = <TemplatesLibraryPage
    view={templatesSidebarView} onNavigate={navigateTemplateView} search={search} onSearchChange={setSearch}
    items={templateItems} onItemsChange={setTemplateItems} editor={templateEditor} onEditorChange={setTemplateEditor}
    onUseTemplate={useLibraryTemplate}
  />;

  /* ── Insights content ── */
  const insightsContent = <InsightsPage view={insightsSidebarView} onNavigate={navigateInsightView} reports={insightReports} onReportsChange={setInsightReports} creator={insightCreator} onCreatorChange={setInsightCreator} search={search} onSearchChange={setSearch} />;

  /* ── Agreements content ── */
  const agreementsContent = (
    <AgreementTableView
      paddingVariant={isEnvelopeListView ? 'compact' : 'default'}
      banner={isNavigatorView ? <CompletedInsightsPanel /> : isPowerFormsView ? (
        <Banner kind="promo" closable onClose={() => {}} action={{ label: 'Learn More', onClick: () => {} }}>
          <strong>Increase envelope completion rates</strong> by converting your PowerForms to Web Forms.
        </Banner>
      ) : undefined}
      pageHeader={
        isNavigatorView ? (
          <Inline align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Inline gap="medium" align="center">
              <Heading level={1} style={{ fontSize: 'var(--ink-font-heading-m-size)', fontWeight: 'var(--ink-font-weight-regular)', color: 'var(--ink-font-default)', margin: 0 }}>
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
                <Button kind="tertiary" size="large" menuTrigger accessibilityText="Select a view" className="navigator-view-trigger">Documents</Button>
              </Dropdown>
              <AIBadge infoContent={false} style={{ marginLeft: "var(--ink-spacing-50)", flexShrink: 0 }} />
            </Inline>
            <Inline gap="small" align="center">
              <ComboButton variant="secondary" size="small" startIcon="plus" compact accessibilityText="Add documents" dropdownLabel="More add document options" />
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
                <IconButton icon="chart-bar" variant="tertiary" size="small" aria-label="Analytics" />
                <Button kind="secondary" startElement={<Icon name="settings" size={16} />}>Manage Parties</Button>
                <Button kind="primary" size="small" onClick={openIris} startElement={<IrisIconInverse size={20} />} className="iris-ask-button">Ask Iris</Button>
              </>)
            : isRequestsView
            ? <Button kind="primary" onClick={() => setHomeCreation({ kind: 'request', files: [] })}>Create Request</Button>
            : isWorkspacesView
            ? <Button kind="primary">Create Workspace</Button>
            : <Button kind="secondary" menuTrigger>Shared Access</Button>
          }
        />
        )
      }
      filterBar={
        <FilterBar
          className={isEnvelopeListView ? 'agreement-list-filters' : undefined}
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
              : isPowerFormsView ? 'Search All PowerForms'
              : 'Search Envelopes',
          }}
          showSearchIndicator={isNavigatorView}
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
          ) : isPowerFormsView ? (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              <Button kind="secondary" size="small" menuTrigger>Date: Last 6 months</Button>
              <Button kind="secondary" size="small" menuTrigger>Status</Button>
              <Button kind="secondary" size="small" menuTrigger>Sender</Button>
              <Button kind="secondary" size="small" menuTrigger>PowerForm Name</Button>
              <Button kind="tertiary" size="small" onClick={() => setSearch('')}>Clear</Button>
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
              <Button kind="primary" size="small" onClick={openIris} startElement={<IrisIconInverse size={20} />} className="iris-ask-button">Ask Iris</Button>
            </Inline>
          ) : (
            <Inline gap="small" align="center" style={{ flexWrap: 'nowrap' }}>
              {agreementDateFilter && <Chip onRemove={() => setAgreementDateFilter(false)}>Date: Last 6 Months</Chip>}
              <Divider orientation="vertical" />
              <Button kind="secondary" size="small" menuTrigger>Status</Button>
              <Button kind="secondary" size="small" menuTrigger>Sender</Button>
              <Button kind="secondary" size="small" menuTrigger>Quick views</Button>
              <Button kind="secondary" size="small" menuTrigger>Advanced search</Button>
              <Button kind="tertiary" size="small" onClick={() => { setSearch(''); setAgreementDateFilter(false); }}>Clear All</Button>
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
      ) : isPowerFormsView ? (
        /* Production lays this out as art-left / copy-right, left-aligned —
           not a centered stack. The illustration is decorative, so it carries
           no accessible name. */
        <Inline gap="large" align="center" justify="center" style={{ padding: 'var(--ink-spacing-600) var(--ink-spacing-300)', flexWrap: 'wrap' }}>
          <img
            src={powerFormsEmptyArt}
            alt=""
            aria-hidden="true"
            width={280}
            style={{ flexShrink: 0 }}
          />
          <Stack gap="medium" align="start" style={{ maxWidth: 420 }}>
            <Heading level={2} style={{ fontSize: 'var(--ink-font-heading-s-size)', fontWeight: 'var(--ink-font-weight-regular)' }}>You haven't created any PowerForms</Heading>
            <Text color="secondary">Create self-service documents and collect signatures easily with PowerForms.</Text>
            <Button kind="primary">Create a PowerForm</Button>
            <Link href="#">Watch how</Link>
          </Stack>
        </Inline>
      ) : isNavigatorView ? (
        <DataTable bordered columns={navigatorColumns} data={filteredNavigator} getRowKey={(row) => row.id} selectable stickyHeader stickyFooter showColumnControl rowHeight="tall" emptyMessage="No completed documents" onRowClick={() => setShowAgreementDetail(true)} pagination={{ page: 1, pageSize: 25, totalItems: 1659, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      ) : (
        <DataTable className="agreement-list-table" columns={getAgreementColumns(row => {
          const draft = createdDrafts.find(item => item.id === row.id);
          if (draft) setHomeCreation({ kind: 'envelope', files: draft.details.files, draftId: draft.id, initialData: draft.details });
        })} data={filteredAgreements} getRowKey={(row) => row.id} selectable stickyHeader showColumnControl rowHeight="tall" emptyMessage={
          sidebarView === 'drafts' ? 'No drafts found' :
          sidebarView === 'in-progress' ? 'No documents in progress' :
          sidebarView === 'deleted' ? 'No deleted documents' :
          'No agreements match your search'
        } pagination={{ page: 1, pageSize: 25, totalItems: filteredAgreements.length, onPageChange: () => {}, onPageSizeChange: () => {}, showInfo: true }} />
      )}
    </AgreementTableView>
  );

  /* ── Resolve content + sidebar ── */
  const sidebarMap: Record<TabId, React.ComponentProps<typeof DocuSignShell>['localNav']> = {
    home: undefined,
    agreements: agreementsSidebar,
    templates: templatesSidebar,
    automations: getAutomationSidebar(automationView, setAutomationView),
    insights: insightsSidebar,
    admin: getAdminSidebar(adminView, setAdminView, accountSettings.name),
    scenarios: undefined,
    tokens: undefined,
  };

  const contentMap: Record<TabId, React.ReactElement> = {
    home: <HomePage
      openRequestCount={createdRequests.length + REQUESTS_DATA.filter(request => request.status !== 'Completed').length}
      templates={templateItems}
      drafts={createdDrafts}
      onUseTemplate={useLibraryTemplate}
      onNavigate={view => { handleTabClick('agreements'); setSidebarView(view); }}
      onViewTemplates={view => { handleTabClick('templates'); setTemplatesSidebarView(view ?? 'my-templates'); }}
      onViewRenewals={() => { handleTabClick('insights'); setInsightsSidebarView('dashboards'); }}
      onAskIris={openIris}
      onBegin={(kind, files = []) => setHomeCreation({ kind, files })}
    />,
    agreements: agreementsContent,
    templates: templatesContent,
    automations: <AutomationsPage workflows={workflows} onChange={setWorkflows} view={automationView} onNavigate={setAutomationView} />,
    insights: insightsContent,
    admin: <AdminPage users={accountUsers} onUsersChange={setAccountUsers} settings={accountSettings} onSettingsChange={setAccountSettings} view={adminView} onNavigate={setAdminView} />,
    scenarios: <ScenariosPage onRun={runScenario} />,
    tokens: <TokenPreviewPage />,
  };

  /* ── Transition key — changes on tab OR sidebar view to trigger animation ── */
  const transitionKey = `${activeTab}-${sidebarView}-${templatesSidebarView}`;
  useLayoutEffect(() => {
    // A new view starts at its heading rather than inheriting the previous page's scroll.
    hostRef.current?.querySelector<HTMLElement>('[data-ink-component="DocuSignShell"] > div > main')?.scrollTo({ top: 0, left: 0 });
  }, [transitionKey, automationView, adminView, insightsSidebarView]);
  useLayoutEffect(() => {
    // Each product area starts with the top of its own navigation.
    hostRef.current?.querySelector<HTMLElement>('[data-ink-component="LocalNav"] > div:nth-child(2)')?.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  return (
    <Inline gap="none" align="stretch" className="prototype-app">
    {/*
      The host page. `zIndex: 0` makes it its own stacking context, so the
      detail overlays stay local instead of competing with the panel, and the
      panel's drag handle paints over host content rather than under it.
    */}
    <main ref={hostRef} style={{ ...panel.hostStyle, height: '100%', minHeight: 0, overflow: 'hidden', position: 'relative', zIndex: 0 }}>
    <style>{tableRowStaggerStyles}</style>
    <Stack gap="none" className="app-shell-host" data-protolab-record-background inert={recordViewOpen} onFocusCapture={event => { if (!recordViewOpen) recordOpener.current = event.target; }}>
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={
        sidebarMap[activeTab]
          ? { ...sidebarMap[activeTab], isLocked: navLocked, onLockChange: setNavLocked }
          : undefined
      }
    >
      <FadeIn keyProp={transitionKey} key={transitionKey}>
        <Stack gap="none" className="page-transition">
          {templateLoadError && <Banner kind="danger" closable onClose={() => setTemplateLoadError('')}>{templateLoadError}</Banner>}
          {contentMap[activeTab]}
        </Stack>
      </FadeIn>
      <Footer />
    </DocuSignShell>
    </Stack>
    {homeCreation && <HomeCreationDialog
      kind={homeCreation.kind}
      initialFiles={homeCreation.files}
      initialData={homeCreation.initialData}
      onClose={() => setHomeCreation(null)}
      onSave={data => {
        const date = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
        if (homeCreation.kind === 'envelope') {
          const draft: LocalEnvelopeDraft = { id: homeCreation.draftId ?? crypto.randomUUID(), name: data.title, recipient: data.recipient ? `To: ${data.recipient}` : 'Unassigned', status: 'Draft', statusIcon: 'clock', statusKind: 'neutral', date, time: 'Just now', action: 'Edit', details: data };
          setCreatedDrafts(drafts => homeCreation.draftId ? drafts.map(item => item.id === homeCreation.draftId ? draft : item) : [draft, ...drafts]);
          handleTabClick('agreements');
          setSidebarView('drafts');
        } else {
          setCreatedRequests(requests => [{ id: crypto.randomUUID(), title: data.title, requestId: `REQ-${String(REQUESTS_DATA.length + requests.length + 1).padStart(4, '0')}`, status: 'New', lastActivityAt: 'Just now', dueDate: '', submitterName: 'Akshat Mishra', submitterEmail: '', submitterInitials: 'AM', owner: 'Unassigned', requestType: 'General Request', description: data.description, created: date }, ...requests]);
          handleTabClick('agreements');
          setSidebarView('requests');
        }
        setHomeCreation(null);
      }}
    />}
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
    </Inline>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return path === `${base}/components` || path === `${base}/componets`
    ? <ComponentGalleryPage />
    : <PrototypeApp />;
}
