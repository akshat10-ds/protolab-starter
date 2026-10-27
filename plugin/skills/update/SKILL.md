---
name: update
description: Update a ProtoLab prototype's design-system components to the version bundled in the installed plugin. Use when the user says "update components", "update the design system", or a component they expect is missing.
---

# /update — Refresh the design system

1. Find the project (`$PROJ`, the folder with `.protolab.json`) and read `$PROJ/version.json`.
2. Locate the bundled template exactly as in the `new-prototype` skill (step 2)
   and read `$TPL/version.json`.
3. If the `bundleHash` values match, say the components are up to date and stop.
4. Otherwise tell the user both versions and ask whether to update.
5. If yes:
   - Back up: `cp -R "$PROJ/src/design-system" "$PROJ/.design-system-backup"`
   - Replace: `rm -rf "$PROJ/src/design-system" && cp -R "$TPL/src/design-system" "$PROJ/src/"`
   - Copy `$TPL/version.json` and `$TPL/AGENTS.md` over the project's copies.
   - Run the `preview` skill. If the build fails and you can't fix it in the
     user's own pages, restore the backup and say so.
   - On success, delete `.design-system-backup`.

Never touch files outside `src/design-system/`, `version.json` and `AGENTS.md`.
