/**
 * Iris scenarios — the fixtures the starter's chat runs on, and the page that
 * jumps into each behaviour.
 *
 * The chat itself is `IrisAgent` + `PanelShell` + `usePanelMode`, mounted in
 * `src/App.tsx`. Those three ARE the whole chat app: the cold-state sequence,
 * the checklist, the snapshot, the nav pages and the artifact dock all run
 * inside them. Everything in this file is content — what a host supplies.
 *
 * Ported from `akshat-lab/projects/iris-system/prototypes/panel`, which is where
 * this work continues. Two substitutions were needed because the glyphs
 * `comment-small` and `ai-flow-small` are newer than this repo's Ink snapshot:
 * prompts draw `comment` and agents draw `flash`. Refresh Ink and they go back.
 */
import type {
  AgentOption,
  ArtifactItem,
  CustomSuggestion,
  InlineResultRow,
} from '@ai';
import { Button, Heading, Stack, Text } from '@/design-system';

/** The glyph a prompt row draws, and the one an agent row draws. */
const PROMPT_ICON = 'comment';
const AGENT_ICON = 'flash';

/* ═══════════════════════════════════════
   Context — the agreements the conversation holds
   ═══════════════════════════════════════ */

export type ContextAgreement = { id: string; fileName: string };

/**
 * The demo corpus. `IrisAgent` shows these as the "N agreements" pill above the
 * composer; a real host feeds whatever the page is showing.
 */
export const CONTEXT_AGREEMENTS: ContextAgreement[] = [
  { id: 'acme-msa', fileName: 'Acme Corp MSA v2.pdf' },
  { id: 'globex-sow', fileName: 'Globex SOW — Q1.pdf' },
];

/**
 * The agreement a host page has open in preview. Deliberately NOT in the
 * starting context — the scenario is arriving at a single agreement while a
 * broader set is already loaded, and being asked which one wins.
 */
export type PreviewAgreement = {
  id: string;
  fileName: string;
  agreementType?: string;
  expiration?: string;
  fields?: number;
};

export const PREVIEW_AGREEMENT: PreviewAgreement = {
  id: 'batterii-mla',
  fileName: 'Batterii MLA_00992.pdf',
  agreementType: 'Master License Agreement',
  expiration: 'Inactive',
  fields: 24,
};

/* ═══════════════════════════════════════
   Cold state
   ═══════════════════════════════════════ */

/** The line under "Jump back in" — what is true about the set, with real numbers. */
export const CONTEXT_GREETING =
  'Ask about terms, dates, or how these agreements connect.';

/**
 * The rows an empty conversation offers. Two, not four — Akshat, 2026-08-17:
 * "at any point we shouldn't show more than two to three suggestions."
 *
 * `description` is the query itself: it is what the composer previews on hover,
 * so it has to read as the thing that will actually be sent.
 */
export const COLD_SUGGESTIONS: CustomSuggestion[] = [
  {
    label: 'Summarize key terms',
    kind: 'prompt',
    icon: PROMPT_ICON,
    description:
      'Provide a high level executive summary of key terms in agreement(s)',
  },
  {
    label: 'Counterparty brief',
    kind: 'agent',
    icon: AGENT_ICON,
    description: 'Research and summarize the counterparty',
  },
];

/** The cold state when the page has ONE agreement open — about it, not the corpus. */
export const AGREEMENT_SUGGESTIONS: CustomSuggestion[] = [
  {
    label: 'Summarize key terms',
    kind: 'prompt',
    icon: PROMPT_ICON,
    description:
      'Provide a high level executive summary of key terms in this agreement',
  },
  {
    label: 'Explain my obligations',
    kind: 'prompt',
    icon: PROMPT_ICON,
    description:
      'What obligations does this agreement put on us, and when does each one fall due?',
  },
];

export const FRAME_PLACEHOLDER = ['Ask, @mention, or / for actions'];

export const AGREEMENT_PLACEHOLDER = [
  'Summarize the commercial terms',
  'Summarize my liabilities',
  'What happens if we terminate early?',
];

