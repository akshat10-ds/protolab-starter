# IrisAgent — spec

The composed chat surface. One import gives the full agent experience; the host
supplies conversation state and content. Tier 1.

**It runs the chat app, not a piece of it.** Akshat, 2026-08-18: *"I have to
ship the entire chat app — to sort of let all the behaviors be known."* The cold
state's sequence, the checklist's memory, the insight cards' dismissal, the nav
pages and the artifact dock are IrisAgent's. The host feeds it content and
fixtures.

## Anatomy

```
┌──────────────────────────────────────────┐
│ Header  agent identity/picker · menu ·   │   compact layout
│         fullscreen · close               │
├──────────────┬───────────────────────────┤
│ Cold state   │  Artifact dock            │   from `artifact` + `artifacts`,
│  or          │  (optional)               │   or a host `artifactSlot`
│ Conversation │                           │
│ stream       │                           │
├──────────────┴───────────────────────────┤
│ Suggested context   (tucked behind ↓)    │
│ Composer  context pill · + menu · / cmds │
│           · @ mentions · disclaimer      │
└──────────────────────────────────────────┘
```

Cold state, top to bottom: greeting + subtitle → **agreement snapshot** →
`coldStateHeaderSlot` → suggestion rows → **insight cards** → **get started** →
`coldStateFooterSlot` → `coldStateSlot`.

`sidebar` layout adds a history rail (conversations, nav shortcuts, nav pages).
`layout` is internal composition only — the relationship to the host page
belongs to PanelShell + usePanelMode, never to this component.

## States

- **Cold, first open** — the get started checklist alone. No rows, no cards.
- **Cold, after dismissal** — zero-query suggestion rows. The checklist is gone;
  a "Get started" entry appears in the nav shortcuts as the way back.
- **Loading** — an assistant turn is requested but not started; skeleton shows.
- **Streaming** — the live turn's markdown streams in; host flips `isStreaming`
  off in `onStreamingComplete`.
- **Completed turn** — thinking steps collapse to an outcome summary; follow-up
  chips render.

## Cold state

- **One block at a time.** Akshat, 2026-08-18: *"I don't need to see the get
  started, the zero query and suggestion cards all at once — let's just show the
  get started… if you dismiss then you see the zero query."* The checklist is
  the whole cold state until it is dismissed; the rows arrive when it leaves.
  This is `getStarted.sequence`, and it is the default. `sequence: false`
  restores the both-at-once state for comparison only.
- **Insight cards are off.** *"Let's not show the suggestion cards here for
  now."* Omit `insights` and there are none — off is the decided default. They
  are also suppressed whenever `agreementContext` is set: corpus findings are
  about a set the user is not looking at.
- **The agreement snapshot goes first.** Two attributes plus "see all N
  extractions", and no more. Poonam, 2026-08-17: *"limit it to really two of
  them, type and expiration date, with the third item being see all."* Her
  standing reason for the cap: extractions carry an accuracy reputation, and
  *"bringing extractions into chat pollutes their thinking about chat also."*
- **The snapshot exists because the extraction panel collapsed.** Sid: *"they
  clicked on the agreement list table, and suddenly all the extractions are
  missing, we just took them to a blank chat."* It is the price of that, not new
  value.
- **`agreementContext.onSeeAll` points up.** It opens the *host page's*
  extraction column, beside the chat, never instead of it. Sid, 2026-08-17:
  *"both will be open at that point in time… think of it as it opening the
  citation."*
