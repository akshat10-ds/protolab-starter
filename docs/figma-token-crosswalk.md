# Figma ↔ code tokens

The local token layer matches the read-only **2026-10-21** export of
`[ds-ui] Component Library` (`nAKX1rO3Mir2OCBdCkC5oq`).

| Collection | Variables | Modes | Verified values |
|---|---:|---|---:|
| Ink | 468 | Standard, Inverse, Standard (Touch), Inverse (Touch) | 1,872 |
| _Utilities | 40 | Default, Compact, Tall | 120 |
| _DEPRECATED_Ink (1.0) | 347 | Standard, Inverse, Standard (Large Touch Target), Inverse (Large Touch Target) | 1,388 |
| Total | 855 | | 3,380 |

All **49 styles** are represented: 28 text, 4 paint, 10 effect and 7 layout-grid
styles. Raw definitions are preserved in `tokens/figma/`. The generated
`src/design-system/1-tokens/figma-token-map.json` lists every variable and
style's CSS mapping; `scripts/figma-token-model.mjs` is the explicit crosswalk.

## Names

- Published roles keep established names: `bgColorDefault` →
  `--ink-bg-color-default`. Form, CTA, spacing and breakpoint exceptions are
  explicit in the crosswalk.
- Recipient numbers are separated: `recipientBgColor100` →
  `--ink-recipient-bg-color-100`. The previous 60 recipient mapping gaps were
  naming mismatches; the sync also corrects actual value drift.
- Internal dimensions use `--ink-dimension-*`; utilities use `--ink-utility-*`.
  Negative offsets preserve a `negative` segment to prevent collisions.
- Deprecated definitions use `--ink-deprecated-*`; obsolete definitions in
  the current collection use `--ink-deprecated-local-*`. Their old names cannot
  overwrite current semantic roles.
- Legacy shorthand remains available. Primary/secondary text and CTA text
  aliases now follow their semantic counterparts across modes.

## Modes

Set `data-ink-mode` on a shared layout component: `standard`, `inverse`,
`standard-touch` or `inverse-touch`. The root defaults to Standard; an explicit
Standard scope resets inherited Inverse values.

```tsx
<Stack gap="medium" data-ink-mode="inverse-touch">
  <Text>Inverse colors with Touch dimensions</Text>
</Stack>
```

Utility modes are independent: `data-ink-utilities-mode="default|compact|tall"`.
Deprecated modes use `data-ink-deprecated-mode` and are for archival inspection.
Alias relationships are retained and checked in all 12 Ink/utility combinations.

## Styles

Text styles expose size, family, weight, line height, tracking, transform,
decoration, paragraph spacing and indent. Effect styles separate shadow and
backdrop blur; the established `--ink-elevation-glass` remains 16px, while
`elevationGlassLow` has its measured 20px blur. Gradients use SVG image values
preserving Figma's affine field across aspect ratios. Grid styles expose their
measured parameters without imposing a page layout.

Code-only prototype extensions, including the Iris gradient, remain available.
The previous focus-inset override is replaced by Figma's 0px value for this
exact-sync pass.

## Verification

`npm run tokens:check` compares generated CSS with the pinned export and runs
in `npm run build`. It fails on missing or different values and stale browser
reference data. It does **not** contact Figma or monitor future changes.

The [browser preview](http://127.0.0.1:5173/#tokens) checks **10,844 computed CSS
values**, including combined modes and compatibility aliases. See the
[sync workflow](figma-token-sync-2026-10-21/README.md),
[coverage report](figma-token-sync-2026-10-21/coverage.json),
[live consistency check](figma-token-sync-2026-10-21/live-check.json) and
[refresh manifest](figma-token-sync-2026-10-21/refresh-manifest.json).

This is complete token/style coverage of this snapshot; it does not assert
pixel parity for every component or production flow. The
[July crosswalk](figma-token-sync-2026-10-21/historical-crosswalk.md) is retained
as historical evidence and is superseded by this inventory.