/**
 * The onboarding checklist. Two steps send a query, two open a surface — the
 * card does not know the difference; each row carries its own action.
 *
 * The `Ask a question` query is a PLACEHOLDER, built from the customer sentence
 * Poonam quoted on 2026-08-11. Replace it when the copy is written.
 */
export const GET_STARTED_STEPS: {
  id: string;
  label: string;
  icon: string;
  query?: string;
}[] = [
  { id: 'add-a-source', label: 'Add a source', icon: 'document-plus' },
  {
    id: 'ask-a-question',
    label: 'Ask a question',
    icon: PROMPT_ICON,
    query: 'Help me understand the web of agreements I have with SAP',
  },
  {
    id: 'visualize-the-hierarchy',
    label: 'Visualize the hierarchy',
    icon: 'hierarchy',
    query:
      'Create a hierarchy, show it in a table for each agreement, show me the relationship, whether it is parent or child, and where in the document did you decipher that?',
  },
  {
    id: 'explore-different-agents',
    label: 'Explore different agents',
    icon: AGENT_ICON,
  },
];

/** On a single agreement, two of the four steps stop making sense. */
export const AGREEMENT_STEPS = GET_STARTED_STEPS.filter((s) =>
  ['ask-a-question', 'explore-different-agents'].includes(s.id),
);

/* ═══════════════════════════════════════
   Menu, agents, conversations
   ═══════════════════════════════════════ */

export const AGENTS: AgentOption[] = [
  { id: 'iris', name: 'Iris', glyph: AGENT_ICON },
  {
    id: 'agreement-type-discovery',
    name: 'Agreement Type Discovery Agent',
    glyph: AGENT_ICON,
    description:
      'Classifies documents into agreement types and maintains the taxonomy.',
  },
  {
    id: 'agreement-desk',
    name: 'Agreement Desk Agent',
    glyph: AGENT_ICON,
    description: 'Combined IAM assistant for Agreement Desk operations.',
  },
];

export const NAV_SHORTCUTS = [
  { id: 'prompt-library', label: 'Prompt Library', icon: PROMPT_ICON },
  { id: 'agents', label: 'Agents', icon: AGENT_ICON },
  { id: 'activity', label: 'Activity', icon: 'clock' },
];

/** The Prompt Library's rows. Every row is a prompt, so every row draws one glyph. */
export const LIBRARY_PROMPTS = [
  ['Summarize key terms', 'Generate a concise overview of important clauses, obligations, and conditions across your agreements'],
  ['Compare agreement versions', 'Highlight differences between draft revisions to track changes in terms, pricing, and liability'],
  ['Extract renewal dates', 'Identify and list all renewal, expiration, and notice deadlines from active contracts'],
  ['Flag compliance risks', 'Scan agreements for clauses that may conflict with regulatory requirements or company policies'],
  ['Identify payment obligations', 'Pull out all fee schedules, payment milestones, and financial commitments from your documents'],
  ['List party responsibilities', 'Break down the roles, duties, and deliverables assigned to each party in the agreement'],
  ['Analyze indemnity clauses', 'Review indemnification language and assess the scope of liability coverage for each party'],
  ['Check termination conditions', 'Surface all termination triggers, cure periods, and exit provisions across your contracts'],
].map(([label, description]) => ({
  label,
  description,
  kind: 'prompt' as const,
  icon: PROMPT_ICON,
}));

export const CONVERSATIONS = [
  {
    label: 'Recent',
    items: [
      { id: 'c1', title: 'Building strategy for MSA' },
      { id: 'c2', title: 'Acme renewal — liability cap' },
      { id: 'c3', title: 'Which agreements expire in Q3' },
      { id: 'c4', title: 'Globex SOW payment terms' },
      { id: 'c5', title: 'Counterparty check — Voyager' },
      { id: 'c6', title: 'Indemnity language comparison' },
    ],
  },
];

/* ═══════════════════════════════════════
   The search scenario
   ═══════════════════════════════════════ */

