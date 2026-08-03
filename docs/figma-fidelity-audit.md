# Figma fidelity audit — 18 primitives, all states

2026-07-17. Figma (`[ds-ui] Component Library`) treated as source of truth; every finding verified on both sides (exact CSS selector + token vs exact Figma variant + bound variable). Method: per-variant/per-state reads of the Figma sets including the `❖ State` axes, diffed against the component CSS modules through [figma-token-crosswalk.md](figma-token-crosswalk.md).

Figma's state model: `❖ State` = Default/Hover/Active only. **No Focused state exists anywhere**; code `:focus` ≈ Figma Active. Error×Active combos are unspecced.

## Verdicts

| Component | Verdict |
|---|---|
| Tooltip | pixel- and token-faithful |
| AlertBadge | faithful; hygiene nits |
| Card | faithful; naming misses only |
| ProgressBar | token-faithful, but one **broken** font-size ref |
| Switch | most faithful control; missing pressed-off |
| StatusLight | solid minus neutral dot |
| Badge | solid minus semantic-kind icon tints |
| Input | high fidelity; error red + placeholder drift |
| Select | token-cleanest form control; small-size drift |
| Button | colors faithful; state chrome drifts |
| IconButton | faithful minus danger idle icon red |
| Checkbox | resting faithful; pressed missing, disabled diverges |
| Slider | state colors perfect; two dangling token refs |
| Link | default lane perfect; subtle lane wholesale wrong |
| TextArea | chrome faithful; whole error lane off-spec |
| Spinner | geometry right, every painted color off-token |
| Avatar | color system unfaithful — worst of 18 |
| Radio | least faithful control — wrong cobalt everywhere |

## A. Code fixes — Figma is right, code is wrong

