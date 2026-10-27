# Composite family review — 2026-10-20

Current Figma file `nAKX1rO3Mir2OCBdCkC5oq`: **71 published owners across 20 pages**, including all child/internal owners. Current local APIs, CSS and templates were inspected. Figma reference screenshots cover each standalone mapped family plus Panel, Overlay, Timeline and SideNav. See [machine-readable per-owner coverage](composites.json) and [sanitized context evidence](composites.contexts.json).

Full all-variant metadata is currently available for 71 of these owners (587 variants); missing IDs are explicitly recorded. This report never claims rendered local parity: no local component zoo or interaction suite was run. Screenshots are Figma references. Connected `@ds/ui` snippets are evidence about Figma connections, not proof of the local `@/design-system` implementation.

## Findings that affect reusable key screens

Priorities below indicate potential impact when the variant appears on a key screen. They are upstream candidates, not a requirement to remediate every variant. Current App uses default removable Chip filters, default-medium Modals, Tabs for detail/template screens, DataTable for seven list callsites, and no Callout/Stepper/standalone Pagination/Table/Drawer/Popover. The small Modal, selected/AI Chip, Card image and compact Stepper gaps are latent API coverage unless a key screen needs them. No full-flow gate is proposed.

| Priority | Finding | Practical consequence |
|---|---|---|
| P1 · C01 | Wrong Chip selected palette and missing AI/size variants | Upstream Chip should expose kind/size and use neutral selected default vs dark/inverse AI selected states; fix template selected/slot gate. |
| P1 · C02 | Tabs drops composed variants and item affordances | Provide fullWidth/extended and TabItem icon/badge support upstream; preserve selected/disabled in template. |
| P1 · C03 | Generic docked/floating Panel and Rail have no runtime equivalent | Keep Panel/Drawer distinct. Route Iris through existing PanelShell; request a genuine nonmodal Panel/Rail in shared source if key screens need it. |
| P1 · C04 | Modal small remains 480px while live small specimen is 272px | Correct small width and responsive min-width upstream; retain established modal composition. |
| P1 · C05 | Callout side locations and imagePosition cannot render as specified | Correct root location selectors and consume imagePosition upstream; preserve body/footer/image in template. |
| P1 · C06 | FileUpload omits designed browse actions and template decouples helper limits from validation | Add action/small/background coverage upstream; map numeric validation deliberately instead of presenting an unbound size helper. |
| P1 · C07 | Templates read stale Boolean properties/slot types and lose designed content | Refresh Breadcrumb, Chip, List and Table reads to current properties/slots, plus Modal title paths, Menu Item Text labels and Stepper Step Text labels. Replace Dropdown raw button example with design-system Button. |
| P2 · C08 | Card image variants and start placement incomplete | Add ratio/imageSpacing and correct start ordering upstream when image-heavy screens are in scope. |
| P2 · C09 | Dismissible FilterTag drops trigger chevron | Honor showTrigger for split tag and add leading slot if required upstream. |
| P2 · C10 | Table borders are mapped lossily and template reads removed selection prop | Use existing DataTable for key list screens; preserve borderRule if generic Table fidelity is required upstream. |
| P2 · C11 | Compact stepper and visited-but-incomplete state unsupported | Add compact summary and independent completion state upstream only when a creation screen needs it. |
| P2 · C12 | Non-Basic menu families largely implemented but mapping/docs understate coverage | Document existing shortcut/icon/section/nested/selectable APIs; verify disabled nested items before relying on them. |
| P2 · C13 | Supported Banner action variant and alignment differ | Use Subtle for current designs; add alignment/borderRule support and correct action styling upstream if key screen requires it. |
| P2 · C14 | Standalone Pagination lacks current info and size controls layout | Prefer DataTable footer; avoid rebuilding pagination for list screens. |
| P3 · C15 | TaskCard template drops visible header overflow action | Extract HasIcon? into showIcon and preserve custom footer subtype. |
| P2 · C16 | Overlay is full-page shell, not Popover | Preserve unresolved Popover mapping; use established DetailPageShell for record key screens. |

