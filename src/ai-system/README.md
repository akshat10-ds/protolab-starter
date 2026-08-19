> **Generated. Do not edit here.** This directory is a released copy of the used set of
> `akshat-lab/system/ai-system`, replaced wholesale by `/release-chat-to-protolab`. Edits made
> here are lost on the next release. The canonical source is Lab HQ.

# ai-system — the canonical AI/agent-experience design system

This is the **one canonical copy** of the AI/agent-experience design system for
Lab HQ. It is live-linked into every active prototype and released to
`protolab-starter` via `/release-chat-to-protolab`. Ported from `protoLab/src/ai-system`
on 2026-07-08.

It sits **on top of** the Ink design system: Ink provides the base UI (Button,
Input, Stack, Icon, DataTable, …); ai-system provides the agent layer
(MessageBubble, ChatPanel, AgentShell, AgentThinking, ArtifactPanel, …).

## What's here

```
ai-system/
├── tokens/       (reserved — AI-specific tokens; empty at port time)
├── primitives/   10  atomic AI components
├── composites/   15  composed AI components
├── patterns/      7  full agent-experience patterns
├── hooks/         4  behavior hooks
├── index.ts          public API (the @ai barrel)
└── README.md
```

- **Primitives (10):** MessageBubble, FeedbackActions, SuggestionChip,
  CitationBadge, GroupedCitationBadge, StreamingCursor, ToolCallCard,
  StatusIndicator, ContextPill, ArtifactCard.
- **Composites (15):** MarkdownRenderer, AgentThinking, ConversationLayout,
  ElicitationCard, ConversationList, CommandMenu, SkillsGrid, ActivityTimeline,
  RichResponse, PromptLibrary, ContextBar, WelcomeScreen, ChatInput,
  TaskCompletionCard, ExecutionTrace.
- **Patterns (7):** IrisSidebar, ArtifactViewer (+ AgreementView, SourceListView,
  SourceDiscoveryView), ArtifactPanel, ChatPanel, AgentShell, ScreenAwareAgent,
  DocumentViewer.
- **Hooks (4):** usePanelResize, useSemanticStreaming, useSmartScroll,
  useKeyboardShortcuts.

The system is exercised by the prototypes under
`projects/iris-system/prototypes/`, not by a separate showcase app.

## The import contract — `@ink` and `@ai`

ai-system does not own the Ink components; the **consuming app provides them**.
Every Ink import in this system is normalized to the alias **`@ink`**, and every
self-reference uses **`@ai`**. A consuming app must define both:

| Alias | Resolves to | Provided by |
|---|---|---|
| `@ink` | the app's vendored Ink `design-system/` | the consuming app |
| `@ai`  | this directory (`system/ai-system`)       | the consuming app |

```ts
// inside ai-system
import { Button, Stack, Icon } from '@ink';                 // Ink base UI
import { SuggestionChip } from '@ai';                        // sibling, via barrel
import { CommandMenu } from '@ai/composites/CommandMenu/CommandMenu'; // deep, when needed
```

CSS modules pull Ink tokens the same way:

```css
@import '@ink/1-tokens/tokens.css';
```

Each consumer wires this up in its own `vite.config.ts` (`resolve.alias`) and
`tsconfig.json` (`paths`) — the two alias entries. See `docs/consuming-ai-system.md`
("Consumer 1") for the exact config.

## Live-link mechanism (spec Q1 — decided: Vite alias, not pnpm workspace)

The spec left the live-link mechanism open (pnpm workspace vs Vite alias). **We
chose the Vite alias**, because:

1. **ai-system is consumed as source, not as a built package.** There is no build
   step, no `dist/`, no `package.json` of its own — it's `.tsx` + CSS modules that
   the app's own Vite/SWC pipeline compiles. A workspace package would add
   indirection (build, `exports` map, watch) for zero benefit.
2. **The link crosses the app root.** `@ai` points *above* a consuming
   prototype to `system/ai-system/`. A single Vite alias plus `server.fs.allow`
   handles this cleanly; a workspace would need symlink + `optimizeDeps` exclusions.
3. **Edit-once-updates-everywhere is already satisfied.** Because the alias
   points at the real source directory, editing `ChatPanel.tsx` here updates
   every active prototype's dev server on save — exactly the spec's requirement,
   with no publish step.

So the live link is **two alias entries** (`@ink`, `@ai`) that each active
prototype declares in its Vite + TS config. A prototype is frozen only by
deliberately replacing the `@ai` alias with a vendored copy — never automatically.

## Import adaptations made during the port

All Ink **value** imports the system needs (Button, Icon, DataTable, Dropdown,
FilterBar, LocalNav, Avatar, Text, Tooltip, …) already exist in
`protolab-starter`'s `design-system` barrel — no adaptation needed.

Three **type-only** imports were used by the system but not surfaced through the
Ink barrel (they live on the components but weren't re-exported):

| Type | Lives on | Used by |
|---|---|---|
| `DataTableColumn` | `5-patterns/DataTable/types` | ArtifactViewer/SourceDiscoveryView |
| `LocalNavProps` | `5-patterns/LocalNav/LocalNav` | IrisSidebar |
| `DropdownItemProps` | `4-composites/Dropdown/Dropdown` | IrisSidebar, ConversationList, CommandMenu |

**Resolution:** surfaced them through the Ink barrel as `export type { … }`.
Nothing was vendored or forked — the types genuinely belong to the Ink
components; they just needed to be public. When `/release-chat-to-protolab` copies this system into
`protolab-starter`, add the same three `export type` lines to the starter's
`design-system/index.ts`.

No missing Ink **components** were found; nothing had to be vendored into
ai-system.

## Rules

1. **Build on Ink.** Use `@ink` components for base UI; never re-implement them.
2. **No hardcoded colors.** Use Ink tokens (`var(--ink-*)`) via
   `@import '@ink/1-tokens/tokens.css'`.
3. **Consume the public API.** Prototypes import from `@ai` (barrel), not from a
   layer's internals.
4. **Add to the system, don't fork it.** If a prototype needs a new agent piece,
   add it here so the live link propagates it everywhere.
