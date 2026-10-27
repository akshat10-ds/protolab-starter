# Docusign patterns — read before building anything

Every prototype is a change to the working Docusign app in `src/App.tsx`.
Whatever the request, the result must look like it shipped in Docusign. The
same order applies every time:

1. **Existing pattern, as is.** If a Docusign screen or pattern already covers the
   request, use or extend that screen.
2. **Existing layout.** If no screen fits, build a new screen on one of the
   layouts below (list, detail, overview, empty state, Iris).
3. **Reuse as much as possible.** If no layout fits, build something new
   from the same parts: the shell, the page container, the type hierarchy, the
   card style, the spacing tokens and the components. A new layout made of
   existing parts is fine. Your own styling is not.

**Requests that go against the patterns.** The PM may ask for something that
breaks a convention: a table in a card, a 48px bold title, a gradient button,
a page outside the shell. Build the Docusign-consistent version, and say in one
line what you did differently and why ("Docusign never puts tables in cards, so
I kept it flush"). If they still want their version, build it and record it
under `deviations` in `.protolab.json`. `/handoff` lists those deviations.

---

## 1. Map of `src/App.tsx`

| What | Where |
|---|---|
| Top-level tabs | `type TabId` (`home`, `agreements`, `templates`, `automations`, `insights`, `admin`, `scenarios`). Selected by URL hash (`#agreements`) via `getTabFromHash` |
| Views inside a tab | `type SidebarView` (Agreements), `TemplatesSidebarView`, `InsightsSidebarView`, `AutomationView`, `AdminView`. Plain `useState`, not routed |
| View titles | `VIEW_LABELS`, `TEMPLATE_VIEW_LABELS`, `INSIGHTS_VIEW_LABELS` |
| Left nav per tab | `agreementsSidebar`, `templatesSidebar`, `insightsSidebar`, `getAutomationSidebar`, `getAdminSidebar`. Wired through `sidebarMap` |
| Page per tab | `agreementsContent`, `templatesContent`, `insightsContent` / `InsightsPage`, `HomePage`, `AutomationsPage`, `AdminPage`. Wired through `contentMap` |
| Local management data | `WORKFLOWS_DATA`, `ACCOUNT_USERS`, `DEFAULT_ACCOUNT_SETTINGS`; state lives in `App` and survives tab changes until reload |
| Sample data and columns | Module level: `AGREEMENTS_DATA`/`agreementColumns`, `NAVIGATOR_DATA`/`navigatorColumns`, `PARTIES_DATA`/`partyColumns`, `REQUESTS_DATA`/`requestColumns`, `WORKSPACES_DATA`/`workspaceColumns`. Templates use `TEMPLATES_DATA`, `TEMPLATE_RESOURCES_DATA` and columns in `TemplatesLibraryPage`; reports use `REPORTS_DATA` and columns in `InsightsPage` |
| Full-screen overlays | `showAgreementDetail`, `activeWorkspace`, `activeRequest` state, rendered after `</DocuSignShell>` |
| AI assistant (Iris) | `openIris()`, `PanelShell` + `IrisAgent`, content in `src/iris/scenarios.tsx` |
| Shared helpers you should reuse | `DetailPageShell`, `DetailEmptyState`, `SectionLabel`, `OvCard`, `OvSectionHeading`, `Footer`, `FadeIn`, `useStaggerEntrance` |

Keep new screens **in `App.tsx`** so they can use these helpers. The file is
big, and that's expected.

## 2. Screen catalog: start from the closest one

| If the PM asks for… | Start from | Layout |
|---|---|---|
| A list of things (envelopes, batches, users, contracts, requests) | Requests, Parties, Workspaces, All Agreements | List view |
| Something about completed agreements, AI extraction, insights on documents | Completed (Navigator mirror) | List view + insights band |
| A record you click into (an agreement, workspace, request, batch) | `WorkspaceDetailView`, `RequestDetailView`, `AgreementDetailView` | Detail overlay |
| A dashboard, landing page or summary | `InsightsOverview`, `HomePage` | Overview |
| A feature with nothing in it yet | PowerForms empty state, `DetailEmptyState` | Empty state |
| Templates, clauses, web forms | Templates resource lists, editor/preview and Template Gallery | List view / gallery |
| Reports or analytics | `InsightsPage` → Overview, named dashboards and Reports category tabs | List view, or Overview for charts |
| AI help, chat, summarisation, "ask a question" | The Iris panel | Iris |
| Agents, rules, workflow lists and setup | `AutomationsPage` → Agents / Rules / Workflows, `WorkflowDialog` | Gallery / list view + creation dialog |
| Settings, admin, preferences | `AdminPage` with grouped account, user, signing/sending and integration navigation | Settings / list view |
| Creating something (new X, wizard, setup) | The entry point the user would click: the Start menu (`headerMenuItems`), the Home "Start" dropdown, or a `PageHeader` action | Creation flow |

Some Agreements left-nav items still have **no view yet**. Wire them up instead
of inventing new navigation: Bulk Send, Signatories and Folders. Search for
`label: '…'` items that have no `onClick`. The Templates, Automations and Admin
areas now provide representative pages through their existing navigation.

## 3. Layout recipes

### List view (`AgreementTableView`)
The most common Docusign screen. `AgreementTableView` takes `pageHeader`,
optional `banner`, `filterBar` and the `DataTable` as children. It handles all
page padding and spacing.

To add a view to Agreements, change **every** place its siblings branch:
1. Add the id to the `SidebarView` union and a title to `VIEW_LABELS`.
2. Add `onClick: () => setSidebarView('<id>')` to its nav item.
3. Add a flag, `const is<Name>View = sidebarView === '<id>'`, plus a filtered-data `useMemo` on `search`.
4. Add a branch to each of: `banner`, `PageHeader` `actions`, FilterBar
   `search.placeholder`, `showSearchIndicator`, `filters`, and the `DataTable` branch.
5. Put the data interface, data array and `columns` at module level, next to `REQUESTS_DATA`.

Table conventions:
- Two-line cells use `<div className={dataTableStyles.cellContent}>` with `Text size="sm"` above `Text size="xs" color="secondary"`.
- Show a person as `Avatar size="small"` with a two-line cell.
- Statuses are a `Badge`.
- Filters are `Button kind="secondary" size="small" menuTrigger`, plus a `Chip` for each filter that's applied.
- Pagination is always on, and `showColumnControl`, `stickyHeader` and `getRowKey` are always set.
- Use `rowHeight="tall"` when cells have two lines.

### Detail overlay (`DetailPageShell`)
A full-screen overlay that opens from a row click and has a back arrow, a title
with a status `Badge`, a tab bar and a content area 1200px wide. Copy
`WorkspaceDetailView`:
1. Add state: `const [activeX, setActiveX] = useState<X | null>(null)`.
2. Add `onRowClick={(row) => setActiveX(row)}` on the list's `DataTable`.
3. Render `{activeX && <XDetailView x={activeX} onClose={() => setActiveX(null)} />}` next to the other overlays.
4. Inside, use `<DetailPageShell title statusLabel tabs activeTab onTabChange topBarActions onClose>`.
   Give each tab a section heading, and use `DetailEmptyState` for empty tabs.
5. Any list inside a tab (agreements, contacts, activity) is a **`DataTable`**.
   `WorkspaceDetailView` now uses the public table and checkbox controls;
   preserve that composition. Summaries and "about" panels are `Card`s in a `Grid`.
6. Use `DetailPageShell` as is. It composes public Tabs and controls with the
   established production dimensions; do not duplicate its shell in new components.

### Overview / dashboard
Copy the skeleton of `InsightsOverview`:
- Page container: `padding: var(--ink-spacing-300)`, `maxWidth: 1400`, `margin: 0 auto`.
- Page title (see the type hierarchy below), then `Grid columns={2} gap="medium"` or `columns={3}` for metric tiles.
- Cards: `OvCard`, with `padding: var(--ink-spacing-200)` inside. Card titles are `Text size="md" weight="semibold"`.
- For a 2:1 split (main column plus side panel), use `Grid columns={3}` with the main child set to `style={{ gridColumn: 'span 2' }}`.
- Use `BarChart` or the existing `InsightsDonut` / `RenewalsChart` for charts. Don't build new chart styles.

### Empty state
Copy the PowerForms empty state: illustration on the left, then a `Stack` with a
`Heading`, one `Text color="secondary"` line, a `Button kind="primary"`, and a `Link`.
For empty tabs inside a detail page, use `DetailEmptyState` instead.
For a new reusable empty-state composition, use the public `EmptyState` and its
Header/Body/Footer parts rather than rebuilding the component.

### Iris / AI
Use the existing Iris panel. Never build a new chat UI:
- Open it with `openIris()` from a `PageHeader` action or a button on the page.
- Give it new conversations, suggestions and results in `src/iris/scenarios.tsx`.
- AI-powered pages get `showAIBadge` on `PageHeader`.
- Components come from `@ai` (`MessageBubble`, `AgentThinking`, `SuggestionChip`…).
- Read `src/ai-system/guidelines/principles.md` before designing any agent behaviour.

### Settings
Fill in `AdminPage`, or add a settings view to a tab.
- Use `PageHeader`, then a `Stack gap="large"` of sections.
- Each section has a section heading, a `Text size="sm" color="secondary"` description, and its form fields.
- Fields are `Input`, `Select`, `Switch`, `Checkbox` or `Radio`.
- Lists of users or items are a `DataTable`, not a hand-made list.
- Account administration uses the shell's grouped `localNav`. A standalone,
  full-width settings view can omit it. Never add a second shell.
- Admin, Automations and Insights sidebar navigation does not key/remount the page. Keep
  their local editor and fixture state intact while changing subviews; reset the
  main scroll position through the shell's existing effect.

The 2026-10-22 live-reference pass is documented in
[live-reference-review-2026-10-22](live-reference-review-2026-10-22/README.md).
Admin defaults to Overview and uses the captured navigation groups. Automations
defaults to Agents. Reports use category tabs rather than the former combined
dashboard/report table. Supplemental pages remain representative local demos.

### Creation flow
Start it from where Docusign would: the Start menu, the Home Start dropdown, or the primary `PageHeader` action.
- **Up to 3 fields:** `Modal`, with the actions in `footer`.
- **Side panel or configuration next to a list:** `Drawer`, `position="right"`.
- **A multi-step wizard:** a full-screen overlay styled like `DetailPageShell`
  (same header band and title style), with a `Stepper` and Back/Next
  `Button`s in a footer bar.

## 4. Type hierarchy (Docusign uses light headings)

| Role | Use | Renders |
|---|---|---|
| Page title | `PageHeader title=…` (list and settings pages), the `DetailPageShell` title, or on overview pages `Heading level={1}` styled `fontSize: var(--ink-font-heading-m-size), fontWeight: var(--ink-font-weight-regular), margin: 0` | 32px / 400 |
| Section heading (detail tabs, settings sections) | `Heading level={2}` styled `fontSize: var(--ink-font-heading-s-size), fontWeight: var(--ink-font-weight-regular), margin: 0` | 24px / 400 |
| Sub-section / card group heading | `OvSectionHeading` | 20px / 500 |
| Card title | `Text size="md" weight="semibold"` | 16px / 600 |
| Eyebrow label | `SectionLabel` | 12px / 600, uppercase |
| Body text (the default) | `Text size="sm"` | 14px |
| Standalone paragraph, empty-state copy | `Text size="md"` | 16px |
| Metadata, timestamps, IDs, sub-lines | `Text size="xs" color="secondary"` | 12px |
| Empty state title | `Text size="lg" weight="medium"` | 18px / 500 |
| Metric in a small tile (count, %) | `Text size="xl" weight="semibold"`, with the label as `Text size="xs" color="secondary"` | 20px / 600 |
| Hero metric (one big number on a dashboard) | `Text` styled `fontSize: var(--ink-font-display-xs-size), fontWeight: var(--ink-font-weight-bold)` | 40px / 700 |

**A plain `<Heading level={1}>` renders 36px semibold, which is not Docusign's
page title.** Always use `PageHeader` or the styled version above. Never set a raw
`fontSize`/`fontWeight` number. Use the `--ink-font-*` tokens.

## 5. Spacing and surfaces

- Page padding is `var(--ink-spacing-300)` (24px). `AgreementTableView` and `DetailPageShell` already apply it.
- Between sections use `Stack gap="large"`. Inside a card or group use `gap="medium"`, and between a label and its value `gap="small"`.
- Spacing tokens: `50`=4, `100`=8, `150`=12, `200`=16, `250`=20, `300`=24, `400`=32, `500`=40, `600`=48, `700`=64.
  Watch out: `--ink-spacing-350` is **36px**, which is larger than `400`.
- Cards: match the sibling you're copying. Insights uses `OvCard` (subtle border,
  `--ink-radius-md`), and Home and detail pages use `Card radius="large"`. Don't mix the
  two on one page, and don't style your own.