/**
 * Two result sets, because the point of the scenario is what a SECOND one does
 * to the first. Each has a five-row preview and a full table behind it; the
 * preview's `artifactId` is the only thing joining them. The table is not shown
 * until "See all" asks for it.
 */
export const SEARCH_RESULTS: {
  match: RegExp;
  artifactId: string;
  question: string;
  answer: string;
  totalCount: number;
  rows: InlineResultRow[];
  table: ArtifactItem;
}[] = [
  {
    match: /agreements with acme/i,
    artifactId: 'search-acme-fontara',
    question: 'Show me agreements with ACME',
    answer: 'Found 300 agreements with ACME, Fontara',
    totalCount: 300,
    rows: [
      { id: 'r1', name: 'Active Miscellaneous Inactivehindi_rent_agreement.pdf', type: 'Miscellaneous', status: 'Expiring', date: '11-09-26' },
      { id: 'r2', name: 'Test Master Services Agreement Equinix copy 2.pdf', type: 'MSA', status: 'Expiring', date: '31-08-26' },
      { id: 'r3', name: 'AS-5734_MSA test gov law pay term 2-JP.pdf', type: 'MSA', status: 'Active', date: '—' },
      { id: 'r4', name: 'Active Master Service Agreement InactiveCascade Analytics S.A.pdf', type: 'MSA', status: 'Expiring', date: '11-09-26' },
      { id: 'r5', name: 'ActiveCXTestAP-DCF-CX-2026-07-30-002.pdf', type: 'Order Form', status: 'Expiring', date: '01-09-26' },
    ],
    table: {
      id: 'search-acme-fontara',
      title: 'Search Results for ACME, Fontara',
      kind: 'table',
      table: {
        selectable: true,
        rowActions: true,
        columns: [
          { key: 'file', label: 'File Name', width: 320, sortable: true },
          { key: 'parties', label: 'Parties', width: 180 },
          { key: 'expires', label: 'Expiration Date', width: 130, sortable: true },
          { key: 'status', label: 'Status', width: 140 },
        ],
        rows: [
          { id: 'r1', cells: {
            file: { kind: 'text', text: 'Active Miscellaneous Inactivehindi_rent_agreement.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: [] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'expiring', label: 'Expiring', sub: 'Expires 11-09-26' } } },
          { id: 'r2', cells: {
            file: { kind: 'text', text: 'Test Master Services Agreement Equinix copy 2.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['[ABF Co. Inc.] Pharma', 'Equinix Operating Co.'] },
            expires: { kind: 'text', text: '31-08-26' },
            status: { kind: 'status', state: 'expiring', label: 'Expiring', sub: 'Expires 31-08-26' } } },
          { id: 'r3', cells: {
            file: { kind: 'text', text: 'AS-5734_MSA test gov law pay term 2-JP.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Microsoft Corp.', 'XYZ, Inc. and ACME'] },
            expires: { kind: 'text', text: '—' },
            status: { kind: 'status', state: 'active', label: 'Active' } } },
          { id: 'r4', cells: {
            file: { kind: 'text', text: 'Active Master Service Agreement InactiveCascade Analytics S.A. + Acme Global', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Acme Global Solutions', 'Cascade Analytics S.A.'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'expiring', label: 'Expiring', sub: 'Expires 11-09-26' } } },
          { id: 'r5', cells: {
            file: { kind: 'text', text: 'ActiveCXTestAP-DCF-CX-2026-07-30-002.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Cognizant Technologies'], more: 2 },
            expires: { kind: 'text', text: '01-09-26' },
            status: { kind: 'status', state: 'expiring', label: 'Expiring', sub: 'Expires 01-09-26' } } },
          { id: 'r6', cells: {
            file: { kind: 'text', text: 'InactiveCXTestAP-DCF-CX-2026-07-30-004.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['GlobalSat Communications', 'SpaceX Orbital Logistics'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'expiring', label: 'Expiring', sub: 'Expires 11-09-26' } } },
          { id: 'r7', cells: {
            file: { kind: 'text', text: 'ActiveCognizant Technology Solutions Corp. + Westfield Commerce Corp. by name', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Cognizant Technologies', 'Westfield Commerce'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'renewing', label: 'Renewing', sub: 'Renews 11-09-26' } } },
          { id: 'r8', cells: {
            file: { kind: 'text', text: 'AS-5734_MSA test gov law pay term 2 copy.docx.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['ACME Corporation', 'XYZ, Inc.'] },
            expires: { kind: 'text', text: '22-08-26' },
            status: { kind: 'status', state: 'active', label: 'Active' } } },
        ],
      },
    },
  },
  {
    match: /upcoming renewals for these/i,
    artifactId: 'search-acme-renewals',
    question: 'What are the upcoming renewals for these?',
    answer: 'Found 15 agreements',
    totalCount: 15,
    rows: [
      { id: 'n1', name: 'ActiveCognizant Technology Solutions Corp. + Westfield Commerce Corp.', type: 'MSA', status: 'Renewing', date: '11-09-26' },
      { id: 'n2', name: 'ActiveWestfield Commerce Corp. + Cobblestone Technologies GmbH', type: 'MSA', status: 'Renewing', date: '11-09-26' },
      { id: 'n3', name: 'ActiveSummit Ridge Capital LLC + Quantum Leap Digital Pty Ltd', type: 'Order Form', status: 'Renewing', date: '11-09-26' },
      { id: 'n4', name: 'ActiveWestfield Commerce Corp. + CloudForge Solutions GmbH', type: 'MSA', status: 'Renewing', date: '11-09-26' },
      { id: 'n5', name: 'AmericanExpress_Supplement-CardRefresher_FullyExecuted.pdf', type: 'Amendment', status: 'Active', date: '—' },
    ],
    table: {
      id: 'search-acme-renewals',
      title: 'Upcoming renewals — ACME, Fontara',
      kind: 'table',
      table: {
        selectable: true,
        rowActions: true,
        columns: [
          { key: 'file', label: 'File Name', width: 320, sortable: true },
          { key: 'parties', label: 'Parties', width: 180 },
          { key: 'expires', label: 'Renewal Date', width: 130, sortable: true },
          { key: 'status', label: 'Status', width: 140 },
        ],
        rows: [
          { id: 'n1', cells: {
            file: { kind: 'text', text: 'ActiveCognizant Technology Solutions Corp. + Westfield Commerce Corp. by name', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Cognizant Technologies', 'Westfield Commerce'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'renewing', label: 'Renewing', sub: 'Renews 11-09-26' } } },
          { id: 'n2', cells: {
            file: { kind: 'text', text: 'ActiveWestfield Commerce Corp. + Cobblestone Technologies GmbH by name', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Cobblestone Technologies', 'Westfield Commerce'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'renewing', label: 'Renewing', sub: 'Renews 11-09-26' } } },
          { id: 'n3', cells: {
            file: { kind: 'text', text: 'ActiveSummit Ridge Capital LLC + Quantum Leap Digital Pty Ltd by name', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['Quantum Leap Digital', 'Summit Ridge Capital'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'renewing', label: 'Renewing', sub: 'Renews 11-09-26' } } },
          { id: 'n4', cells: {
            file: { kind: 'text', text: 'ActiveWestfield Commerce Corp. + CloudForge Solutions GmbH by name', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['CloudForge Solutions', 'Westfield Commerce'] },
            expires: { kind: 'text', text: '11-09-26' },
            status: { kind: 'status', state: 'renewing', label: 'Renewing', sub: 'Renews 11-09-26' } } },
          { id: 'n5', cells: {
            file: { kind: 'text', text: 'AmericanExpress_Supplement-CardRefresher_FullyExecuted_10_05_2016.pdf', sub: 'Uploaded: View Job', subIcon: 'upload' },
            parties: { kind: 'chips', chips: ['American Express Travel', 'DocuSign, Inc.'] },
            expires: { kind: 'text', text: '—' },
            status: { kind: 'status', state: 'active', label: 'Active' } } },
        ],
      },
    },
  },
];

/**
 * One agreement per search-result row, so clicking a row opens the thing it
 * names. `parentId` points back at the table it was reached through, which is
 * what draws the breadcrumb. Each carries the clauses the row's own cells
 * already state and nothing more — inventing eight distinct agreements would be
 * inventing content.
 */
const SEARCH_DOCUMENTS: ArtifactItem[] = SEARCH_RESULTS.flatMap((result) =>
  (result.table.table?.rows ?? []).map((row) => {
    const name = (row.cells.file as { text: string }).text;
    const expires = (row.cells.expires as { text: string }).text;
    const parties = (row.cells.parties as { chips: string[] }).chips;
    return {
      id: `${result.artifactId}:${row.id}`,
      title: name,
      kind: 'document' as const,
      parentId: result.artifactId,
      subtitle: parties.join(' · ') || undefined,
      sections: [
        {
          heading: '1. Parties',
          body: parties.length
            ? `This agreement is between ${parties.join(' and ')}.`
            : 'The parties on this agreement have not been extracted yet.',
        },
        {
          heading: '2. Term',
          body:
            expires === '—'
              ? 'This agreement has no expiration date on file.'
              : `This agreement runs to ${expires}. Notice windows and renewal terms are in the clauses below.`,
        },
        {
          heading: '3. Source',
          body: `Uploaded to Docusign as ${name}. The extraction job for this document is available from the agreement's own page.`,
        },
      ],
    };
  }),
);

/** Name and type, nothing else — the full table behind "See all" holds the rest. */
export const SEARCH_PREVIEW_COLUMNS = [
  { key: 'name', header: 'Name', width: '68%' },
  { key: 'type', header: 'Type', width: '32%' },
];

/**
 * A fixture shelf, not the dock's contents: `IrisAgent` lists only what this
 * conversation has actually opened.
 */
export const ALL_ARTIFACTS: ArtifactItem[] = [
  ...SEARCH_RESULTS.map((r) => r.table),
  ...SEARCH_DOCUMENTS,
];

/* ═══════════════════════════════════════
   The trigger page
   ═══════════════════════════════════════ */

export type ScenarioId =
  | 'cold'
  | 'agreement'
  | 'search'
  | 'agents'
  | 'prompt-library';

export const SCENARIOS: { id: ScenarioId; label: string; note: string }[] = [
  {
    id: 'cold',
    label: 'Agreements cold state',
    note: 'Get started alone. Dismiss it and the zero-query rows arrive.',
  },
  {
    id: 'agreement',
    label: 'Agreement context',
    note: 'One agreement open: the snapshot leads, corpus insights stand down.',
  },
  {
    id: 'search',
    label: 'Search results in the dock',
    note: 'A five-row preview, then "See all" fills the artifact dock.',
  },
  { id: 'agents', label: 'Agents page', note: 'The nav page behind the peek menu.' },
  {
    id: 'prompt-library',
    label: 'Prompt Library page',
    note: 'Eight saved prompts; hovering one previews it in the composer.',
  },
];

/**
 * Plain rows of buttons. This is a jig for reaching each behaviour, not a
 * surface anyone designs against.
 */
export function ScenariosPage({ onRun }: { onRun: (id: ScenarioId) => void }) {
  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <Stack gap="small">
        <Heading level={2}>Iris scenarios</Heading>
        <Text color="secondary">
          Each row opens the panel already in that state. The chat is `IrisAgent`
          + `PanelShell` + `usePanelMode` — see `src/App.tsx`.
        </Text>
      </Stack>

      <Stack gap="small" style={{ marginTop: 24 }}>
        {SCENARIOS.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '12px 0',
              borderBottom: '1px solid var(--ink-border-subtle)',
            }}
          >
            <div>
              <Text weight="semibold">{s.label}</Text>
              <Text size="sm" color="secondary">
                {s.note}
              </Text>
            </div>
            <Button kind="secondary" size="small" onClick={() => onRun(s.id)}>
              Run
            </Button>
          </div>
        ))}
      </Stack>
    </div>
  );
}
