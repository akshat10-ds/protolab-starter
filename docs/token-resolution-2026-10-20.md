# Remaining token resolution — 2026-10-20

Read-only source and Figma investigation of the **9 names / 26 references**
left by the contract patches. No generated source, canonical checkout or
Figma content was changed. Recommendations below belong in the authoritative
component source and its release, never as starter-only aliases.

## Supported replacements

| Missing token | Recommended existing token | Confidence and evidence |
|---|---|---|
| `--ink-font-color` (1 ref) | `--ink-font-color-default` | **High.** `GlobalNav.module.css:212` explicitly falls back to `rgba(19,0,50,0.9)`, exactly the existing default token at `tokens.css:337`. Current Figma `Published/Font/fontColorDefault` (`VariableID:6240:70`) resolves to that same color in Standard mode. |
| `--ink-font-color-link-subtle` (2 refs) | `--ink-font-color-link-subtle-default` | **High.** DataTable's `.partyLink` and `.partyMoreLink` base rules already use the corresponding `-hover` role for hover. The approved local crosswalk explicitly maps Figma's unsuffixed default link name to code's `-default` name. Live Link specimen `79:2674`, set `55:2626`, and variable definitions confirm subtle default at 90% ink. |
| `--ink-font-size-body-xs` (17 refs) | `--ink-font-detail-s-size` | **High for the intended size; medium for extending the earlier decision to Ink AgentPanel.** `src/ai-system/guidelines/FIX-SPEC.md:3,31` records Akshat's 2026-08-10 approval of this exact replacement, explicitly calling it a judgement call. Current Figma has `fontDetailS` = 12px, Medium, 150% line height, 0.16px tracking, described as captions/descriptive text; no `fontBodyXS` exists among its 28 text styles. Existing CSS defines the size at `tokens.css:884`. The prior spec is scoped to canonical **ai-system**, whereas all 17 remaining uses are **Ink AgentPanel**. Reuse this documented normalization in the upstream review and report the scope extension; do not claim a Figma specimen proves every AgentPanel label. Replace the size only; this does not authorize changing existing monospace families, weights or line heights. |
| `--ink-spacing-75` (1 ref) | `--ink-spacing-100` | **Medium; documented normalization, not exact 6px fidelity.** The same recorded approval at `FIX-SPEC.md:32` chooses 8px on the existing rhythm. Live `Published/Spacing/gap100` (`VariableID:6240:15974`) is 8 in every mode; `gap50` (`6240:15973`) is 4; there is no `gap75`. Remaining use is the document-title icon/text gap at `AgentCanvas.module.css:104`, outside the prior AI-package scope. Do not map to `--ink-spacing-6`: that legacy name is **24px**, aliasing spacing-300 (`tokens.css:985`). |

The first two are direct naming/role repairs: **2 names / 3 refs**. Reusing
the two documented normalization decisions covers **another 2 names / 18
refs**, leaving **5 names / 5 refs** requiring per-consumer intent decisions.
No patch was changed or new inventory claimed by this investigation.

## Role candidates that still need a consumer decision

| Missing token / consumer | Evidence-supported candidate | Remaining uncertainty |
|---|---|---|
| `--ink-bg-canvas` / `DocuSignShell.module.css:9` | `--ink-bg-color-canvas-page` | **Medium.** Figma has distinct page (`VariableID:6240:15968`) and document (`6240:15969`) roles; a shell is the page-level consumer, and DataTable already uses the page role for its surrounding canvas. The shell has no local mapped Figma specimen proving its root fill. Its sidebar and content independently paint white (`:32,:39`), so this is not permission to recolor the visible content pane. Recommend page role upstream, then check exposed shell areas against production. |
| `--ink-bg-color-neutral-subtle` / AIChat expand hover `:280` | `--ink-cta-bg-color-secondary-hover` **if** this control is a secondary IconButton | **Medium as a variant choice; high for the selected variant's token.** Live IconButton secondary hover `14:991` uses `ctaBgColorSecondaryHover` = 5% ink. The current custom 28px expand button has a white fill and subtle border; there is no actual AIChat Figma specimen or declared variant. `itemBgColorHoverSubtle` also happens to be 5%, but an equal color does not establish an item role. Prefer adopting the supported IconButton contract upstream over inventing neutral background aliases. |
| `--ink-bg-color-neutral` / AIChat expand active `:286` | `--ink-cta-bg-color-secondary-active` **under the same variant choice** | **Medium.** Live secondary active `14:993` and variable defs establish 10% ink. `itemBgColorActiveSubtle` also resolves to 10%, while default item active is 15%. Pick the control's semantics before choosing a role; do not alias all generic neutral states to one primitive. |

