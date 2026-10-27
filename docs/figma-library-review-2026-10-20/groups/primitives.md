# Primitive and form-component review — 2026-10-20

Reviewed all **41 published owners**, **570 extant variants/standalone specimens**, and **6,816 descendant records** across 18 assigned pages. The JSON contains exact per-owner APIs, state axes, variant IDs, metadata paths and findings. Twenty-five current Figma screenshot files and 27 saved design-context reads cover the mapped families plus group/calendar/combobox references.

**Runtime visual parity remains unverified.** No component zoo or browser state captures were created. This is a current Figma-reference and source audit. A connected upstream snippet is not evidence that the generated local CSS matches it. Actual variants were reviewed, not every possible property override. Small insets and row density are not completion gates.

The current key-screen issue is the unnamed compact ComboButton action at `src/App.tsx:3305`. Button icon sizing also affects existing Share/Manage Parties/filter actions. Other capability gaps should be fixed only when a selected key screen needs them. Changes belong in the upstream design-system source/update bundle; no generated files were edited.

## Priority findings

### PRIM-01 · P2 · Name compact ComboButton actions

Compact branches render only Icon in the main button and the API exposes no text/name prop. App.tsx:3305 currently uses that branch; the main action is unnamed in source. Dropdown uses only aria-label despite the project requirement for in-button text.

**Scope:** necessary for the current compact list-screen action. **Action:** Add an accessible-name path that renders sr-only text in both internal buttons through the upstream design system bundle.

Figma: [17:168](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17-168). Local: `src/design-system/4-composites/ComboButton/ComboButton.tsx:9`, `src/design-system/4-composites/ComboButton/ComboButton.tsx:67`, `src/App.tsx:3305`.

### PRIM-02 · P2 · Preserve Button icon slot geometry

Local CSS forces start/end SVGs to16px for both mapped sizes. Current Figma startElement is24px in medium and20px in small; passing a larger Icon cannot escape the descendant selector.

**Scope:** relevant to current Share, Manage Parties and filter CTAs. **Action:** Use size-specific element dimensions from the current Figma slots; inspect actual key-screen icon rendering before changing every callsite.

Figma: [8894:21299](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=8894-21299), [8894:21300](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=8894-21300), [8894:24211](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=8894-24211), [8894:24212](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=8894-24212). Local: `src/design-system/3-primitives/Button/Button.module.css:237`, `src/App.tsx:2227`, `src/App.tsx:3317`.

### PRIM-03 · P2 · Represent the two ComboBox field families explicitly

The template targets non-editable Combobox but source always filters via text input and shows a clear button whenever value is set, together with the chevron. It cannot configure size, leading element, trigger/clear alternatives, groups/loading/cascading, option descriptions or slots.

**Scope:** conditional on a key screen using this capability. **Action:** Expose the family choices needed by actual agreement/recipient/settings screens, then update the local mapping from the upstream bundle. Do not hand-roll a second select widget.

Figma: [5517:2448](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5517-2448), [5836:25700](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5836-25700), [5496:944](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5496-944), [5642:1902](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5642-1902), [7264:825](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=7264-825). Local: `src/design-system/4-composites/ComboBox/ComboBox.tsx:5`, `src/design-system/4-composites/ComboBox/ComboBox.tsx:257`, `src/design-system/4-composites/ComboBox/ComboBox.figma.ts:4`.

### PRIM-04 · P2 · Use the current ComboBox listbox surface

All three current Figma listbox roots are white with10% neutral stroke and low elevation. Code uses glass frost, blur10px, a2px border and box-shadow:none. The comment claiming no Figma shadow is stale.

**Scope:** when a key screen opens ComboBox. **Action:** Replace stale surface assumptions in the upstream source with the current white/elevation treatment; verify on a key form screen.

Figma: [5496:971](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5496-971), [7264:826](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=7264-826), [5715:23979](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5715-23979). Local: `src/design-system/4-composites/ComboBox/ComboBox.module.css:191`.

### PRIM-05 · P2 · Make DatePicker labels and keyboard opening work

