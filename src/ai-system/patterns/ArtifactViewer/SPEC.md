# ArtifactDock — spec

The one right-hand surface for every artifact. Akshat, 2026-08-13: *"the pane is
sort of like the artifacts panel can be used dynamically for showing agreements,
showing a document editor, showing data tables, etc."*

**A frame, not a component with variants.** The dock owns four things — the box,
the header, the tab strip, the region below. Everything inside that region is a
renderer, looked up by kind. The dock never names a kind.

Reached through `usePanelMode().artifact` + `IrisAgent`'s `artifacts` /
`onArtifactAction`. Mounting it by hand in `artifactSlot` still works.

## Anatomy

```
┌──────────────────────────────────────┐
│ ← · Title · [renderer] · ⤓ · ⤢ · ✕  │  73px header, universal, one row
├──────────────────────────────────────┤
│ ▣ Tab  ▣ Tab  ▣ Tab                  │  32px strip, only when >1 artifact
├──────────────────────────────────────┤
│ [renderer toolbar]                   │  48px, RENDERER-owned — the agreement
├──────────────────────────────────────┤  has one, the table has none
│                                      │
│ renderer well                        │  padded, flush, or canvas ground —
│                                      │  the renderer decides
└──────────────────────────────────────┘
```

The header draws the **title alone** — no kind icon, no subtitle. The tab strip
is where a kind is still named, and there the icon is doing navigation work.

## States

- **Card** — 420px, floating inside the panel, 16px in from the right edge. The
  panel cannot be mistaken for the host app's own chrome.
- **Pane** — at fullscreen the card becomes the third region of the panel: rail,
  chat, pane. Flush right, full height, one hairline on its left edge and no
  frame. It takes the surplus room rather than a fixed slice.
- **Expanded** — the host collapses the chat column and the dock takes the whole
  surface. A freshly opened artifact never arrives expanded.

**The dock arrives; it does not appear.** Measured 2026-08-19: opening it fired
zero transition and zero animation events anywhere in the panel — the dock
mounted at its final 420 and the chat column went 479 → 43 in the same frame.
Both halves of one movement were cuts. It now runs an entrance keyframe on
`--ai-motion-duration-artifact`, at `standard` easing, so the frame sweeps 0 →
420 and the chat column gives the room back at exactly the same rate.

## Decided behaviors

- **The host owns all state** — which items exist, which one is open, whether
  the chat column is collapsed. The dock renders nothing when `openId` is
  `null` or names an item that is not in `items`.
- **Opening goes fullscreen first.** *"A 420px dock does not fit beside the chat
  in a 360px sidebar."* The promotion lives on `usePanelMode`, not on the host —
  a host that finishes the job itself is how the 43px chat sliver shipped.
- **`open` and `setOpenId` are two verbs.** `open` promotes a new artifact:
  fullscreen, appended to `openedIds`, never expanded. `setOpenId` navigates
  inside what is already open — a tab, a back arrow, a source row.
- **"See all" opens the dock beside the chat, never instead of it.** Sid,
  2026-08-17: *"both will be open at that point in time… think of it as it
  opening the citation."*
- **The active collapsed card closes the pane.** Press the card in the chat and
  the dock closes, the preview returns, and the expanded state resets so
  reopening later does not inherit a fullscreen used on something else. Hover
  and focus reveal **Close** in the slot "See all" occupies — hidden at rest, so
  the collapsed row stays one quiet line. (The card itself is `IrisAgent`'s; the
  dock is what it opens and closes.)
- **Back names the route you came through.** `parentId` is set by the host,
  because the host is what knows the route — a document opened out of a search
  table returns to that table. Akshat, 2026-08-19: *"we do need breadcrumb
  before the agreement name to go back to the search results."*
- **A renderer owns its own toolbar and its own well**, and returns both, so the
  wells can differ: the table is full-bleed, the document is a canvas ground
  with a white page in it, markdown keeps the padded well. Adding a kind is one
  registry entry plus one renderer file; the dock does not change.
- **One action hook.** Download, Open in Navigator, search, a row's overflow
  menu and show/hide fields all report through `onAction` — the dock has no
  opinion about any of them, it only says which was pressed.
