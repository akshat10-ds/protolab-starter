# Comprehensive Figma component review — 2026-10-20

The review covers **every component owner in the current `[ds-ui] Component Library`**, not just the Accordion page supplied in the link. It identifies useful upstream component/API corrections for a reusable Docusign prototyping playground. Completion means recognizable key screens, reusable design-system composition, accessible controls and representative states. **Content insets, row density and all production flows are not completion gates.** No fidelity percentage is assigned.

Figma and live Docusign were read-only. This audit changed only documentation/evidence under `docs/`; it did not edit the generated design system or register/write Figma mappings. Separate key-screen application changes and their verification are reported by the parent task.

## What was covered

| Evidence dimension | Current coverage | What it does not prove |
|---|---|---|
| Whole-file inventory | 57 pages; 53 contain owners, 4 are documentation/separator pages | A page name is not a single component specimen |
| Owner/variant metadata | **164 published owners: 108 sets + 56 standalone masters; 1,389 actual variants/standalone specimens; 20,520 descendant node records** | Every Cartesian combination or arbitrary Boolean/slot override |
| Current local source comparison | All owners reviewed at family/parent scope: primitives/forms 41, composites 71, Figma-only/internal group 52 | Every Figma-only owner needs a new export, or every internal child is a missing control |
| Visual design references | **64 current Figma PNGs**, including 4 supplemental AI glyph references; family specimens inspected | Screenshot per variant or local rendered pixel equality |
| Runtime component verification | No new component zoo or exhaustive interaction run | Hover/focus/keyboard/error/disabled states, responsive/inverse/touch modes and font rasterization remain visually unverified |
| Tokens/styles | 855 local variables resolved without missing aliases; 28 text styles, 4 paint styles, 10 effect styles | Token presence means the correct token is consumed everywhere |
| Linked System icons | 589 masters inventoried, vector data extracted; name mapping and AI renderer geometry reviewed | Full normalized/raster equivalence for every glyph or other Icon Library pages |

The whole-file read found **no additional unpublished owners**. Audit roles separate 53 family/group masters, 23 compositions/presets and 88 child/internal pieces. These role labels are audit classifications; the 56 standalone-master count is a Figma node-type count, not a claim of 56 public React components.

The exact IDs, axes, variant IDs, code representations, evidence paths and verification dimensions are in [coverage.json](figma-library-review-2026-10-20/coverage.json). All 164 IDs reconcile exactly with the current published graph; there are no duplicate, omitted or extra owner records.

## Current key-screen priorities

These are useful current-screen actions or upstream source-owner work. Conditional variants below are not prerequisites for the playground.

1. **Name the compact Navigator ComboButton action.** Its generated compact branch renders an icon-only main button without an accessible text/name path in its API. This is present on the current Navigator branch. A view can compose existing named Button/IconButton and Dropdown pieces; the durable component fix belongs upstream. See PRIM-01 in the [primitive review](figma-library-review-2026-10-20/groups/primitives.md).
2. **Preserve Button icon-slot geometry.** Generated Button CSS forces both sizes' SVG slots to 16px, while current Figma specimens use 20px in small and 24px in medium. This affects existing Share, Manage Parties and filter actions; passing a larger Icon cannot overcome the descendant selector. Validate the selected key-screen icons before an upstream size correction. See PRIM-02.
3. **Repair translation contracts for future playground reuse.** Current local templates lose designed content or read stale property names/types: Breadcrumb parent flags, Chip/List slots, Table selection, Modal title path, Dropdown `Item Text`, Stepper `Step Text`, and Slider description's exact whitespace-sensitive name. An automated static pass found 35 current targets, one unresolved Alert target and one intentional Popover stub; 147 property reads align in type, 3 read slots as Booleans, 4 exact property names are missing, and 4 reads belong to the unresolved target. This is source/template evidence, not proof of current Dev Mode registration or executed template behavior. See [property check](figma-library-review-2026-10-20/evidence/local-template-property-check.json) and C07.
4. **Keep current high-level screen composition.** DataTable supplies the seven list callsites and their footer; Tabs is now used by the detail/template screens. Tabs lacks fullWidth/extended and item icon/badge coverage, so current app classes compensate for API gaps. Improve the shared contract when those key screens need it; do not rebuild tables, navigation or tabs. See C02/C10/C14.

Current source-proven accessibility gaps also exist in Switch label association, DatePicker label/keyboard opening and Tooltip trigger association. They are necessary to address when those controls are used by the selected key screens; they do not require building every settings/date flow. See PRIM-05/08/17. FileUpload's click-only drop area and absent designed browse actions similarly matter on the key upload entry when used (C06).

## Conditional upstream gaps, not a production-flow backlog

The detailed groups contain the exact current evidence. The most consequential latent differences are:

