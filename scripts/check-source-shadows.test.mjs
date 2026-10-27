import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findSourceShadows } from './check-source-shadows.mjs';

test('detects nested emitted siblings without flagging standalone JavaScript', () => {
  const root = mkdtempSync(join(tmpdir(), 'protolab-shadow-check-'));
  try {
    mkdirSync(join(root, 'nested'));
    for (const file of ['App.tsx', 'App.js', 'nested/utils.ts', 'nested/utils.js', 'standalone.js']) writeFileSync(join(root, file), '');
    assert.deepEqual(findSourceShadows(root), [join(root, 'App.js'), join(root, 'nested/utils.js')]);
    assert.deepEqual(findSourceShadows(join(root, 'absent')), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
