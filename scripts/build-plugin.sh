#!/usr/bin/env bash
# Build the ProtoLab Cowork plugin from this repo.
#   bash scripts/build-plugin.sh             # lean plugin (default; npm packages install on first build)
#   bash scripts/build-plugin.sh --offline   # also bundle npm packages (~40 MB archive; see note at 3b)
# Output: plugin-dist/prototyping/ (unpacked) and plugin-dist/protolab.zip (upload this)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/plugin-dist"
PLG="$OUT/prototyping"
TPL="$PLG/template"

rm -rf "$OUT" && mkdir -p "$PLG"
cp -R "$ROOT/plugin/." "$PLG/"

# 1. Template = the starter, minus anything a PM's prototype shouldn't carry
mkdir -p "$TPL"
rsync -a \
  --exclude node_modules --exclude dist --exclude .git \
  --exclude sync-agent --exclude evals --exclude plugin --exclude plugin-dist --exclude scripts \
  --exclude .playwright-mcp --exclude .figma --exclude .vscode --exclude .github/workflows \
  --exclude .claude --exclude .mcp.json --exclude .DS_Store \
  --exclude '.env' --exclude '.env.*' --exclude '*.local' \
  --exclude 'specs/baselines' \
  "$ROOT/" "$TPL/"

# 2. Cowork-flavoured instructions for the template
python3 - "$TPL" <<'PY'
import re, sys, pathlib
tpl = pathlib.Path(sys.argv[1])
a = (tpl / "AGENTS.md").read_text()
a = re.sub(r"## Optional: ProtoLab MCP.*?(?=\n## )", "", a, flags=re.S)
a = re.sub(r"## Skills \(Claude Code\).*", (
    "## Skills (Prototyping plugin)\n\n"
    "| Skill | What it does |\n|---|---|\n"
    "| `/new-prototype` | Start a new prototype from this template |\n"
    "| `change-prototype` | Any follow-up change; keeps it on Docusign patterns |\n"
    "| `/preview` | Type-check, self-check screenshot, publish / refresh the live preview |\n"
    "| `/handoff` | Generate `HANDOFF.md` with a component inventory for engineers |\n"
    "| `/update` | Refresh `src/design-system/` from the installed plugin |\n"
    "| `/reference-to-prototype` | Rebuild a live Docusign page as an Ink prototype |\n"
), a, flags=re.S)
a = a.replace("npm run dev      # http://localhost:5173",
              "npm run dev      # local only. In Cowork, use /preview instead")
(tpl / "AGENTS.md").write_text(a)
(tpl / "CLAUDE.md").write_text(
    "# ProtoLab prototype\n\n"
    "**Before any change, read [AGENTS.md](AGENTS.md), [docs/PATTERNS.md](docs/PATTERNS.md) and "
    "[docs/GOTCHAS.md](docs/GOTCHAS.md).** Always use Docusign patterns: extend an existing screen first, "
    "then use an existing layout, and only then build something new from the same parts (shell, page container, type hierarchy, spacing).\n\n"
    "After every change, run the `preview` skill to type-check, self-check and refresh the live preview.\n"
)
PY

