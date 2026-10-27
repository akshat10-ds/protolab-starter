---
name: new-prototype
description: Start a new Docusign prototype from the ProtoLab starter. Use when the user says "new prototype", "start a prototype", "prototype a ...", "mock up a Docusign screen/flow/feature", or describes any Docusign screen, flow or feature they want to see built.
---

# /new-prototype — Start a prototype

Turn the user's idea into a working prototype that looks like it shipped in
Docusign, then show it as a live preview. The user is usually a PM, not an
engineer: never ask them to run commands, and keep updates in plain language.

## 1. Gather the idea (one question, max)

You need a short **name** (kebab-case, e.g. `bulk-send-v2`) and **what to
build**. If the request says what to build, derive the name and don't ask.

## 2. Find the bundled template

```bash
TPL=""
for d in "${CLAUDE_PLUGIN_ROOT}/template" /sessions/*/mnt/.remote-plugins/*/template; do
  [ -f "$d/.protolab-template" ] && TPL="$d" && break
done
echo "$TPL"; cat "$TPL/.protolab-template"
```

If nothing is found, tell the user the Prototyping plugin looks incomplete and to
reinstall it. Stop.

## 3. Create the project in the user's folder

It must live in the folder the user selected so it persists. If no folder is
connected, ask them to pick one (e.g. `Prototypes`) with `request_cowork_directory`.

```bash
DEST="<connected-folder-in-shell>/<name>"   # add -2, -3… if it exists
mkdir -p "$DEST" && cp -R "$TPL/." "$DEST/" && rm -f "$DEST/.protolab-template"
```

Write `$DEST/.protolab.json`:

```json
{ "name": "<name>", "createdFrom": "<the full line from .protolab-template>", "previewUrl": null,
  "brief": "<one line: what the PM asked for>", "deviations": [], "defaultViewChanged": null }
```

(`defaultViewChanged` gets filled in during step 6. The format is in GOTCHAS.md, under "Structure".)

Don't run `npm install` anywhere. `/preview` builds offline in the sandbox, using the
packages bundled in the plugin.

## 4. Read the rules. This is not optional

Read these in full before writing any code:
1. `$DEST/AGENTS.md`: the build rules (only `@/design-system`, no hand-rolled UI, tokens only).
2. `$DEST/docs/PATTERNS.md`: **the patterns-first order**, the map of `App.tsx`,
   the screen catalog, layout recipes and the type hierarchy.
3. `$DEST/docs/GOTCHAS.md`: component traps and build traps.
4. If there's a Figma link or frame: `$DEST/docs/figma-to-prototype.md`.

## 5. Choose the pattern, then say it

Use PATTERNS.md §2 to pick, in this order:
1. **An existing screen**, used or extended as is.
2. **An existing layout**: list, detail overlay, overview, empty state, Iris, settings or creation flow.
3. **Only if neither fits:** a new layout built from existing parts.

Before building, tell the user in one line where it will live, e.g. *"I'll add
this as a Bulk Send view in the Agreements left nav, using the same list layout as
Requests."* Don't wait for approval unless the request is truly ambiguous.

If the request goes against a Docusign convention, follow the rule in
PATTERNS.md: build the on-pattern version, say why in one line, and record any
deviation the PM insists on in `.protolab.json`.

## 6. Build inside `App.tsx`

- Follow the recipe for the chosen layout in PATTERNS.md §3 step by step,
  including every branch point a sibling view has.
- Use the type hierarchy (§4) and spacing (§5). Don't use raw font sizes, hex colors or your own padding.
- Reuse existing data arrays when the feature is about existing objects. Otherwise
  add realistic data at module level (§6).
- Copy structure from sibling screens, but check each prop against the component
  (GOTCHAS: "Copying from App.tsx").
- Make the preview open on the new screen, and record what you changed in `defaultViewChanged`.

## 7. Preview

Run the `preview` skill. It type-checks, builds, screenshots the result for
you to review, and publishes.

## 8. Hand back

Two sentences at most: what you built and where it lives in the app. Then say
they can keep asking for changes and the same preview link will update. Mention
they can share it from the page's Share menu.
