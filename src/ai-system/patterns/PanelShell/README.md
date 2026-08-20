# PanelShell + `usePanelMode`

The canonical answer to "how does a panel relate to the page it sits next to."

- **`usePanelMode`** (`hooks/usePanelMode.ts`) — the state machine. Owns mode, width, restore memory, and the host reflow contract.
- **`PanelShell`** (this folder) — the DOM. Sibling-mountable, content-agnostic, zero-width when closed.

Split this way because **modes are a container concern, not a content concern.** The same machine has to drive a chat, a tagger, and a document preview. Bolting `mode` onto `ChatPanel` would make everything that isn't a chat un-fullscreen-able. See `projects/iris-system/notes/2026-07-09-panel-behavior-audit.md` §7.

---

## The mode machine

```
                      ┌────────────────────────────────┐
                      │            closed              │
                      │  width 0 · shell stays mounted │
                      └────────────────────────────────┘
                         │  ▲                        ▲
                 open()  │  │  close()               │  toggleFullscreen()
        setMode('sidebar')│  │  setMode('closed')     │  when entered from closed
                         ▼  │                        │
                      ┌────────────────────────────────┐
          ┌──────────▶│           sidebar              │
          │           │  width = sidebarWidth (40%)    │
          │           │  host: calc(100% - Npx)        │
          │           └────────────────────────────────┘
          │              │  ▲                    │
   drag back below       │  │                    │  setMode('fullscreen')
   viewport − 50px       │  │  drag / arrow keys │  — from a header button, or
          │              ▼  │                    ▼    from a citation click
          │           ┌──────────────┐   ┌────────────────────────┐
          └───────────│   resizing   │──▶│      fullscreen        │
                      │ min ≤ w ≤ vw │   │  width = innerWidth    │
                      │ no transition│   │  host width → 0        │
                      └──────────────┘   └────────────────────────┘
                                                    │
                          toggleFullscreen() ───────┘
                          restores the *remembered* pre-fullscreen width
```

**`fullscreen` is a width, not a flag.** It is derived: `width >= innerWidth - 50`. Dragging the handle to the edge enters it; dragging back leaves it. Nothing special happens at the boundary. This is what the prototype actually did — `handleExpandPanelToFull` is just `setPanelWidth(window.innerWidth)`.

Two consequences worth stating:

- **Sticky fullscreen is inherited, not written.** When the window resizes, `usePanelResize` snaps a near-full-width panel to the new `innerWidth`. `isFullscreen` stays true, so the derived mode stays `'fullscreen'`. Zero lines here do that.
- **`setMode('fullscreen')` works from anywhere.** It is a stable callback. The sources-chip and citation-click flows, which live deep inside artifact content, call it directly. No prop-drilling, no context.

### What this machine deliberately does *not* model

`artifactFullscreen` is a **different axis**. It hides the *chat column inside the panel*, not the host page. The two compose — Iris can take the viewport while the artifact takes Iris — and modeling them as one enum would make that composition inexpressible. It belongs to whatever owns the panel's contents. (Backlog §4.1.)

The ceremonial `overlay` mode is also absent. It is a second mount of the agent, not a mode of this panel, and the audit recommends deleting it in favor of a route.

---

## The sibling-mount contract

**`PanelShell` does not take the host page as `children`.**

This is the whole design. A panel that wraps the page cannot be a flex sibling of it, and it is the sibling relationship that makes `width: calc(100% - Npx)` possible. `AgentShell` made the opposite choice (`<main>{children}</main>`) and as a result no page it hosts can ever reflow around a panel — the audit calls this its original sin.

So the contract is: **the host renders both, side by side, and reflows itself.**