- **The placeholder rotates; the suggestions do not.** `placeholderHints` cycles
  context-specific questions ("summarize commercial terms", "summarize my
  liabilities"). The rows under the input are static. Akshat, 2026-08-17: *"if
  it's rotating, then I need to time my click."*
- **Two to three suggestions, never more.** Akshat's dose, verbatim: *"at any
  point we shouldn't show more than two to three suggestions."*
- **A suggestion does not print why it was suggested.** Hover at most. Akshat:
  *"that'll be too much… if it's contextual, it will become clear over time."*
- **A step and an insight card both just send.** A checklist step with a `query`
  sends it and marks itself done; an insight card sends its whole `query` with
  the title as the display label. The answer lands in the chat like any other
  turn.

## Suggested context

The strip above the composer, offering the agreement the host page has open.

- **Add first, Replace second.** Akshat, 2026-08-18: *"flip it — Add first,
  Replace second."* He reversed an order that led with the destructive action;
  he gave no reason beyond the call.
- **Only Add is visible.** Replace and Dismiss sit behind an overflow, so the
  strip carries two targets instead of three and the action that throws away a
  set the user assembled costs a deliberate second click. With nothing to
  replace, the plain close stays — a menu holding one item is worse than the
  glyph it replaces.
- **No border, tucked behind the composer.** *"It's almost like it's peeking
  out."* The composer keeps all four of its own corners; the strip is pulled up
  by exactly one radius, so only its top edge and top corners clear it —
  **34px of a 46px strip shows**.
- **Replace is offered only when there is something to replace.** The suggestion
  never replaces anything on its own. Sid, 2026-08-17: *"we will not be
  intent-wise be able to understand any of this stuff, we need to just have them
  explicitly choose."*

## Turn anatomy

- **User turn** — plain bubble; command-bubble variant when sent via slash
  command; a question label above when it answers an elicitation.
- **Assistant turn** — thinking steps → markdown body → citations → inline
  result card → completion summary + follow-ups.
- **Result card** — every result set renders inline as a preview card, always. A
  glyph and "Showing N results" on the left, "See all ›" on the right, the
  preview table below. The pane never opens on its own.

## Results and the dock

- **"See all" promotes that set into the dock**, and goes fullscreen first — a
  420px dock does not fit beside the chat in a 360px sidebar. Route it through
  `artifact.open`; setting `openId` directly is what shipped a 43px chat sliver.
- **A card's label is derived, never stored.** It reads "Seeing results in right
  panel" when its own set is the open one, "Showing N results" otherwise. A
  follow-up card then costs nothing, and the earlier card reverts by itself.
- **The active card closes the pane.** It is the thing that says "you are
  looking at this", so it is the thing that stops.
- **One entity per table.** Sid, 2026-08-17: *"our tables are going to be
  limited to one entity."* Several entity types in one answer render as
  separate tables.
- **The dock lists only what this conversation opened.** Akshat, 2026-08-19:
  *"we don't need all the tabs by default — it makes no sense, because if you
  just start a chat and you're seeing search results you don't have the other
  tabs."*

## Decided behaviors

- **Conversation is controlled.** The consumer owns `messages`; IrisAgent never
  invents state it can't hand back.
- **`onFullscreen` points up.** IrisAgent renders the affordance and reports
  intent; it never resizes itself. Hosts with no fullscreen to give omit the
  prop and no affordance renders.
- **The header names the agent, not the conversation.** Multiple `agents` make
  the title a picker; a single agent renders a static identity, no chevron.
- **`artifactExpanded` is its own axis.** It collapses the chat column inside
  the surface — it is not panel fullscreen and never touches the host page.
- **The title-dropdown header is retired** (2026-08-12) — every layout draws the
  agent-identity header. `title`, `onTitleChange` and `onStarChange` are inert,
  kept only so old call sites do not break.
- **The disclaimer is a node, not a string** — the shipping panel's disclaimer
  ends in a link, which a string cannot carry.
- **The chat measure is one variable.** `--iris-chat-measure`: 620px in the
  sidebar, 720px at fullscreen. The greeting, the rows and the composer all draw
  from it, so their left edges cannot drift. 720 is this file's existing measure
  for "the chat is the page", not a stated dose — the variable is the knob.
- **The stream scrolls full width.** The measure lives in `padding-inline`, so
  the scrollbar sits at the column's right edge instead of floating in the
  gutter at fullscreen.
- **Nav pages are IrisAgent's.** Give it `navPages` and the shortcut opens one,
  the header names it, the back arrow leaves it, and a send, a new conversation
  or a picked conversation clears it.
- **Everything is additive.** `openArtifactId`, `artifactExpanded`,
  `onSeeAllResults`, `onCloseResults`, `coldStateHeaderSlot`,
  `coldStateFooterSlot`, `navPageSlot`, `navPageTitle` and `onNavBack` all still
  work; the machine wins where both are supplied.

## What the host still owns

Content, and only content: every suggestion string, the greeting subtitle, the
placeholder list, the checklist's steps and their copy, the artifact fixtures,
and the host page's own chrome. The host's OWN brand stays host-side — `railBrand`
is Docusign's logo, not Iris's. Iris's own art does not: the bloom, the mark and
the wordmark ship in `IrisAgent/art/` and are the defaults for `coldBackdrop`,
`thinkingMark` and the `iris` agent's `wordmark`, so a surface that passes no art
still looks like Iris. The props remain, as overrides.

## Do / don't

- Do compose it inside `PanelShell` with `usePanelMode` — the 95% path.
- Do pass `artifact` from `usePanelMode().artifact` and let IrisAgent run the
  dock.
- Do pass `agreements` / `canvasContext` / `agreementContext` so the surface
  reflects the host page.
- Don't add a third attribute to the agreement snapshot. Two plus "see all" is
  the cap.
- Don't open the extraction panel *instead of* the chat — "see all" opens it
  beside.
- Don't rotate the suggestion rows. Only the placeholder inside the input
  rotates.
- Don't print why a suggestion was suggested. Hover, or not at all.
- Don't stack the checklist, the rows and the insight cards on a first open.
- Don't lead the suggested-context strip with Replace, and don't put three
  actions on it.
- Don't reassemble a chat surface from Tier 2 parts — that is rebuilding this,
  badly.
- Don't drive panel width or mode from inside; everything panel-shaped points up.

## Open questions

- Whether both panels stay open on a small screen, or the chat collapses when
  the extraction panel opens. Akshat parked it, 2026-08-17: *"can we keep this
  as an open item."*
- The get started list's own content. Sid took apart "visualize a hierarchy"
  (*"less than 5% of accounts have hierarchies"*) and "explore different agents";
  what replaces them is not decided.
- Whether the "why suggested" line ever shows.
- The strip's copy — the review did not settle whether the label should name why
  the page is suggesting it.
- Multi-line vs single-line input as a variant — not yet decided as a prop.
- `groundScheme` — four readings, switchable rather than chosen. Akshat,
  2026-08-14: *"i'm kinda stuck on this one — we can experiment but I want text
  to stay legible."*

<!-- dev -->

## Dev spec

Mirrors `IrisAgent.module.css`, `compact` layout. Geometry that is not tokenised
is listed with its literal value, because that is what the CSS holds.

| Element / state | Property | Token or value |
|---|---|---|
| `.pageCompact` | `--iris-chat-measure` | `620px` |
| `.pageCompact[data-fullscreen]` | `--iris-chat-measure` | `720px` |
| `.pageCompact` | `container-type` | `inline-size` — makes the panel the containing block for the drawer |
| `.pageCompact .contentHeader` | `background` | `none` |
| `.panelWelcome` | `overflow-y` / `background` | `auto` / `none` |
| `.panelWelcomeContent` | `padding` | `0 var(--ink-spacing-300) var(--ink-spacing-300)` |
| `.panelWelcomeContent` | `gap` / `max-width` / `margin` | `--ink-spacing-300` / `--iris-chat-measure` / `auto auto 0` |
| `.panelSuggestionsSection` | `gap` | `--ink-spacing-150` |
| `.panelChatMessages` | `padding` | `--ink-spacing-200` |
| `.panelChatMessages` | `padding-inline` | `max(var(--ink-spacing-200), calc((100% - var(--iris-chat-measure)) / 2 + var(--ink-spacing-200)))` |
| `.panelChatMessages` | `width` / `overflow-y` | `100%` / `auto` — the scroll container is the column |
| `.panelChatInput` | `padding` / `max-width` / `margin` | `0 var(--ink-spacing-100) 0` / `--iris-chat-measure` / `0 auto` |
| `.panelComposer` | `position` | `relative` — paints above the strip tucked behind it |
| `.suggestedContext` | `background` / `border` | `--ink-neutral-10` / `none` |
| `.suggestedContext` | `border-radius` | `var(--ink-radius-size-m) var(--ink-radius-size-m) 0 0` |
| `.suggestedContext` | `margin-bottom` | `calc(var(--ink-radius-size-m) * -1)` — the tuck, one radius |
| `.suggestedContext` | `padding` | `var(--ink-spacing-100) var(--ink-spacing-200) calc(var(--ink-spacing-100) + var(--ink-radius-size-m))` |
| `.suggestedContext` | `gap` | `--ink-spacing-200` |
| `.suggestedContextLabel` | `font-size` / `weight` / `color` | `--ink-font-size-xs` / `--ink-font-weight-medium` / `--ink-font-color-neutral-subtle` |
| `.suggestedContextLabel` | `letter-spacing` | `0.16px` — Ink has no token for it |
| `.suggestedContextLabel strong` | `font-weight` | `--ink-font-weight-bold` |
| `.suggestedContextAdd` | `color` / `:hover` | `--ink-font-color-default` / `text-decoration: underline` |
| `.suggestedContextActions` | `gap` | `--ink-spacing-100` |
| `.suggestedContextDismiss` | `margin-block` / `margin-right` | `-7px` / `-8px` — keeps the 32px hit area off the strip's height |
| `.suggestedContextMenu` | `bottom` / `min-width` | `calc(100% + var(--ink-spacing-50))` / `148px` — opens upward, hand-positioned |
| `.suggestedContextMenu` | `padding` / `radius` / `background` | `--ink-spacing-50` / `--ink-radius-size-m` / `--ink-white-100` |
| `.suggestedContextMenu` | `box-shadow` | `var(--ink-shadow-lg, 0 8px 24px rgba(19, 0, 50, 0.12))` |
| `.suggestedContextMenuItem` | `min-height` / `padding` / `radius` | `32px` / `0 var(--ink-spacing-100)` / `--ink-radius-size-xs` |
| `.suggestedContextMenuItem:hover, :focus-visible` | `background` | `--ink-ecru-20` |
| `.suggestedContextMenuItem:focus-visible` | `outline` | `2px solid var(--ink-border-color-accent)` at `-2px` offset |
| `.panelDisclaimer` | `font-size` / `weight` / `color` | `--ink-font-size-xs` / `--ink-font-weight-medium` / `--ink-font-color-neutral-subtle` |
| `.panelDisclaimer` | `margin` / `padding` | `var(--ink-spacing-150) 0 0` / `0 var(--ink-spacing-200) var(--ink-spacing-200)` |
| `.chatColumnCollapsed` | `flex` / `max-width` / `opacity` | `0 0 0` / `0` / `0` |
| `.chatColumnCollapsed` | `transform` / `pointer-events` | `translateX(-12px)` / `none` |
| Reduced motion | `animation` | `none` on greeting, subtitle, hero, discovery, suggestions, chat area, skeleton, backdrop and thinking mark |

### Ground schemes — `compact` + `[data-fullscreen]` only

One variable moves the rail, `.pageCompact`, the notch corner and the dock.

| `data-ground` | `--iris-rail-ground` |
|---|---|
| *(unset — `flat`)* | `color-mix(in srgb, var(--ink-bg-color-canvas-page) 35%, var(--ink-white-100))` |
| `sandwich` | `--ink-bg-color-canvas-page` |
| `warm` | `--ink-ecru-20` |

`step` moves the pane's ground rather than the rail's, so it sets nothing here.