- Gap names mean different sizes in `Stack` and `Inline` (see GOTCHAS), so choose by pixel value.
- The page background stays as is. Color appears only through component props
  (`Badge kind`, `Banner kind`, `Button kind`) and `--ink-*` color tokens.

## 6. Sample data

For token and mode verification, the internal `#tokens` view renders shared
components and checks computed CSS against the pinned Figma export. It is
outside the product navigation. Tokens load once through the public barrel;
do not add token imports to individual CSS modules. See
[figma-token-crosswalk.md](figma-token-crosswalk.md).

The separate `/components` review page lives in `App.tsx` alongside the token
view. It deliberately renders outside `DocuSignShell`, as requested for the
component playground. It offers search, category filters, named button sizes
and modes, representative control states and overlay launchers. Product shell
and global navigation link back to their real prototype context; do not nest a
second shell in the gallery. `/componets` is a tolerated spelling alias.

- Make the data realistic for Docusign: envelope names, agreement types,
  signer names and emails, IDs like `BS-20481`, dates in the 2026 timeframe.
- If the feature is about objects that already exist (agreements, parties,
  workspaces), **reuse the existing data arrays** so the prototype feels connected.
  If none of them fit, add new data that reuses existing names (party names from
  `PARTIES_DATA`, senders from `AGREEMENTS_DATA`).
- Show 5–8 rows, including at least one row for each status the feature has
  (e.g. Sent, In Progress, Failed, Queued), so every state is visible.
- The signed-in user is "Akshat Mishra" (`globalNavConfig.user`). Change it if the PM asks.