label is rendered without htmlFor and the input is not nested in it. Opening is attached to a div click with no keyboard handler or calendar trigger button; the value is controlled/readOnly with no native typing change path.

**Scope:** necessary when DatePicker is used on a key date/filter screen. **Action:** Associate label/error/help IDs with the input and provide a named keyboard-operable picker trigger in the upstream component.

Figma: [28226:6401](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28226-6401), [28226:6402](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28226-6402). Local: `src/design-system/4-composites/DatePicker/DatePicker.tsx:177`.

### PRIM-06 · P2 · Expose only the required DateInput/calendar capabilities

DateInput size/usePicker/readOnly axes are omitted. No standalone/mobile/month-year-selector/date-range mode exists; both digit families have40px cells and range states that are not represented.

**Scope:** conditional on a key screen using this capability. **Action:** Prioritize small date filters, no-picker/typed entry or range selection only when required by a selected key screen. Treat internal calendar/digit owners as implementation parts rather than five new mandatory exports.

Figma: [28226:6401](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28226-6401), [7482:13585](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=7482-13585), [36936:6079](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-6079), [28218:14649](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28218-14649), [36936:5174](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-5174). Local: `src/design-system/4-composites/DatePicker/DatePicker.tsx:7`, `src/design-system/4-composites/DatePicker/DatePicker.figma.ts:4`.

### PRIM-07 · P2 · Correct calendar selection emphasis and typography

Current selected digit backgrounds are dark cobalt #260559 with white text. Local selected day uses cobalt60 #a598ff, white and semibold; current calendar day text is16/400, source is14/400. This changes selected-state contrast and density beyond small inset tolerance.

**Scope:** when a key screen opens the calendar. **Action:** Use the current selected semantic fill and16px day typography in the upstream calendar; verify selected/today/disabled states on the selected key screen.

Figma: [28218:14681](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28218-14681), [28218:14682](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28218-14682), [36936:5241](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-5241), [36936:5243](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-5243), [36936:5246](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-5246). Local: `src/design-system/4-composites/DatePicker/DatePicker.module.css:176`, `src/design-system/4-composites/DatePicker/DatePicker.module.css:198`.

### PRIM-08 · P2 · Associate Switch label and disabled copy

The label prop becomes a sibling span outside the label containing the input, so the visible label does not name/toggle it. Disabled opacity affects only the control. With description but no label, description is discarded by the label&& branch.

**Scope:** necessary whenever a key settings screen uses labeled Switch. **Action:** Connect text and description to the switch and apply disabled treatment to the whole labeled control in the upstream bundle.

Figma: [171:3566](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=171-3566), [170:3533](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=170-3533). Local: `src/design-system/3-primitives/Switch/Switch.tsx:58`, `src/design-system/3-primitives/Switch/Switch.tsx:88`, `src/design-system/3-primitives/Switch/Switch.module.css:22`.

### PRIM-09 · P2 · Support Badge menuTrigger when required

Current published Status Badge has menuTrigger boolean, with hidden chevron layers on every kind. Local Badge props, render and template do not expose it.

**Scope:** conditional on a key screen using this capability. **Action:** Add an accessible menu-trigger variant upstream if a selected key screen uses interactive status badges; static status badges need no workaround.

Figma: [83:2801](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=83-2801), [44036:74](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=44036-74), [44038:26594](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=44038-26594). Local: `src/design-system/3-primitives/Badge/Badge.tsx:14`, `src/design-system/3-primitives/Badge/Badge.tsx:64`, `src/design-system/3-primitives/Badge/Badge.figma.ts:1`.

### PRIM-10 · P2 · Preserve Avatar fallback identity and optional treatments

Square/no-image/no-initials variants use buildingCompany; local fallback always uses person and60% dimensions. Figma exposes shadow/badge/border but local API has none.

**Scope:** conditional on a key screen using this capability. **Action:** Implement the square entity fallback and optional treatments required by selected person/party/recipient screens in the upstream bundle.

Figma: [17273:35026](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17273-35026), [17273:35031](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17273-35031), [17273:35032](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17273-35032), [17273:35037](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17273-35037). Local: `src/design-system/3-primitives/Avatar/Avatar.tsx:5`, `src/design-system/3-primitives/Avatar/Avatar.tsx:59`, `src/design-system/3-primitives/Avatar/Avatar.module.css:101`.

