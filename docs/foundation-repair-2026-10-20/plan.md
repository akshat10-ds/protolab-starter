# Full foundation repair — 2026-10-20

Scope authorized by Akshat: create a branch and fix everything identified in the
component review and foundation audits. This expands the earlier key-screen-only
remediation scope. Existing tolerance for content insets/row density remains;
the work covers confirmed defects, component API/state gaps, missing public
families, source-use violations and reliable generation. It does not require
reconstructing every production flow. Live Docusign and Figma remain read-only.

## Branches and preservation

- Starter: `codex/fix-protolab-foundation`, retaining existing working changes.
- Ink source: `codex/protolab-foundation-repair` in
  `/private/tmp/protolab-foundation-repair/ink`.
- AI source: `codex/protolab-foundation-repair` in
  `/private/tmp/protolab-foundation-repair/ai`.
- Backups: `/private/tmp/protolab-foundation-repair/starter-before`.
- Current starter source capabilities were copied into the isolated Ink source
  candidate to prevent regressions from the older canonical snapshot. Exact
  hashes are in `source-reconciliation.json`. Current upstream checkouts are
  unchanged; source branches are review candidates, not published releases.

## First build wave: one writer per zone

All agents have the current source, audit IDs and saved Figma evidence in hand.
Unspecified visual/behavioral choices must be marked for verification; source
metadata alone is not a runtime pass.

| Owner | Write zone | Deliverable |
|---|---|---|
| contracts_tokens | Ink generators/package/export barrels; patterns/layout contracts/tokens; Dropdown, Popover, SearchInput and Table helpers; canonical AI system | Clean contract/token checks, preserved current starter API, reproducible generation |
| primitives_behavior | Primitive component TSX/CSS plus ComboButton, ComboBox, DatePicker, FileUpload and FilterTag; excludes all `.figma.ts` | Primitive/form findings, accessibility and required state/API repairs with meaningful tests |
| composites_mappings | All `.figma.ts`; Accordion, Banner, Breadcrumb, Callout, Card, Chip, Modal, Pagination, Panel/Rail, Stepper, List, Table root, Tabs, TaskCard and Timeline | Composite findings, corrected mappings, required state/API repairs with meaningful tests |
| root | Starter app/CSS/docs, source-use violations, icon assets/renderers, new Figma-only families, integration and browser verification | Integrated source candidate, validated refresh, per-finding closure evidence |

Global primitive/composite/root barrels are owned by contracts_tokens. Agents
request new exports instead of racing on those files. Folder-local indexes are
owned by their component writer. Icon/AIIcon/AIBadge renderers belong to root.
No agent edits the starter's generated folders directly. Root delivers a backed-up
refresh only from validated source output.

## Completion evidence

Every review finding and missing-family disposition gets a ledger entry with
source change, verification and remaining limits. Require clean TypeScript,
build, token references, public API/generator checks and source-use checks.
Exercise changed controls in the browser and compare relevant Figma states.
Do not claim every possible slot permutation or glyph raster match from metadata.
No compiler exclusions, broad `any`, baseline relaxation or invented token aliases.

Initial planning estimate: 5–10 engineering days for the expanded scope; this is
not a wall-clock promise. Three build agents plus the integrator are the initial
team. Reassign bounded zones in later waves as findings close.

## Final status and complete checklist

All 59tracked repairs are implemented on `codex/fix-protolab-foundation`. The final private bundle is `16c70f74eb3e3ee2`. Starter typecheck/build pass, the unbaselined app audit reports zero findings, 17 local tests pass, and 257 upstream tests pass (5 skipped). Canonical/prepared AI checks pass 8/4 respectively.

The browser pass covers the key screens and representative controls, with exact limits in [the ledger](ledger.json) and [browser checks](browser/root-checks.json). Native file selection, exhaustive pixel permutations and all production flows are not claimed. Live Docusign and Figma were not changed during this repair. Source archives and hashes are in [the delivery folder](../../patches/2026-10-20-foundation-repair/README.md).

The checkmarks below mean implementation and bounded checks are complete, not that every visual variant was independently rendered.

