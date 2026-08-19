# IrisAgent

The full agent chat surface: cold state, live turn, history rail, and a
host-owned artifact column. It composes eleven decided system pieces
(`ConversationLayout`, `MessageBubble`, `AgentThinking`, `MarkdownRenderer`,
`StreamingMarkdown`, `FeedbackActions`, `SuggestionChip`, `ChatInput`,
`IrisSidebar`, `CommandMenu` via `ChatInput`, `useSmartScroll`) without
overriding any of them.

Extracted from `protoLab/src/prototypes/iris-agent/index.tsx` — 2,937 LOC,
**frozen**. That file remains the historical source of truth; do not edit it.

## Two things IrisAgent does not own

**Conversation state.** The consumer owns `messages`, `isLoading`, and
`isStreaming`, and handles `onSendMessage`. IrisAgent owns only presentation
state: which turns have finished animating, sidebar lock, input text, header
title. The prototype's scripted scenario engine lived inside the component; it
does not cross this boundary.

**Its relationship to the host page.** `layout` describes *internal composition
only* — is the history rail docked, is this one narrow column. Whether Iris is a
resizable side panel, a viewport takeover, or a route is `PanelShell`'s
question. `onFullscreen` points **up**: IrisAgent renders the affordance and
reports the intent; it never resizes itself.

## States

Three renders are mutually exclusive, and they are chosen in this order:

1. **`navPageSlot`** is set → the host's page renders; the stream *and the
   composer* are hidden.
2. **`messages` is empty** → the cold state.
3. Otherwise → the conversation.

`hasMessages = messages.length > 0` is the only gate. Everything else — indexing,
loading, streaming — modifies one of the three, it does not select among them.

| State | What renders | Props that drive it | Layout differences |
|---|---|---|---|
| **Cold / zero-query** | Greeting + subtitle, the composer, and a discovery section | `greeting`, `greetingSubtitle`, `categories`, `customSuggestions`, `coldStateSlot` | **`sidebar` / `single-column`:** hero composer (`variant="expanded"`) with the aurora glow, then `customSuggestions` **or** category tabs, then `coldStateSlot`. **`compact`:** greeting, then `customSuggestions` as full-width icon rows, then `coldStateSlot`; the composer is docked at the bottom (`variant="expanded"`, two rows) with the `disclaimer`. No badge and no section label — the shipping panel has neither. **`compact` ignores `categories` entirely** — pass `customSuggestions` or `coldStateSlot` or the panel shows greeting + composer and nothing else. |
| **Cold, indexing** | Subtitle becomes *"Reading N agreements…"*; a progress bar fills and agreement names appear one by one | `agreements` (non-empty) | Same node in every layout. **`compact`** hides the suggestions and `coldStateSlot` while it runs; **`sidebar` / `single-column`** keep showing them beside the bar. |
| **Cold, indexed** | Subtitle returns to `greetingSubtitle`; the *"N agreements"* context pill appears above the composer | `agreements`, `onOpenSources` | The pill is the **only** `onOpenSources` entry point in `compact` — the Sources header button exists only in the `sidebar` / `single-column` header, which itself renders only once there are messages. |
| **Cold, header** | Close, and (single-column) the sidebar toggle | `onClose` | **`sidebar` / `single-column`** collapse to `headerWelcome`: **no title, no Share, no Sources, no Fullscreen** until a message exists. **`compact`** keeps its full header at every moment (sidebar toggle, agent picker, New chat, Fullscreen, Close) — it never hides the agent's name, because the header names the *agent*, not the conversation. |
| **Loading (skeleton)** | Three shimmering lines after the last turn | `isLoading` | None. |
| **Streaming, no content yet** | `AgentThinking` animates; the turn's content is withheld until the accordion finishes | `isStreaming` + `messages[last].thinkingSteps` | None. |
| **Streaming, no thinking and no markdown** | Nothing visible; `CompleteOnMount` reports completion after 1,500 ms so `FeedbackActions` can appear | `isStreaming` | None. |
| **Loaded history** | Every turn renders finished — `AgentThinking` in `initialDone`, markdown whole, no cursor, `FeedbackActions` present. Follow-up chips render only on the last turn | `messages`, `isStreaming: false` | None. |
| **Post-reset** | Whatever `messages` now says | `onNewConversation` | None. |
| **Nav page** | `navPageSlot` | `navPageSlot` | None; the composer is hidden in every layout. |
| **Artifact expanded** | The chat column collapses so `artifactSlot` fills the surface — *including over the cold state* | `artifactExpanded` | None. |

### Three contracts the states depend on

