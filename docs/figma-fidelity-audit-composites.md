# Figma fidelity audit — 21 composites, all states

2026-07-17. Same method as [figma-fidelity-audit.md](figma-fidelity-audit.md) (primitives): per-variant/state Figma reads incl. `❖ State` axes + bound variables, diffed through [figma-token-crosswalk.md](figma-token-crosswalk.md). Figma = source of truth for values. Standing decisions from the primitives pass apply: **focus untouched, code-only embellishments/a11y kept, Figma colors win, don't replicate Figma's own inconsistencies (flag instead).**

## ⚠️ Regression from the primitives pass — fix first
`--ink-font-color-error` was changed red-100→red-90 (#c70547) for error messages. But Banner/Alert danger **body text** reuses it and Figma wants red-100 #a6003f (`fontColorErrorEmphasis`). **Fix: add `--ink-font-color-error-emphasis: var(--ink-red-100)`; repoint Banner + Alert danger body text (and their icon wrappers per the icon-tint fix) to it.** Error *messages* stay on `--ink-font-color-error` (#c70547) — correct.

## Undefined-token bugs (silent fallback — all shipping)
1. **List** — `--ink-spacing-{xs,sm,md,lg,xl}` (17 refs) don't exist (spacing ramp is numeric only). All item padding/gap collapse to **0**. Repoint to numeric `--ink-spacing-*` (List.module.css:22-23,27,32,59,69,144,153,164,186,236,240). **Highest severity.**
2. **Table** — `.statusDot.active`→`--ink-status-success` and `.error`→`--ink-status-error` undefined → dots render **invisible**. Repoint to `--ink-status-bg-color-success`/`-alert`. Sibling `.warning`→`--ink-status-warning` is defined but off-lane (a font color) → `--ink-status-bg-color-warning`. (Table.module.css:447,455,459)
3. **Accordion** — `.startIcon`/`.chevron`→`--ink-icon-color-secondary` undefined → falls back darker. Repoint to `--ink-icon-color-subtle` (= Figma `iconColorSubtle` 70%). (L80,146)
4. **Dropdown** — `--ink-iris-70` undefined (has hardcoded `#4c00b0` fallback on a code-only "New" badge). Repoint to a real cobalt token or drop. Low severity. (L33)

## The recurring font-size trap
`--ink-font-size-md`=16 and `-lg`=18 resolve one scale-step off the px their inline comments claim. Fix per component to the token that actually resolves to the intended px:
- TaskCard heading 18→**20** (`--ink-font-heading-xs-size`); body 16→**14** (`--ink-font-body-s-size`).
- Tabs text 16→**14**. FilterTag text 16→**14**. Callout body 16→**14**. Alert text 16→**14**. List primary 16→**14**, description already 14→**12**. ComboBox description 14→**12**. DatePicker helper 14→**12**.

## A. Code fixes (Figma right) — by component

**Callout** — glass lane inverted (worst): `.glass-frost` is dark `--ink-purple-130`/white; Figma `bgColorGlassFrost` = white@90% + dark text → repoint to `--ink-bg-glass-frost` (ComboBox uses it correctly). `.glass-tint` purple-120 → `--ink-bg-glass-tint` (near-black + white text). Caret ::before/::after follow. Border `--ink-form-border-subtle`(neutral-30 solid) → `--ink-border-color-subtle` (translucent). Body 16→14px. Shadow blur ~8 → 20 (`neutral-fade-15`).

**Alert** — `information` hue wrong: bg `--ink-cobalt-10`/text cobalt-110 → `messageBgColorSubtle` (neutral-fade-5) + `fontColorDefault` (Banner does this right). Padding 16/24→[8,8,8,16], gap 12→8, text 16→14. Icons inherit text → per-kind `--ink-icon-color-{error,success,warning,accent}`. Danger body text → new `-error-emphasis`. **Do NOT strip Alert's extra features (title/shape/bottomBorder/subtle-neutral kinds)** — flag that Alert may be a different component than its mapped Inline Message (design question).

**Banner** — danger body text → `--ink-font-color-error-emphasis` (#a6003f). Icon wrappers inherit text → `--ink-icon-color-{success,warning,error}`. Left padding 48→16 (`gap200`). Promo text override (dark, "for readability") vs Figma `fontColorAccentEmphasis` #4200ca: **apply Figma value BUT check WCAG AA contrast on the promo bg first; if it fails, keep the dark override and flag.**

**Stepper** — active circle `--ink-cobalt-100` #4c00fb → `--ink-icon-color-accent-emphasis` (cobalt-110 #4200ca). Active title neutral-90/regular → `--ink-font-color-accent-emphasis` + weight 600. Completed connector cobalt-20 (#e9e6fd) → `--ink-bar-track-color-visited` (cobalt-140 #260559). Upcoming circle border/default connector neutral-30 → `borderColorSubtle`/`--ink-bar-track-default`. Number 14/400 → 16/500.

**List** — undefined spacing (above). Selected wrong: code paints cobalt-10 bg + cobalt-100 text + accent bar; Figma selected only bolds the label (SemiBold, no bg/accent) → remove bg/accent, set `.primary` selected to weight 600. Hover/active neutral-10/-20 → `--ink-item-bg-color-hover-subtle`/`-active-subtle`. Text 16→14, description→12.

**DatePicker** — input border lane raw greys/cobalt-60 → `--ink-form-control-border-color-{default,hover}` (focus untouched). Error border/text red-60 → red-90 (`--ink-form-control-border-color-error` / `--ink-font-color-error`). Radius 8→4 (`--ink-radius-size-xs`) on input + calendar. Helper 14→12. Calendar border → `--ink-border-color-subtle`; selected/today cobalt-60 → an accent token.

**FileUpload** — remove the invented 2px dashed border (Figma default has none); radius 16→8 (`--ink-radius-size-s`); bg neutral-10 → `--ink-cta-bg-color-tertiary-default`. Hover/drag cobalt → neutral (`--ink-item-bg-color-hover`, active `borderColorEmphasis`). Disabled: remove dim (Figma doesn't dim). Note File Drop is deprecation-flagged in Figma (DS flag).

**TaskCard** — heading 18→20, body 16→14 (above). Border raw neutral-fade-10 → `--ink-border-color-subtle` (hygiene).

**Tabs** — text 16→14. Horizontal padding 20→0 (Figma min-width+centered). Add pressed bg `--ink-item-bg-color-active-subtle`. Hover bg raw → `--ink-item-bg-color-hover-subtle`.

**FilterTag** — text 16→14. Base left padding 12→8. Hover/pressed border `--ink-font-color-default`(90%) → `--ink-border-color-emphasis` (solid).

**Table** — status dots (above). Default row height 65→56 (or flag as production-vs-library). Header vertical padding 4→12; header height 49→44. Row border 5%→10% (`--ink-border-color-subtle`). th letter-spacing 0.12→0.16 (`--ink-letter-spacing-wide`). **thead gray vs Figma transparent: DO NOT blind-change — flag for DS reconcile (production divergence).**

**Modal** — radius 16→12 (`--ink-radius-size-m`). Only substantive drift; otherwise token-perfect.

**Pagination** — per-page Select: border neutral-30 → `formBorderColorDefault`; radius 8→4; text 14→16; disabled bg → `formBgColorDisabled`. navButton radius 8→4. Page-button lane is perfect — don't touch.

**Accordion** — hover bg `--ink-item-bg-color-hover`(10%) → `--ink-item-bg-color-hover-subtle`(5%). Icon token (above). Add pressed bg `--ink-item-bg-color-active-subtle`.

**ComboBox** — description 14→12px/Medium. Otherwise high-fidelity; focus divergence is a judgment call (keep per focus policy). Listbox unaudited (separate Figma set).

**Chip** — hygiene only: raw `neutral-fade-*` → `--ink-cta-bg-color-tertiary-*` (value-equal). Keep code-only selected + disabled dim (Figma debt).

**Breadcrumb** — clean. No changes.

**Dropdown** — solid variant border width 2px → 1px (Figma solid is sw1; glass is sw2). iris token (above). Otherwise faithful.

## B. Judgment calls — standing decisions applied (flag, mostly no-change)
- Focus divergences (DatePicker ring, ComboBox 2px cobalt active, all `:focus`): **untouched** per policy.
- Code-only states kept: Chip `.selected`, List/Accordion extras beyond Figma, code shadows/animations, Alert title/shape.
- Chip/FileUpload disabled dim where Figma doesn't dim: **keep** (better UX), flag as Figma debt.
- Banner promo text: apply Figma accent unless it fails WCAG AA (then keep + flag).

## Remediation applied — 2026-07-17
All A-bucket fixes applied across the 21 mapped composites (tokens.css got the one `--ink-font-color-error-emphasis` add for the regression; everything else CSS-only). Undefined-token bugs fixed: List zero-padding (→ 4/16), Table invisible dots (→ status-bg-color-*), Accordion icon (→ icon-color-subtle), Dropdown iris (→ cobalt-110). Banner promo passed WCAG AA (8.25:1) so Figma accent applied. Popover mapping dropped (no valid Figma target). No `:focus` touched, embellishments kept, no TS errors introduced (all edits CSS/token; the composite `.tsx` type errors under bare tsc are pre-existing).

**Open — NOT yet fixed:**
- **Drawer** carries the SAME undefined-`--ink-spacing-{md,lg,xl}` zero-padding bug as List (Drawer.module.css:111,135,136,170,197,269,273,277). It was never audited — Drawer was the false-match skip (Figma Panel ≠ Drawer overlay), so it has no Figma source of truth for the correct padding values. Needs either a Figma reference or a value decision before fixing.
- **Unaudited composites:** AIBadge, ComboButton, FileInput, SearchInput were never mapped/audited. Status unknown.
- `--ink-iris-70` still used in App.tsx demo code ×3 (has #4c00b0 fallback — renders, but undefined).
- Residual token-arch question: List/Drawer both assumed a named `--ink-spacing-{xs..xl}` ramp that doesn't exist (file is numeric). Decide: add the named ramp, or keep repointing to numeric.

## C. Figma-side flags (DS team)
- Deprecation-flagged, no successor: File Drop, Inline Message, Banner, Modal, Select Menu, SideNav (from the mapping pass) — File Drop/Inline Message carry hidden `_Component Deprecation Warning` layers.
- **Alert ↔ Inline Message may be the wrong mapping** — Alert is built to a toast-like spec (title/shape/bottomBorder) the Inline Message node lacks.
- **Popover ↔ Overlay is an invalid mapping** — `[INK] Overlay` is a dialog shell (header/footer/close/submit), not a positioned popover-with-arrow. No popover/tooltip-bubble primitive exists in the library. Fix the `.figma.ts` (drop or retarget) and flag the missing component.
- Table thead gray vs Figma transparent header — production-vs-library divergence, needs reconcile.
- Chip Figma `disabled=True` is visually identical to Default (no dim spec).
- No parent `[INK] List` set (only List.Item / List.Heading).