### PRIM-12 · P2 · Allow IconButton notification badge

Published badge boolean controls the positioned AlertBadge dot. Local IconButton renders only Icon and its mapping deliberately omits badge.

**Scope:** conditional on a key screen using this capability. **Action:** Expose the optional badge upstream when a selected shell or notification key screen needs it.

Figma: [14:953](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=14-953), [30894:10072](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=30894-10072). Local: `src/design-system/3-primitives/IconButton/IconButton.tsx:5`, `src/design-system/3-primitives/IconButton/IconButton.tsx:50`, `src/design-system/3-primitives/IconButton/IconButton.figma.ts:25`.

### PRIM-13 · P2 · Make Text Box slots available without custom controls

Current Text Box exposes leading/trailing elements, inputHelp and characterCount. Local Input API has none and renders only the native input between label and error. These cannot be configured through its template.

**Scope:** conditional on a key screen using this capability. **Action:** Add required slots/help/counter capabilities upstream for selected form screens, using SearchInput for its existing dedicated search case.

Figma: [144:17002](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=144-17002), [144:17003](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=144-17003). Local: `src/design-system/3-primitives/Input/Input.tsx:5`, `src/design-system/3-primitives/Input/Input.figma.ts:36`.

### PRIM-15 · P2 · Match visible Spinner ring geometry

Figma INSIDE strokes occupy16/40/80px with2/4/8px widths. SVG viewBox50 and r20 yields actual outer diameters14.8/36/72px inside those containers; stroke width alone is matched.

**Scope:** key loading-state geometry. **Action:** Check ring geometry at the key loading screen and adjust circle radius/viewBox in the upstream component.

Figma: [474:12166](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=474-12166), [474:12163](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=474-12163), [474:12160](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=474-12160). Local: `src/design-system/3-primitives/Spinner/Spinner.tsx:32`, `src/design-system/3-primitives/Spinner/Spinner.tsx:43`.

### PRIM-16 · P2 · Use emphasis red for StatusLight alert text

Current alert Status Text uses #a6003f (emphasis red100). Local .alert .text uses --ink-font-color-error (#c70547, red90).

**Scope:** conditional alert-state token correction. **Action:** Use the live emphasis semantic text token upstream when an alert light is used.

Figma: [166:2871](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=166-2871), [166:2874](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=166-2874). Local: `src/design-system/3-primitives/StatusLight/StatusLight.module.css:98`.

### PRIM-17 · P2 · Connect Tooltip to its trigger semantically

Tooltip can appear on focus but the cloned trigger receives no aria-describedby and the portal tooltip has no ID; role=tooltip alone does not associate it with the control.

**Scope:** necessary for key screens relying on tooltip descriptions. **Action:** Provide a stable tooltip ID and preserve/append the trigger describedby in the upstream bundle.

Figma: [196:1439](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=196-1439). Local: `src/design-system/3-primitives/Tooltip/Tooltip.tsx:220`, `src/design-system/3-primitives/Tooltip/Tooltip.tsx:253`.

## Lower-priority observations

| Finding | Observation |
|---|---|
| PRIM-11: Surface the existing AvatarGroup through the barrel | AvatarGroup.tsx exists but Avatar/index.ts and the top-level barrel do not export it. Consumers following AGENTS.md cannot reuse it without a prohibited deep import. |
| PRIM-14: Keep TextArea leading-element gap explicit | Live startElement boolean has no code prop. Existing other states, read-only surface and character-count API are present. |
| PRIM-18: Preserve 99+ AlertBadge text in translation | Template parseInt("99+",10) becomes99; runtime only renders99+ for values greater than99. The translated badge therefore loses its plus sign. parseInt(... )||1 also changes0 to1. |
| PRIM-19: Keep Radio error icon difference visible | Figma radio error specimen uses a status-error icon next to error copy. Radio.tsx renders only the string, unlike Checkbox which renders the icon. |
| PRIM-20: Review extra text Button shadows | All40 current Figma Button roots have effects=[]; brand/primary/danger CSS adds resting and hover shadows. |
| PRIM-21: Use medium weight for visible Spinner label | Current hidden-by-default /text layers are14px weight500; local .labelVisible is14px weight400. |

