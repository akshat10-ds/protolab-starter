# PanelShell + usePanelMode — spec

The panel system: the container the chat lives in, and the state machine
between the panel and its host page. Tier 1.

## The one idea

**The panel is a sibling of the host page, never its parent.** The panel owns a
width; the host reflows around it (`width: calc(100% - Npx)` via
`panel.hostStyle`). A panel that wraps the page cannot push it. Everything else
falls out of this inversion.

## Modes

- **closed** — width 0. The shell stays mounted: scroll position, draft input,
  and streamed messages survive a close/reopen, and reopening animates a width
  instead of a mount. Hidden from screen readers and focus order while closed.
- **sidebar** — sized (default 40%, floor 360px), displaces the host page.
- **fullscreen** — fills its extent; the host page reaches width 0.

**Fullscreen is a width, not a flag.** Dragging the handle to the edge enters
it; dragging back leaves it. The extent is the viewport unless the host scopes
the panel to a narrower container (split view) — fullscreen then means "fills
its container".

## Decided behaviors

- **Opening always lands at `sidebarWidth`** — the affordance lands in the same
  place every time, even if the user previously dragged wider.
- **Leaving fullscreen restores the width you came from** — a user at 72% who
  goes fullscreen and back gets 72%, not a hardcoded default. A fullscreen
  entered from closed (citation click) collapses back to closed, not to a
  sidebar the user never asked for.
- **Closing remembers the width** for the next restore, whether closed from the
  header or snapped shut by a drag.
- **Drag-to-close is off by default** — a panel that vanishes mid-drag is a
  surprise; closing is an explicit action. Opt in via `snapToCloseThreshold`.
- **The handle is keyboard-operable** — arrow keys resize in 24px steps,
  Home/End jump to min/max; it is an ARIA separator with value semantics.
- **Reduced motion is honored at the token layer** — `tokens/motion.css` zeroes
  the panel duration under `prefers-reduced-motion`. Mounting PanelShell is
  what loads that token (see host contract).

## The divider

**A 1px subtle hairline in every state — rest, hover, and drag.** Hover is
signalled by the drag bar alone; the stroke never changes colour. Akshat,
2026-08-18: *"Border subtle only with 1px and just highlight the dragger."*
Four hover strokes were tried and all four came out: indigo 10 read *lighter*
than the border it replaced, and 70% neutral and solid `#130032` both read as
the page's structure thickening. **A structural edge should not change weight
because the pointer is near it.** A mark arriving is a hover state; a line
gaining weight is not.

**The whole divider is draggable, and it straddles the border.** Akshat,
2026-08-18: *"the handle inside doesn't work well sometimes and we also need to
have the entire divider be draggable."* The 16px hit area is centred on the
border — 8px of host page, 8px of panel — so the edge is grabbable from the
side that shrinks, and the first 16px of panel content no longer sits under a
strip that eats its clicks. The bar fades in at 0.6 when the panel is hovered
and firms to full opacity on the handle itself.

**The drag is pointer-based, not mouse-based.** Pointer capture keeps a release
outside the window from leaving the drag on, gives touch and pen a path, and
pins a fast drag to the handle. `data-panel-resizing` on `<body>` holds
`ew-resize` and kills selection page-wide for the length of the drag — without
it the cursor reverts to an I-beam the instant the pointer leaves the strip,
and a working drag reads as broken.

## The artifact dock

