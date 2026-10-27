# Live Docusign comparison and prototype updates

Reviewed the signed-in development app on 22 October 2026, then revised the local prototype. The earlier coverage pass used structural approximations; this pass uses fresh screenshots and DOM observations from the actual app. Live navigation was read-only: no settings, documents, recipients, rules or workflows were submitted or changed.

## Review steps and resulting health

1. **Templates — updated and verified.** The live envelope list has Tabs above the title, creation under Start, Date / Advanced search / Clear controls, and Name / Owner / Powerforms / Created Date / Last Change / Folders columns. The prototype now uses that structure, linked names and compact page padding. Show More opens All Templates. Existing resource pages, Elastic Templates, favorites, previews and creation remain. Shared-only filtering reduced the four My Templates fixtures to one; Clear restored four.
2. **Automations — updated and verified.** The actual landing page is Agents, with Rules and Workflows in the primary navigation. Added Featured / My agents cards, local filters, list/tile views and creation/editing; added the Rules introduction and eleven template subjects with local setup. Workflows now shows publication state, last modified, creator and overflow actions, with Draft saved / Edit subrows and the live filter names. Local agent and rule creation passed. Prior activity and workflow-template demos remain accessible through the Workflow menu.
3. **Admin — updated and verified.** The actual app defaults to Overview, with an account selector and Account, Users and Groups, Signing and Sending, Integrations, Agreement Actions and Auditing groups. All forty local destinations render. Overview now includes the permissions announcement, setting/user search, notifications and resources. Users uses the live action toolbar and filters, plus Name / Added / Status / Permission Profile / Groups / Actions columns. Existing local user/group/profile operations remain, with local edit and bulk-file dialogs.
4. **Insights — updated and verified.** Overview now has the live Recents / Starred organization and recommendation, weekly, agreement-review and exploration sections, without the old announcement at the top. Named dashboards now open separate views. Reports has Recents, All Envelope, Envelope, Recipient, Usage, Custom, Downloads and Web forms tabs, with the observed category-specific columns. All eight categories rendered. Saving a recommendation survived navigation; period selection and a Monthly schedule worked; schedule opens one dialog; a new custom dashboard retained its title after leaving and returning. My dashboard includes the captured environmental-impact composition.
5. **Shared shell — verified.** Preserved the requested uniform header utility buttons, extra Home tasks and ecru background. Home's Send action now precedes Ask Iris, matching the live order. Main content and sidebar scroll reset appropriately when navigating. Root height equals the viewport height.

## Visual evidence

Accepted live captures `01`–`11` cover Home, Templates, Agents, Rules, Workflows, Admin Overview / Users, Insights Overview, My dashboard and Reports. The first Reports Recents capture was rejected because it inherited scroll; `10-live-reports-recents.png` is the accepted replacement.

For direct comparison, hidden browser tabs produced matching **1280×720** captures:

| Area | Live reference | Final prototype |
| --- | --- | --- |
| Templates | `14-reference-templates-1280.png` | `20-prototype-templates.png` |
| Agents | `15-reference-agents-1280.png` | `25-prototype-agents-final.png` |
| Admin Overview | `16-reference-admin-1280.png` | `22-prototype-admin-overview.png` |
| Insights Overview | `13-reference-insights-1280.png` | `26-prototype-insights-final.png` |

Each saved image was opened and inspected. Reference and prototype were viewed together for comparison. That pass corrected template search width, agent-card surfaces and responsive layout, Insights panel stacking and vertical inset, and retained navigation scroll. Intermediate `12`, `21` and `24` are retained as before/superseded evidence.

## Verification and limits

- Typecheck and production build passed; all 10,844 pinned token checks passed.
- Design-system source audit: zero findings without a baseline.
- Literal icon scan: 459 references checked, zero invalid names.
- Fresh browser pass: all six top-level tabs render, with zero runtime errors and zero icon warnings.
- Navigation and interaction evidence is recorded in `browser-checks.json`.
- Fixed unsupported Select props and invalid block content in Banner during verification; added their correct usage to GOTCHAS.

Content, counts, spacing and row density intentionally use representative fixtures. Supplemental Admin settings and most dashboard interiors are rough demos rather than verified replicas of every live page. Admin's separate Organization / Accounts rail is represented by the existing shell's account navigation. The promotional illustrations/video were omitted rather than approximated. Controls are composed from public Ink components; this pass does not certify full keyboard or screen-reader accessibility. Local edits reset on refresh, and no backend or external rule execution is connected. The build retains its existing large-chunk warning.
