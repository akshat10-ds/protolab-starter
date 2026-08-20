/**
 * Sample agent runs for AgentActivity — agreements domain, hardcoded.
 *
 * A fixture, like SAMPLE_SUGGESTIONS: the panel renders these until a host has
 * real runs to show. Icons are limited to glyphs every prototype's vendored
 * Ink carries (flash, search, data-read, document-pencil, gear, plugin, clock,
 * bolt, ai-spark-filled) — no brand logos, no external URLs.
 */

import type { AgentRun } from './AgentActivity';

export const SAMPLE_AGENT_RUNS: AgentRun[] = [
  {
    id: 'run-obligations',
    agent: 'Obligations Agent',
    summary: 'Extracting obligations from Q3 vendor agreements',
    timestamp: 'Now',
    status: 'running',
    icon: 'data-read',
    transcript: [
      { type: 'trigger', text: 'Scheduled run — extract obligations from new vendor agreements.' },
      {
        type: 'thinking',
        steps: [
          { kind: 'searching', title: 'Finding vendor agreements added this quarter', result: '18 agreements' },
          { kind: 'reading', title: 'Reading payment and delivery clauses', result: '11 of 18' },
          { kind: 'processing', title: 'Extracting obligations into the register' },
        ],
        outcome: 'Read 11 of 18 agreements so far',
      },
      {
        type: 'message',
        markdown:
          'Working through the Q3 vendor set. So far:\n\n- **23 obligations** extracted from 11 agreements\n- 2 agreements use non-standard payment terms — flagged for a closer pass\n\n7 agreements remain.',
      },
    ],
  },
  {
    id: 'run-renewals',
    agent: 'Renewals Agent',
    summary: 'Flagged 3 agreements expiring in 30 days',
    timestamp: '12 min ago',
    status: 'done',
    icon: 'clock',
    transcript: [
      { type: 'trigger', text: 'Daily run — check for agreements approaching renewal.' },
      {
        type: 'thinking',
        steps: [
          { kind: 'searching', title: 'Scanning active agreements for renewal dates', result: '412 scanned' },
          { kind: 'reading', title: 'Reading renewal terms on near-term expirations', result: '9 agreements' },
          { kind: 'processing', title: 'Checking auto-renewal and notice windows' },
        ],
        outcome: 'Scanned 412 agreements, 3 need attention within 30 days',
      },
      {
        type: 'message',
        markdown:
          'Three agreements expire within 30 days:\n\n| Agreement | Expires | Notice window |\n| --- | --- | --- |\n| Apex Corp MSA | Sep 4 | 60 days — **already inside it** |\n| Northwind SOW-2 | Sep 9 | 30 days |\n| Meridian NDA | Sep 11 | None |\n\nApex auto-renews unless notice is given. I drafted a renewal summary for each and added them to the renewals queue.',
      },
    ],
  },
  {
    id: 'run-discovery',
    agent: 'Agreement Type Discovery Agent',
    summary: 'Classified 12 new documents',
    timestamp: '2 hours ago',
    status: 'done',
    icon: 'search',
    transcript: [
      { type: 'trigger', text: 'New uploads detected — classify agreement types.' },
      {
        type: 'thinking',
        steps: [
          { kind: 'reading', title: 'Reading 12 uploaded documents', result: '12 documents' },
          { kind: 'processing', title: 'Matching against known agreement types' },
          { kind: 'writing', title: 'Applying type labels and metadata' },
        ],
        outcome: 'Classified 12 documents into 4 types',
      },
      {
        type: 'message',
        markdown:
          'All 12 documents classified:\n\n- **7** — Master Service Agreements\n- **3** — Statements of Work\n- **1** — Non-disclosure Agreement\n- **1** — Amendment (linked to Apex Corp MSA)\n\nOne MSA had no counterparty name in its metadata; I filled it from the signature block.',
      },
    ],
  },
  {
    id: 'run-redline',
    agent: 'Redline Agent',
    summary: 'Could not reconcile 2 conflicting clauses',
    timestamp: 'Yesterday',
    status: 'needs-attention',
    icon: 'document-pencil',
    transcript: [
      { type: 'trigger', text: 'Review the Northwind MSA redlines against our playbook.' },
      {
        type: 'thinking',
        steps: [
          { kind: 'reading', title: 'Reading counterparty redlines', result: '14 changes' },
          { kind: 'searching', title: 'Matching changes against playbook positions', result: '12 matched' },
          { kind: 'thinking', title: 'Resolving the remaining changes', text: 'Two changes touch the same liability cap with different values. The playbook allows either alone, not both.' },
        ],
        outcome: 'Accepted 12 of 14 changes, 2 conflict',
      },
      {
        type: 'message',
        markdown:
          'I accepted 12 of 14 redlines under playbook positions. Two need a human call:\n\n1. **Section 4.2** — liability cap changed to 12 months of fees\n2. **Exhibit B** — the same cap referenced as 24 months\n\nThese conflict, and the playbook allows either alone. Pick one and I will apply it to both places.',
      },
    ],
  },
  {
    id: 'run-intake',
    agent: 'Intake Agent',
    summary: 'Routed 5 requests to the right queues',
    timestamp: 'Yesterday',
    status: 'done',
    icon: 'gear',
    transcript: [
      { type: 'trigger', text: 'Hourly run — triage new agreement requests.' },
      {
        type: 'thinking',
        steps: [
          { kind: 'searching', title: 'Collecting new requests from intake', result: '5 requests' },
          { kind: 'processing', title: 'Classifying and prioritizing each request' },
          { kind: 'writing', title: 'Routing to owning queues' },
        ],
        outcome: 'Routed 5 requests, 1 marked high priority',
      },
      {
        type: 'message',
        markdown:
          'Five requests triaged:\n\n- **1 high priority** — a $2.4M MSA review from Sales, routed to Legal\n- 3 standard NDA requests, routed to self-service\n- 1 SOW amendment, routed to Procurement\n\nNothing left in the intake queue.',
      },
    ],
  },
];
