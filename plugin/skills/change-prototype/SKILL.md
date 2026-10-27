---
name: change-prototype
description: Make any change to an existing ProtoLab prototype while keeping it on Docusign patterns. Use for every follow-up request on a prototype, such as "add a filter", "make the table sortable", "change the copy", "add an empty state", "add a modal", "make it look like X", "continue my prototype" or "open my bulk-send prototype", and whenever the working folder contains a .protolab.json.
---

# Change a prototype (always on-pattern)

Every change, however small, follows the same rules as a new prototype. The PM
asks for an outcome, and you deliver it the way Docusign would ship it.

## 1. Find the project and reload the rules

- `$PROJ` is the folder with `.protolab.json`. If there are several, pick the one
  the user named or was just working on. Ask only if it's unclear.
- **Re-read `$PROJ/docs/PATTERNS.md` and `$PROJ/docs/GOTCHAS.md`** if they aren't
  already in this conversation. Rules from an earlier session don't carry over.
- Read `.protolab.json` for the `brief`, `previewUrl` and existing `deviations`.

## 2. Classify the request

| Request | What to do |
|---|---|
| Copy, data or labels | Edit in place. Keep the data realistic |
| Add a control to a screen (filter, action, column, banner) | Add it where the sibling screens put the same control: `PageHeader` actions, FilterBar `filters`/`quickActions`, a `DataTable` column, or the `banner` slot |
| A new state (empty, loading, error, success) | Empty: `DetailEmptyState` or the PowerForms pattern. Loading: `Skeleton`/`Spinner`. Error or success: a `Banner`/`Alert` with the right `kind` |
| A new screen or flow | Follow `new-prototype` steps 5–6 (pattern order, then the recipe) |
| A visual tweak ("bigger", "bolder", "more purple", "add a card around it") | Map it to the nearest on-pattern option: a different component prop, the next level in the type hierarchy, `Badge`/`Banner` kinds, or `Card`. If there isn't one, see step 3 |
| "Make it look like <screenshot/URL>" | Use the `reference-to-prototype` skill |

## 3. Requests that go against the patterns

Build the on-pattern version and say in one line what Docusign does instead, for example:

- "Tables in Docusign sit flush on the page, so I kept it out of a card."
- "Page titles are 32px light everywhere, so I kept it consistent."

If the PM still wants their version, build it, and add an entry to
`deviations` in `.protolab.json`: `{ "what": "...", "why": "PM request" }`.
Even then, use tokens and components, never raw hex values or hand-rolled elements.

## 4. Preview

Run the `preview` skill after every change (it type-checks, screenshots and
republishes to the same link). Several small asks in one message → one preview.
