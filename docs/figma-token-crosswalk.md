# Code ↔ Figma token crosswalk

Code: `src/design-system/1-tokens/tokens.css` — 1,093 `--ink-*` declarations (741 modern + 352 legacy aliases).
Figma: "[ds-ui] Component Library" (`nAKX1rO3Mir2OCBdCkC5oq`). Enumerated read-only 2026-07-17.

Figma has three variable collections — **Ink** (504 vars, modes: Standard / Inverse / Standard (Touch) / Inverse (Touch)), **_Utilities** (40, internal font/shadow primitives), **_DEPRECATED_Ink (1.0)** (347, superseded — excluded from matching). Styles: 4 paint styles, 28 text styles, 14 effect styles.

## Name convention

Mechanical rule, covers 367 of 427 matches:

```
Figma "Published/{Group}/{leafCamelCase}"  →  --ink-{leaf-kebab-case}
Figma "Internal/color/{semantic|accent}/{path}"  →  --ink-{path-joined-with-dashes}
```

e.g. `Published/Background/bgColorDefault` → `--ink-bg-color-default`; `Internal/color/semantic/neutral/fade/50` → `--ink-neutral-fade-50`; `Internal/color/accent/cyan/50` → `--ink-cyan-50`.

Documented deviations (the 60 fuzzy matches — code side is older/shorter):

| Figma pattern | Code pattern | count |
|---|---|---|
| `ctaToggleBgColor*`, `ctaFabBgColor*` | drops `color`: `--ink-cta-toggle-bg-*`, `--ink-cta-fab-bg-*` | 14 |
| `ctaComboBorderColor{X}Default` | `--ink-cta-combo-border-{x}` (drops `color`+`default`) | 3 |
| `Form/form*` | `--ink-form-control-*` (code keeps old `formControl` naming; also `formTextColor`→`font-color`, `formHighlightBgColorDefault`→`bg-color-highlight`) | 22 |
| `deviceBreakpoint{XS…XXL}` | `--ink-breakpoint-{xs…xxl}` (drops `device`) | 6 |
| `Spacing/gap{N}` | `--ink-spacing-{N}` | 10 |
| one-offs | `focusColor`→`--ink-focus-color-default`, `barStopIndicator`→`--ink-bar-stop-indicator-color`, `radiusSizeNone`→`--ink-radius-none`, `fontColorLink[Subtle]`→`…-default` | 5 |

**Inverse is structural, not nominal.** Code ships ~113 modern `-inverse-` tokens (`--ink-icon-color-inverse-*`, `--ink-form-control-*-inverse-*`, …). Figma has no inverse variables — inverse is the **Inverse mode** of the same variable. Mechanical mapping must resolve a code inverse token to (Figma variable, Inverse mode), not to a name.

## Variables lane (vs Ink collection, 504 vars)

| | count |
|---|---|
| Matched — exact mechanical rule | 367 |
| Matched — documented fuzzy rule | 60 |
| Figma-only | 77 |
| Code-only (modern tokens in variable-shaped groups) | 184 |

**Figma-only (77):** 38 `@dep-*` sentinels (`#00ffcc`/`#ff00cc` — formControl 8, fontAvatarColor 10, Deprecated/Avatar 12, Deprecated/Tag 4, 4 misc); 22 `Internal/dimension/*` (raw px scale — code spacing maps by value, not name); `ctaSizeMd/Sm` + `(Flex)` variants (4); `ctaBgColorTertiaryHoverInverse`, `ctaIconBgColorTertiaryDefault`, `ctaFabBorderColorPrimaryActive`, `itemBgColorDefault`; 8 font colors code lacks (`fontColorSubtle`, `fontColorSubtleInverse`, `fontColor{Success,Warning,Error}{Emphasis,Subtle}`); stray `Published/color/primary/bg/pale`.

**Code-only (184):** ~113 are `-inverse-` variants (Figma: mode, see above). Rest with no Figma counterpart at all:

- Whole groups: `--ink-tag-bg-color-*` (8 — Figma tag vars are all `@dep`), `--ink-badge-ai-*` (4), `--ink-z-*` (6), `--ink-opacity-disabled`, `--ink-cta-font-color-*` (5), `--ink-status-{info,warn,critical}-*` + `status-warning-font-color` (10), `--ink-focus-{inner,outer,ring}-*` (8)
- Scale drift: `--ink-spacing-{0,25,125,350}` + 12 pixel-named spacings (`--ink-spacing-1`…`-16`); `--ink-radius-{sm,md,lg,xl,full}` (shadcn-style aliases; Figma only has `radiusSize*`); `--ink-neutral-5/-15`, `--ink-neutral-fade-0/-25`; `--ink-icon-size-s/m`
- Misc: `--ink-bg-color-{muted,subtle,active-subtle}`, `--ink-border-color-{focus,hover,active-indicator}`, `--ink-form-control-border-color-subtle`, `--ink-form-control-border-width-s`, `--ink-bar-track-color-emphasis`, `--ink-cta-fab-elevation-*` (2)

