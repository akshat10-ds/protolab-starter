---
name: update
description: Check for and apply design system component updates
user_invocable: true
---

# /update — Update Ink DS components

Check if the design system components in this project are up to date with the latest ProtoLab MCP server, and update them if needed.

## Steps

1. Read `version.json` from the project root to get the current `bundleHash`
2. Call ProtoLab MCP tool `check_template_version` with `localBundleHash` from version.json
3. If up to date: tell the user "Your components are up to date"
4. If outdated:
   a. Tell the user which version they have and what's available
   b. Ask if they want to update
   c. If yes: download the latest starter kit zip from the MCP server's download URL
   d. Replace `src/design-system/` with the updated version
   e. Update `version.json` with the new bundleHash and timestamp
   f. Run `npm run dev` to verify nothing broke
5. Report what was updated

## Important

- Never modify files outside `src/design-system/` — user's custom pages/components are untouched
- Always back up the current design-system directory before replacing
- If the dev server fails after update, offer to revert

## Example output

```
Your template is 12 days old (bundleHash: abc123).
Latest version available (bundleHash: def456).

Updated src/design-system/ — 63 components refreshed.
version.json updated.
Dev server running — everything looks good.
```