1. **Avatar colorIndex palette scrambled.** 8 of 11 indices render the wrong bg/font pair (1↔2↔4 permuted; 3/7/8/9/sign wrong outright; only 0 and 5 correct). Root cause: `Avatar.module.css` bypasses the `--ink-recipient-*` lane with raw primitives, AND that lane itself drifted from Figma's `Published/Recipient/*` values. Fix both: resync lane values, point CSS at the lane. Also: square radius 12px flat vs Figma 8 (L/M) / 4 (S/XS); Medium initials lh 1.4 vs `fontHeadingXXS` 1.25/−0.16; placeholder = fallback bg #f0eff0 + `iconColorEmphasis`, not neutral-50-on-color.
2. **Error red, systemic.** `--ink-font-color-error` resolves #a6003f (red-100); Figma `fontColorError` = **#c70547** (red-90). Fix the token, then: TextArea error message/counter/required (`--ink-red-60` #ff7d87 **and** 14px vs spec 12px) → semantic token + `fontDetailS`; Select `.errorMessage` red-90 hardcode → semantic token; Radio error styles the **label text** pink instead of the control border (`formBorderColorError`); Checkbox/Input inherit the token fix.
3. **Broken token references (silent runtime fallbacks):** Slider `--ink-font-color-subtle` and `--ink-radius-xs` (undefined → description color inherits, tooltip corners square); ProgressBar `--ink-font-size-14` (undefined, ProgressBar.module.css:21,30) → `--ink-font-element-label-size` / `--ink-font-body-s-size`.
4. **Radio checked/pressed cobalt.** Checked border+dot and `:active` border use `--ink-cobalt-100` #4c00fb; Figma binds `formBorderColorSelected`/`formBgColorSelected` **#37039e** — the correct `--ink-form-control-*-selected` tokens exist (Checkbox/Switch use them). Also fix checked-hover specificity collapse (hovered checked radio renders grey border + bright dot; spec is `formBorderColorSelectedHover` #2b047f).
5. **Spinner off-token throughout.** Default arc cobalt-100 #4c00fb → `--ink-bar-fill-default` #735aff; strokes render 1.28/3.2/6.4px vs spec 2/4/8; subtle arc → `--ink-bar-fill-color-subtle`; track → `--ink-bar-track-default`; label gap size-dependent 8/12/16.
6. **Link subtle lane wholesale wrong**, hover direction inverted (Figma darkens 90→80%, code lightens 70→60%) → use `fontColorLinkSubtle*` values. Token-level: `--ink-font-color-link-visited` aliases cobalt-110 vs Figma #260559 (cobalt-140); `--ink-font-color-disabled` fade-30 vs Figma 20%.
7. **Input:** placeholder 30% ink vs Figma `fontColorSubtle` 70%; `:focus` border raw cobalt-120/2px → Select's pattern (`--ink-form-control-border-color-active` + `--ink-form-border-width-active`).
8. **IconButton danger idle icon** `#c70547` (a bg token) → Figma `iconColorError` #ec004c = existing `--ink-icon-color-error`. Plus missed pressed tint (primary medium active → `iconColorAccentSubtle`).
9. **StatusLight neutral dot** neutral-70 #928f93 → `--ink-status-bg-color-neutral` (≈#5a4d70).
10. **Select small** 14px/4px-pad vs Figma 16px/8px-pad. **TextArea** horizontal text inset 8 vs 16; disabled double-dim (wrapper 0.2 × label 0.25).
11. **Checkbox pressed colors missing** (`formBorderColorActive`, `formBgColorSelectedActive` #4200ca — tokens exist unused). **Switch pressed-off missing** (`formThumbBgColorActive`). **Badge semantic-kind icons** inherit text color vs Figma's per-kind icon variables.
12. **Token-hygiene batch** (values equal today, diverge on any retune): Card borders → `--ink-border-color-subtle`; Tooltip text/shadow → inverse/elevation tokens; Badge/StatusLight/Spinner primitives → semantic status/icon/bar tokens; AlertBadge border-width lane; raw opacities/letter-spacings where tokens exist.

## B. Judgment calls — code may be right; Figma is silent or self-inconsistent

- **Focus, systemically.** Figma specs focus almost nowhere (Button's `❖ Focus` frame only, bound to a raw cobalt/130 — and a *different* color than code). Code styles focus on everything with **four different colors** (cobalt-120/100/60 + rings). Decide one standard; probably keep rings (a11y) and standardize, then propose to Figma.
- **Hover halos** (32px highlight on Checkbox/Radio/Switch) — code-only; Figma has only hidden halo nodes in Radio Active variants.
- **Button/Switch-thumb shadows, Slider thumb ring+scale, Slider value tooltip, TextArea focus rings** — code-only embellishments.
- **Checkbox disabled**: code recolors to grey; Figma just dims (faded purple).
- **Avatar `sign`**: code solid-cobalt/white; Figma pale-cobalt/#4c00fb.

## Remediation applied — 2026-07-17

Bucket A fixed; Bucket B per Akshat's calls (focus **untouched**, embellishments **kept**); token hygiene done. Two-phase: `tokens.css` corrected first (single writer), then per-component CSS/TSX in parallel.

- **Tokens** (`tokens.css`): `--ink-font-color-error` red-100→red-90 (#c70547); `--ink-font-color-link-visited` cobalt-110→cobalt-140 (#260559); `--ink-font-color-disabled` fade-30→fade-20 (only consumer: Tabs); recipient lane resynced to authoritative Figma values (was index-scrambled).
- **Controls**: Radio selected/pressed cobalt→`form-control-*-selected`/#37039e, checked-hover specificity fixed, error moved off label onto control border; Checkbox pressed states added + disabled de-greyed to faded purple; Switch pressed-off added; Link subtle lane de-inverted; IconButton danger icon #c70547→`icon-color-error` #ec004c; Button unchanged.
- **Forms**: Slider two undefined-token refs fixed; TextArea error lane (color+12px+required) + 16px inset + disabled single-dim; Input placeholder 30%→70%; Select small 16px/8px + error token; Card + Tooltip hygiene.
- **Display**: Avatar palette remapped to recipient lane + size-dependent square radius + placeholder/sign; Spinner arc→`bar-fill-default`, strokes now 2/4/8px, subtle/track/gap; ProgressBar undefined `font-size-14`→14px tokens; Badge per-kind icon colors + bg/text hygiene; StatusLight neutral dot; AlertBadge hygiene.
- **Bonus** (found during verify, outside the primitive audit): `--ink-font-color-subtle` is undefined but consumed by TaskCard + Accordion (composites) — repointed to `--ink-font-color-neutral-subtle`.

**Skipped (Figma internal inconsistencies → DS-team flags, not code changes):** Button/IconButton pressed dims that exist only at medium size.

**Residual token follow-ups (not blocking; token-first cleanup):**
1. `--ink-font-color-link-subtle-{hover,active,visited}` are wrong in `tokens.css` (don't match Figma); Link CSS uses correct raw `neutral-fade` values as a workaround. Fix the 3 tokens, repoint Link.
2. `--ink-icon-color-success` (#00875c) / `--ink-icon-color-warning` (#dc4e00) ≠ Figma `iconColorSuccessEmphasis` #004c36 / warning emphasis. Badge success/warning icons use the code token; if Figma's emphasis value is intended, the tokens need a new emphasis variant.
3. `--ink-letter-spacing-cozy` does not exist; Avatar keeps `-0.16px` literal.
4. `--ink-font-color-subtle` doesn't exist though 3 components reached for it — consider adding it as the semantic alias for `fontColorSubtle` rather than relying on `-neutral-subtle`.

## C. Figma-side flags (for the DS team)

- No Focused state model anywhere; Button focus bound to a raw primitive.
- Internal inconsistencies: pressed/disabled text-and-icon dims exist only at medium size (Button, IconButton); secondary small default pads 5px vs 6px elsewhere; Switch has no Hover axis; non-discrete Link has no disabled variants; hidden halo nodes in Radio Active.
- ProgressBar: raw unbound radius/gap on indeterminate, stray stroke on determinate fill.
- Form variables live as `Published/Form/form*` while a dead `@dep-formControl*` generation matches code's naming (crosswalk).
- Plus the library-level flags in [figma-code-connect.md](figma-code-connect.md): 6 deprecated components without successors, no List parent, missing AI gradient/badge/tag lanes, elevation-glass 8 vs 16.