**Not in any Figma lane (code-only groups, 121):** TYPOGRAPHY primitives (24: `--ink-font-family*`, `--ink-font-size-*`, `--ink-font-weight-*`, `--ink-line-height-*`, `--ink-letter-spacing-*` — value-level counterparts live in the `_Utilities` collection but names don't map; fuzzy at best), `--ink-font-link-*` decoration tokens (3), MOTION (22), TRANSITIONS (3), SHADOWS (6, see elevation below), plus the 352 LEGACY ALIASES (pure `var()` re-exports of modern tokens — excluded from matching).

## Styles lane

### Gradients → paint styles (matched 4 / code-only 1 / figma-only 0)

| Code | Figma paint style | |
|---|---|---|
| `--ink-gradient-pearl` | `Gradient/gradientPearl` | stops match (ecru-10 → white) |
| `--ink-gradient-atmosphere` | `Gradient/gradientAtmosphere` | stops match (cobalt-40 → cobalt-100) |
| `--ink-gradient-blue-haze` | `Gradient/gradientBlueHaze` | stops match (cobalt-100 → cobalt-140) |
| `--ink-gradient-nightglow` | `Gradient/gradientNightglow` | stops match (red-70 → cobalt-100) |
| `--ink-gradient-ai-iris` | **none** | code-only |

**AI Iris answer: no Figma paint style exists for `--ink-gradient-ai-iris`** (90deg, #d9155d → #a02aac → #4c06ff). All four Figma gradient styles are 2-stop; none contains these colors. The AI badge tokens (`--ink-badge-ai-*`) are likewise code-only.

### Typography → text styles (matched 27 / code-only 2 / figma-only 1)

Rule: Figma `font{Name}` ↔ code pair `--ink-font-{name-kebab}-size` + `--ink-font-{name-kebab}-line-height`. All 27 pairs match: detail-xs/s, body-s/m/l/xl, heading-xxs/xs/s/m, display-xs/s/m/l/xl, avatar-group, badge, button, button-s, element-label, element-label-emphasis, item-selected, link, link-s, section-headline, tab, timestamp.
Code-only ramps: `link-m`, `breadcrumb` (4 tokens). Figma-only: `[PR] fontNumeric`. Weight is carried by the Figma style (Regular/Medium/SemiBold, DS Indigo), not by the code pair — code weights are separate primitives.

### Elevation → effect styles (matched 5 / code-only 6 / figma-only 9)

| Code | Figma effect style | |
|---|---|---|
| `--ink-elevation-low` | `elevationLow` | values match (0 4 8 #130032 15%) |
| `--ink-elevation-medium` | `elevationMedium` | values match |
| `--ink-elevation-high` | `elevationHigh` | values match |
| `--ink-elevation-drag` | `elevationDrag` | values match |
| `--ink-elevation-glass` | `elevationGlass` | **fuzzy — value mismatch**: code `8px`, Figma blur 16 |

Figma-only: `elevationLowest`, `elevationGlass{Lowest,Low,Medium,High}` (shadow+blur combos code composes manually), 4 `@dep-*`. Code-only: `--ink-shadow-xs…xl,-elevated` (6, Tailwind-style scale — no Figma counterpart).

## Top mismatches

1. **AI Iris gradient is code-only** — no paint style; the AI badge lane (`--ink-badge-ai-*`) has no Figma presence at all.
2. **Inverse divergence** — 113 code `-inverse-` tokens vs Figma's Inverse mode; any sync tool needs a token→(variable, mode) resolver.
3. **Form naming is a generation behind** — code `--ink-form-control-*` matches Figma's dead `@dep-formControl*` names; live Figma vars are `form*`.
4. **Tag tokens dead in Figma** — code's 8 `--ink-tag-*` map only to `@dep` sentinels.
5. **Dimension scales don't share names** — Figma `gapN`/`Internal/dimension/N`/`radiusSize*` vs code `--ink-spacing-*` (plus 12 extra pixel spacings) and shadcn-style `--ink-radius-{sm…}` aliases; mapping is value-based, not mechanical.
