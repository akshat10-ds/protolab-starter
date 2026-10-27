# Design-system upstream issues

Checked **2026-10-20** against the current local generated sources. This is an
upstream repair register for `src/design-system/` and `src/ai-system/`. It does
not establish current visual parity with all of Docusign or the Figma library.

Do not patch either generated folder in this starter. Fix the authoritative
component/token sources, publish a compatible bundle, and refresh this copy
through `/update`. Application-owned code is outside this register.

## Evidence and classification

| Class | Meaning here |
|---|---|
| Proven runtime defect | The current implementation was executed and the faulty output reproduced. |
| Static issue | Source or compiler evidence proves an invalid reference or contract; affected browser states still need visual checking. |
| Feature/API gap | An intended composition has no supported first-class API; this does not prove a rendering failure for supported uses. |

## 1. Generated packages do not typecheck

**Class: static issue.** From the project root:

```sh
npm run typecheck
```

The current result is exit code 2 with **61 TypeScript diagnostics across 20
files**: **53 in `src/design-system/`**, **8 in `src/ai-system/`**, and **zero
outside those generated folders**, including `src/App.tsx`.

Representative incompatibilities:

- `SwitchProps` and `SearchInputProps` redefine `onChange` without omitting the
  incompatible native input signature.
- Tooltip/SearchInput timers use uninitialized `useRef()` and `NodeJS` types
  under the current React 19/browser TypeScript configuration.
- Table/DataTable column controls and AI ArtifactViewer pass Button `variant`,
  while the installed Button accepts `kind`.
- Breadcrumb, Callout, and AIChat pass IconButton `kind`, while IconButton
  accepts `variant`.
- Popover/Tooltip/Dropdown assume typed cloned-child props that are `unknown`
  under the installed React types.
- DocuSignShell imports `GlobalNavProps` and `LocalNavProps` from sub-barrels
  that do not export those types.
- ChatInput passes FilterTag `icon`, and ArtifactViewer passes Tooltip `size`,
  which are unsupported by the installed components.

To reproduce the counts without relying on visually counting compiler output:

```sh
python3 - <<'PY'
import collections, re, subprocess
run = subprocess.run(
    ['npm', 'run', 'typecheck', '--', '--pretty', 'false'],
    capture_output=True, text=True,
)
errors = [line for line in (run.stdout + run.stderr).splitlines()
          if re.search(r'error TS\d+:', line)]
counts = collections.Counter(
    'design-system' if line.startswith('src/design-system/') else
    'ai-system' if line.startswith('src/ai-system/') else 'app/other'
    for line in errors
)
print('exit:', run.returncode, 'diagnostics:', len(errors), dict(counts))
PY
```

**Upstream fix:** reconcile both generated packages against the same supported
React/types and component API versions; correct callers and exported types.
Ship the packages together where a contract changes. A successful Vite build
does not verify TypeScript contracts because `npm run build` invokes Vite
without running `tsc`.

## 2. Generated CSS references undefined tokens

**Class: static issue with potential runtime styling loss.** The current source
scan finds **14 undefined `--ink-*` names across 38 references**: 37 references
in `src/design-system/`, plus one in `src/ai-system/`. Four references supply
fallbacks; **34 have no fallback**. All current findings are generated-source
references. This supersedes the earlier 21-name scan made before application
token cleanup.

Locations below are relative to `src/`. Line numbers reflect the inspected
snapshot; rerun the scan after changes.

