import { createRequire } from 'node:module';
const template = process.argv[2];
const starter = process.argv[3];
if (!template || !starter) throw new Error('Usage: node runtime-semantics.mjs <generated-template> <starter>');
const require = createRequire(starter + '/package.json');
const { build } = require('esbuild');
const result = await build({
  stdin: {
    contents: `
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { strict as assert } from 'node:assert';
import { Breadcrumb, Button, FilterTag, Tooltip, Popover, Dropdown } from './src/design-system';
import { TableActionBar } from './src/design-system/4-composites/Table/TableActionBar';
const render = renderToStaticMarkup;
const crumb = render(<Breadcrumb rootIcon items={[{ label: 'Agreements', href: '/agreements' }, { label: 'Current', current: true }]} />);
assert.match(crumb, /<a[^>]*href="\\/agreements"/);
assert.match(crumb, />Agreements<\\/span>/);
assert.doesNotMatch(crumb, /<button[^>]*href=/);
assert.match(render(<FilterTag label="Status" />), /^<button/);
assert.match(render(<FilterTag label="Status" dismissible />), /^<div/);
assert.match(render(<Tooltip text="Help"><Button>Help</Button></Tooltip>), /<button/);
assert.match(render(<Popover content="Details"><Button>Details</Button></Popover>), /aria-expanded="false"/);
assert.match(render(<Dropdown items={[]}><Button>Actions</Button></Dropdown>), /aria-haspopup="menu"/);
assert.match(render(<TableActionBar selectedCount={1} selectedRows={new Set(['one'])} visible actions={[{label:'Delete', variant:'destructive', onClick:()=>{}}]} />), /data-ink-prop-kind="danger"/);
console.log('9 server-rendered semantic assertions pass.');
`,
    resolveDir: template, loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  external: ['react', 'react-dom/server', 'node:assert'],
  loader: { '.module.css': 'empty', '.css': 'empty' }, logLevel: 'silent',
});
const module = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(
  require, module, module.exports,
);
