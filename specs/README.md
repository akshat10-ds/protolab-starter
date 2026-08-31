# specs/ — production sync baselines

This folder is the memory of the **protolab sync agent** (see `sync-agent/`). It
holds one baseline per prototype page: the last *approved* capture of the
matching Docusign demo page. On each monthly run the agent re-captures every
page listed in [pages.json](pages.json), diffs against the baseline here, and
only pages whose *structure* changed proceed to spec extraction and code
generation. Unchanged pages cost nothing.

## Layout

```
specs/
  pages.json                  ← the page manifest (see below)
  baselines/
    <page-id>.spec.json       ← structural spec of the demo page (schema below)
    <page-id>.skeleton.json   ← structural fingerprint of THIS PAGE'S CONTENT:
                                ordered role:name lines from the aria snapshot
                                (headings, buttons, filters, column headers).
                                Data rows are excluded and digits masked
                                ("# items"), so live-data churn never triggers
                                a sync. This is the change gate.
    _shell.skeleton.json      ← the global chrome (top bar, left sidebar,
                                footer), shared by every page and tracked ONCE.
                                Measured at 38 nodes vs ~14-23 of page content,
                                so folding it into each page would make a single
                                nav change trip all 16 pages at once. A shell
                                change gets one dedicated PR, never 16.
    <page-id>.png             ← reference screenshot. NOT a gate — used for
                                reviewer before/afters, and to flag visual
                                drift on structurally-identical pages (a
                                design-system concern, handled via /update,
                                never a page PR)
```

`baselines/` is empty on purpose. It gets populated by the **first supervised
run** of the sync agent — the agent captures every page, a human approves the
captures, and they're committed as the initial baselines. Do not hand-author
baselines.

## pages.json

One entry per prototype view, keyed on the view-ID union types in
`src/App.tsx` (`TabId`, `SidebarView`, `TemplatesSidebarView`,
`InsightsSidebarView`) — **not** on sidebar item IDs, several of which alias to
the same view (e.g. six dashboard nav items all render `dashboards`).

| Field | Meaning |
|---|---|
| `id` | Stable page id, used for baseline filenames and PR branch names |
| `tab` / `view` | How the page is reached inside the prototype (`App.tsx` state) |
| `label` | Human label, matches `VIEW_LABELS` etc. |
| `demoUrl` | URL of the matching page on the Docusign demo site — `TODO(akshat)` until filled in |
| `entry` | Navigation steps needed after login when the page isn't directly URL-addressable (overlays) |
| `sync` | `false` = the agent skips this page (invented prototype surface or stub) |
| `overlay` | Page is a full-screen overlay reached from a row click, not a routed view |
| `reviewers` | GitHub handles the agent requests review from on this page's PRs. CODEOWNERS can't route by view (every view lives in `src/App.tsx`), so area routing happens here. `TODO(akshat)` until filled in |
| `notes` | Anything the capture tool needs to know |

## Baseline spec schema (`<page-id>.spec.json`)

The JSON form of the spec format defined in
`.claude/skills/reference-to-prototype.md` — what components the page uses and
what content they display. The design system owns spacing/colors/typography, so
none of that is captured.

```jsonc
{
  "pageId": "requests",
  "capturedAt": "2026-09-01T00:00:00Z",
  "demoUrl": "https://…",
  "pageHeader": {
    "title": "Requests",
    "showAIBadge": true,
    "aiBadgeText": "AI-Assisted",
    "actions": [
      { "component": "Button", "kind": "secondary", "label": "Manage" },
      { "component": "IconButton", "icon": "settings", "variant": "tertiary" }
    ]
  },
  "banner": null,
  "filterBar": {
    "searchPlaceholder": "Search requests",
    "quickActions": [],
    "filters": [
      { "component": "Chip", "label": "Status Type: Open", "removable": true }
    ]
  },
  "dataTable": {
    "selectable": true,
    "showColumnControl": true,
    "rowHeight": "tall",
    "columns": [
      { "key": "name", "header": "Name", "sortable": true, "cell": "Text" }
    ],
    "sampleRows": [],
    "pagination": { "pageSize": 25, "totalItems": 1334 }
  },
  "icons": [
    { "label": "Requests", "pathPrefix": "M4.5 2.25a.75.75…", "matchedIcon": "document" }
  ]
}
```

Fields are nullable — a page without a table simply has `"dataTable": null`.
The skeleton fingerprint is the automatic change gate; the spec is the richer
record (column order, cell renderers, pagination) the agent uses to name
precisely what changed and to regenerate the view.
