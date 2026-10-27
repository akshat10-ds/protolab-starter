# Prototyping

Describe a Docusign screen or flow in Cowork, and get back a working prototype
with a live link you can share.

## For PMs

1. In Cowork, select a folder for your prototypes (e.g. `Documents/Prototypes`).
2. Say what you want, e.g.:
   - "Prototype a Bulk Send page that shows each batch and its delivery status."
   - "When I click a party in Parties, show a party profile with their agreements and contacts."
   - "Add an AI summary to the Completed page."
3. Claude builds it inside the real Docusign app, using the same navigation,
   layouts and components, and gives you a preview link.
4. Keep asking for changes ("add a filter for sender", "add an empty state"),
   and the same link updates. Share it from the page's **Share** menu.

Claude always uses existing Docusign patterns first. If you ask for something
that breaks one (a table in a card, a custom-coloured button), it builds the
Docusign version and tells you why. If you still want yours, it builds that and
notes the change for engineering.

| Ask for | What happens |
|---|---|
| "new prototype …" / describe a screen | Creates a prototype and a preview link |
| any follow-up change | Updates the prototype, keeping it on-pattern |
| "refresh the preview" | Rebuilds and republishes |
| "hand this off to engineering" | Writes `HANDOFF.md`: components used, patterns, deviations |
| "rebuild this page" + a screenshot or URL | Recreates a live Docusign page as a prototype |
| "update the design system" | Pulls the latest components from the plugin |

## For maintainers

The plugin is built from the `protolab-starter` repo:

```bash
bash scripts/build-plugin.sh   # → plugin-dist/protolab.zip
```

The build does the following:
- **Bundles the starter** as `template/`, excluding `sync-agent`, `node_modules`, settings and secrets.
- **Keeps the plugin lean** (about 400 small text, image and font files). npm packages install in the sandbox on first build, about 2 seconds.
  If your org's Cowork network blocks npm, run `bash scripts/build-plugin.sh --offline` to bundle them instead. This adds about 40 MB, and Customize may fail to show the files.
- **Records the starter's existing problems** (type errors and unknown icons/tokens) as baselines, so PMs are only told about new ones.
- **Writes the Cowork-specific** `CLAUDE.md` and `AGENTS.md` skills table.

The rules Claude follows live in the repo, not here:
- `docs/PATTERNS.md`: patterns first, the `App.tsx` map, layout recipes, type hierarchy.
- `docs/GOTCHAS.md`: component and build traps.

Edit those, rebuild, bump `version` in `plugin/.claude-plugin/plugin.json`, and re-upload.
