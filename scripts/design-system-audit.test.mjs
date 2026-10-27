import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditProject, compareBaseline, createBaseline, cssDeclarations, scanCssSource, scanTsSource } from './design-system-audit.mjs';

const tokens = new Set(['--ink-font-default', '--ink-spacing-100', '--ink-radius-md', '--ink-font-size-sm']);
const tsFindings = (source) => scanTsSource('src/Fixture.tsx', source, tokens);
const cssFindings = (source) => scanCssSource('src/fixture.css', source, tokens);
const count = (findings, rule) => findings.filter((finding) => finding.rule === rule).length;

function projectFixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'design-system-audit-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'src'));
  mkdirSync(path.join(root, 'scripts'));
  return root;
}

test('raw controls are JSX nodes, excluding comments, text, components, and closing tags', () => {
  const findings = tsFindings(`
    // <button>not a control</button>
    const documentation = '<input />';
    const ui = <><Button>Save</Button><button>Save</button><input /><select /><textarea /><table /><a href="/home">Home</a></>;
  `);
  assert.equal(count(findings, 'raw-control'), 6);
  assert.deepEqual(findings.map((finding) => finding.property), ['button', 'input', 'select', 'textarea', 'table', 'a']);
});

test('detects actual deep imports, re-exports, dynamic imports, and require calls', () => {
  const findings = tsFindings(`
    import { Button } from '@/design-system';
    import { Text } from './design-system/index';
    import { Button as Other } from '@/design-system/3-primitives/Button';
    export { Card } from './design-system/3-primitives/Card';
    const mod = import('@/design-system/2-utilities/Stack');
    const cjs = require('./design-system/4-composites/Modal');
    const example = "import x from '@/design-system/nope'";
    // import x from '@/design-system/nope';
  `);
  assert.equal(count(findings, 'deep-design-system-import'), 4);
});

test('ignores chart/data colors, SVG paint attributes, and structural dimensions', () => {
  const findings = tsFindings(`
    const rows = [{ color: '#ff00ff', padding: 24, fontSize: 32 }];
    const ui = <svg fill="#fff"><path stroke="red" /></svg>;
    const sizing = <div style={{ width: 1200, height: 48, top: 10, left: '20px', zIndex: 2, gridTemplateColumns: '1fr 2fr' }} />;
  `);
  assert.equal(findings.length, 0);
});

test('reads direct JSX styles and token-aware color, typography, spacing and layout debt', () => {
  const findings = tsFindings(`
    const ui = <div style={{ color: '#130032', background: 'linear-gradient(red, blue)', fontSize: 14, fontWeight: 'bold', padding: '0 16px', margin: 0, borderRadius: 'var(--ink-radius-md)', display: 'flex' }} />;
  `);
  assert.equal(count(findings, 'hardcoded-color'), 2);
  assert.equal(count(findings, 'hardcoded-typography'), 2);
  assert.equal(count(findings, 'hardcoded-spacing'), 1);
  assert.equal(count(findings, 'layout-bypass'), 1);
});

test('resolves unique bindings and style spreads, and does not flag DS layout components', () => {
  const findings = tsFindings(`
    const pad = 12;
    const base = { padding: pad };
    const layout = { display: 'grid', ...base };
    const ui = <div style={layout} />;
    const builtIn = <Grid style={{ display: 'grid' }} />;
    const typed: React.CSSProperties = { fontSize: 22 };
    const asserted = { gap: 24 } as CSSProperties;
    const checked = { marginTop: 8 } satisfies CSSProperties;
    const padding = 16;
    const shorthand = <div style={{ padding }} />;
  `);
  assert.equal(count(findings, 'hardcoded-spacing'), 4);
  assert.equal(count(findings, 'hardcoded-typography'), 1);
  assert.equal(count(findings, 'layout-bypass'), 1);
});

test('does not guess ambiguous shadowed bindings or execute style calls', () => {
  const findings = tsFindings(`
    const padding = 20;
    function first() { const padding = 8; return <div style={{ padding }} />; }
    const ui = <div style={computeStyles()} />;
    const dynamic = <div style={{ [getName()]: 'red', margin: calculate() }} />;
  `);
  assert.equal(findings.length, 0);
});

test('handles conditional literal style branches without treating expressions as literal values', () => {
  const findings = tsFindings(`
    const ui = <div style={open ? { marginTop: 12 } : { marginTop: 0 }} />;
    const other = <div style={{ color: open ? 'red' : 'var(--ink-font-default)' }} />;
    const gated = <div style={open && { gap: 8 }} />;
  `);
  assert.equal(count(findings, 'hardcoded-spacing'), 2);
  assert.equal(count(findings, 'hardcoded-color'), 1);
});

test('finds undefined Ink variables, including fallback use, while ignoring comments and dynamic token names', () => {
  const findings = tsFindings(`
    // var(--ink-comment-only)
    const ignored = '/* var(--ink-css-comment) */';
    const valid = 'var(--ink-font-default)';
    const missing = 'var(--ink-not-defined, var(--ink-font-default))';
    const dynamic = \`var(--ink-\${name})\`;
    const templated = \`color: var(--ink-template-missing); width: \${size}px\`;
  `);
  assert.deepEqual(findings.map((finding) => finding.evidence), ['--ink-not-defined', '--ink-template-missing']);
});

test('undefined token source locations use original escaped string text', () => {
  const source = 'const value = "line\\nvar(--ink-missing)";';
  const [finding] = tsFindings(source);
  assert.equal(finding.line, 1);
  assert.equal(finding.column, source.indexOf('--ink-missing') + 1);
});