**`isLoading` does not open the conversation.** The skeleton lives inside the
stream, and the stream only renders when `messages` is non-empty. A host that
flips `isLoading` before appending the user turn gets the cold state and no
skeleton. **Append the turn first**, as the worked example does.

**Reset returns to cold only if the consumer empties `messages`.**
`onNewConversation` clears the presentation state IrisAgent owns — completed
ids, custom title, star, context pill, input text — and reports the intent. It
cannot clear the array it does not own.

**Reset does not replay indexing.** The indexing effect keys on the agreement
*names*, which a reset does not change. A post-reset cold state with `agreements`
still attached is the **indexed** cold state, not the indexing one: suggestions
and the context pill, no progress bar. Change the `agreements` array's contents
to replay it.

### Open design questions

Two of these states have no answer in the prototype and none is invented here.
Both are written up, with evidence and a recommendation, in
[`projects/iris-system/notes/2026-07-09-zero-state.md`](../../../../projects/iris-system/notes/2026-07-09-zero-state.md):

1. **What a 360px `compact` panel shows when empty.** The design exploration says
   a welcome state is *"Not applicable"* at that width; the prototype shipped one
   anyway. Today `compact` + `categories` renders greeting + composer and nothing
   else.
2. **Whether the cold state should be reachable at all once a conversation
   exists** — i.e. what the header's missing Fullscreen/Share/Sources buttons
   mean, and whether `navPageSlot` hiding the composer is a state or an accident.

## Layout values were renamed

| Prototype | Here | Why |
|---|---|---|
| `'full'` | `'sidebar'` | Describes the composition (rail docked inline), not a viewport claim. |
| `'single-column'` | `'single-column'` | Unchanged. Rail becomes an overlay drawer. |
| `'panel'` | `'compact'` | `panel` named the *host relationship*, which now belongs to `PanelShell`. What the value actually selects is a narrow column with a compacted header. |

`artifactFullscreen` was likewise renamed to **`artifactExpanded`**. It is not a
sibling of panel fullscreen — it collapses the *chat column* so the artifact
fills the surface. The collision of names was half the confusion (backlog §4.1).

## Props

### Composition
| Prop | Type | Notes |
|---|---|---|
| `layout` | `'sidebar' \| 'single-column' \| 'compact'` | Default `'sidebar'`. |
| `initialSidebarLocked` | `boolean` | Defaults to `true` when `layout='sidebar'`. |

### Conversation (controlled — required)
| Prop | Type | Notes |
|---|---|---|
| `messages` | `ChatMessage[]` | **Required.** The consumer owns the array. |
| `onSendMessage` | `(text, meta?: SendMeta) => void` | **Required.** Append the user turn and produce a reply. |
| `isLoading` | `boolean` | Shows the three-line skeleton. |
| `isStreaming` | `boolean` | The **last assistant turn** streams instead of rendering whole. |
| `onStreamingComplete` | `(messageId: string) => void` | The turn finished animating. Flip `isStreaming` off here. |

Only the last assistant turn can be live, and only while `isStreaming` is true.
Everything else — including a conversation loaded whole from history — renders
finished, with `AgentThinking` in its `initialDone` state. There is no prop to
seed "already completed" ids; `isStreaming: false` says it.

### Input
`inputValue` / `onInputChange` (omit to let IrisAgent own the text) ·
`placeholderHints` · `commandContextItems` · `commandToolCategories` ·
`onCommandSelect` · `mentionItems` · `onMentionSelect` · `disclaimer`
(`compact` only).

Tool commands (menu items carrying a `description`) are additionally sent as a
slash command, with `commandMeta.commandType` resolved by looking the child's
parent category up in `commandToolCategories`.

### Agent picker (`compact` only)
`agents` · `selectedAgentId` · `onSelectAgent`

The compact header's title is a picker over `agents`, not the conversation's name.
Pass none and it renders a static identity with no chevron; pass some and clicking
it opens a "Selected Agent" menu. `title` / `onTitleChange` are `sidebar` and
`single-column` only — a compact panel never names itself after its first turn.

### Chrome
`onClose` · `closeLabel` · `title` · `onTitleChange` · `onStarChange` ·
`onShare` · `onFullscreen`

Every header affordance is conditional on its callback. Pass no `onOpenSources`
and the Sources button does not render; pass no `onFullscreen` and neither does
the expand button.

### Cold state
`greeting` · `greetingSubtitle` · `categories` · `customSuggestions` ·
`coldStateSlot`

`customSuggestions` replaces `categories` when supplied — and an empty array is
not "supplied". Both default to empty, so the discovery section is absent unless
the host fills it. `greetingSubtitle` is overridden to *"Reading N agreements…"*
while `agreements` are indexing.

