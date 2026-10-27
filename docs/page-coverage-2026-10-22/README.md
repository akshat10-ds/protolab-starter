# Prototype page coverage — 22 October 2026

Implemented with three parallel agents for Admin, Automations and Templates; parent integration covered shared navigation, header treatments, icon fixes and browser QA. All six product tabs render a usable page. This is representative prototype coverage, not a claim of exact production or Figma parity.

## Admin

Grouped navigation uses the existing shell. Ten views: Admin overview, Users, Groups, Permission profiles, Account settings, Brands, Security settings, Signing settings, Sending settings, Connected apps.

Preserved adding users, status filtering, invitation/deactivation actions and account preferences. Added group creation/membership, profile creation/duplication, brand preview, signing/sending/security controls and connection-management dialogs. All changes affect local fixture state only.

Browser checks exercised every destination. A group with one selected member survived navigation to Permission profiles and back. The initial Groups → Permission profiles transition exposed a stale DataTable column renderer; distinct table keys fixed it. Only the tables remount, so owning page state survives sidebar navigation.

## Automations

Five views: All workflows, Active workflows, Draft workflows, Activity, Workflow templates. Added grouped navigation, five run fixtures, run details with timelines/retry state, and six starter templates. Existing create/edit, activate/pause, duplicate, search and pagination remain available.

Verified creating a workflow from a prefilled starter yields a new Draft row. Verified a failed run changes to Running after Retry. Verified transitions between workflows, run activity, filters and template cards. A row's View activity action opens overall activity; it does not scope the list to that workflow.

## Templates

Twelve destinations: My Templates, Shared with Me, Favorites, Clauses, Document Templates, Workspace Templates, Workflow Templates, My Web Forms, Shared Web Forms, All Web Forms, Template Gallery, Elastic Templates. The internal All Templates view remains available to existing callers as well.

Forty fixtures span seven resource types. Search, status filtering, pagination, favorites, previews, creation/upload dialogs, editing and copying are wired. Envelope Use opens the existing composer. Workflow Use adds an Automations draft. Other resource previews offer a local draft copy.

Browser checks exercised every visible category, gallery preview, required-name validation and clause creation, Elastic Templates, and the Templates → Automations draft handoff. The gallery contains 34 published fixture cards. Upload controls are wired; this pass did not exercise file selection.

## Shared shell and icons

Search, Notifications, Tasks, Help and the avatar now share transparent 40×40 hit areas, matching hover/active/focus treatments, and 24px utility glyphs. Tasks returns to Home. Styling is scoped to the app's GlobalNav instance and uses Ink tokens. Agreements' Workflows shortcut now opens Automations.

The odd Send Envelope artwork was a failed SVG asset request while the local server was stopped. Restarting the server restored the catalog's actual paper-plane glyph; its source artwork was retained. Two Iris New chat references were repaired in isolated authoritative AI source and refreshed after source-contract validation; see `patches/2026-10-22-icon-references/`.

The final literal-name scan checked 446 references against 291 catalog families and preserved extensions, with zero invalid names. Runtime verification confirmed Iris uses `pencil-box` with the small master and produced no icon warnings. Home's root height measured 720px in a 720px viewport.

## Verification

- Typecheck passed.
- Build passed, including all 10,844 pinned Figma token checks.
- Design-system source audit: zero findings without a baseline.
- Existing source-audit tests: 16 passed.
- Fresh browser pass: Home, Agreements, Templates, Automations, Insights and Admin rendered with zero runtime errors.
- Accepted screenshots: `header-home.png`, `automations.png`, `admin-users.png`, `templates.png`, `template-gallery.png`.
- Navigation observations: `browser-checks.json` and `top-level-checks.json`.

Build retains the existing large-chunk warning. Fixture changes reset on reload; Admin's supplemental fixture state also resets when leaving that top-level tab. Settings are representative controls, previews use sample content, and deeper production flows are outside this rough coverage pass. Some Agreements links (Folders, Signatories, Bulk Send) remain placeholders. The live Docusign account and Figma library were not changed.