`usePanelMode().artifact` is the dock's controller — `{ openId, expanded,
openedIds, open, setOpenId, close, toggleExpanded }`. Pass it to `IrisAgent`'s
`artifact` prop.

- **`open` is the promote verb, and it goes fullscreen first.** A 420px dock
  does not fit beside the chat in a 360px sidebar. `open` sets fullscreen,
  appends to `openedIds`, and never arrives expanded. This is why the dock
  lives on the hook: a controller that cannot reach `setMode` is one the host
  has to finish, and the host finishing it is how the prototype shipped a 43px
  chat sliver.
- **`setOpenId` navigates, it does not promote.** A tab, a back arrow, a source
  row move the dock inside what it already holds — no mode change, no addition
  to `openedIds`.
- **`openedIds` is what this conversation produced**, in the order it opened
  them. It is the dock's tab strip, not a fixture shelf.
- **`close` drops `expanded`** so a later reopen never inherits a fullscreen
  used on something else.
- **`expanded` is its own axis** — it folds the chat column inside the panel; it
  is not panel fullscreen and never touches the host page.

## Motion

Three durations, named once in `tokens/motion.css`.

- **Panel width and host reflow** share `--ai-motion-duration-panel` on
  `--ai-motion-easing-standard`, so the panel and the page it pushes move as
  one thing.
- **The dock enters on a keyframe**, not a transition, on
  `--ai-motion-duration-artifact`. The dock is *mounted* by the host, and
  transitions do not fire on insertion — before the keyframe there were zero
  motion events anywhere in the panel when it opened.
- **The fullscreen entrance interpolates `flex-grow` alone.** The 480px basis
  lives on the base rule. As a `flex` shorthand it flipped grow 1→0 in one
  frame while basis transitioned 0%→480px, so the pane entered at 149% of its
  final width and shrank, and every open after the first was a hard cut.

Closing the dock is still a cut — the host unmounts it, so there is nothing for
CSS to animate.

## Defaults

Right edge · sidebar 40% · min 360px · z-index 300 · drag-to-close off.

## Do / don't

- Do spread `{...panel.shellProps}` — it already carries the handle; there is
  no second spread to remember.
- Do keep the shell mounted when closed; never conditionally unmount it.
- Do route every "open this artifact" through `artifact.open`. Setting
  `openId` directly is the 43px sliver.
- Don't colour the divider on hover. Four strokes were tried, all four rejected.
- Don't put the host page inside PanelShell's `children` — children are the
  panel's contents (typically IrisAgent).
- Don't store fullscreen as a separate flag anywhere; derive from width.

<!-- dev -->

## Dev spec

Mirrors `PanelShell.module.css`. Geometry that is not tokenised is listed with
its literal value, because that is what the CSS holds.

| Element / state | Property | Token or value |
|---|---|---|
| Shell | `background` | `--ink-bg-color-default` |
| Shell | `transition` | `width var(--ai-motion-duration-panel) var(--ai-motion-easing-standard)` |
| Shell | `overflow` | `visible` — the handle straddles the border; `.content` does the clipping |
| Shell, edge right | `border-left` | `1px solid var(--ink-border-color-subtle)` |
| Shell, edge left | `border-right` | `1px solid var(--ink-border-color-subtle)` |
| Shell, resizing | `transition` | `none !important` — width is driven frame-by-frame |
| Shell, closed | `pointer-events` / `overflow` | `none` / `hidden` |
| Shell, closed | `width` / `inert` / `aria-hidden` | `0` / set / `true` |
| Shell | `z-index` | `300` (prop default) |
| Content row | `display` / `flex` / `overflow` | `flex` row / `1` / `hidden` |
| Handle | `width` / `height` | `16px` / `100%` |
| Handle, edge right | `left` | `-8px` — 8px host, 8px panel |
| Handle, edge left | `right` | `-8px` |
| Handle | `cursor` / `touch-action` | `ew-resize` / `none` |
| Handle | `z-index` | `1` |
| Bar | `width` × `height` | `4px` × `48px` |
| Bar | `border-radius` | `--ink-radius-full` |
| Bar | `transition` | `opacity`, `background` on `--ai-motion-duration-handle` `ease` |
| Bar, rest | `background` / `opacity` | `--ink-neutral-40` / `0` |
| Bar, shell hover | `opacity` | `0.6` |
| Bar, handle hover + active | `background` / `opacity` | `--ink-neutral-80` / `1` |
| Bar, focus-visible | `background` / `outline` | `--ink-focus-color` / `--ink-focus-outer` at `--ink-focus-outer-offset` |
| `body[data-panel-resizing]` | `cursor` / `user-select` | `ew-resize !important` / `none` |
| Reduced motion | `transition` | `none` on shell and bar |

The focus ring sits on the bar, never on the invisible 16px hit area. The
reduced-motion block is redundant when `tokens/motion.css` is loaded; it is kept
so a consumer who imports `PanelShell` without the token sheet still behaves —
a motion preference should never depend on an import succeeding.

### Motion tokens consumed

| Token | Value | Used by |
|---|---|---|
| `--ai-motion-duration-panel` | `250ms` | shell width, `hostStyle` reflow |
| `--ai-motion-duration-artifact` | `300ms` | the dock's `dockIn` keyframe |
| `--ai-motion-duration-handle` | `180ms` | drag-bar opacity and background |
| `--ai-motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | width, reflow |

All three durations collapse to `0.01ms` under `prefers-reduced-motion` — not
`0s`, which suppresses `transitionend`.
