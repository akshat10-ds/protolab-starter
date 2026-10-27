#!/usr/bin/env python3
"""Validate both upstream patches in private copies, using already installed deps.

No installs, network, Git commands, publication, or source-checkout writes.
"""
from pathlib import Path
import argparse
import collections
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--starter', type=Path, default=HERE.parents[1])
parser.add_argument('--mcp', type=Path)
parser.add_argument('--lab', type=Path)
args = parser.parse_args()
starter = args.starter.resolve()
mcp = (args.mcp or starter.parent / 'protolab-mcp').resolve()
lab = (args.lab or starter.parent / 'akshat-lab').resolve()
work = Path(tempfile.mkdtemp(prefix='protolab-upstream-check-'))
node = shutil.which('node')
patch = shutil.which('patch')
if not node or not patch:
    raise SystemExit('Existing node and patch executables are required.')
tsc = starter / 'node_modules/typescript/bin/tsc'
tsx = mcp / 'node_modules/tsx/dist/cjs/index.cjs'
if not tsc.exists() or not tsx.exists():
    raise SystemExit('Existing starter TypeScript and MCP tsx dependencies are required; nothing was installed.')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def run(command, cwd, label, expected=None):
    environment = os.environ.copy()
    environment['npm_config_cache'] = str(work / 'npm-cache')
    environment['npm_config_update_notifier'] = 'false'
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, env=environment)
    (work / (label + '.txt')).write_text(result.stdout + result.stderr)
    if expected is not None and result.returncode != expected:
        raise RuntimeError(f'{label}: exit {result.returncode}; see {work / (label + ".txt")}')
    return result


def link_dependencies(destination):
    # Keep Vite's temporary config/cache directories private while reading the
    # already installed packages. A symlink for the whole node_modules folder
    # would send .vite-temp writes back into the source checkout.
    destination.mkdir()
    for package in (starter / 'node_modules').iterdir():
        if package.name in {'.vite', '.vite-temp', '.cache'}:
            continue
        (destination / package.name).symlink_to(package, target_is_directory=package.is_dir())


def copy_starter(destination):
    destination.mkdir()
    shutil.copytree(starter / 'src', destination / 'src')
    for name in ['package.json', 'tsconfig.json', 'vite.config.ts', 'vite-plugin-ink-manifest.ts', 'index.html']:
        shutil.copy2(starter / name, destination / name)
    shutil.copytree(starter / 'public', destination / 'public')
    link_dependencies(destination / 'node_modules')


def token_inventory(root):
    files = [p for p in root.rglob('*') if p.suffix in {'.ts', '.tsx', '.css'} and not p.name.endswith('.figma.ts')]
    defined = set()
    for path in files:
        defined.update(re.findall(r'(--ink-[\w-]+)\s*:', path.read_text()))
    missing = collections.defaultdict(list)
    for path in files:
        for number, line in enumerate(path.read_text().splitlines(), 1):
            for token in re.findall(r'var\((--ink-[\w-]+)', line):
                if token not in defined:
                    missing[token].append(f'{path.relative_to(root)}:{number}')
    return {'names': len(missing), 'references': sum(map(len, missing.values())), 'missing': missing}


manifest = json.loads((HERE / 'source-manifest.json').read_text())
roots = {'protolab-mcp': mcp, 'akshat-lab': lab}
for name, entry in manifest.items():
    for item in entry['files']:
        if digest(roots[name] / item['path']) != item['beforeSha256']:
            raise SystemExit(f'Preimage changed: {name}/{item["path"]}; review/rebase the patch before validation.')

mc = work / 'protolab-mcp'
for name in ['scripts', 'src', 'protolab-source', 'data']:
    shutil.copytree(mcp / name, mc / name)
for name in ['package.json', 'tsconfig.json']:
    shutil.copy2(mcp / name, mc / name)
if (mcp / 'public/fonts').exists():
    shutil.copytree(mcp / 'public/fonts', mc / 'public/fonts')
(mc / 'node_modules').symlink_to(mcp / 'node_modules', target_is_directory=True)
lc = work / 'akshat-lab'
shutil.copytree(lab / 'system/ai-system', lc / 'system/ai-system')
for name, copy in [('protolab-mcp', mc), ('akshat-lab', lc)]:
    command = [patch, '--batch', '--forward', '-p1', '-d', str(copy), '-i', str(HERE / (name + '.patch'))]
    run(command + ['--dry-run'], work, name + '-patch-dry-run', 0)
    run(command, work, name + '-patch-application', 0)
    for item in manifest[name]['files']:
        assert digest(copy / item['path']) == item['afterSha256'], item['path']

run([node, '--require', str(tsx), 'scripts/bundle-data.ts'], mc, 'bundle', 0)
run([node, '--require', str(tsx), 'scripts/generate-template.ts'], mc, 'generate-template', 0)
template = mc / 'template/ink-starter'
link_dependencies(template / 'node_modules')
run([node, 'scripts/check-template-contracts.mjs'], mc, 'generated-api-contracts', 0)
run([node, str(tsc), '--noEmit', '--pretty', 'false'], template, 'generated-typecheck', 0)
run(['npm', 'run', 'build'], template, 'generated-build', 0)
run([node, str(HERE / 'runtime-semantics.mjs'), str(template), str(starter)], work, 'server-rendered-semantics', 0)

