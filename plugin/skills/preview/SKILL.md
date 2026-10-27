---
name: preview
description: Build the current ProtoLab prototype, check it, and publish or refresh its live, shareable preview. Use after any change to a prototype, or when the user says "preview", "show me", "refresh the preview", "share this", or "deploy".
---

# /preview — Build, check and publish a live preview

In Cowork there is no localhost the user can open. Instead, build the
prototype in the sandbox, check it, and publish the build with the Artifact tool.
Each prototype keeps **one** preview URL; republish to it after every change.
Don't show the user build logs or commands. Tell them only the outcome.

`build.sh` installs the npm packages itself, once per session (about 2 seconds,
from `registry.npmjs.org`, or from `runtime/` if this is an offline build of the
plugin). Don't run `npm install` or `npm ci` yourself.

## 1. Find the project and the plugin

`$PROJ` is the folder in the user's connected folder that contains
`.protolab.json` (the one you're working on; ask only if there are several).

```bash
TPL=""
for d in "${CLAUDE_PLUGIN_ROOT}/template" /sessions/*/mnt/.remote-plugins/*/template; do
  [ -f "$d/.protolab-template" ] && TPL="$d" && break
done
PLUGIN="$(dirname "$TPL")"
NAME=$(python3 -c "import json;print(json.load(open('$PROJ/.protolab.json'))['name'])")
```

## 2. Check and build (one command)

```bash
bash "$PLUGIN/scripts/build.sh" "$PROJ"
```

This copies the project to `/tmp/protolab-build/$NAME`, links the bundled
packages, and runs three checks before building:
- **Type check.** Only errors that aren't in the starter's `.protolab-ts-baseline` count.
  Vite doesn't type-check, so a wrong prop would otherwise build fine and render wrong.
- **Icon names and tokens.** A wrong icon renders blank and a wrong token silently
  drops its value, and the type check can't see either.
- **`vite build --base ./`.** The `--base ./` is required because the preview is served from a sub-path.

The last line it prints is either `DIST=<path>` or `FAILED=<reason>`:
- `FAILED=checks` or `FAILED=build`: fix what it lists **in `$PROJ`** (never in
  `/tmp/protolab-build`), then run it again. Read the component's `.tsx` for the
  right prop. `docs/GOTCHAS.md` lists the usual ones. Don't tell the user about
  build errors; just fix them.
- `FAILED=dependencies`: npm couldn't reach its registry from the sandbox. Tell the
  user in plain words that their org's Claude network settings are blocking npm. An
  org Owner can allow `registry.npmjs.org` (Admin settings › Capabilities), or the
  plugin maintainer can ship the offline build. Don't retry in a loop. Stop.

## 3. Look at it before publishing

```bash
DIST=/tmp/protolab-build/$NAME/dist
OUTDIR=<outputs-dir-in-shell>
python3 -I "$PLUGIN/scripts/selfcheck.py" "$DIST" "$OUTDIR/selfcheck-$NAME-$(date +%s).html"
```

Present that file with `present_files`, then take a screenshot of it with
`screenshot_file_preview`. Use a new filename each time, because the panel only
opens on a new file. If no screenshot comes back after one retry, skip this step
and carry on. Don't ask the user to click anything.

Check the screenshot against `docs/PATTERNS.md`:
- The new screen is the one showing. On tab pages the global nav and left nav are visible.
  On a detail overlay, the back arrow, title, status badge and tab bar are visible (the overlay covers the shell by design).
- The page title is 32px light, like the other pages. Spacing matches the sibling screens.
- Nothing is hand-styled: no odd colors, gradients, borders or font sizes.
- There are no blank icons, `undefined` text or empty tables.

Fix anything that's off, then go back to step 2. Large images, like the avatar
photo, are left out of the self-check on purpose, so a missing avatar is expected.

## 4. Stage and publish

```bash
OUT=$OUTDIR/protolab-preview-$NAME
rm -rf "$OUT" && mkdir -p "$OUT" && cp -R "$DIST/." "$OUT/"
sed -i "s|<title>.*</title>|<title>$NAME</title>|" "$OUT/index.html"
cd "$OUT" && find . -type f ! -name index.html | sed 's|^\./||'
```

Call `Artifact` (publish) with:
- `file_path`: `$OUT/index.html` (as a file-tool path), and `root`: `$OUT`.
- `files`: the paths listed above. Add `null` for any `assets/…` path from the
  last publish that's gone, since hashed names change every build.
- `description`: one sentence on what the prototype shows.
- `icon`: `layout`, on the first publish only.
- `url`: the `previewUrl` from `.protolab.json`, if it's set and this conversation
  hasn't published it yet. Read it first (`action: "read"`). Within the same
  conversation, reuse the same `file_path` instead.

Save the returned URL as `previewUrl` in `$PROJ/.protolab.json`.

## 5. Tell the user

One sentence on what changed. The preview card appears automatically, so
don't paste the URL. If you deviated from what they asked to stay on-pattern,
say so in one line. The page is private until they share it from its Share menu.