| Undefined name | References | Source locations | Explicit fallback |
|---|---:|---|---|
| `--ink-bg-canvas` | 1 | `design-system/6-layouts/DocuSignShell/DocuSignShell.module.css:9` | None |
| `--ink-bg-color-neutral` | 1 | `design-system/5-patterns/AIChat/AIChat.module.css:286` | None |
| `--ink-bg-color-neutral-subtle` | 1 | `design-system/5-patterns/AIChat/AIChat.module.css:280` | None |
| `--ink-font-color` | 1 | `design-system/5-patterns/GlobalNav/GlobalNav.module.css:212` | `rgba(19, 0, 50, 0.9)` |
| `--ink-font-color-link-subtle` | 2 | `design-system/5-patterns/DataTable/DataTable.module.css:788,801` | None |
| `--ink-font-family-mono` | 3 | `design-system/5-patterns/DataTable/DataTable.module.css:635,814`; `ai-system/patterns/ArtifactViewer/ArtifactViewer.module.css:71` | `monospace` |
| `--ink-font-size-body-m` | 1 | `design-system/5-patterns/AgentPanel/AgentActionCard.module.css:199` | None |
| `--ink-font-size-body-s` | 6 | `design-system/5-patterns/AgentPanel/AgentCanvas.module.css:106`; `AgentActionCard.module.css:208,333,385`; `ThinkingSteps.module.css:121,318` in the same folder | None |
| `--ink-font-size-body-xs` | 17 | `design-system/5-patterns/AgentPanel/AgentCanvas.module.css:116,128`; `AgentActionCard.module.css:123,135,233,266,279,326,350,378,419`; `ThinkingSteps.module.css:129,340,357,364,378,413` in the same folder | None |
| `--ink-font-size-detail-xs` | 1 | `design-system/5-patterns/AIChat/AIChat.module.css:405` | None |
| `--ink-font-size-xxl` | 1 | `design-system/5-patterns/PageHeader/PageHeader.module.css:15` | None |
| `--ink-spacing-75` | 1 | `design-system/5-patterns/AgentPanel/AgentCanvas.module.css:104` | None |
| `--ink-yellow-20` | 1 | `design-system/5-patterns/AgentPanel/AgentCanvas.module.css:191` | None |
| `--ink-yellow-60` | 1 | `design-system/5-patterns/AgentPanel/AgentCanvas.module.css:192` | None |

Reproduce the inventory without modifying files:

```sh
python3 - <<'PY'
from pathlib import Path
import collections, re
files = [path for path in Path('src').rglob('*')
         if path.suffix in {'.css', '.tsx', '.ts'}
         and not path.name.endswith('.figma.ts')]
defined = set()
for path in files:
    defined.update(re.findall(r'(--ink-[\w-]+)\s*:', path.read_text()))
missing = collections.defaultdict(list)
for path in files:
    for number, line in enumerate(path.read_text().splitlines(), 1):
        for token in re.findall(r'var\((--ink-[\w-]+)', line):
            if token not in defined:
                missing[token].append(f'{path}:{number}')
print('names:', len(missing), 'references:', sum(map(len, missing.values())))
for token, locations in sorted(missing.items()):
    print(token, len(locations), *locations, sep='\n  ')
PY
```

This scan establishes missing declarations in this source tree. It does not
measure final computed styles, runtime-injected external tokens, or screenshot
differences. Missing unguarded variables make the consuming declaration invalid
at computed-value time; inherited/initial values and other styles determine
what users actually see.

**Upstream fix:** correct the generated consumers to use approved existing
semantic tokens where intent is established. Clear naming candidates include
`--ink-font-color-link-subtle-default`, `--ink-font-body-m-size`,
`--ink-font-body-s-size`, `--ink-font-detail-xs-size`, and
`--ink-font-heading-m-size`. Confirm intended semantics before replacing
`body-xs`, yellow, canvas, hover-background, or spacing references. If a missing
token is intentional, define it in the authoritative token source and specify
its modes instead of maintaining a starter-only alias.

## 3. AIIcon names all render the same geometry

**Class: proven runtime defect.**
`design-system/3-primitives/Icon/AIIcon.tsx` accepts `ai-iris`,
`ai-iris-filled`, `ai-spark`, and `ai-spark-filled`. The function destructures
`name` but never uses it to select a path. Every name renders
`AI_SPARK_FILLED_PATH` at line 94.

Executing all four variants through React's server renderer produces
`distinctPaths: 1` for `renderedIcons: 4`. This reproduction uses the existing
esbuild dependency, bundles in memory, and treats CSS as text because only SVG
geometry is under test:

```sh
node --input-type=module <<'JS'
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const result = await build({
  stdin: {
    contents: `import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIIcon } from './src/design-system/3-primitives/Icon/AIIcon';
