# Design-system static audit

Run `npm run audit:design-system` to check application-owned source against the
known-debt baseline. It prints all rule totals, reports new findings with source
locations, and exits with status 1 when new debt appears. Existing debt stays
visible even when the command passes. A passing check is not visual approval.

```bash
# Save every finding and coverage limitation as structured JSON.
npm run audit:design-system -- --json /tmp/protolab-design-system-audit.json

# Inspect everything without allowing findings to fail the command.
npm run audit:design-system -- --report-only

# Treat all current debt as new; useful when evaluating a fresh prototype.
npm run audit:design-system -- --no-baseline --json /tmp/all-design-debt.json

# Test the parser, scope exclusions, baseline behavior, and regression exit code.
node --test scripts/design-system-audit.test.mjs
```

The scanner uses the installed TypeScript compiler API. It adds no dependencies
and never edits application or generated component sources.

## What it checks

It scans `.ts`, `.tsx`, and `.css` under `src`, excluding `src/design-system`,
`src/ai-system`, and `.figma.ts` Code Connect files. Token definitions are read
from all source CSS, including those excluded generated directories.

| Rule | Evidence |
| --- | --- |
| `raw-control` | Actual JSX `a`, `button`, `input`, `select`, `textarea`, and `table` nodes; use the corresponding design-system component. |
| `deep-design-system-import` | Imports, re-exports, literal dynamic imports, and literal `require` calls into design-system component paths. |
| `undefined-ink-token` | `var(--ink-…)` references with no CSS definition, even when a fallback is supplied. |
| `hardcoded-color` | Literal hex, named, or color-function values in appearance properties. |
| `hardcoded-typography` | Literal typography values such as font family, size, weight, line height, or letter spacing. |
| `hardcoded-spacing` | Nonzero literal spacing and radius values. |
| `layout-bypass` | CSS `display: flex/grid` or corresponding style objects used on raw HTML layout elements. |

Appearance checks cover CSS declarations, JSX style objects, object properties
named `style`, and `CSSProperties` annotations/assertions. They resolve
file-unique variable bindings, object spreads, shorthand properties, and literal
conditional branches. Comments and plain text that looks like JSX are ignored.

## Baseline maintenance

`scripts/design-system-audit-baseline.json` records existing findings by a hash
of file, rule, property, and normalized evidence, plus the number of occurrences.
Line numbers are excluded so moving code does not introduce artificial debt.
Adding another identical violation still fails because its occurrence exceeds
the baseline count. Changing a literal value creates different evidence and is
reported as new. Removed occurrences appear in the resolved count.

Refresh the baseline only after reviewing intentional exceptions or removing
resolved entries. Refreshing accepts all current findings as known debt:

```bash
npm run audit:design-system -- --write-baseline
```

Use `--baseline <path>` to compare against a different baseline. Invalid baseline
schema, malformed entries, unknown options, and missing explicit baseline paths
exit with status 2. `--format json` prints the complete machine-readable report
to stdout; `--json <path>` saves it while retaining the readable console summary.

## What it does not prove

This is a static debt inventory, not a percentage of design-system adherence or
production fidelity. It does not validate icon names, design-system prop
contracts, runtime behavior, accessibility, or rendered appearance. Run the type
check and inspect the actual app against Docusign and the Figma library as
separate checks.

Arbitrary function calls, imported style objects, computed values, and dynamic
property/token names are not evaluated. Layout detection is a useful subset,
not a complete custom-layout inventory. Token definitions are a global CSS
union, without cascade, scope, or load-order analysis. Token fallbacks, asset
URLs, zero spacing, structural width/height/position values, font registration,
and SVG/data paint attributes are excluded from appearance debt. Baseline
matching accepts counted evidence; it does not certify a particular code
location or the quality of an exception.