- **The pane takes an edge, not a ground.** The frame gives this region no fill,
  only a hairline. At fullscreen the pane is white — Akshat, 2026-08-18: *"when
  you open the search results panel can we just use the white color for all bg
  there."*
- **The CSS owns the width.** Supply `width` and the host wins at every width,
  because an inline style beats a container query — that is the override, not
  the default.

## Do / don't

- Do drive it from `usePanelMode().artifact` — five `useState` in the host is
  what that hook replaced.
- Do let the registry be the only place a kind is named.
- Don't compose `ArtifactViewer` inside it. The dock replaced three components
  that fought over one slot and drew three frames with up to three stacked close
  buttons. One frame, one close, one back arrow.
- Don't style the dock from the host page. `HostPage`'s row-stagger sheet reached
  into the panel and re-staggered the preview's rows every time the dock opened.
  The frame never styles the stage.

## Open questions

- **Closing is still a cut.** The host unmounts the dock, so CSS has nothing left
  to animate. Holding the slot mounted through an exit transition is
  `IrisAgent`'s call, not the dock's.
- The fullscreen toggle remounts the dock and replays its entrance during the
  panel's own sweep. Judged acceptable — it reads as re-tucking — but it is not
  deliberate.
- **The ground schemes are an experiment**, not a decision. Akshat, 2026-08-14:
  *"i'm kinda stuck on this one — we can experiment but I want text to stay
  legible."* `step` and `warm` are in the CSS behind `data-ground`; `flat` is
  what ships.
- `visualization` is a declared placeholder — the API is ready for charts, the
  system adds no chart dependency to draw one.
- The document toolbar's leading Select is unreadable in frame 158:18134. No
  control is drawn and no meaning is invented. Ask Akshat what it selects.

<!-- dev -->

## Dev spec

Mirrors `ArtifactDock.module.css` as it stands. Raw values are raw in the CSS —
no token exists for them.

### Box — card

| Element / state | Property | Token or value |
|---|---|---|
| `.dock` | width | `420px` |
| `.dock` | margin | `--ink-spacing-100` / `--ink-spacing-200` / `--ink-spacing-100` / `0` |
| `.dock` | background | `--ink-bg-color-default` |
| `.dock` | border | `1px solid --ink-border-color-subtle` |
| `.dock` | border-radius | `--ink-radius-size-s` |
| `.dock` | flex | `flex-shrink: 0`, column, `overflow: hidden` |
| `.dock[data-expanded]` | flex | `1` |

### Box — pane (`:global([data-fullscreen])`)

| Element / state | Property | Token or value |
|---|---|---|
| `.dock` | margin | `0` |
| `.dock` | background | `none` (frame draws no fill) |
| `.dock` | border | `none`; `border-left: 1px solid --ink-border-color-subtle` |
| `.dock` | border-radius | `0` |
| `.dock:not([data-expanded])` | flex | `1 1 520px` |
| `.dock` under `:not([data-ground])` | background | `--ink-bg-color-default` — the `flat` scheme |
| `.dock` under `[data-ground='step']` | background | `--ink-bg-color-canvas-page` |
| `.sourceRow:hover/:focus-visible` under `[data-ground='warm']` | background | `--ink-ecru-20` |
| `.well[data-ground='canvas']` under `[data-ground='warm']` | background | `--ink-ecru-10` |
| `.tabStrip` | scrollbar | `scrollbar-width: none`, `::-webkit-scrollbar { display: none }` |

### Motion

| Element / state | Property | Token or value |
|---|---|---|
| `.dock` | animation | `dockIn --ai-motion-duration-artifact` (fallback `300ms`) |
| `.dock` | easing | `--ai-motion-easing-standard` (fallback `cubic-bezier(0.4, 0, 0.2, 1)`) |
| `@keyframes dockIn` | from | `width: 0; margin-right: 0; opacity: 0` |
| `.tab`, `.sourceRow` | transition | `background-color --ai-motion-duration-handle` (fallback `180ms`) `ease` |
| `prefers-reduced-motion` | — | `.dock { animation: none }`, `.tab`/`.sourceRow { transition: none }` |

### Header — 73px