const names = ['ai-iris', 'ai-iris-filled', 'ai-spark', 'ai-spark-filled'];
const paths = names.map(name => renderToStaticMarkup(
  React.createElement(AIIcon, { name })
).match(/<path d="([^"]+)"/)[1]);
console.log({ distinctPaths: new Set(paths).size, renderedIcons: paths.length });`,
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  external: ['react', 'react-dom/server'],
  loader: { '.module.css': 'text', '.css': 'text' }, logLevel: 'silent',
});
const module = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(
  createRequire(import.meta.url), module, module.exports,
);
JS
```

**Upstream fix:** implement the supported names using approved distinct
geometry, or narrow/deprecate the misleading API with a consumer migration.
Verify each output against its current approved reference before claiming
Figma equality. `IrisIcon` and `IrisIconInverse` already exist as separate
barrel exports, but their APIs and viewboxes differ; they are not automatically
interchangeable with every AIIcon call.

## 4. PageHeader cannot express composed titles through its API

**Class: feature/API gap**, separate from its undefined font-size token above.
`design-system/5-patterns/PageHeader/PageHeader.tsx:7` declares `title: string`.
It wraps that string in a fixed `Heading level={1}`; its only other content
slots are the AI badge text and right-side `actions`. `className` applies to
the outer header. There is no title adornment/trigger slot or title-typography
prop.

This prevents a supported typed composition for an inline title icon,
title-adjacent view selector, or other richer heading content while reusing the
PageHeader structure. Passing a React element as `title` is a type error.

**Upstream fix:** agree a title/adornment API that preserves an accessible H1
and keeps interactive title controls semantically correct. Fix the title-size
token and reconcile the underlying Heading selectors with the intended
32px/400 page-title style. Add examples for plain and composed titles; verify
the rendered size and keyboard behavior rather than relying on comments.

## 5. Iris CTA has no supported component variant

**Class: feature/API gap.**
`design-system/3-primitives/Button/Button.tsx:7` supports only `brand`,
`primary`, `secondary`, `tertiary`, and `danger`. Its stylesheet has no Iris/AI
gradient CTA variant. The barrel provides `IrisIconInverse`, but no complete
Iris CTA component or Button appearance handles the approved gradient,
geometry, hover/pressed states, focus, disabled, and loading treatment together.

The existing `--ink-gradient-ai-iris` token is the magenta-to-blue-violet
branding gradient. Its existence does not specify an Iris CTA variant or prove
that it matches the production CTA's purple gradient. Inline style overrides
are technically possible but do not supply a reusable state specification.

**Upstream fix:** verify the current production and Figma CTA references,
resolve the intended visual treatment, then publish a reusable Button variant
or dedicated composite with supported icon placement and all interaction
states. Expose it through the existing design-system barrel. Until that lands,
use supported components and record any fidelity approximation explicitly.

## Repair and refresh workflow

1. Reproduce each issue in the authoritative component/token repositories with
   the supported React and TypeScript versions. Keep static defects, runtime
   defects, and requested API additions separately reviewable.
2. Fix the authoritative sources and any consumers in both generated packages.
   Validate the affected component states and agreed production/Figma
   references. Publish a compatible bundle with updated version metadata.
3. Refresh this starter using the documented
   [`/update` workflow](../.claude/skills/update.md), which checks `version.json`,
   backs up the generated directory, and replaces it from the published bundle.
   Where an issue spans `src/ai-system/`, ensure the authoritative release and
   refresh mechanism update that companion package too; the current local
   `/update` recipe explicitly names only `src/design-system/`.
4. Rerun `npm run typecheck`, the token inventory, and the AIIcon reproduction;
   build and inspect the affected live screens. Update this register with
   resolved bundle identifiers and evidence. Do not suppress the known list
   or treat a successful build as proof that all visual differences are gone.

Snapshot metadata: `version.json` reports version `1.0.0`, bundle hash
`9faf8a7094ab99ec`, and build timestamp `2026-03-31T02:36:43.652Z`. This is
declared bundle metadata; it does not prove that every generated file still
matches that original bundle.
