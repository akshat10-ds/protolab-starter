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
import type { AgentStep } from '@ai/composites/AgentThinking/AgentThinking';
import type { FollowUp } from '@ai/patterns/IrisAgent/types';
import { useState } from 'react';
import { Button, Heading, IconButton, Stack, Text } from '@/design-system';

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
    query: 'Summarize these agreements',
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
  | 'prompt-library'
  | 'assist'
  | 'autonomous';

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
  {
    id: 'assist',
    label: 'Assist — counterparty brief',
    note: 'The Acme relationship brief, chaining to comparison, document, and email.',
  },
  {
    id: 'autonomous',
    label: 'Autonomous — agent ran while away',
    note: 'The Conflicting Terms agent reports 3 flagged agreements.',
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

/* ═══════════════════════════════════════
   The David story — scripted exchanges
   ═══════════════════════════════════════

   One table drives every conversational beat of the e2e story: education,
   assist, and the autonomous follow-up. `handleSend` in App.tsx tries
   SEARCH_RESULTS first (it opens the dock), then this table, then the
   fallback. Follow-up chip `id`s are full sentences on purpose — a chip
   sends its id as the message text, so each id is written to hit the next
   exchange's regex. That is how the acts chain.
*/

export type ScriptedExchange = {
  id: string;
  match: RegExp;
  /** Plain-text answer line. */
  content: string;
  /** Streamed markdown body (tables render). */
  markdown?: string;
  thinking?: AgentStep[];
  inlineResults?: { rows: InlineResultRow[]; totalCount?: number; artifactId?: string };
  followUps?: FollowUp[];
  /** Dock item to open once the reply lands. */
  openArtifactId?: string;
};

const UNCAPPED_ROWS: InlineResultRow[] = [
  { id: 'u1', name: 'Acme Corp MSA v2.pdf', type: 'MSA', status: 'Active', date: '14-03-27' },
  { id: 'u2', name: 'Fontara Master Subscription Agreement.pdf', type: 'MSA', status: 'Active', date: '02-11-26' },
  { id: 'u3', name: 'Globex SOW — Q1.pdf', type: 'SOW', status: 'Expiring', date: '30-09-26' },
  { id: 'u4', name: 'Maze Services Agreement 2024.pdf', type: 'Services', status: 'Active', date: '18-01-27' },
];

const CONFLICT_ROWS: InlineResultRow[] = [
  { id: 'cf1', name: 'Acme Corp MSA v2.pdf', type: 'MSA', status: 'Active', date: '14-03-27' },
  { id: 'cf2', name: 'Acme Order Form 2026-114.pdf', type: 'Order Form', status: 'Active', date: '01-06-27' },
  { id: 'cf3', name: 'Acme DPA Amendment 3.pdf', type: 'Amendment', status: 'Active', date: '—' },
];

export const SCRIPTED_EXCHANGES: ScriptedExchange[] = [
  {
    id: 'summarize',
    match: /summarize (these|key)|executive summary|high level/i,
    content: '',
    markdown: [
      'Across the 2 agreements in context:',
      '',
      '- **Acme Corp MSA v2** — master terms for identity-verification services. Auto-renews 14 Mar 2027; 60-day notice to terminate. Liability is **uncapped** for data-breach events.',
      '- **Globex SOW — Q1** — fixed-fee statement of work under the Globex MSA, $84K over two quarters. Expires 30 Sep 2026 with no renewal clause.',
      '',
      'The one term worth attention: Acme’s uncapped liability carve-out is broader than your standard position.',
    ].join('\n'),
    followUps: [
      { id: 'Do I have any agreements with uncapped liability?', label: 'Find uncapped liability' },
      { id: 'Research and summarize the counterparty', label: 'Counterparty brief' },
    ],
  },
  {
    id: 'hierarchy',
    match: /hierarch|parent or child|related to (one another|each other)/i,
    content:
      'I don’t see any related agreements in this set — nothing here is linked as parent or child. Agreements are grouped into a hierarchy from the party page; once they’re linked, I can show you how they connect and where each relationship comes from.',
  },
  {
    id: 'uncapped-liability',
    match: /uncapped liability/i,
    content:
      'Yes — 4 agreements have no liability cap. Here are the most recent. To run this check across your whole repository on a schedule, a worksheet is the right tool.',
    inlineResults: { rows: UNCAPPED_ROWS, totalCount: 4 },
    followUps: [
      { id: 'Research and summarize the counterparty', label: 'Counterparty brief' },
    ],
  },
  {
    id: 'counterparty-brief',
    match: /research and summarize the counterparty|relationship with acme|counterparty brief/i,
    content: '',
    thinking: [
      { kind: 'searching', title: 'Finding agreements with Acme Corp' },
      { kind: 'reading', title: 'Reading terms across 3 active agreements' },
      { kind: 'processing', title: 'Building the relationship brief' },
    ],
    markdown: [
      '## Acme Corp — relationship brief',
      '',
      'Acme provides **identity-verification services** under 3 active agreements: an MSA, one order form, and a DPA amendment. Combined annual spend is **$212K**.',
      '',
      '**Relationship**: the MSA is the master; the order form and DPA hang off it. All three renew independently — the order form auto-renews 1 Jun 2027.',
      '',
      '**Risk**:',
      '- Liability is **uncapped** for data-breach events in the MSA — broader than your standard position.',
      '- The DPA amendment names a subprocessor list that hasn’t been refreshed since 2024.',
      '',
      '**Posture**: terms conflict in 5 places across the three documents; the order form’s payment terms (net-60) contradict the MSA (net-30).',
    ].join('\n'),
    followUps: [
      { id: 'Are there other parties that provide similar services?', label: 'Find similar vendors' },
      { id: 'Generate a document that captures this summary', label: 'Create a summary document' },
    ],
  },
  {
    id: 'similar-vendors',
    match: /similar (parties|vendors|services?)/i,
    content:
      'Yes — Fontara and Maze also provide identity-verification services, both under active agreements. Want me to compare them on price?',
    followUps: [
      {
        id: 'Show me services provided, dates, pricing, and geographic span for Acme, Fontara, and Maze',
        label: 'Compare all three',
      },
    ],
  },
  {
    id: 'vendor-comparison',
    match: /services provided.*(pricing|geographic)|compare (them|all three)/i,
    content: '',
    markdown: [
      '| Vendor | Service | Term | Annual pricing | Geographic span |',
      '|---|---|---|---|---|',
      '| Acme Corp | Identity verification (API + docs) | To 14 Mar 2027, auto-renews | $212K | US, EU |',
      '| Fontara | Identity verification (API) | To 2 Nov 2026 | $148K | US only |',
      '| Maze | Identity + fraud screening | To 18 Jan 2027 | $176K | US, EU, APAC |',
      '',
      'Acme is the most expensive for the narrowest service tier. Fontara is cheapest but US-only; Maze covers the widest span for $36K less than Acme.',
    ].join('\n'),
    followUps: [
      { id: 'Generate a document that captures this summary', label: 'Create a summary document' },
    ],
  },
  {
    id: 'generate-document',
    match: /generate a document|document that captures|create a summary document/i,
    content:
      'Done — I’ve drafted the vendor summary. It’s open on the right; edit it directly or ask me to change it.',
    openArtifactId: 'acme-vendor-brief',
    followUps: [
      { id: 'Send this document to john@acme.com', label: 'Email to john@acme.com' },
    ],
  },
  {
    id: 'send-email',
    match: /send (this document|it) to|email to john/i,
    content:
      'Ready to send: "Acme vendor summary" to john@acme.com, with the document attached. Send it?',
    followUps: [{ id: 'Yes, send the email', label: 'Send the email' }],
  },
  {
    id: 'email-sent',
    match: /yes, send the email/i,
    content: 'Sent to john@acme.com. The document stays in this conversation if you need it again.',
  },
  {
    id: 'show-conflicts',
    match: /show (me )?the conflicts|conflicting terms/i,
    content: '',
    markdown: [
      'Across Acme’s 3 agreements, 5 terms conflict:',
      '',
      '| Term | MSA v2 | Order Form 2026-114 | DPA Amendment 3 |',
      '|---|---|---|---|',
      '| Payment terms | Net-30 | **Net-60** | — |',
      '| Liability cap | **Uncapped** (breach) | 12 months fees | 12 months fees |',
      '| Governing law | Delaware | **California** | Delaware |',
      '| Notice period | 60 days | **30 days** | 60 days |',
      '| Data retention | 90 days | — | **180 days** |',
      '',
      'The order form is the outlier on three of five. Its terms were negotiated separately in 2026 and never reconciled with the master.',
    ].join('\n'),
    followUps: [
      { id: 'Research and summarize the counterparty', label: 'Counterparty brief' },
    ],
  },
];

/** No match — say what the demo can do instead of thinking forever. */
export const FALLBACK_EXCHANGE: ScriptedExchange = {
  id: 'fallback',
  match: /$^/,
  content:
    'In this demo I can summarize the agreements in context, brief you on a counterparty, compare vendors, and draft documents. Try one of these:',
  followUps: [
    { id: 'Provide a high level executive summary of key terms in agreement(s)', label: 'Summarize key terms' },
    { id: 'Research and summarize the counterparty', label: 'Counterparty brief' },
  ],
};

/** The generated document the assist act ends on. */
export const GENERATED_DOCUMENTS: ArtifactItem[] = [
  {
    id: 'acme-vendor-brief',
    title: 'Acme vendor summary',
    kind: 'document',
    subtitle: 'Drafted by Iris',
    sections: [
      {
        heading: '1. Relationship',
        body: 'Acme Corp provides identity-verification services under 3 active agreements — an MSA, one order form, and a DPA amendment. Combined annual spend is $212K. The MSA is the master; both other documents hang off it.',
      },
      {
        heading: '2. Risk',
        body: 'Liability is uncapped for data-breach events in the MSA, broader than our standard position. Terms conflict in 5 places across the three documents, most notably payment terms (net-30 vs net-60).',
      },
      {
        heading: '3. Alternatives',
        body: 'Fontara ($148K, US only) and Maze ($176K, US/EU/APAC) provide comparable identity-verification services. Maze covers the widest geographic span at $36K below Acme’s current spend.',
      },
      {
        heading: '4. Recommendation',
        body: 'Consolidate identity-verification spend at the next Acme renewal window (60-day notice, before 14 Mar 2027). Reconcile the order form’s terms with the master before any renegotiation.',
      },
    ],
  },
];

/* ═══════════════════════════════════════
   Autonomous act — the agent that ran while you were away
   ═══════════════════════════════════════ */

export const AUTONOMOUS_SEED = {
  content:
    'While you were away, your Conflicting Terms agent ran on 12 newly added agreements. 3 with total contract value over $10K carry terms that conflict with your standard positions — all three are with Acme Corp.',
  inlineResults: { rows: CONFLICT_ROWS, totalCount: 3 },
  followUps: [
    { id: 'Show me the conflicts', label: 'Show the conflicts' },
    { id: 'Research and summarize the counterparty', label: 'Counterparty brief' },
  ] as FollowUp[],
};

/** Seeded when Iris opens on the Parties page — the proactive beat. */
export const PARTY_PROACTIVE = {
  content:
    'Acme Corp has 5 conflicting terms across its 3 active agreements. Want the full relationship brief?',
  followUps: [
    { id: 'Research and summarize the counterparty', label: 'Counterparty brief' },
    { id: 'Show me the conflicts', label: 'Show the conflicts' },
  ] as FollowUp[],
};

/* ═══════════════════════════════════════
   Walkthrough — the story, step by step
   ═══════════════════════════════════════

   A floating card gated on `?walkthrough=true`. It does not drive the app —
   it tells the reader what to click while they drive the demo themselves.
*/

const WALKTHROUGH_STEPS: { title: string; body: string }[] = [
  {
    title: 'Meet David',
    body: 'David runs legal ops at the Parks & Rec department. He manages most contracts, he is not an admin, and he has never used Iris. This walkthrough follows his first session.',
  },
  {
    title: 'Open Iris',
    body: 'You are on Agreements → Completed. Click Ask Iris, top right of the table. The panel opens beside the page — the page reflows, nothing is covered.',
  },
  {
    title: 'Get started',
    body: 'A new user sees a welcome line and a Get started checklist: add a source, ask a question, visualize the hierarchy, explore agents. Sources are not attached by default — click + or the suggested pill to scope the chat.',
  },
  {
    title: 'Ask a question',
    body: 'Click Ask a question in the checklist. It sends a real query — summarize these agreements — and Iris answers with key terms and the one risk worth attention.',
  },
  {
    title: 'Follow the rails',
    body: 'Click Find uncapped liability. Iris answers with matching agreements inline, and points at worksheets for running this across the whole repository.',
  },
  {
    title: 'Counterparty brief',
    body: 'Click Counterparty brief. Iris researches, then delivers the Acme relationship: spend, how the three agreements relate, risk, and five conflicting terms.',
  },
  {
    title: 'Compare vendors',
    body: 'Click Find similar vendors, then Compare all three. A table lines up service, term, pricing, and geographic span across Acme, Fontara, and Maze.',
  },
  {
    title: 'Create the document',
    body: 'Click Create a summary document. The drafted vendor brief opens beside the chat, ready to review.',
  },
  {
    title: 'Send it',
    body: 'Click Email to john@acme.com, then Send the email. The action completes without leaving the system.',
  },
  {
    title: 'Iris speaks first',
    body: 'Reload the page, open Parties in the left nav, and click Ask Iris. Iris opens with what it already knows: five conflicting terms with Acme.',
  },
  {
    title: 'While you were away',
    body: 'Add #scenarios to the URL and run Autonomous. The Conflicting Terms agent has already flagged three agreements over $10K — the results are waiting.',
  },
];

export function WalkthroughCard() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const last = step === WALKTHROUGH_STEPS.length - 1;
  const { title, body } = WALKTHROUGH_STEPS[step];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 50,
        maxWidth: 340,
        background: 'var(--ink-bg, #fff)',
        border: '1px solid var(--ink-border-subtle)',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton
          icon="close"
          variant="tertiary"
          size="small"
          aria-label="Dismiss walkthrough"
          onClick={() => setOpen(false)}
        />
      </div>
      <Stack gap="small">
        <Text size="xs" color="secondary">
          Walkthrough · step {step + 1} of {WALKTHROUGH_STEPS.length}
        </Text>
        <Text weight="semibold">{title}</Text>
        <Text size="sm" color="secondary">
          {body}
        </Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Button
            kind="tertiary"
            size="small"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          <Button
            kind="primary"
            size="small"
            onClick={() => (last ? setOpen(false) : setStep((s) => s + 1))}
          >
            {last ? 'Done' : 'Next'}
          </Button>
        </div>
      </Stack>
    </div>
  );
}
