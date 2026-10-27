#!/usr/bin/env bash
# Exercise build.sh's preflight without copying files or installing dependencies.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_SCRIPT="$REPO_ROOT/plugin/scripts/build.sh"
FIXTURE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/protolab-build-safety.XXXXXX")"
trap 'rm -rf "$FIXTURE_ROOT"' EXIT
mkdir -p "$FIXTURE_ROOT/bin" "$FIXTURE_ROOT/project with spaces"
PROJECT="$FIXTURE_ROOT/project with spaces"
TRACE="$FIXTURE_ROOT/trace"
OUTPUT="$FIXTURE_ROOT/output"

# Any copy/dependency subprocess is recorded. A valid preflight may reach mkdir
# and rsync, but rsync deliberately fails so this test never reaches npm or Vite.
for command in mkdir rsync sha1sum npm node tar; do
  cat > "$FIXTURE_ROOT/bin/$command" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "${0##*/}" >> "${BUILD_SAFETY_TRACE:?}"
case "${0##*/}" in
  mkdir) exit 0 ;;
  rsync) exit 23 ;;
  *) exit 91 ;;
esac
SH
  chmod +x "$FIXTURE_ROOT/bin/$command"
done

fail() {
  echo "FAIL: $1" >&2
  cat "$OUTPUT" >&2
  exit 1
}

assert_rejected() {
  local description="$1"
  shift
  : > "$TRACE"
  if PATH="$FIXTURE_ROOT/bin:$PATH" BUILD_SAFETY_TRACE="$TRACE" \
    bash "$BUILD_SCRIPT" "$@" > "$OUTPUT" 2>&1; then
    fail "$description was accepted"
  fi
  [ ! -s "$TRACE" ] || fail "$description reached a copy or dependency subprocess"
  case "$(< "$OUTPUT")" in
    *FAILED=project*) ;;
    *) fail "$description did not report FAILED=project" ;;
  esac
}

assert_rejected "missing argument"
assert_rejected "missing project directory" "$FIXTURE_ROOT/missing"
assert_rejected "missing metadata" "$PROJECT"

for metadata in \
  '{' \
  '[]' \
  '{}' \
  '{"name": null}' \
  '{"name": 42}' \
  '{"name": ""}' \
  '{"name": "."}' \
  '{"name": ".."}' \
  '{"name": "../escape"}' \
  '{"name": "safe/../../escape"}' \
  '{"name": "/tmp/escape"}' \
  '{"name": "unsafe name"}' \
  '{"name": "unsafe\nname"}'; do
  printf '%s\n' "$metadata" > "$PROJECT/.protolab.json"
  assert_rejected "invalid metadata $metadata" "$PROJECT"
done

printf '{"name": "build-safety-%s"}\n' "$$" > "$PROJECT/.protolab.json"
: > "$TRACE"
if PATH="$FIXTURE_ROOT/bin:$PATH" BUILD_SAFETY_TRACE="$TRACE" \
  bash "$BUILD_SCRIPT" "$PROJECT" > "$OUTPUT" 2>&1; then
  fail "failed rsync was accepted"
fi
[ "$(< "$TRACE")" = $'mkdir\nrsync' ] || fail "valid metadata did not stop immediately after failed rsync"
case "$(< "$OUTPUT")" in
  *FAILED=copy*) ;;
  *) fail "failed rsync did not report FAILED=copy" ;;
esac

echo "PASS: unsafe metadata stops before copying; copy failures stop before dependencies"