This is the zero-query state. The `WelcomeScreen` composite in Tier 2 is a
parallel, never-adopted answer to the same question and is `@deprecated`; it has
no composer, and the composer is the centerpiece here. See "States" above.

### Context attachment
`agreements` · `canvasContext` · `onCanvasContextDismiss` · `onOpenSources`

`agreements` drives the indexing animation and the multi-document context pill.

### Artifact surface (host-owned)
`artifactSlot` · `artifactExpanded` · `onCitationClick` · `onInlineResultClick` ·
`onAddInlineResultsAsContext` · `inlineResultColumns`

### History rail
`conversations` · `activeConversationId` · `onSelectConversation` ·
`onNewConversation` · `navShortcuts` · `navPageSlot`

`navPageSlot` renders in place of the conversation and hides the input. The host
decides what a `navShortcuts` click opens.

### Inline slot
`chatSuffix` — rendered after the last completed assistant turn.

## Worked example

A consumer supplying its own conversation. No scenario engine — just an array
and a send handler.

```tsx
import { useState } from 'react';
import { IrisAgent } from '@ai/patterns/IrisAgent';
import type { ChatMessage } from '@ai/patterns/IrisAgent';
import { SAMPLE_CONVERSATION } from '@ai/patterns/IrisAgent/__fixtures__/sampleConversation';

export function IrisDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_CONVERSATION);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = (text: string, meta?: { displayLabel?: string }) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: meta?.displayLabel ?? text },
    ]);
    setIsLoading(true);

    // Whatever produces turns for you — a model call, a fixture, a scripted engine.
    setTimeout(() => {
      setIsLoading(false);
      setIsStreaming(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          markdownContent: `You asked about **${text}**. Here is what I found.`,
        },
      ]);
    }, 800);
  };

  return (
    <IrisAgent
      layout="sidebar"
      messages={messages}
      onSendMessage={handleSend}
      isLoading={isLoading}
      isStreaming={isStreaming}
      onStreamingComplete={() => setIsStreaming(false)}
      onNewConversation={() => setMessages([])}
      greetingSubtitle="What would you like to know?"
    />
  );
}
```

The scripted demo engine that used to live inside this component — `SCENARIO_MAP`,
`matchScenario`, `FALLBACK_RESPONSE`, `isAffirmative` — becomes a pure function of
`(text, history)` on the consumer's side of `onSendMessage`.

## What was dropped in extraction

Everything below stayed in the frozen prototype. Nothing was deleted from it.

### The scenario engine (53 references, 6 `./data/` imports)
`SCENARIO_MAP`, `matchScenario`, `FALLBACK_RESPONSE`, `isAffirmative`,
`CONVERSATION_HISTORIES`, `WORKFLOW_HISTORIES`, and the `lastScenarioRef`
bookkeeping. `isAffirmative` ("yes" re-runs the last scenario) is genuine
conversational memory that a real model owns — it has no home in a system
component.

### The demo harness props (and the ~95 LOC of effects serving them)
`autoTriggerScenario`, `injectConversationTurn`, `onConversationTurnInjected`,
`prefillInput`, `onPrefilled`, `onScenarioTriggered`. These existed so a parent
could drive a child imperatively through props — each of their three effects
carried an eslint-suppressing "intentionally omits callbacks" comment, which is
the tell. With `messages` controlled, all three effects and both refs
(`lastScenarioRef`, `injectedTurnCompleteRef`) disappear.

### The prototype-shaped nav/inbox views (~337 LOC, `index.tsx:2592–2928`)
`InboxView`, `NavPage`, `NavPageDetail`, `InboxItemCard`, `RiskBars` — plus
`WorkflowDetailView`, `WorkflowTimeline`, and the `inbox-data` /
`workflow-histories` fixtures. These are Docusign workflow domain content, not
system surface. The `layout` modes did depend on them via `activeNavPage`; that
routing is now the host's, delivered through **`navPageSlot`**.

### The built-in artifact panel (`index.tsx:2183–2294`)
A hand-rolled view-switching document carousel over `MOCK_SOURCES` /
`AGREEMENT_DETAILS` / `MOCK_AGREEMENT_SECTIONS`. Both prototypes rebuilt this
independently and disagreed on its wide width (`60%` vs `960px`). It is not
system surface until `ArtifactPanel` is rebuilt against the shape they proved
(backlog §2.2, step 2). Until then the artifact column is entirely
**`artifactSlot`**, and `onOpenSources` / `onCitationClick` point up.

