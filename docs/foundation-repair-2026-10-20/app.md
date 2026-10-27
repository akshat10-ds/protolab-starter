# Application source-use repair

Owned files: `src/App.tsx`, `src/index.css`, `src/iris/scenarios.tsx`. Generated design-system and AI-system source were not edited. The source-use audit baseline was not changed or regenerated.

The actual unbaselined audit decreased from 173 findings to zero: 24 raw controls, 25 hardcoded colors, 56 typography values, 45 spacing/radius values and 23 raw layout declarations were replaced or removed through existing design-system APIs. The final regular audit also reports zero findings and 201 resolved historical baseline occurrences (28 were already resolved before this wave).

`App.tsx` now uses design-system Link, Button, IconButton and ComboButton for every previously raw control. The compact Navigator action is specifically named **Add documents**, and its dropdown is named **More add document options**. The agreement viewer's close/notification/sidebar actions retain their callbacks and pressed state; its Download pair uses ComboButton. Ask Iris retains both existing entry callbacks and uses Button's icon slot. The insights carousel retains its manual selection and five-second rotation; its internal Button text supplies each dot's accessible name. My Insights/Data Review now use the shared Tabs keyboard/focus implementation with associated panels containing the same pre-existing shared fixture body.

All 23 reported raw layouts now use Inline, Stack or Grid. The request overview/details preserve the 2:1 layout through three Grid columns and a two-column main section. The agreement detail viewer retains its 64px navigation rail, 380px detail pane and remaining document area through Stack/Inline composition; root flex children preserve scrolling and Iris's sibling reflow. The existing single DocuSignShell, hash navigation, view branches and source fixtures remain in place.

Existing higher-level patterns replace the matching hand-built surfaces: Banner for the overview announcement, SearchInput for its search affordance, Card for overview/insight/walkthrough surfaces, and StatusLight for request detail status. The envelope upload keeps the existing Upload action through FileUpload's repaired primaryAction slot. Removing the separate positioned action avoids a duplicate browse control after the foundation refresh; obsolete upload-content/icon overrides were removed because the repaired FileUpload now owns that geometry.

`index.css` uses the line-height token and holds tokenized insights styling that was previously in an unscanned string template. The old template's raw colors, typography, spacing and hand-built control styles were removed rather than left outside the scanner. Navigator's title selector and the existing Ask Iris gradient use design-system components and existing tokens. `scenarios.tsx` uses Inline rows/actions and a Card walkthrough while preserving scenario data, run callbacks and step state.

Verification:

- `npm run audit:design-system -- --no-baseline`: passed, **0 findings**. The unchanged regular-baseline run also passes with zero findings.
- `node --test scripts/design-system-audit.test.mjs`: **16 tests passed**.
- App/Iris strict TypeScript check against repaired upstream Ink/AI source aliases: passed. The temporary probe is `/private/tmp/protolab-foundation-repair/app-source-check.tsconfig.json`; it uses the existing ES2020/strict contract and one React declaration set to prevent duplicate dependency identities.
- `npm run build`: passed, with the existing large-bundle warning.
- Structural preservation check: all function declarations, selected data/fixture initializers and useState initializers match the pre-wave source. Verified `AGREEMENTS_DATA`, `NAVIGATOR_DATA`, `PARTIES_DATA`, `REQUESTS_DATA`, `WORKSPACES_DATA`, `TEMPLATES_DATA`, `REPORTS_DATA`, `DETAIL_TABS`, `INSIGHT_CARDS`, `ALL_ARTIFACTS`, `SCENARIOS` and `SCRIPTED_EXCHANGES`.

Before the generated refresh, normal `npm run typecheck` still fails on the known old generated-source issues and four expected app diagnostics for new APIs that are present in the repaired authoring source (`FileUpload.primaryAction`, `ComboButton.dropdownLabel`, `ComboButton.accessibilityText`, `Tabs` item `icon`). This is an integration dependency, not a passing starter typecheck claim. Root owns the backed-up refresh and will rerun the normal check against generated output.

Visible changes/verification limits: bespoke 11/13/15/44px text snaps to the existing 12/14/14/40px type roles; uppercase tracking uses the open tracking token. The old teal chart literal is now the nearest existing cyan70 palette role; the CTA accent uses the existing Iris gradient. Shared Card/Banner/Button/Tab surfaces can change tiny insets, default focus rings and hover treatment. Actual runtime verification remains with the integration owner: Completed insight rotation/collapse/tabs and action naming; agreement detail scroll and rail switching; request 2:1 layouts; overview cards/search/banner; envelope upload/recipient/save flow; Iris panel reflow and scenario walkthrough. Static audit success and build success do not establish visual parity or browser behavior.

## Integrator closure

Final private bundle `16c70f74eb3e3ee2` is refreshed with source hash equality. Starter typecheck/build pass and the app source audit has zero findings. Bounded CUA checks are recorded in [browser/root-checks.json](browser/root-checks.json), with final icon tint evidence in [browser/icon-final-tints.png](browser/icon-final-tints.png). Historical wave notes above retain their original scope; no exhaustive raster/variant or successful native-picker claim is made.