## Every-owner coverage

All below have current property/variant metadata and source/API review. “Covered” means source/API evidence exists; it does not mean rendered pixel parity. Internal and Figma-only owners are not automatically missing implementation requirements.

| Page | Owner and node | Actual specimens | Local representation | Findings |
|---|---|---:|---|---|
| Avatar | [[INK] Avatar · 871:18543](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=871-18543) | 104 | Avatar; Direct mapped component | PRIM-10 |
| Avatar | [[INK] Avatar Group · 872:18918](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=872-18918) | 8 | AvatarGroup; Source exists but is not publicly exported | PRIM-11 |
| AlertBadge | [[INK] Alert Badge · 4:409](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=4-409) | 6 | AlertBadge; Direct mapped component | PRIM-18 |
| Button | [[INK] Button · 10:557](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=10-557) | 40 | Button; Direct mapped component | PRIM-02, PRIM-20 |
| Button | [[INK] Icon Button · 14:953](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=14-953) | 40 | IconButton; Direct mapped component | PRIM-12 |
| Button | [[INK] Combo Button · 17:168](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17-168) | 18 | ComboButton; Available component without local template | PRIM-01 |
| Button | [[INK] Toggle Button · 19:484](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=19-484) | 16 | Compose Button / IconButton; Figma-only family; compose supported parts | No consequential source/API mismatch isolated |
| Button | [_[INK] Round Button · 17431:43925](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=17431-43925) | 20 | Compose Button / IconButton; Figma-only family; compose supported parts | No consequential source/API mismatch isolated |
| Checkbox | [[INK] Checkbox · 377:23064](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=377-23064) | 15 | Checkbox; Direct mapped component; groups are composition references | No consequential source/API mismatch isolated |
| Checkbox | [[INK] Checkbox group (Basic) · 1220:9370](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1220-9370) | 1 | Checkbox; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| Checkbox | [[INK] Checkbox group (Nested) · 1220:9369](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1220-9369) | 1 | Checkbox; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| Checkbox | [[INK] Checkbox group (Error) · 1220:9368](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1220-9368) | 1 | Checkbox; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| Checkbox | [[INK] Checkbox group (Disabled) · 1220:9367](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1220-9367) | 1 | Checkbox; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| ComboBox | [[INK] Combobox Listbox · 5496:944](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5496-944) | 3 | ComboBox; Internal/family reference; no independent public API | PRIM-03, PRIM-04 |
| ComboBox | [[INK] Editable Combobox · 5836:25700](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5836-25700) | 30 | ComboBox; Partially represented by ComboBox; no independent template | PRIM-03 |
| ComboBox | [[INK] Combobox · 5517:2448](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5517-2448) | 20 | ComboBox; Partial family mapping; internal pieces are not exposed | PRIM-03 |
| ComboBox | [Child/[INK] ComboBox.Option · 5642:1902](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=5642-1902) | 8 | ComboBox; Internal/family reference; no independent public API | PRIM-03 |
| ComboBox | [Child/[INK] Combobox.Group · 7264:825](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=7264-825) | 1 | ComboBox; Internal/family reference; no independent public API | PRIM-03 |
| DatePicker | [[INK] DateInput · 28226:6401](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28226-6401) | 20 | DatePicker; DateInput is directly mapped; calendar/digit owners are internal references | PRIM-05, PRIM-06 |
| DatePicker | [_[INK] DatePicker · 7482:13585](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=7482-13585) | 4 | DatePicker; Internal/family reference; no independent public API | PRIM-06 |
| DatePicker | [_Digit · 28218:14649](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=28218-14649) | 43 | DatePicker; Internal/family reference; no independent public API | PRIM-06, PRIM-07 |
| DatePicker | [_Blocks / [INK] Digit · 36936:5174](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-5174) | 36 | DatePicker; Internal/family reference; no independent public API | PRIM-06, PRIM-07 |
| DatePicker | [[INK] DatePicker · 36936:6079](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=36936-6079) | 4 | DatePicker; Internal/family reference; no independent public API | PRIM-06, PRIM-07 |
| Link | [[INK] Link · 55:2626](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=55-2626) | 32 | Link; Direct mapped component | No consequential source/API mismatch isolated |
| ProgressBar | [[INK] Progress Bar · 471:9459](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=471-9459) | 4 | ProgressBar; Direct mapped component | No consequential source/API mismatch isolated |
| ProgressCircle | [[INK] Progress Circle · 474:12179](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=474-12179) | 6 | Spinner; Direct mapped Progress Circle | PRIM-15, PRIM-21 |
| RadioButton | [[INK] Radio Button · 274:4817](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=274-4817) | 10 | Radio; Direct mapped component; groups are composition references | PRIM-19 |
| RadioButton | [[INK] Radio Buttton Group (Nested) · 1114:5532](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1114-5532) | 1 | Radio; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| RadioButton | [[INK] Radio Buttton Group (Disabled) · 1114:5530](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1114-5530) | 1 | Radio; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| RadioButton | [[INK] Radio Button Group (Error) · 1114:5529](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1114-5529) | 1 | Radio; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| RadioButton | [[INK] Radio Button Group (Basic) · 1114:5531](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1114-5531) | 1 | Radio; Composition reference; no dedicated local export/template | No consequential source/API mismatch isolated |
| Select | [[INK] Select · 259:5197](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=259-5197) | 10 | Select; Direct mapped component; options utility is a composition reference | No consequential source/API mismatch isolated |
| Select | [Utilities / [INK] Select Options · 1225:8060](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1225-8060) | 1 | Select; Internal/family reference; no independent public API | No consequential source/API mismatch isolated |
| Slider | [_[INK] Slider Control · 1108:5083](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1108-5083) | 4 | Slider; Internal/family reference; no independent public API | No consequential source/API mismatch isolated |
| Slider | [[INK] Slider · 1108:6861](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=1108-6861) | 4 | Slider; Direct mapped component; control is internal | No consequential source/API mismatch isolated |
| StatusBadge | [[INK] Status Badge · 83:2801](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=83-2801) | 7 | Badge; Direct mapped Status Badge | PRIM-09 |
| StatusLight | [[INK] Status Light · 166:2875](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=166-2875) | 9 | StatusLight; Direct mapped component | PRIM-16 |
| Switch | [[INK] Switch · 171:3566](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=171-3566) | 6 | Switch; Direct mapped component | PRIM-08 |
| TextArea | [[INK] Text Area · 261:2190](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=261-2190) | 7 | TextArea; Direct mapped component | PRIM-14 |
| TextBox | [[INK] Text Box · 144:17002](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=144-17002) | 14 | Input; Direct mapped Text Box | PRIM-13 |
| Tooltip | [[INK] Tooltip · 196:1439](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id=196-1439) | 12 | Tooltip; Direct mapped component | PRIM-17 |

## Existing corrections that should stay closed

Link subtle semantic colors, Avatar cozy tracking, Checkbox label-only hiding, Radio selected-hover behavior, and Input/TextArea read-only surfaces are already present. Badge kind names and Spinner/Radio/Input name translations remain valid. Do not reopen historical findings without a current rendered discrepancy.

## Evidence and limits

- [Machine-readable owner/findings inventory](primitives.json).
- [Sanitized design contexts](primitives.context.json) and [standalone desktop calendar child context](primitives.calendar-context.json).
- [Screenshot manifest](primitives.screenshots.json): paths, node IDs, dimensions and stable Figma links; temporary asset URLs removed.
- Full per-page appearance records are referenced per owner in the JSON and contain every extant variant plus all descendant geometry, fills, strokes, variable bindings, typography and effects.
- Group masters and Figma-only Toggle/Round/calendar parts can be composed or deferred according to the selected key screens; no new UI library or hand-rolled controls are recommended.
- Before changing visual primitives, capture them on the selected key screens, including the relevant hover/focus/error/selected/disabled state. No demand for 100% pixel identity is implied.
