/**
 * Sample artifacts — agreements-domain fixtures for prototyping the
 * `ArtifactColumn`. Hardcoded on purpose; no plumbing.
 */

import type { Artifact } from './ArtifactColumn';
import type { ArtifactItem, ArtifactTable } from './ArtifactDock';
import type { Citation } from '../../primitives/CitationBadge/CitationBadge';

/**
 * The structured fixture for the `table` kind — frame 163:21261's real columns,
 * and eight of the twenty-five rows it lists.
 *
 * `sortValues` carries what the text cannot sort on: an expiry date is written
 * DD-MM-YY and sorts wrong as a string, and a status has an order its label
 * does not carry.
 */
const agreementsTable: ArtifactTable = {
  selectable: true,
  rowActions: true,
  columns: [
    { key: 'file', label: 'File Name', width: 548 },
    { key: 'parties', label: 'Parties', width: 158, sortable: true },
    /* The one column that aligns to its own edge. Eight dates against a right
       edge with tabular figures read as a ranking. The frame draws them left;
       Akshat, 2026-08-14: "sure." */
    { key: 'expires', label: 'Expiration Date', width: 147, sortable: true, align: 'end' },
    { key: 'status', label: 'Status', width: 130, sortable: true },
    { key: 'type', label: 'Agreement Type', width: 200, sortable: true },
    { key: 'sets', label: 'Sets', width: 223, sortable: true },
  ],
  rows: [
    {
      id: 'msa-2041',
      sortValues: { expires: '2026-09-12', status: 2 },
      cells: {
        file: {
          kind: 'text',
          text: 'MSA-2041 — Northwind Traders.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Northwind', 'Docusign'] },
        expires: { kind: 'text', text: '12-09-26' },
        status: { kind: 'status', state: 'renewing', label: 'Renewing Soon', sub: 'Renews 12-09-26' },
        type: { kind: 'text', text: 'Master Services Agreement' },
        sets: { kind: 'chips', chips: ['Q3 Renewals', 'Northwind'], more: 2 },
      },
    },
    {
      id: 'sow-1187',
      sortValues: { expires: '2026-08-30', status: 0 },
      cells: {
        file: {
          kind: 'text',
          text: 'SOW-1187 — Contoso Ltd.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Contoso'] },
        expires: { kind: 'text', text: '30-08-26' },
        status: { kind: 'status', state: 'expiring', label: 'Expiring Soon', sub: 'Expires 30-08-26' },
        type: { kind: 'text', text: 'Statement of Work' },
        sets: { kind: 'chips', chips: ['Q3 Renewals'] },
      },
    },
    {
      id: 'nda-0932',
      sortValues: { expires: '2026-09-02', status: 2 },
      cells: {
        file: {
          kind: 'text',
          text: 'NDA-0932 — Fabrikam Inc.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Fabrikam', 'Docusign'] },
        expires: { kind: 'text', text: '02-09-26' },
        status: { kind: 'status', state: 'renewing', label: 'Renewing Soon', sub: 'Renews 02-09-26' },
        type: { kind: 'text', text: 'Mutual Non-Disclosure' },
        sets: { kind: 'chips', chips: [] },
      },
    },
    {
      id: 'msa-1990',
      sortValues: { expires: '2026-09-28', status: 0 },
      cells: {
        file: {
          kind: 'text',
          text: 'MSA-1990 — Adventure Works.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Adventure Works', 'Docusign'] },
        expires: { kind: 'text', text: '28-09-26' },
        status: { kind: 'status', state: 'expiring', label: 'Expiring Soon', sub: 'Expires 28-09-26' },
        type: { kind: 'text', text: 'Master Services Agreement' },
        sets: { kind: 'chips', chips: ['Q3 Renewals', 'Adventure Works'], more: 1 },
      },
    },
    {
      id: 'sow-2044',
      sortValues: { expires: '2027-01-31', status: 1 },
      cells: {
        file: {
          kind: 'text',
          text: 'SOW-2044 — Implementation services.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Northwind'] },
        expires: { kind: 'text', text: '31-01-27' },
        status: { kind: 'status', state: 'active', label: 'Active' },
        type: { kind: 'text', text: 'Statement of Work' },
        sets: { kind: 'chips', chips: ['Northwind'] },
      },
    },
    {
      id: 'sow-2101',
      sortValues: { expires: '2027-03-14', status: 1 },
      cells: {
        file: {
          kind: 'text',
          text: 'SOW-2101 — Support retainer.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Northwind'] },
        expires: { kind: 'text', text: '14-03-27' },
        status: { kind: 'status', state: 'active', label: 'Active' },
        type: { kind: 'text', text: 'Support Agreement' },
        sets: { kind: 'chips', chips: ['Northwind', 'Support'] },
      },
    },
    {
      id: 'dpa-2045',
      sortValues: { expires: '2025-11-04', status: 3 },
      cells: {
        file: {
          kind: 'text',
          text: 'DPA-2045 — Data processing addendum.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Northwind', 'Docusign'] },
        expires: { kind: 'text', text: '04-11-25' },
        status: { kind: 'status', state: 'inactive', label: 'Inactive' },
        type: { kind: 'text', text: 'Data Processing Addendum' },
        sets: { kind: 'chips', chips: [] },
      },
    },
    {
      id: 'amd-2046',
      sortValues: { expires: '2026-09-12', status: 1 },
      cells: {
        file: {
          kind: 'text',
          text: 'Amendment 1 — MSA-2041.pdf',
          sub: 'Uploaded: View Job',
          subIcon: 'document',
        },
        parties: { kind: 'chips', chips: ['Northwind', 'Docusign'] },
        expires: { kind: 'text', text: '12-09-26' },
        status: { kind: 'status', state: 'active', label: 'Active' },
        type: { kind: 'text', text: 'Amendment' },
        sets: { kind: 'chips', chips: ['Northwind'] },
      },
    },
  ],
};