## Structural decisions

**Panel ≠ Drawer.** Current Panel is a 280px docked/floating supplemental surface; Rail is 64px. It has header/body/footer slots and collapse behavior. Local Drawer always portals, locks body scroll and exposes `role=dialog`/`aria-modal`, including with `overlay=false`. Preserve the unmapped status. Existing Iris screens should keep their established PanelShell. A true generic nonmodal Panel/Rail is an upstream family gap if a key screen needs one.

**Overlay ≠ Popover.** Current Overlay screenshot is a full-page 1280×832 white shell with header/close/body/footer. Popover is an anchored bubble with position/align/arrow. Do not restore the removed mapping. Record detail key screens already have DetailPageShell; modal dialogs have Modal.

**Non-Basic menus are largely available now.** Dropdown has shortcut, icon, section, divider, selected and one-level nested item APIs. These families lack separate templates; that is different from lacking code. Nested child states are incomplete. Current Menu.Item `kind=Alert` and arbitrary end slots remain unsupported.

**Timeline exists.** The exported implementation covers chronological current/complete/incomplete events and content/actions. Missing template and unsupported alert-style Event Indicator statuses should not be described as an absent Timeline family.

## All-family coverage

| Page / owner count | Local coverage | Consequential gaps / observations |
|---|---|---|
| Accordion · 3 | Accordion item data | Container template emits placeholder items and loses actual open/disabled/subtitle/metadata/start slot content. Mixed per-item heights or borders are not expressible. |
| Banner · 7 | Banner | Supported Subtle specimen uses secondary bordered action, whereas local Banner emits tertiary action. Information variants show a live deprecation warning recommending Subtle. Template hardcodes action label. Top/both border rules and start alignment lack public props. |
| Breadcrumb · 3 | Breadcrumb | Local template reads nonexistent parent props ❖ Root Icon and ❖ Show Current Page. Actual current owner exposes only children slot and Overflow Menu. Local runtime rootIcon/showCurrentPage remain valid APIs; template placeholder items lose real labels. |
| Callout · 4 | Callout | Side-arrow CSS targets descendant .container but the location and container classes are on the same root, leaving root column layout. imagePosition is unused. Template discards body/footer and never emits image content. Generic header lacks start/status slots. |
| CardContainer · 2 | Card.Image | Figma has 16:9/3:2/1:1 and full-width/document-preview/floating. Local Image has only src/alt/HTML attributes and fixed 3:2 CSS. Image-heavy overview/detail screens require upstream API coverage or an approved existing composition. |
| Chip · 1 | Chip | Live selected default Chip is neutral 10% fill; local selected uses cobalt-10/cobalt-100 plus inset outline. Live AI selected is dark purple with inverse text, a separate unsupported variant. Template omits selected, kind, size and reads the start slot as a Boolean. |
| FileDrop · 1 | FileUpload | Designed primary/secondary browse actions are absent; local upload is a clickable div with hidden file input, fixed dropzone and synthetic progress. Figma 20MB helper can coexist with actual local 10MB validation because template does not derive maxSize. Treat as semantic/API gap, not inset drift. |
| FilterTag · 1 | FilterTag | Dismissible branch omits chevron regardless of showTrigger even though current Figma split specimen retains it. Two action areas/disabled state exist. Leading slot absent. |
| List · 2 | List.Item | Both slots exist in runtime. Local template reads startElement/endElement as Boolean instead of HasStartElement?/HasEndElement? gates. Current description uses 12px/500 in Figma but local is 12px/400. Row density is an observation only under user tolerance. |
| Menu · 9 | Dropdown | Basic mapped template looks for text layers named text, but current menu item label layer is Item Text; it falls back to placeholder labels. It also emits a raw button trigger, violating consumer UI rule. Current runtime supports additional menu families; absence of separate mappings is not absence of implementation. |
| Modal · 5 | Modal | Current small Figma specimen is 272px, local .small has min/max 480px and mobile CSS retains min-width. Other widths large=640/xlarge=800 align. Image variants have no local API. Template maps width but looks for title at Header > header > text; current path is Modal.Header > headerTitle > text (with ModalHeader/Child names on other sizes), so title extraction is stale. It emits placeholder body and no footer. Small nested header is 20px/500 vs uniform local24px/400. |
| Overlay · 3 | No Overlay export; Popover intentionally unmapped | Live screenshot is a 1280x832 white full-page shell with header, close, scroll body and bottom controls. Local Popover is trigger-positioned, with position/align/arrow and outside-click behavior; no semantic/structural equality. Use established DetailPageShell for key record screens, Modal for modal behavior; keep mapping unresolved. |
| Pagination · 3 | Pagination; DataTable pagination preferred for lists | Live small specimen places per-page control left and info+navigation right. Standalone local reverses pagination/select order, has no item-count info, and defaults first/last buttons to duplicate chevron glyphs. Existing DataTable footer covers production list layout; avoid rebuilding it. |
| Panel · 2 | No generic Panel export; Drawer is behavioral alternative | Live Panel is 280px docked or floating supplemental surface, with modern header/body/footer slots and collapse control. Drawer always portals to document.body, locks body scroll and uses dialog/aria-modal even when overlay=false. It has different size and scrim behavior; do not restore Panel-to-Drawer mapping. Iris should keep established PanelShell. |
| ProgressStepper · 2 | Stepper | Live compact variant is an Active Step/Next step label plus circular 4/5 progress indicator, not a row-density change. Local Stepper lacks this materially different variant. Normal horizontal/vertical structure available. |
| SideNav.Item · 3 | LocalNav sections[].hasDivider | Section dividers supported within shell LocalNav. This is not a new independent sidebar requirement. |
| Table · 11 | Table; higher-level DataTable preferred by project | Figma none/rows/columns/both are four meaningful border patterns; local Table only default/bordered/striped and bordered is an outer rounded frame. Template reads nonexistent ❖ Show Selection Col at root. Use current DataTable for production key list screens; its lack of Figma template is not a runtime gap. |
| Tabs · 2 | Tabs | Normal text tabs exist but full-width equal distribution and extended rule cannot be selected. Current App detail shell and template screen use Tabs with app-owned CSS classes; upstream layout/affordance coverage would reduce custom styling for key screens. Template drops selected/disabled despite runtime ability. |
| TaskCard · 4 | TaskCard.Header | Current Figma default HasIcon=true; local default showIcon=false and template omits flag, so generated example drops visible overflow action. |
| Timeline · 3 | Timeline.items[] | Timeline is implemented/exported, not a missing family. Per-item independent collapsible/open controlled axes unavailable; source uses global collapsible and mount-time defaults. Status geometry and date-label layout are present. |

## Evidence and limits

- [All owner IDs, axes, variants and local source paths](composites.json). Every published owner on the assigned pages is included, including internal border rules and table/list pieces.
- [Reference contexts](composites.contexts.json) preserve current design descriptions/code without temporary Figma asset URLs. Local PNG evidence is linked per owner in the JSON.
- Exhaustive appearance traversal is a metadata review of all variants/descendants. Representative family screenshots were visually inspected; every possible Boolean slot combination was not separately rendered.
- No Figma writes and no generated component/source edits were performed. Shared fixes belong in design-system source/update bundle.
- Row insets and density differences are deliberately lower priority under the user’s tolerance. Missing modes, materially wrong selection colors, geometry, typography, status meaning and reusable APIs are the actionable scope.
- Audit source checks found no undefined `--ink-*` references in the inspected composite CSS files; token existence does not establish correct token choice or mode behavior.