1. [x] **PRIM-01** — Name compact ComboButton actions
2. [x] **PRIM-02** — Preserve Button icon slot geometry
3. [x] **PRIM-03** — Represent the two ComboBox field families explicitly
4. [x] **PRIM-04** — Use the current ComboBox listbox surface
5. [x] **PRIM-05** — Make DatePicker labels and keyboard opening work
6. [x] **PRIM-06** — Expose only the required DateInput/calendar capabilities
7. [x] **PRIM-07** — Correct calendar selection emphasis and typography
8. [x] **PRIM-08** — Associate Switch label and disabled copy
9. [x] **PRIM-09** — Support Badge menuTrigger when required
10. [x] **PRIM-10** — Preserve Avatar fallback identity and optional treatments
11. [x] **PRIM-11** — Surface the existing AvatarGroup through the barrel
12. [x] **PRIM-12** — Allow IconButton notification badge
13. [x] **PRIM-13** — Make Text Box slots available without custom controls
14. [x] **PRIM-14** — Keep TextArea leading-element gap explicit
15. [x] **PRIM-15** — Match visible Spinner ring geometry
16. [x] **PRIM-16** — Use emphasis red for StatusLight alert text
17. [x] **PRIM-17** — Connect Tooltip to its trigger semantically
18. [x] **PRIM-18** — Preserve 99+ AlertBadge text in translation
19. [x] **PRIM-19** — Keep Radio error icon difference visible
20. [x] **PRIM-20** — Review extra text Button shadows
21. [x] **PRIM-21** — Use medium weight for visible Spinner label
22. [x] **C01** — Wrong Chip selected palette and missing AI/size variants
23. [x] **C02** — Tabs drops composed variants and item affordances
24. [x] **C03** — Generic docked/floating Panel and Rail have no runtime equivalent
25. [x] **C04** — Modal small remains 480px while live small specimen is 272px
26. [x] **C05** — Callout side locations and imagePosition cannot render as specified
27. [x] **C06** — FileUpload omits designed browse actions and template decouples helper limits from validation
28. [x] **C07** — Templates read stale Boolean properties/slot types and lose designed content
29. [x] **C08** — Card image variants and start placement incomplete
30. [x] **C09** — Dismissible FilterTag drops trigger chevron
31. [x] **C10** — Table borders are mapped lossily and template reads removed selection prop
32. [x] **C11** — Compact stepper and visited-but-incomplete state unsupported
33. [x] **C12** — Non-Basic menu families largely implemented but mapping/docs understate coverage
34. [x] **C13** — Supported Banner action variant and alignment differ
35. [x] **C14** — Standalone Pagination lacks current info and size controls layout
36. [x] **C15** — TaskCard template drops visible header overflow action
37. [x] **C16** — Overlay is full-page shell, not Popover
38. [x] **FAMILY-ColorPicker** — ColorPicker public family
39. [x] **FAMILY-EmptyState** — EmptyState public family
40. [x] **FAMILY-Hotspot** — Hotspot public family
41. [x] **FAMILY-Meter** — Meter public family
42. [x] **FAMILY-PreviewCard** — PreviewCard public family
43. [x] **FAMILY-SegmentedControl** — SegmentedControl public family
44. [x] **FAMILY-SelectTile** — SelectTile public family
45. [x] **FAMILY-StarRating** — StarRating public family
46. [x] **FAMILY-Tag** — Tag public family
47. [x] **FAMILY-Toast** — Toast public family
48. [x] **FAMILY-Tree** — Tree public family
49. [x] **FAMILY-WorkflowStepper** — WorkflowStepper public family
50. [x] **FAMILY-ZoomControl** — ZoomControl public family
51. [x] **FOUNDATION-TYPES** — Zero TypeScript diagnostics and reliable public API
52. [x] **FOUNDATION-TOKENS** — Zero undefined token references with semantic review
53. [x] **FOUNDATION-GENERATION** — Compatible source generation and repeatable refresh
54. [x] **APP-SOURCE** — Resolve173 app source-use audit findings
55. [x] **ICONS** — Correct advertised AI glyph geometry and missing System glyphs
56. [x] **FAMILY-ToggleButton** — Public Toggle Button selected/disabled/small/icon-only contract
57. [x] **AIBADGE** — AI Badge placement, callout content and accessible interaction
58. [x] **FOUNDATION-LOCALNAV** — Separate accessible navigation row and overflow actions; prevent bubbled keyboard navigation
59. [x] **APP-RECORD-FOCUS** — Full-page record views focus their close action, support Escape, restore focus and make the covered shell inert