export const sampleAgreementArtifacts: Artifact[] = [
  {
    id: 'renewals-q3',
    title: 'Q3 renewals',
    kind: 'table',
    content: `## Agreements up for renewal — Q3 2026

| Agreement | Counterparty | Value | Expires | Auto-renews |
|---|---|---|---|---|
| MSA-2041 | Northwind Traders | $420,000 | Sep 12, 2026 | Yes |
| SOW-1187 | Contoso Ltd | $88,500 | Aug 30, 2026 | No |
| NDA-0932 | Fabrikam Inc | — | Sep 02, 2026 | Yes |
| MSA-1990 | Adventure Works | $610,000 | Sep 28, 2026 | No |

**4 agreements** expire this quarter. Two do not auto-renew and need action before their notice windows close.`,
  },
  {
    id: 'northwind-hierarchy',
    title: 'Northwind hierarchy',
    kind: 'markdown',
    content: `# Northwind Traders — agreement hierarchy

**Master agreement**

- **MSA-2041** — Master Services Agreement, effective Jan 2024

**Child agreements**

- SOW-2044 — Implementation services, $120,000
- SOW-2101 — Support retainer, $36,000/yr
- DPA-2045 — Data processing addendum
- Amendment 1 — Extends term to Sep 2026

**Notes**

- The support retainer inherits the MSA's liability cap ($1M aggregate).
- Amendment 1 changed the governing law from NY to DE.`,
  },
  {
    id: 'renewal-brief',
    title: 'Renewal brief',
    kind: 'markdown',
    content: `# Renewal brief — MSA-1990 (Adventure Works)

## Recommendation

Start renewal talks now. The agreement does **not** auto-renew, and the 60-day notice window opens Jul 30.

## Key terms

- Term: 3 years, expires Sep 28, 2026
- Value: $610,000/yr
- Price escalation: capped at 4% per renewal
- Termination: either party, 60-day notice

## Risks

- No auto-renew clause; a missed window means a lapsed agreement.
- The liability cap is below the current policy floor.`,
  },
];

/**
 * The `ArtifactDock` fixture — every kind, one of each.
 *
 * The three markdown/table items are the same content as
 * `sampleAgreementArtifacts` above, so a host can swap `ArtifactColumn` for
 * `ArtifactDock` and see the same artifacts in the new frame. The sources item
 * and the document item are what the dock adds: a sources list drills into
 * `msa-2041`, which is why that document carries the back arrow.
 */