test('CSS lexer balances nested rules, comments, quoted punctuation, and URL functions', () => {
  const source = `
    /* .bad { color: red; --ink-comment-only: 1px; } */
    @media (width > 600px) {
      .card:hover { background: url("data:image/svg+xml,<svg fill='#fff'>{;}</svg>"); padding: 16px; }
      .other { color: var(--ink-font-default); content: 'var(--ink-string-only)'; }
    }
  `;
  const declarations = cssDeclarations(source);
  assert.deepEqual(declarations.map((declaration) => declaration.property), ['background', 'padding', 'color', 'content']);
  const findings = cssFindings(source);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'hardcoded-spacing');
  assert.equal(findings[0].line, 4);
});

test('CSS appearance rules skip font-face registration, token fallbacks, zero and token arithmetic', () => {
  const findings = cssFindings(`
    @font-face { font-family: 'DS Indigo'; font-weight: 400; src: url('/font.woff2'); }
    .card { color: var(--ink-font-default, #000); padding: calc(var(--ink-spacing-100) * 2); margin: 0 auto; width: 1400px; height: 100%; }
    .debt { border-color: rebeccapurple; border-radius: 16px; display: inline-grid; font-size: 1rem; }
    .mixed { padding: var(--ink-spacing-100) 12px; }
  `);
  assert.equal(count(findings, 'hardcoded-color'), 1);
  assert.equal(count(findings, 'hardcoded-spacing'), 2);
  assert.equal(count(findings, 'hardcoded-typography'), 1);
  assert.equal(count(findings, 'layout-bypass'), 1);
});

test('project scope excludes generated sources and Code Connect while reading their CSS token definitions', (t) => {
  const root = projectFixture(t);
  mkdirSync(path.join(root, 'src/design-system/1-tokens'), { recursive: true });
  mkdirSync(path.join(root, 'src/ai-system'), { recursive: true });
  writeFileSync(path.join(root, 'src/design-system/1-tokens/tokens.css'), ':root { --ink-real: red; /* --ink-fake: blue; */ }');
  writeFileSync(path.join(root, 'src/ai-system/tokens.css'), ':root { --ink-ai-real: 1px; }');
  writeFileSync(path.join(root, 'src/design-system/Ignore.tsx'), 'const ui = <button />;');
  writeFileSync(path.join(root, 'src/Ignore.figma.ts'), 'const ui = <button />;');
  writeFileSync(path.join(root, 'src/App.tsx'), `const ui = <Button style={{ color: 'var(--ink-real)', margin: 'var(--ink-ai-real)' }} />; const bad = 'var(--ink-fake)';`);
  const report = auditProject(root);
  assert.deepEqual(report.scope.sourceFiles, ['src/App.tsx']);
  assert.equal(report.scope.definedInkTokens, 2);
  assert.equal(report.summary.total, 1);
  assert.equal(report.findings[0].evidence, '--ink-fake');
});

test('baseline fingerprints survive line moves and use occurrence counts to catch duplicates', () => {
  const original = tsFindings('const ui = <button>Save</button>;');
  const baseline = createBaseline(original);
  const moved = tsFindings('\n\nconst ui = <button>Save</button>;');
  assert.equal(compareBaseline(moved, baseline).findings[0].status, 'existing');
  const doubled = tsFindings('const ui = <><button>Save</button><button>Save</button></>;');
  assert.deepEqual(compareBaseline(doubled, baseline).findings.map((finding) => finding.status), ['existing', 'new']);
  assert.equal(compareBaseline([], baseline).resolvedBaselineCount, 1);
});

test('changed literal evidence remains a new finding even when its source position is unchanged', () => {
  const baseline = createBaseline(tsFindings('const ui = <div style={{ padding: 12 }} />;'));
  const updated = tsFindings('const ui = <div style={{ padding: 16 }} />;');
  const compared = compareBaseline(updated, baseline);
  assert.equal(compared.findings[0].status, 'new');
  assert.equal(compared.resolvedBaselineCount, 1);
});

test('rejects malformed baseline data instead of silently accepting findings', () => {
  assert.throws(() => compareBaseline([], { schemaVersion: 2, entries: [] }), /Unsupported/);
  assert.throws(() => compareBaseline([], { schemaVersion: 1, entries: [{ fingerprint: 'x', count: -1 }] }), /Malformed/);
});

test('CLI writes JSON, captures explicit baseline, and fails on new debt with useful exit codes', (t) => {
  const root = projectFixture(t);
  const app = path.join(root, 'src/App.tsx');
  writeFileSync(app, 'const ui = <button>Save</button>;');
  const cli = fileURLToPath(new URL('./design-system-audit.mjs', import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [cli, '--root', root, ...args], { encoding: 'utf8' });
  assert.equal(run().status, 1);
  assert.equal(run('--write-baseline').status, 0);
  assert.equal(run().status, 0);
  writeFileSync(app, 'const ui = <><button>Save</button><input /></>;');
  assert.equal(run('--json', 'report.json').status, 1);
  const report = JSON.parse(readFileSync(path.join(root, 'report.json'), 'utf8'));
  assert.equal(report.summary.existing, 1);
  assert.equal(report.summary.new, 1);
  assert.equal(run('--report-only').status, 0);
  assert.equal(run('--format', 'json', '--report-only').stdout[0], '{');
  assert.equal(run('--baseline', 'missing.json').status, 2);
  assert.equal(run('--unknown-option').status, 2);
});