Current mode values (Standard / Inverse; Touch repeats each corresponding mode):

| Figma role | Current value |
|---|---|
| `bgColorCanvasPage` | `#f7f6f7` / `#190f35` |
| `bgColorCanvasDocument` | `#f0eff0` / `#201b3a` |
| `ctaBgColorSecondaryHover` (`VariableID:6242:109`) | `#130032` at 5% / white at 5% |
| `ctaBgColorSecondaryActive` (`VariableID:6242:112`) | `#130032` at 10% / white at 10% |
| `fontColorDefault` (`6240:70`) | `#130032` at 90% / white at 100% |
| `fontColorLinkSubtle` (`6240:15943`) | `#130032` at 90% / white at 100% |
| `fontColorLinkSubtleHover` (`8169:5648`) | `#130032` at 80% / white at 80% |
| `fontColorLinkSubtleActive` (`8169:5649`) | `#130032` at 100% / white at 90% |

The local Link/token comments say hover “darkens.” The live Standard values
are 90% → 80% ink: on a white surface that **lightens** the displayed color.
Retain Figma's measured values and correct that explanatory comment upstream;
do not invert the states to follow the comment.

## Still unresolved: annotation yellow

`AgentCanvas.module.css:191–192` uses `--ink-yellow-20` and
`--ink-yellow-60` for a document annotation fill and border. The current Ink
collection has no yellow ramp or annotation role. A full local-variable read
does find `OLD_TOKENS/Color/extendedYellow[20]` (`VariableID:1:127`,
`#ffd651`) and `[60]` (`VariableID:1:131`, `#ac6600`) **only** in
`_DEPRECATED_Ink (1.0)`. Those names and numbers do not establish that they
were the author's intended values, and do not authorize reviving them.
Orange warning tokens describe a different semantic role.

No `styles.highlight` callsite exists in `AgentCanvas.tsx`; the only
`highlight` occurrence in that component's files is the CSS selector itself.
Thus the scan proves dead declarations, but no currently rendered annotation
failure. Keep both unresolved until an actual annotation specimen/production
reference specifies fill, outline, opacity and modes, or remove unused styles
through a deliberate upstream cleanup.

## Evidence and limits

- Local inputs: `docs/design-system-upstream-issues.md`,
  `patches/2026-10-20-upstream-contracts/README.md` and both remaining-token
  inventories; `docs/figma-token-crosswalk.md`; current consuming CSS and
  `src/ai-system/guidelines/FIX-SPEC.md` (the same spec exists in canonical
  `../akshat-lab/system/ai-system/guidelines/`).
- Read current Figma library
  [nAKX1rO3Mir2OCBdCkC5oq](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library)
  through design context + screenshots for actual
  [Link set](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=55-2626),
  [subtle Link specimen](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=79-2674),
  [IconButton set](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=14-953),
  and [secondary hover specimen](https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq/-ds-ui--Component-Library?node-id=14-991).
  Read variable definitions for both sets; used read-only Plugin API to
  enumerate local collections, variables, resolved aliases/modes, and text
  styles. The supplied `3140:1301` is the Thumbnail, not the component target.
- Current inventory: **Ink 468 variables**, `_Utilities` 40,
  `_DEPRECATED_Ink (1.0)` 347; **28 text styles**. The July crosswalk's 504
  Ink-variable count is historical and differs from this read. This is a
  focused resolution investigation, not a replacement whole-library audit.
- No browser UI was controlled and no new visual-parity claim is made.
  Existing CSS-only token declarations do not implement all Figma inverse or
  touch modes automatically. Resolve modes through the established code
  token contract when preparing the authoritative release.
