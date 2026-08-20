# Host contract — what the app owes the chat

The chat never lives in isolation; it lives beside a product surface. These are
the obligations of any page that hosts it. Verified against the `panel`
prototype (chat beside the real Agreements page).

## Layout

**1 — Mount the panel as a sibling of the page, and reflow — never overlay.**
Spread `panel.hostStyle` on the page element. Opening the chat compresses
the page (`width: calc(100% - Npx)`); content reflows into the narrower
width. The chat never floats over content.

**2 — In sidebar mode, the app's left nav collapses** to its compact state, so
the page keeps usable width while the chat is open.

**3 — Keep the shell mounted.** A closed panel is zero-width, not unmounted —
conversation state surviving a close/reopen is part of the contract with the
user, not an implementation detail.

## Ownership

**4 — The host owns the entry point** ("Ask Iris" button, banner, row action).
Opening always lands at sidebar width.

**5 — The host grants fullscreen.** Pass `onFullscreen` only if the surface has
a fullscreen to give; the chat renders the affordance only when it does.

**6 — The host owns context.** Documents in scope (`agreements`), a selected
cell (`canvasContext`), and the artifact column (`artifactSlot`) are the
host's state; the chat renders pills and reports intent.

**6a — The page the chat lives on is itself context, and the chat shows it.**
If the agent is open inside a surface — a workspace, an agreement, a request —
that surface is the base context of the conversation. The host passes it
(`pageContext`); the chat renders it as the standing context pill — **with the
surface's own icon**, so it is unmistakable which thing is in context — superseded
only by a more specific selection (a picked cell, attached documents). Working
inside a thing means the chat already knows you mean that thing. The pill is
**dismissible**: clearing it drops the page scope for that conversation, for when
the user wants to ask something not about this surface.

**6b — The `+` menu is the consistent "add anything from anywhere" affordance.**
Its shape does not change surface to surface — upload, add from Navigator, add a
party, plus the tool categories — so the way you bring context into a
conversation is learned once. The system ships this menu as the default; the
host extends the *corpus* (which agreements, which parties exist), never the
menu's structure. An empty menu is not a menu — the `+` renders only when there
is something to add.

## Wiring

**7 — The host provides both aliases** — `@ink` (its design system copy) and
`@ai` (this system). The chat brings no UI foundation of its own.

**8 — Mounting PanelShell is what loads the motion tokens.** A host that spreads
`hostStyle` without ever mounting PanelShell gets no open/close transition
and no reduced-motion handling.

**9 — The frame never styles the stage.** The host must not inject
document-level styles that can reach inside the panel. `HostPage`'s row-stagger
sheet was scoped only by `[data-ink-component="DataTable"]`, so it re-animated
the panel's own tables every time the artifact dock opened or closed — the host
page had been animating the panel's tables for as long as both existed. Scope
host sheets to the host.

## Open

- Behavior when the viewport is too narrow for page + sidebar (mobile /
  split-screen) — not yet decided.
- Whether the left-nav collapse (rule 2) is the host's listener on
  `onModeChange` or a shared helper — currently each host wires it by hand.