export const sampleArtifactItems: ArtifactItem[] = [
  {
    ...sampleAgreementArtifacts[0],
    subtitle: '8 rows · Q3 2026',
    /*
     * `content` stays beside `table`. `ArtifactColumn` and the markdown path
     * still read it, so the same fixture works in both frames; `ArtifactDock`
     * prefers the structured model where it exists.
     */
    table: agreementsTable,
  },
  {
    ...sampleAgreementArtifacts[1],
    subtitle: 'Northwind Traders · 5 agreements',
  },
  {
    ...sampleAgreementArtifacts[2],
    subtitle: 'Adventure Works · expires Sep 28, 2026',
  },
  {
    id: 'q3-sources',
    title: 'Sources',
    kind: 'sources',
    subtitle: '4 agreements read',
    sources: [
      {
        id: 'msa-2041',
        title: 'MSA-2041 — Northwind Traders',
        excerpt: 'Master Services Agreement, effective Jan 2024',
        meta: 'PDF · 24 pages',
        icon: 'document',
      },
      {
        id: 'sow-1187',
        title: 'SOW-1187 — Contoso Ltd',
        excerpt: 'Statement of work, expires Aug 30, 2026',
        meta: 'PDF · 8 pages',
        icon: 'document',
      },
      {
        id: 'nda-0932',
        title: 'NDA-0932 — Fabrikam Inc',
        excerpt: 'Mutual non-disclosure, auto-renews',
        meta: 'PDF · 4 pages',
        icon: 'document',
      },
      {
        id: 'msa-1990',
        title: 'MSA-1990 — Adventure Works',
        excerpt: 'Master Services Agreement, no auto-renew',
        meta: 'PDF · 31 pages',
        icon: 'document',
      },
    ],
  },
  {
    id: 'msa-2041',
    title: 'MSA-2041',
    kind: 'document',
    subtitle: 'Northwind Traders · effective Jan 12, 2024',
    /*
     * Twelve clauses, so the paged preview has four pages to move between. The
     * renderer pages by a fixed number of sections; three of these are the
     * original fixture and the citation still lands on clause 7.
     */
    sections: [
      {
        heading: '1. Term',
        body: 'This Agreement starts on the Effective Date and continues for three (3) years. It renews automatically for successive one-year terms unless either party gives written notice at least sixty (60) days before the end of the then-current term.',
      },
      {
        heading: '2. Services',
        body: 'Supplier will supply the services described in each Statement of Work executed under this Agreement. Each Statement of Work is part of this Agreement and is governed by its terms.',
      },
      {
        heading: '3. Fees and payment',
        body: 'Customer will pay each undisputed invoice within thirty (30) days of receipt. Fees are exclusive of taxes. A price increase at renewal will not be more than four percent (4%) of the fees for the previous term.',
      },
      {
        heading: '4. Confidentiality',
        body: 'Each party will keep the other party’s Confidential Information in confidence, and will not disclose it to a third party without written permission. This obligation continues for five (5) years after the end of this Agreement.',
      },
      {
        heading: '5. Intellectual property',
        body: 'Each party keeps all right, title and interest in its own pre-existing intellectual property. Deliverables made under a Statement of Work become the property of Customer when the related fees are paid in full.',
      },
      {
        heading: '6. Warranties',
        body: 'Supplier warrants that it will supply the services in a professional manner and in agreement with the applicable Statement of Work. Customer must report a defect within thirty (30) days.',
      },
      {
        heading: '7. Limitation of liability',
        body: 'Each party’s total aggregate liability under this Agreement will not exceed one million dollars ($1,000,000). This cap applies to all claims in the aggregate, and it flows down to every Statement of Work and addendum executed under this Agreement.',
        highlighted: true,
        citationId: 'msa-2041-liability',
      },
      {
        heading: '8. Indemnification',
        body: 'Supplier will defend Customer against a third-party claim that the deliverables infringe an intellectual property right, and will pay the damages that a court awards for that claim.',
      },
      {
        heading: '9. Data protection',
        body: 'The parties will process personal data in agreement with the Data Processing Addendum (DPA-2045), which is included in this Agreement by reference.',
      },
      {
        heading: '10. Termination',
        body: 'Either party can end this Agreement for a material breach that is not corrected within thirty (30) days of written notice. Customer will pay for all services supplied before the end date.',
      },
      {
        heading: '11. Assignment',
        body: 'Neither party can assign this Agreement without the written permission of the other party, except to a successor in a merger or a sale of all of its assets.',
      },
      {
        heading: '12. Governing law',
        body: 'This Agreement is governed by the laws of the State of Delaware, without regard to its conflict-of-laws rules. Amendment 1 changed this from New York on Sep 3, 2025.',
      },
    ],
  },
  {
    id: 'renewal-value',
    title: 'Renewal value by quarter',
    kind: 'visualization',
    subtitle: 'FY2026 · 4 quarters',
  },
];

/**
 * Citations for a chat turn that reference the sample artifacts.
 * `url` carries `artifact:{id}` so the host's `onCitationClick` can route
 * the click to `ArtifactColumn` via `openId`.
 */
export const sampleArtifactCitations: Record<string, Citation> = {
  '1': {
    id: '1',
    title: 'Q3 renewals',
    excerpt: '4 agreements expire this quarter; two need action.',
    url: 'artifact:renewals-q3',
  },
  '2': {
    id: '2',
    title: 'Northwind hierarchy',
    excerpt: 'MSA-2041 with four child agreements.',
    url: 'artifact:northwind-hierarchy',
  },
  '3': {
    id: '3',
    title: 'Renewal brief',
    excerpt: 'MSA-1990 does not auto-renew; notice window opens Jul 30.',
    url: 'artifact:renewal-brief',
  },
};

/**
 * A ready-made assistant turn body. The `[label]¹` spans render as
 * `CitationBadge` chips; clicking one opens the artifact.
 */
export const sampleArtifactMessage = `I looked across the portfolio. Four agreements expire in Q3 — the full list is in the [Q3 renewals table]¹.

Northwind is the largest relationship; I mapped its [agreement hierarchy]² under MSA-2041.

MSA-1990 needs attention first, so I drafted a [renewal brief]³ with the key terms and risks.`;