# Compatibility check: apply only the patch's reviewed deltas to a private
# current snapshot. Wholesale replacement is checked separately below.
compat = work / 'current-snapshot-compatibility'
copy_starter(compat)
ink = compat / 'src/design-system'
for item in manifest['protolab-mcp']['files']:
    relative = Path(item['path'])
    if not item['path'].startswith('protolab-source/src/design-system/') or relative.suffix != '.tsx':
        continue
    target = compat / relative.relative_to('protolab-source')
    original = mcp / relative
    if target.read_bytes() == original.read_bytes():
        shutil.copy2(mc / relative, target)
    elif relative.name == 'Dropdown.tsx':
        old = 'children: React.ReactElement;'
        text = target.read_text()
        assert text.count(old) == 1
        target.write_text(text.replace(old, 'children: React.ReactElement<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;'))
    elif relative.name == 'GlobalNav.tsx':
        assert '<Avatar name=' not in target.read_text()  # already repaired in the newer snapshot
    else:
        raise RuntimeError(f'Unreviewed compatibility drift: {relative}')
for target in ink.rglob('*.css'):
    text = target.read_text()
    for old, new in {
        '--ink-font-size-body-m': '--ink-font-body-m-size',
        '--ink-font-size-body-s': '--ink-font-body-s-size',
        '--ink-font-size-detail-xs': '--ink-font-detail-xs-size',
        '--ink-font-size-xxl': '--ink-font-heading-m-size',
    }.items():
        text = re.sub(re.escape(old) + r'(?=[,\)])', new, text)
    target.write_text(text)
target = ink / '1-tokens/tokens.css'
text = target.read_text()
needle = '  --ink-font-family-default: var(--ink-font-family);'
assert text.count(needle) == 1
target.write_text(text.replace(needle, needle + '\n  --ink-font-family-mono: monospace;'))
target = ink / '4-composites/Breadcrumb/Breadcrumb.module.css'
addition = (mc / 'protolab-source/src/design-system/4-composites/Breadcrumb/Breadcrumb.module.css').read_text().split('/* Preserve the link', 1)[1]
target.write_text(target.read_text() + '\n/* Preserve the link' + addition)
for relative in ['5-patterns/GlobalNav/index.ts', '5-patterns/LocalNav/index.ts']:
    target = ink / relative
    for line in (mc / 'protolab-source/src/design-system' / relative).read_text().splitlines():
        if line.startswith('export type') and line not in target.read_text():
            target.write_text(target.read_text() + '\n' + line + '\n')
for relative in ['composites/ChatInput/ChatInput.tsx', 'composites/CommandMenu/CommandMenu.tsx', 'patterns/ArtifactViewer/AgreementView.tsx', 'patterns/ArtifactViewer/SourceListView.tsx']:
    target = compat / 'src/ai-system' / relative
    text = target.read_text()
    if 'ChatInput/' in relative:
        text, count = re.subn(r'^\s*icon=\{contextSource.icon\}\n', '', text, flags=re.M)
        assert count == 2
    elif 'CommandMenu/' in relative:
        text = text.replace('children: React.ReactElement;', "children: React.ComponentProps<typeof Dropdown>['children'];")
    else:
        text = re.sub(r'<Button\b[^>]*>', lambda match: match[0].replace('variant=', 'kind='), text)
        text = re.sub(r'(<Tooltip\b[^>]*?) size="compact"', r'\1', text)
    target.write_text(text)
# This separate application-owned correction is not part of either source patch.
target = compat / 'src/App.tsx'
text = target.read_text().replace('Record<TabId, object | undefined>', "Record<TabId, React.ComponentProps<typeof DocuSignShell>['localNav']>")
target.write_text(text)
run([node, str(tsc), '--noEmit', '--pretty', 'false'], compat, 'compatibility-typecheck', 0)
run(['npm', 'run', 'build'], compat, 'compatibility-build', 0)

refresh = work / 'wholesale-refresh'
shutil.copytree(compat, refresh, ignore=shutil.ignore_patterns('node_modules', 'dist'))
link_dependencies(refresh / 'node_modules')
shutil.rmtree(refresh / 'src/design-system')
shutil.copytree(template / 'src/design-system', refresh / 'src/design-system')
result = run([node, str(tsc), '--noEmit', '--pretty', 'false'], refresh, 'wholesale-refresh-typecheck')
refresh_diagnostics = len(re.findall(r'error TS\d+:', result.stdout + result.stderr))

full = work / 'full-canonical-ai'
shutil.copytree(compat, full, ignore=shutil.ignore_patterns('node_modules', 'dist'))
link_dependencies(full / 'node_modules')
shutil.rmtree(full / 'src/ai-system')
shutil.copytree(lc / 'system/ai-system', full / 'src/ai-system')
config = json.loads((full / 'tsconfig.json').read_text())
config['include'] = ['src/ai-system']
(full / 'tsconfig.json').write_text(json.dumps(config, indent=2))
result = run([node, str(tsc), '--noEmit', '--pretty', 'false'], full, 'full-canonical-ai-typecheck')
canonical_diagnostics = len(re.findall(r'error TS\d+:', result.stdout + result.stderr))
for name, entry in manifest.items():
    for item in entry['files']:
        assert digest(roots[name] / item['path']) == item['beforeSha256'], ('source checkout changed', item['path'])
report = {
    'workspace': str(work),
    'generatedTemplate': 'typecheck, API positive/negative contracts, build, and 9 server-rendered assertions pass',
    'currentSnapshotCompatibility': 'typecheck and build pass with separate app sidebarMap type correction',
    'wholesaleRefreshDiagnostics': refresh_diagnostics,
    'fullCanonicalAiDiagnostics': canonical_diagnostics,
    'currentRemainingTokens': token_inventory(compat / 'src'),
    'upstreamRemainingTokens': token_inventory(mc / 'protolab-source/src'),
    'sourceCheckoutsUnchanged': True,
}
(work / 'validation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: value for key, value in report.items() if not key.endswith('Tokens')}, indent=2))