### Other removals
- **`chatInputOverride`** — a generic `ReactNode` hatch whose every real use was
  an `ElicitationCard` rendered in the input region while the agent blocked on
  structured input. The right prop is `elicitation?: ElicitationRequest`, but
  that is a design decision (backlog §2.1, §9), not an extraction. **The
  human-in-the-loop state is currently unrepresentable here.**
- **`worksheetName`** — the third special case of `contextSource`, folded away.
  `canvasContext` and `agreements` remain as the other two; collapsing all three
  into one `contextSource` prop belongs with the `ChatInput` spec.
- **`autoOpenSources`** — coupled to the artifact panel that left.
- **`onStreamingComplete()`** → now `onStreamingComplete(messageId)`.
- The panel cold-open `Banner` + four hardcoded sample questions +
  `panelCardsExpanded` — demo content. Use `coldStateSlot` or `customSuggestions`.
- `CATEGORIES`, `MENTION_ITEMS`, `COMMAND_*`, `PLACEHOLDER_HINTS`,
  `MOCK_AGREEMENT_SECTIONS`, `RESULT_COLUMNS` (342 LOC of constants) became
  props with generic defaults.
- `PANEL_SUGGESTED_ACTIONS` / `PANEL_SUGGESTED_QUESTIONS` — declared in the
  prototype and never referenced. Dead.
- `ChatMessage.toolCalls`, `.richResponse`, `.opensArtifact`, `.isPlainText`,
  and the `'system'` role — declared in `data/types.ts`, never rendered.

## Changes of substance, not just relocation

- **The conversation stream is rendered once.** The prototype duplicated ~110
  LOC of turn rendering across its panel and full branches; they differed only
  in a `MessageBubble` variant and one button. The layouts now differ only in
  their wrapper.
- **`MessageBubble variant="default"`** (panel branch, `:1490`) was never a valid
  variant — `MessageBubbleVariant` is `'plain-text' | 'slash-command' |
  'suggestion-selected'`. Both branches now use `'plain-text'`.
- **`commandMeta.commandType` was always `undefined`.** The prototype read the
  parent category from a second argument that `ChatInput.onCommandSelect` never
  passes. We look the parent up in `commandToolCategories` instead.
- **`CompleteOnMount` no longer restarts its 1,500 ms timer on every re-render**
  (`onComplete` moved into a ref).
- **The indexing effect no longer calls `setMessages([])`.** The consumer owns
  the array.
- **Reduced motion is honored.** The prototype shipped 9 keyframes, 14
  `animation:` rules and 26 `transition:` rules with zero
  `prefers-reduced-motion` blocks. Entrances now collapse to their end state and
  the ambient aurora loop stops. This is a local fix; the systemic policy is
  still unmade (backlog §4.6).
- **No hardcoded colors.** `#26065d` → `var(--ink-cobalt-140)`; `#191823` →
  `var(--ink-font-color-default)`; the aurora's `rgba(76,0,251,…)` /
  `rgba(38,5,89,…)` → `color-mix()` over cobalt tokens.
- **The `!important` block is gone.** `.chatColumnCollapsed` is declared last and
  wins on source order at equal specificity.

## Known gaps (design work, not extraction)

1. **No error states.** `grep -i error` over the prototype's 2,937 lines returns
   zero hits. There is no stream failure, no tool failure, no retry. `StepKind`
   has no `'error'`. `onError` is not on this surface because nobody has designed
   what a failed turn looks like (backlog §4.2).
2. **No human-in-the-loop state.** See `chatInputOverride` above.
3. **`AgentThinking.outcomeSummary` is required and unknowable.** We still fall
   back to the hardcoded string `'Analysis complete'`, which ships to users
   (backlog §4.4).
4. **Interleaved thinking → response → thinking** is not expressible: exactly one
   `AgentThinking` renders per assistant turn (backlog §4.3).
5. **`Tooltip` has no `size` prop** in this Ink snapshot, though protoLab's did.
   The `size="compact"` tooltips were dropped rather than fixing Ink from here.

## Files

```
patterns/IrisAgent/
├── IrisAgent.tsx              the pattern
├── IrisAgent.module.css       Ink-tokened, reduced-motion aware
├── types.ts                   ChatMessage, SendMeta, TaskCompletion, …
├── index.ts                   this folder's public exports
├── __fixtures__/
│   └── sampleConversation.ts  ≤80 LOC mock — replaces data/scenarios.ts (1,938 LOC)
└── README.md
```

`IrisAgent` is Tier 1 of the `@ai` barrel — `import { IrisAgent } from '@ai'`,
alongside `PanelShell` and `usePanelMode`.