```tsx
import { IrisAgent, PanelShell, usePanelMode } from '@ai';

function AgreementsPage() {
  const panel = usePanelMode({
    sidebarWidth: '40%',   // prototype's WIDE_PANEL_WIDTH_PERCENT
    minWidth: 360,         // prototype's DEFAULT_PANEL_WIDTH
    edge: 'right',
    onModeChange: (mode) => setNavLocked(mode === 'closed'),
  });

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* The host page. It is a SIBLING of the panel, not its parent. */}
      <main style={panel.hostStyle}>
        <AgreementsTable onRowClick={panel.open} />
        {panel.mode === 'closed' && <FloatingCTA onClick={panel.open} />}
      </main>

      {/* The panel. One spread. */}
      <PanelShell {...panel.shellProps}>
        <IrisAgent
          onClose={panel.close}
          onFullscreen={panel.toggleFullscreen}
          onCitationClick={() => panel.setMode('fullscreen')}
        />
      </PanelShell>
    </div>
  );
}
```

`panel.hostStyle` is `{ width: 'calc(100% - 768px)', transition: 'width …' }` — the push layout is one spread, and it stays correct on every drag frame because `isResizing` kills the transition.

Three things the host still owns, on purpose:

| Concern | Why not the panel's |
|---|---|
| The re-open affordance (`FloatingCTA`) | It renders *over the host page*, in host stacking context. A closed panel is 0px wide and cannot contain it. |
| Host-chrome coupling (nav lock on open) | That is the host's chrome. Subscribe via `onModeChange`. |
| Where the panel sits in the DOM | `edge` styles the border and the handle; ordering is the host's flexbox. |

### Closed means zero-width, not unmounted

`PanelShell` keeps its subtree mounted at `width: 0`. Scroll position, draft input, and a mid-stream message all survive a close/reopen, and reopening animates a width instead of playing a mount keyframe. `AgentShell` unmounts; that is why its panel can only `slideInRight` and can never reflow anything.

A zero-width shell that is still focusable would be a keyboard trap, so it carries `inert` and `aria-hidden` when closed.

---

## API

### `usePanelMode(options)`

| Option | Default | Notes |
|---|---|---|
| `initialMode` | `'closed'` | |
| `sidebarWidth` | `'40%'` | `PanelSize` — px number or `` `${number}%` `` of `innerWidth`, re-resolved on window resize. |
| `minWidth` | `360` | Drag floor. |
| `maxWidth` | viewport | The extent `fullscreen` fills, and what a `%` is a percentage *of*. Supply it when the panel is scoped to a container narrower than the viewport (split view, modal, the Playground stage), and re-supply it when that container resizes — a panel at the extent stays pinned to it. |
| `snapToCloseThreshold` | `0` | How far below `minWidth` a drag must go before the panel closes. `0` disables it: closing is an explicit action, and a panel that vanishes mid-drag is a surprise. Opt in and the mode machine subscribes to the snap `usePanelResize` already emits. |
| `edge` | `'right'` | Which side of the viewport. Sets handle side and drag direction. |
| `onWidthChange` | — | Fires on every width change, **including each drag frame**. |
| `onModeChange` | — | `(mode, prev)`. |
| `handleLabel` | `'Resize panel'` | Accessible name for the handle. |

Returns `{ mode, width, isResizing, setMode, toggleFullscreen, open, close, setWidth, shellProps, handleProps, hostStyle }`.

`onWidthChange` fires per frame during a drag. Apply it as a style, not as React state, or accept a re-render per frame. (The prototype re-rendered per frame at acceptable cost — do not pre-optimize, but know the escape hatch is a `ref` plus a direct style write.)

### `<PanelShell>`

`{...panel.shellProps}` supplies `mode`, `width`, `isResizing`, `edge`, `handleProps`. Also accepts `showHandle`, `zIndex` (default `300`), `label`, `className`, and `children` — **the panel's contents, never the host page.**

`PanelShell` imports nothing from `patterns/`. It does not know what an agent is.

---

## Composition, not duplication

`usePanelMode` composes `usePanelResize` and reimplements none of it:

| Behavior | Lives in |
|---|---|
| Drag math (`startWidth + delta`, clamp) | `usePanelResize.handleMouseDown` |
| Window-resize clamp + sticky fullscreen | `usePanelResize`'s resize effect |
| `isFullscreen` derivation | `usePanelResize.isFullscreen` |
| Mode, restore memory, `%` resolution, `hostStyle` | `usePanelMode` |

The prototype re-implemented the first two line-for-line (`iris-panel/index.tsx:161-181` and `:532-556`). Both are deleted by this hook.

`usePanelResize.toggleFullscreen()` is **not** used — it collapses to a constant `defaultWidth`, which is precisely the data loss described below.

---

## Deliberate departures from the prototype

Everything else is lifted verbatim. These four are not:

1. **Restore memory stores the width, not a boolean.** The prototype's `panelWasOpenRef` (`index.tsx:184`) was a `boolean`, and returning from fullscreen reset to a hardcoded 40%. A user who dragged to 72%, went fullscreen, and came back silently lost their width. The ref could not express the thing it needed to restore. `usePanelMode` remembers `{ mode, width }`.

2. **Closing animates.** The prototype drops the `width` property entirely when the panel is shut (`:624-629`), so the host snaps rather than transitions. `hostStyle` keeps `calc(100% - 0px)`, making open and close symmetric.

3. **The handle is keyboard-operable.** `role="separator"`, arrows resize by 24px, `Home`/`End` jump to min/full. The prototype's handle was pointer-only, which made fullscreen unreachable without a mouse.

4. **`prefers-reduced-motion` is honored.** The prototype guards only its overlay. See below.

---

## Motion

`tokens/motion.css` names the panel vocabulary the prototype hardcoded at every call site:

| Token | Value | Used by |
|---|---|---|
| `--ai-motion-duration-panel` | `250ms` | panel width, host reflow |
| `--ai-motion-duration-artifact` | `300ms` | artifact reveal (reserved) |
| `--ai-motion-duration-handle` | `180ms` | handle hover reveal |
| `--ai-motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | width, reflow |
| `--ai-motion-easing-decelerate` | `cubic-bezier(0.16, 1, 0.3, 1)` | entrances (reserved) |
| `--ai-motion-easing-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | exits (reserved) |

Reduced motion is handled **at the token layer** — the media query in `motion.css` collapses every duration to `0.01ms`. This is not a stylistic choice: `hostStyle` is an *inline style*, and an inline style cannot carry a media query. Zeroing the token is the only mechanism by which the host page's reflow can honor the preference.

`PanelShell.module.css` *also* carries its own explicit `prefers-reduced-motion` block. Redundant when the token sheet is loaded, and intentionally so — a motion preference should never depend on an import succeeding.

`0.01ms` rather than `0s` because a zero duration suppresses `transitionend`.

---

## Provenance

Lifted from `protoLab/src/prototypes/iris-panel/` — **frozen archive, never modify.**

| Here | There |
|---|---|
| `minWidth: 360` default | `index.tsx:55` `DEFAULT_PANEL_WIDTH` |
| `sidebarWidth: '40%'` default | `index.tsx:56` `WIDE_PANEL_WIDTH_PERCENT` |
| mode + width state | `index.tsx:95-102` |
| sticky fullscreen | `index.tsx:161-181` → deleted, now `usePanelResize` |
| restore memory | `index.tsx:183-203` (`panelWasOpenRef`) |
| `open` / `close` / `setMode('fullscreen')` | `index.tsx:460-496` |
| sources-chip → fullscreen + artifact | `index.tsx:490-496` |
| drag handler | `index.tsx:532-556` → deleted, now `usePanelResize` |
| `hostStyle` | `index.tsx:624-629` |
| shell + handle JSX | `index.tsx:803-811` |
| `.shell`, `.shellResizing`, `.content` | `index.module.css:7-31` |
| `.handle`, `.handleBar` | `index.module.css:135-171` |