| Element / state | Property | Token or value |
|---|---|---|
| `.header` | height | `73px` |
| `.header` | padding | `0 --ink-spacing-100 0 --ink-spacing-200` |
| `.header` | gap | `--ink-spacing-100` |
| `.header` | border-bottom | `1px solid --ink-border-color-subtle` |
| `.header > button:first-child` | margin-left | `calc(--ink-spacing-100 * -1)` |
| `.title` | font-size | `--ink-font-heading-xxs-size` |
| `.title` | font-weight | `--ink-font-weight-medium` |
| `.title` | line-height | `--ink-font-heading-xxs-line-height` |
| `.title` | color | `--ink-font-color-default` |
| `.title` | overflow | `flex: 1`, ellipsis, no wrap |

### Toolbar — 48px, renderer-owned

| Element / state | Property | Token or value |
|---|---|---|
| `.toolbar` | height | `48px` |
| `.toolbar` | padding | `0 --ink-spacing-200` |
| `.toolbar` | gap | `--ink-spacing-100` |
| `.toolbar` | border-bottom | `1px solid --ink-border-color-subtle` |
| `.srOnly` | — | `clip-path: inset(50%)`, 1×1, off-flow |

### Tab strip — 32px

| Element / state | Property | Token or value |
|---|---|---|
| `.tabStrip` | height | `32px` |
| `.tabStrip` | padding | `0 --ink-spacing-100` |
| `.tabStrip` | gap | `--ink-spacing-50` |
| `.tabStrip` | border-bottom | `1px solid --ink-border-color-subtle` |
| `.tab` | padding | `--ink-spacing-25 --ink-spacing-100` |
| `.tab` | gap | `--ink-spacing-50` |
| `.tab` | border-radius | `--ink-radius-size-xs` |
| `.tab` | font | `--ink-font-family-default`, `--ink-font-detail-xs-size` |
| `.tab` | color | `--ink-font-color-secondary` |
| `.tab:hover` | background | `--ink-ecru-10` |
| `.tab[data-active]` | background / color / weight | `--ink-ecru-10` / `--ink-font-color-default` / `--ink-font-weight-medium` |
| `.tab:focus-visible` | outline | `2px solid --ink-border-color-accent`, offset `-2px` |
| `.tabLabel` | max-width | `160px` |

### Well

| Element / state | Property | Token or value |
|---|---|---|
| `.well` | padding | `--ink-spacing-200` |
| `.well` | overflow | `auto` both axes, `flex: 1`, `min-height: 0` |
| `.well[data-flush]` | padding | `0` |
| `.well[data-ground='canvas']` | background | `--ink-bg-color-canvas-page` |
| `.markdownFallback` | padding | `--ink-spacing-200` |

### Sources

| Element / state | Property | Token or value |
|---|---|---|
| `.sourceList` | gap | `--ink-spacing-50` |
| `.sourceRow` | min-height | `40px` |
| `.sourceRow` | padding | `--ink-spacing-100 --ink-spacing-200 --ink-spacing-100 --ink-spacing-100` |
| `.sourceRow` | gap | `--ink-spacing-100` |
| `.sourceRow` | border-radius | `--ink-radius-size-xs` |
| `.sourceRow` | background | `--ink-bg-color-default` |
| `.sourceRow:hover/:focus-visible` | background | `--ink-neutral-20` |
| `.sourceRow:focus-visible` | outline | `2px solid --ink-border-color-accent`, offset `2px` |
| `.sourceIcon` | size / color | `24×24` / `--ink-icon-color-subtle` |
| `.sourceText` | layout | column, `flex: 1`, `min-width: 0` |
| `.sourceTitle` | font | `--ink-font-body-s-size`, `--ink-font-weight-medium`, `--ink-font-color-neutral-subtle` |
| `.sourceExcerpt` | font | `--ink-font-detail-xs-size`, `--ink-font-color-secondary` |
| `.sourceMeta` | font | `--ink-font-detail-xs-size`, `--ink-font-color-secondary` |

### Visualization placeholder

| Element / state | Property | Token or value |
|---|---|---|
| `.placeholder` | min-height | `180px` |
| `.placeholder` | gap / color | `--ink-spacing-100` / `--ink-icon-color-subtle` |
| `.placeholderTitle` | font | `--ink-font-body-s-size`, `--ink-font-weight-medium`, `--ink-font-color-secondary` |
| `.placeholderMeta` | font | `--ink-font-detail-xs-size`, `--ink-font-color-secondary` |