# The repo's .github/skills/*/SKILL.md are Copilot rules, not plugin skills. Left inside the
# template they look like extra (invalid) skills to Claude's plugin loader, so ship them as docs.
if [ -d "$TPL/.github/skills" ]; then
  mkdir -p "$TPL/docs/rules"
  for d in "$TPL"/.github/skills/*/; do
    n="$(basename "$d")"; cp "$d/SKILL.md" "$TPL/docs/rules/$n.md"
  done
  rm -rf "$TPL/.github"
  sed -i.bak -E 's#`\.github/skills/([a-z-]+)/`#`docs/rules/\1.md`#g' "$TPL/AGENTS.md" && rm -f "$TPL/AGENTS.md.bak"
fi
test -z "$(find "$PLG" -name SKILL.md -not -path "$PLG/skills/*")" || { echo "Stray SKILL.md outside skills/"; exit 1; }

# Vite client types, so `import.meta.env` type-checks in PM pages
[ -f "$TPL/src/vite-env.d.ts" ] || echo '/// <reference types="vite/client" />' > "$TPL/src/vite-env.d.ts"

# Baseline of type errors already in the starter, so /preview flags only new ones
TSB="$(mktemp -d)"; rsync -a "$TPL/" "$TSB/"; ln -s "$ROOT/node_modules" "$TSB/node_modules"
( cd "$TSB" && npx tsc --noEmit -p . 2>&1 | grep "error TS" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort > "$TPL/.protolab-ts-baseline" ) || true
echo "Type-error baseline: $(wc -l < "$TPL/.protolab-ts-baseline") known errors"
# Same for icon names / tokens that don't exist (they render blank, not as errors)
( cd "$TPL" && python3 -I "$ROOT/plugin/scripts/check-ink.py" > .protolab-ink-baseline )
echo "Ink-name baseline: $(wc -l < "$TPL/.protolab-ink-baseline") known issues"

# 3. Marker the skills use to find the template, carrying the DS version
python3 -c "import json,sys;v=json.load(open('$ROOT/version.json'));print(f\"protolab-template {v['version']} {v['bundleHash']}\")" > "$TPL/.protolab-template"

# 3b. OPTIONAL bundled npm runtime (--offline), for orgs whose Cowork sandbox can't reach npm.
# Off by default: a 40 MB binary archive makes Customize show "Couldn't load files" and
# breaks the plugin-directory limits (files <= 256 KiB, no binaries). Cowork network access
# is an org-level setting, and npm worked in Docusign's org, so the lean build is the right default.
if [ "${1:-}" = "--offline" ]; then
  # Cowork sandboxes are Linux; Apple-silicon Macs get arm64 and Intel/Windows get x64,
  # so we ship the native build binaries (esbuild, rollup, swc) for both.
  # Needs npm >= 10 (for --os/--cpu); works from macOS too.
  RT="$PLG/runtime"; mkdir -p "$RT"
  for CPU in arm64 x64; do
    D="$(mktemp -d)"; cp "$ROOT/package.json" "$ROOT/package-lock.json" "$D/"
    ( cd "$D" && npm ci --os=linux --cpu="$CPU" --libc=glibc --ignore-scripts --no-audit --no-fund --loglevel=error )
    if [ ! -d "$RT/node_modules" ]; then
      mv "$D/node_modules" "$RT/node_modules"
    else
      for P in "@esbuild/linux-$CPU" "@rollup/rollup-linux-$CPU-gnu" "@swc/core-linux-$CPU-gnu"; do
        mkdir -p "$RT/node_modules/$(dirname "$P")" && cp -R "$D/node_modules/$P" "$RT/node_modules/$P"
      done
    fi
  done
  # Not needed for builds: lucide-react (unused; Ink has its own Icon) and .bin symlinks
  # (build.sh calls node directly, and symlinks don't survive every unzip).
  rm -rf "$RT/node_modules/lucide-react" "$RT/node_modules/.bin"
  for CPU in arm64 x64; do
    for P in "@esbuild/linux-$CPU" "@rollup/rollup-linux-$CPU-gnu" "@swc/core-linux-$CPU-gnu"; do
      test -d "$RT/node_modules/$P" || { echo "Missing runtime package $P"; exit 1; }
    done
  done
  # Ship it as ONE archive: plugin uploads reject paths containing "@" (every scoped npm
  # package, e.g. @swc/core), and an archive also keeps exec bits and cuts ~900 files.
  tar czf "$RT/node_modules.tar.gz" -C "$RT" node_modules && rm -rf "$RT/node_modules"
  echo "Bundled runtime: $(du -sh "$RT/node_modules.tar.gz" | cut -f1) archive (linux arm64 + x64)"
fi

# 4. Sanity checks
# (runtime/ is third-party npm code; "sk-" must start a token so CSS names like "mask-border" don't match)
grep -rIlE --exclude-dir=runtime "(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{16,}|x-webhook-secret|ANTHROPIC_AUTH_TOKEN" "$PLG" \
  && { echo "Secret-looking string found, aborting"; exit 1; } || true
test -f "$TPL/src/design-system/index.ts"
test -f "$PLG/.claude-plugin/plugin.json"

# 5. Zip
TMPZIP="$(mktemp -d)/protolab.zip"   # zip in temp: some mounted folders reject zip's in-place writes
( cd "$PLG" && zip -qr "$TMPZIP" . -x '*.DS_Store' )
# The uploader rejects unusual characters in paths, so only allow [A-Za-z0-9._/-]
BAD="$(unzip -Z1 "$TMPZIP" | grep -vE '^[A-Za-z0-9._/-]+$' || true)"
[ -z "$BAD" ] || { echo "Paths the uploader would reject:"; echo "$BAD" | head; exit 1; }
cp "$TMPZIP" "$OUT/protolab.zip"
echo "Built $(du -sh "$OUT/protolab.zip" | cut -f1), $(unzip -Z1 "$TMPZIP" | wc -l | tr -d ' ') files → plugin-dist/protolab.zip"
