#!/usr/bin/env bash
# Build a prototype offline, using the npm packages bundled in the plugin.
#
#   bash build.sh <project-dir>
#
# Copies the project to /tmp/protolab-build/<name>, links the bundled runtime
# (no network needed), type-checks, checks icons and tokens, and runs vite build.
# The last line is either  DIST=<path>  or  FAILED=<reason>.
set -uo pipefail

if [ "$#" -ne 1 ] || [ ! -d "$1" ]; then
  echo "FAILED=project (usage: bash build.sh <existing-project-dir>)"
  exit 4
fi

PROJ="$(cd -- "$1" && pwd -P)" || { echo "FAILED=project (could not read project directory)"; exit 4; }
PLUGIN="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_ROOT="/tmp/protolab-build"

# Validate before creating anything: an empty or traversing name must never
# turn rsync --delete into a copy over the shared build root or another folder.
if ! NAME=$(python3 - "$PROJ" "$BUILD_ROOT" <<'PY'
import json
import os
import re
import sys

project, build_root = sys.argv[1:]

def fail(message):
    print("build.sh: " + message, file=sys.stderr)
    sys.exit(1)

try:
    with open(os.path.join(project, ".protolab.json"), encoding="utf-8") as source:
        metadata = json.load(source)
except (OSError, ValueError) as error:
    fail("could not read .protolab.json: " + str(error))

name = metadata.get("name") if isinstance(metadata, dict) else None
if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}", name):
    fail(".protolab.json name must be 1-128 letters, digits, hyphens or underscores, starting with a letter or digit")

build = os.path.join(build_root, name)
root_path = os.path.realpath(build_root)
build_path = os.path.realpath(build)
if os.path.islink(build_root) or os.path.islink(build):
    fail("the build root and project build directory must not be symbolic links")
if os.path.dirname(build_path) != root_path or build_path == root_path:
    fail("the project build directory must be a direct child of " + build_root)
if os.path.exists(build) and not os.path.isdir(build):
    fail("the project build path exists and is not a directory")
if os.path.commonpath([project, build_path]) in (project, build_path):
    fail("the project and build directories must not overlap")

print(name)
PY
); then
  echo "FAILED=project (invalid metadata or unsafe build directory)"
  exit 4
fi

BUILD="$BUILD_ROOT/$NAME"

mkdir -p "$BUILD" || { echo "FAILED=copy (could not create build directory)"; exit 5; }
rsync -a --delete --exclude node_modules --exclude dist "$PROJ/" "$BUILD/" \
  || { echo "FAILED=copy (could not copy project)"; exit 5; }

# ── Dependencies: bundled runtime first, npm only as a fallback ──
TGZ="$PLUGIN/runtime/node_modules.tar.gz"
if [ -f "$TGZ" ]; then
  # Unpack once per plugin version into /tmp (the plugin folder is read-only).
  VER=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['version'])" "$PLUGIN/.claude-plugin/plugin.json")
  RTX="/tmp/protolab-runtime-$VER"
  if [ ! -d "$RTX/node_modules" ]; then
    rm -rf "$RTX.partial" && mkdir -p "$RTX.partial" && tar xzf "$TGZ" -C "$RTX.partial" --no-same-owner 2>/tmp/protolab-tar.log && mv "$RTX.partial" "$RTX" \
      || { echo "FAILED=dependencies (could not unpack the bundled runtime)"; exit 3; }
  fi
  RT="$RTX/node_modules"
  if [ -L "$BUILD/node_modules" ] || [ ! -e "$BUILD/node_modules" ]; then ln -sfn "$RT" "$BUILD/node_modules"; fi
  case "$(uname -m)" in aarch64|arm64) A=arm64 ;; *) A=x64 ;; esac
  chmod +x "$RT/@esbuild/linux-$A/bin/esbuild" 2>/dev/null || true
else
  # Lean plugin: install from npm once per session (about 2s), shared by every prototype
  # with the same lockfile, then link it in.
  LOCKH=$(sha1sum "$BUILD/package-lock.json" | cut -c1-12)
  RTX="/tmp/protolab-npm-$LOCKH"
  if [ ! -d "$RTX/node_modules" ]; then
    rm -rf "$RTX.partial" && mkdir -p "$RTX.partial" && cp "$BUILD/package.json" "$BUILD/package-lock.json" "$RTX.partial/"
    (cd "$RTX.partial" && npm ci --no-audit --no-fund --loglevel=error >/tmp/protolab-npm.log 2>&1) && mv "$RTX.partial" "$RTX" || {
      echo "FAILED=dependencies (npm couldn't reach registry.npmjs.org; see /tmp/protolab-npm.log)"; exit 3; }
  fi
  RT="$RTX/node_modules"
  if [ -L "$BUILD/node_modules" ] || [ ! -e "$BUILD/node_modules" ]; then ln -sfn "$RT" "$BUILD/node_modules"; fi
fi

cd "$BUILD"
FAIL=0

# ── Type check: only errors not already in the starter's baseline count ──
node node_modules/typescript/bin/tsc --noEmit -p . 2>&1 | grep "error TS" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort > /tmp/protolab-ts-now.txt
NEW_TS=$(sort .protolab-ts-baseline 2>/dev/null | comm -13 - /tmp/protolab-ts-now.txt)
if [ -n "$NEW_TS" ]; then echo "== New type errors (fix these):"; echo "$NEW_TS"; FAIL=1; fi

# ── Icons and tokens: wrong ones render blank and the type check can't see them ──
INK=$(python3 -I "$PLUGIN/scripts/check-ink.py" .protolab-ink-baseline)
if [ -n "$INK" ]; then echo "== Unknown icons/tokens (fix these):"; echo "$INK"; FAIL=1; fi

[ "$FAIL" = 1 ] && { echo "FAILED=checks"; exit 1; }

# ── Build ──
if ! node node_modules/vite/bin/vite.js build --base ./ --logLevel error > /tmp/protolab-vite.log 2>&1; then
  tail -30 /tmp/protolab-vite.log; echo "FAILED=build"; exit 2
fi
echo "DIST=$BUILD/dist"