- Chip has current AI/default and small/medium axes plus a neutral selected default palette; local API/template cannot express them. Current App uses default unselected removable filters, so the unused AI/selected variants are conditional (C01).
- Modal small is hard-fixed to 480px locally while its live small specimen is 272px; image positions and small-header type also differ. Current dialogs use default medium, making small/image variants conditional (C04).
- ComboBox's editable/noneditable/listbox/group/loading capabilities are only partly represented. The live listbox is white with low elevation; local source uses glass/blur with no shadow. Calendar selected fill and DateInput/calendar APIs also differ materially (PRIM-03/04/06/07).
- Callout side-arrow selectors and ignored imagePosition cannot represent the selected side/image variants (C05). Generic docked/floating Panel/Rail has no exact runtime counterpart; Drawer remains a modal portal, while Iris already uses its established PanelShell (C03). Neither requires adding an unused workflow.
- Badge menuTrigger, IconButton notification badge, Avatar entity fallback/treatments and publicly exported AvatarGroup are contract gaps when a key screen needs them (PRIM-09/10/11/12).
- Spinner ring optical bounds and StatusLight alert emphasis are current geometry/token differences to verify on relevant loading/status states (PRIM-15/16). Small inset/density variations are not treated as blockers.

Figma-only families include ColorPicker, EmptyState, Hotspot, Meter, PreviewCard, SegmentedControl, SelectTile, StarRating, Tag, Toast, Tree, WorkflowStepper and ZoomControl. The [Figma-only/internal review](figma-library-review-2026-10-20/groups/figma-only-and-internals.md) explains which can use documented composition and which lack exact behavior/API. Existing empty-state composition is appropriate. A Card alone is not an accessible SelectTile, an inline Alert is not automatically transient Toast behavior, and Progress Stepper is not the actionable Workflow Stepper.

Two historical gaps must stay closed: **Timeline is implemented/exported**, and **Dropdown already supports shortcut/icon/section/divider/selected and one-level nested menus**. Their remaining mapping or state limits do not justify calling the entire family absent. Overlay is a full-page shell, not Popover; Panel is not Drawer. Do not restore those incorrect mappings.

## Icons, foundations and historical corrections

[Icons and foundations](figma-library-review-2026-10-20/groups/icons-and-foundations.md) records the bounded current comparison. The local 300 path entries yield 285 normalized direct-name matches plus 9 alias matches against the linked System page; those counts are not geometry-parity scores. Current unmatched medium glyphs include documentAnalyze, documentSplit and folderCopy. Inverse Iris has a separate renderer rather than an Icon path key.

**AIIcon ignores its name prop and always draws a filled spark.** Generic Icon's Iris/spark paths also differ in shape/optical bounds from the current colored glyphs. Standard IrisIcon has five paths while current Iris exposes nine visible vector descendants; inverse Iris has the expected five-part small-master structure, with exact runtime raster equivalence unverified. Current App mostly uses the filled-spark AIIcon choice and the separate Iris renderers, so latent advertised variants must be separated from current-screen appearance. Representative AI thinking states use generic spark and deserve selected-screen review.

The current Ink collection contains 468 variables, not the July 504. The explicit-name Standard-mode token comparison records 357 equal values, 11 differences, 78 unmapped candidates and 22 deprecated/nonsemantic exclusions. All mode definitions are saved, but exhaustive inverse/touch CSS rendering was not performed. The 11 differences require semantic/consumer review; they are not automatic fixes. Current glass blur still differs (Figma16px/local8px). Twenty-seven text-style size/line-height token pairs agree; generic Text/Heading usage still requires the documented semantic type hierarchy.

Link subtle tokens, numeric Drawer spacing, Avatar cozy tracking, Input/TextArea read-only styling and the multi-segment process-spinner are already present in current source. Do not reopen the old fixed findings. Alert's former `123:919` target is currently invalid; AIBadge's old `19467:181071` citation is not found in this component file. Their runtime implementations exist; their historical target references remain unresolved.

## Evidence and remaining verification

- [Combined machine-readable ledger](figma-library-review-2026-10-20/coverage.json), [primitive findings](figma-library-review-2026-10-20/groups/primitives.json), [composite findings](figma-library-review-2026-10-20/groups/composites.json), [remaining owners](figma-library-review-2026-10-20/groups/figma-only-and-internals.json).
- [Evidence format and readers](figma-library-review-2026-10-20/README.md). Full metadata is gzip-compressed; ordinary coverage/findings stay readable JSON. Local PNGs contain accepted reference images. Temporary asset/screenshot URLs and duplicate base64 payloads are not retained.
- Every accepted chunk assembly decoded and parsed. A transient Modal connection error was retried. An initial imported-master parent lookup limitation produced 1,622 identity lookup errors; supplemental guarded reads resolved all 1,622, with 6,643 identity records and no remaining identity errors. The original errors remain visible as provenance, rather than being confused with design defects.

This audit does not clear pre-existing source diagnostics. The parent task's current build passes, with **61 generated-source TypeScript diagnostics / 0 App diagnostics**, and **173 static audit findings / 0 new**. Those protected baselines were not masked or edited. Shared component changes should be made in the authoritative design-system source/update bundle, followed by verification of the selected key screens and the states each correction actually affects.
