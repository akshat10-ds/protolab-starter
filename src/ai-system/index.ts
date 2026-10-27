import '@ink';
/**
 * AI System — Agent Experience Design System
 *
 * Built on top of the Ink Design System.
 *
 * ┌─ TIER 1 — COMPOSE ────────── the 95% path. Start here, and usually stop here.
 * ├─ TIER 2 — BUILD ──────────── the parts, for extending the system itself.
 * └─ TIER 3 — DEPRECATED ─────── superseded. Never import these.
 *
 * ============================================================================
 * Tier 1, in full
 * ============================================================================
 *
 * Three exports compose a complete agent surface that lives beside a host page
 * and reflows it. `IrisAgent` is the chat; `PanelShell` is the container;
 * `usePanelMode` is the state machine between them. The panel is a **sibling**
 * of the host page, never its parent — that inversion is what makes the push
 * layout possible.
 *
 * **The three of them are the whole chat app, not a shell you finish.** Akshat,
 * 2026-08-18: *"I have to ship the entire chat app — to sort of let all the
 * behaviors be known."* So the cold state's sequence, the onboarding checklist's
 * memory, the insight cards, the nav pages and the artifact dock all run inside
 * these three. A host supplies content and fixtures; it supplies no behaviour.
 *
 * ```tsx
 * import { IrisAgent, PanelShell, usePanelMode } from '@ai';
 *
 * function AgreementsPage() {
 *   const panel = usePanelMode({ sidebarWidth: 360 });
 *   const [messages, setMessages] = useState<ChatMessage[]>([]);
 *
 *   return (
 *     <div style={{ display: 'flex', height: '100vh' }}>
 *       <main style={panel.hostStyle}>
 *         <AgreementsTable onAskIris={panel.open} />
 *       </main>
 *
 *       <PanelShell {...panel.shellProps}>
 *         <IrisAgent
 *           layout="compact"
 *           isFullscreen={panel.mode === 'fullscreen'}
 *           messages={messages}
 *           onSendMessage={handleSend}
 *           customSuggestions={COLD_ROWS}
 *           getStarted={{ steps: GET_STARTED_STEPS }}
 *           navPages={NAV_PAGES}
 *           artifact={panel.artifact}
 *           artifacts={ALL_ARTIFACTS}
 *           onFullscreen={panel.toggleFullscreen}
 *           onClose={panel.close}
 *         />
 *       </PanelShell>
 *     </div>
 *   );
 * }
 * ```
 *
 * `panel.hostStyle` gives the host `width: calc(100% - Npx)` and the transition
 * that mirrors the panel's. `onFullscreen` points **up**: IrisAgent renders the
 * affordance and reports the intent; it never resizes itself. `panel.setMode`
 * is callable from anywhere, including deep inside artifact content.
 *
 * `panel.artifact` is the dock's machine, and it lives on the hook because
 * opening an artifact has to reach `setMode` — a 420px dock does not fit beside
 * the chat in a 360px sidebar, so it goes fullscreen first.
 *
 * Reach into Tier 2 when you are building the system itself, or when a prototype
 * genuinely needs a piece Tier 1 does not compose. Never import Tier 3.
 */

// =============================================================================
// TIER 1 — COMPOSE
//
// The front door. A composed surface, a container, and the machine between them.
// Importing these three is the supported way to put an agent on a page.
// =============================================================================

// The full agent chat surface. Conversation state is controlled by the consumer.
export { IrisAgent } from './patterns/IrisAgent/IrisAgent';
/*
  The canonical `+` menu, exported so a host can SPREAD AND EXTEND it — the
  agents branch, for one, lists whichever agents an account actually has, which
  is host data. Replace the entry you own and leave the rest byte-identical;
  redesigning the menu is not the host's job.
*/
export {
  DEFAULT_COMMAND_CONTEXT_ITEMS,
  DEFAULT_COMMAND_TOOL_CATEGORIES,
} from './patterns/IrisAgent/IrisAgent';
export type {
  IrisAgentProps,
  IrisAgentLayout,
  NavPageContext,
  NavPageEntry,
  GetStartedStep,
  IrisGetStarted,
  IrisInsight,
} from './patterns/IrisAgent/IrisAgent';
export type {
  AgentOption,
  AgreementRef,
  CanvasContext,
  ChatMessage,
  CommandMeta,
  ContextSource,
  CustomSuggestion,
  FollowUp,
  InlineResultRow,
  InlineResults,
  MessageRole,
  SendMeta,
  SuggestionCategory,
  TaskCompletion,
} from './patterns/IrisAgent/types';

// The panel's DOM. Sibling-mountable; `children` is the panel's contents, never
// the host page. Zero-width (not unmounted) when closed, so content state survives.
export { PanelShell } from './patterns/PanelShell/PanelShell';
export type { PanelShellProps } from './patterns/PanelShell/PanelShell';

// The mode machine: closed | sidebar | fullscreen, restore memory, host reflow.
export {
  usePanelMode,
  resolvePanelSize,
  THREE_COLUMN_MIN_WIDTH,
  THREE_COLUMN_MIN_HOST_WIDTH,
} from './hooks/usePanelMode';
export type {
  PanelMode,
  PanelArtifactState,
  PanelEdge,
  PanelSize,
  PanelHandleProps,
  PanelShellState,
  UsePanelModeOptions,
  UsePanelModeReturn,
} from './hooks/usePanelMode';

// =============================================================================
// TIER 2 — BUILD
//
// The decided parts Tier 1 composes, plus the scaffolding around them. Import
// from here when you are extending the system, or when a prototype needs a
// piece the composed surface does not expose.
//
// The DECIDED / UNDECIDED split below is preserved from the old barrel and still
// means what it meant: only DECIDED components have been through the
// exploration → decided pipeline and are spec-accurate.
// =============================================================================

// -----------------------------------------------------------------------------
// Tier 2 · DECIDED — through the exploration → decided pipeline
// -----------------------------------------------------------------------------

// Messages (decided 2026-03-18)
export { MessageBubble } from './primitives/MessageBubble/MessageBubble';
export type {
  AnswerPair,
  MessageBubbleProps,
  MessageBubbleVariant,
} from './primitives/MessageBubble/MessageBubble';

// Live work (decided 2026-08-19) — the sweep a surface takes while the agent
// is running on it. One signal, wherever work is live.
export { Shimmer } from './primitives/Shimmer/Shimmer';
export type { ShimmerProps } from './primitives/Shimmer/Shimmer';

// The agent's MARK, and the tunnel it throws while it works — Akshat's
// `sparkleTunnel` Lottie, ported to SVG + CSS with no player and no dependency
// (2026-08-24: "I think this is a spark animation that I want to use"). The
// static Ink glyph is its floor, so `active={false}` is the mark every surface
// already draws. Use it anywhere `ai-spark-filled` stands for work in flight —
// the run chip does, and a host's own "Working on…" line should.
export { Spark } from './primitives/Spark/Spark';
export type { SparkProps } from './primitives/Spark/Spark';

// Feedback (decided 2026-03-18)
export { FeedbackActions } from './primitives/FeedbackActions/FeedbackActions';
export type {
  FeedbackActionsProps,
  FeedbackState,
} from './primitives/FeedbackActions/FeedbackActions';

// Suggestions (decided 2026-03-18)
export { SuggestionChip } from './primitives/SuggestionChip/SuggestionChip';
export type { SuggestionChipProps } from './primitives/SuggestionChip/SuggestionChip';

// Responses (decided 2026-03-18)
export { MarkdownRenderer } from './composites/MarkdownRenderer/MarkdownRenderer';
export type { MarkdownRendererProps } from './composites/MarkdownRenderer/MarkdownRenderer';

// Streaming responses — the composite the prototype proved it needed
// (it hand-rolled this over MarkdownRenderer; see backlog §5, Layer 3).
export { StreamingMarkdown } from './composites/StreamingMarkdown/StreamingMarkdown';
export type { StreamingMarkdownProps } from './composites/StreamingMarkdown/StreamingMarkdown';

// Thinking/Reasoning (decided 2026-03-18)
export { AgentThinking } from './composites/AgentThinking/AgentThinking';
export type {
  AgentThinkingProps,
  AgentStep,
  StepKind,
} from './composites/AgentThinking/AgentThinking';

// Citation Badge (decided 2026-03-18)
export { CitationBadge } from './primitives/CitationBadge/CitationBadge';
export type { CitationBadgeProps, Citation } from './primitives/CitationBadge/CitationBadge';

// Grouped Citation Badge (decided 2026-03-18)



// Conversation Layout (decided 2026-03-18)
export { ConversationLayout } from './composites/ConversationLayout/ConversationLayout';
export type {
  ConversationLayoutProps,
  UserTurnProps,
  AssistantTurnProps,
  SuggestionsProps,
} from './composites/ConversationLayout/ConversationLayout';

// Iris Sidebar (decided 2026-03-18)
export { IrisSidebar } from './patterns/IrisSidebar/IrisSidebar';
export type {
  IrisSidebarProps,
  NavShortcut,
  ConversationItem,
  ConversationGroup,
} from './patterns/IrisSidebar/IrisSidebar';

// Elicitation Card (decided 2026-04-27)



// Supporting primitives used by decided components



// -----------------------------------------------------------------------------
// Tier 2 · UNDECIDED — scaffolded, NOT designed. Will change or be removed.
// Do not rely on these for new work.
// -----------------------------------------------------------------------------

// Controlled call chrome; audio and session lifecycle remain host-owned.



// Hooks (undecided)
export { usePanelResize } from './hooks/usePanelResize';
export type {
  UsePanelResizeOptions,
  UsePanelResizeReturn,
  ResizeDirection,
} from './hooks/usePanelResize';

export { useSemanticStreaming } from './hooks/useSemanticStreaming';
export type {
  UseSemanticStreamingOptions,
  UseSemanticStreamingReturn,
  StreamingPhase,
} from './hooks/useSemanticStreaming';

export { useSmartScroll } from './hooks/useSmartScroll';
export type { UseSmartScrollOptions, UseSmartScrollReturn } from './hooks/useSmartScroll';




// Primitives (undecided)












// Composites (undecided)



export { CommandMenu } from './composites/CommandMenu/CommandMenu';
export type {
  CommandMenuProps,
  CommandContextItem,
  CommandToolCategory,
  CommandToolChild,
} from './composites/CommandMenu/CommandMenu';




export { ZeroQueryActions, SUGGESTION_ICON } from './composites/ZeroQueryActions/ZeroQueryActions';
export type {
  ZeroQueryActionsProps,
  ZeroQueryActionItem,
  ZeroQueryActionKind,
  ZeroQueryPreview,
} from './composites/ZeroQueryActions/ZeroQueryActions';

// An agent RUN inside a thread, as one row that stays: ticking activity and
// elapsed while it works, generic counts and a duration once it lands, and the
// resolved row is the door to that run's slice of the record. Akshat,
// 2026-08-20: "agent work is a chip in the thread; the chip opens the record."
//
// Give it `lines` + `expandable` and the door leads inward instead — the row
// expands in place onto the run's own thinking, and stays after the run lands
// as the collapsed receipt. Akshat, 2026-08-24: "a little box that shows that
// the agent is working on thinking on this. If I click on it, I can expand and
// see the thinking, but otherwise it could just show us that it's working."
// Chips without `lines` keep the 2026-08-20 contract unchanged.
export { RunChip } from './composites/RunChip/RunChip';
export type { RunChipData, RunChipProps } from './composites/RunChip/RunChip';

export { NavPage } from './composites/NavPage/NavPage';
export type { NavPageProps } from './composites/NavPage/NavPage';

export { GetStarted } from './composites/GetStarted/GetStarted';
export type { GetStartedProps, GetStartedItem } from './composites/GetStarted/GetStarted';

// The findings the surface already made, as cards you can open a conversation
// about — Akshat: "we can do an insights list for this page", "sort of like
// gmail suggested tasks".
export { InsightList } from './composites/InsightList/InsightList';
export type { InsightListProps, Insight } from './composites/InsightList/InsightList';

export { AgreementSnapshot } from './composites/AgreementSnapshot/AgreementSnapshot';
export type { AgreementSnapshotProps } from './composites/AgreementSnapshot/AgreementSnapshot';

// The progress surface, in three parts, from 2026-08-19. Akshat deferred their
// promotion, so they sit here: the receipt is the ONE line the zero-query state
// shows once the agent has run; the strip is the standing door above the
// composer after that; the card is one recommendation, small, with its object
// preview in the dock rather than inside it. The artifact they all open is the
// `process` renderer in `ARTIFACT_RENDERERS`.



// The section label row of the zero-query cold state — what this section is,
// and a hover-revealed text link to where the rest of it lives. The whole
// section is the hover scope, so the receipt reveals its own "View details".






// The handoff row. A block whose contents are filling the artifact pane
// collapses to its own header line, takes the indigo tint, and becomes the
// control that closes the pane — the search results card's grammar, extracted
// so the receipt and the recommendation preview say it the same way.
export { CollapsedHandoff } from './composites/CollapsedHandoff/CollapsedHandoff';
export type { CollapsedHandoffProps } from './composites/CollapsedHandoff/CollapsedHandoff';

// One thing the agent thinks you should do next. `layout="full"` is the card as
// shipped and is still the default; `layout="brief"` is the 2026-08-24 redesign
// — Akshat's own drawing (typed eyebrow, title loudest) with what the
// loan-officer and CPO reviews demanded added to it: ONE always-visible line of
// why, accept and decline as PEERS (same row, same size, same register — never
// one a button and the other a link, never an X), an overflow for the rest, a
// required decline reason where the host marks the finding consequential, and a
// press on the words that opens the rationale, the itemized checks with the
// values in effect, and the policy citation. That last one is the CPO's "which
// eight rules" — asserted everywhere and, until now, answerable nowhere.
//
// Three opt-ins shape the same anatomy for a quieter host (2026-08-24): omit
// `meta` and the icon leads the title on one row instead of an eyebrow of its
// own; `overflowPlacement="top"` pins the `⋯` to that row's right corner; and
// `actionRegister="text"` draws the two peers in the card's quiet label register
// rather than as Ink chips. Absent all three, the card is byte-for-byte what it
// was.
export { RecommendationCard } from './composites/RecommendationCard/RecommendationCard';
export type {
  RecommendationCardProps,
  RecommendationCheck,
  RecommendationMenuItem,
} from './composites/RecommendationCard/RecommendationCard';

// The agent's human-in-the-loop ask, from Akshat's HITL spec (2026-08-19). It
// docks into the composer area — pass it to `IrisAgent`'s `ask` prop, which
// hands it the composer and empties the strip slot for the duration. Supersedes
// `ElicitationCard`, the thread-card drawing of the same idea.


















export { ChatInput } from './composites/ChatInput/ChatInput';
export type {
  ChatInputProps,
  ChatInputAgentChip,
  ChatInputContextSource,
  ChatInputMentionItem,
} from './composites/ChatInput/ChatInput';







export { AgentActivity } from './composites/AgentActivity/AgentActivity';
export type {
  AgentActivityProps,
  AgentRun,
  AgentRunEvent,
  AgentRunStatus,
} from './composites/AgentActivity/AgentActivity';
export { SAMPLE_AGENT_RUNS } from './composites/AgentActivity/sampleRuns';

// Patterns (undecided)
export { ArtifactViewer } from './patterns/ArtifactViewer/ArtifactViewer';
export type {
  ArtifactViewerProps,
  ArtifactViewerType,
} from './patterns/ArtifactViewer/ArtifactViewer';

export { AgreementView } from './patterns/ArtifactViewer/AgreementView';
export type { AgreementViewProps, AgreementSection } from './patterns/ArtifactViewer/AgreementView';

export { SourceListView } from './patterns/ArtifactViewer/SourceListView';
export type { SourceListViewProps, SourceItem } from './patterns/ArtifactViewer/SourceListView';

// Where a source COMES FROM. `SourceListView` reviews what is attached; this is
// the surface you pick from — search, filters, a selectable table, and a footer
// count whose commit is drawn-but-disabled at zero.
//
// `variant="picker"` is the shape shipping Iris draws (observed 2026-08-24), and
// `SourcePickerModal` is that shape in the centered "Add Sources" dialog Ink's
// `Modal` gives it. The host owns the `open` boolean, which is what lets the
// composer's `+ → Add from Navigator` and the get-started checklist's "Add a
// source" reach the same surface. Committing hands back the selected ids; the
// host puts them in `IrisAgent`'s `agreements`.






export { DocumentViewer } from './patterns/DocumentViewer/DocumentViewer';
export type {
  DocumentViewerProps,
  DocumentPage,
  DocumentHighlight,
} from './patterns/DocumentViewer/DocumentViewer';

// Artifact column — the artifact surface for IrisAgent's host-owned
// `artifactSlot` (successor to the deprecated Tier 3 ArtifactPanel).
export { ArtifactColumn } from './patterns/ArtifactViewer/ArtifactColumn';
export type {
  ArtifactColumnProps,
  Artifact,
  ArtifactKind,
} from './patterns/ArtifactViewer/ArtifactColumn';

export {
  sampleAgreementArtifacts,
  sampleArtifactCitations,
  sampleArtifactMessage,
} from './patterns/ArtifactViewer/sampleArtifacts';

// Artifact dock — the ONE right-hand surface for every artifact: markdown,
// tables, agreements, source lists, and (declared, not drawn) visualizations.
// Akshat: "we'll use that for all artifacts I don't like the current
// implementation." It wears the same box as IrisAgent's docked left menu, and
// it draws one frame with one close and one back arrow, replacing the three
// components that used to stack their own chrome in `artifactSlot`.
//
// Its kind union is a superset of `ArtifactColumn`'s and is exported as
// `ArtifactDockKind`, because the barrel already gives the name `ArtifactKind`
// to the column's two-value union.
//
// The dock is a FRAME with PLUGGABLE RENDERERS — Akshat, 2026-08-13: "the pane
// is sort of like the artifacts panel can be used dynamically for showing
// agreements, showing a document editor, showing data tables, etc." The frame
// owns the box, the universal 73px header and the tab strip; a renderer owns
// everything below, including its own optional 48px toolbar. `ArtifactRenderer`
// and `ArtifactRenderContext` are that contract; `ARTIFACT_RENDERERS` is the
// map from kind to renderer, and the only place a kind is named.
//
// A `document` ITEM CARRIES TWO THINGS THE PROSE MODEL COULD NOT, both opt-in
// and both system capabilities as of 2026-08-24:
//
//   `ArtifactSection.content`   a rendered block in place of `body`. A page of
//                               a document is not always paragraphs — a 1003
//                               and a bank statement are label/value grids —
//                               and this is how one wears the real 783px page
//                               instead of a host re-hosting its CSS.
//   `ArtifactItem.highlights`   FIELD-LEVEL CITATION. `section.highlighted`
//                               tints a whole section and cannot be smaller
//                               than one; these are `DocumentHighlight` boxes
//                               over the page, in percentages of its CONTENT
//                               box, so page layout and citation measure one
//                               box. Same shape `DocumentViewer` uses.
//
// `paneWidthFor` and `PANE_SIZE` come out with them: the pane's opening width
// is the ARTIFACT's property, not the pane's, so a host that mounts its own
// dock in `artifactSlot` spends the system's dose rather than three copied
// numbers.
export { ArtifactDock } from './patterns/ArtifactViewer/ArtifactDock';
export {
  ARTIFACT_RENDERERS,
  PANE_SIZE,
  paneWidthFor,
} from './patterns/ArtifactViewer/artifactRenderers';
export type { PaneSize } from './patterns/ArtifactViewer/artifactRenderers';
export type {
  ArtifactActionHandler,
  ArtifactDockProps,
  ArtifactItem,
  ArtifactRenderContext,
  ArtifactRenderer,
  ArtifactProcess,
  ArtifactProcessStep,
  ArtifactRecommendation,
  ArtifactSection,
  ArtifactSource,
  ArtifactTable,
  ArtifactTableCell,
  ArtifactTableColumn,
  ArtifactTableRow,
  ArtifactTableStatus,
  ArtifactKind as ArtifactDockKind,
} from './patterns/ArtifactViewer/ArtifactDock';

// The `process` renderer — a run's stepper, the current step's bullets, and a
// collapsible Recommendations (N). Registered in `ARTIFACT_RENDERERS`; exported
// so the system's own surfaces can compose it directly.
export { ProcessArtifact } from './patterns/ArtifactViewer/ProcessArtifact';

export { sampleArtifactItems } from './patterns/ArtifactViewer/sampleArtifacts';

// =============================================================================
// TIER 3 — DEPRECATED / SUPERSEDED
//
// Never consumed by any prototype. `iris-agent/` and `iris-panel/` imported none
// of these and rebuilt all three inline — 520 LOC of pattern code that never ran
// (see `projects/iris-system/notes/2026-07-09-diff-extract-backlog.md` §1, §2.2).
// `PanelShell` + `IrisAgent` are what the prototype actually proved.
//
// **These are demoted, not deleted.** They shipped to the team's starter in
// release `ai-system-v0.1.0`, and deleting them here would silently remove them
// from the starter's next release. They stay exported until a major bump gives
// their consumers a migration.
// =============================================================================

/** @deprecated Superseded by {@link IrisAgent}. Never consumed by any prototype (see projects/iris-system/notes/2026-07-09-diff-extract-backlog.md §1). Retained for the starter's v0.1.0 consumers; will be removed in a future major. */

/** @deprecated Superseded by {@link IrisAgent}. Never consumed by any prototype (see projects/iris-system/notes/2026-07-09-diff-extract-backlog.md §1). Retained for the starter's v0.1.0 consumers; will be removed in a future major. */


/** @deprecated Superseded by {@link PanelShell}. Never consumed by any prototype (see projects/iris-system/notes/2026-07-09-diff-extract-backlog.md §1). AgentShell takes the host page as `children`, so no page it hosts can ever reflow around a panel. Retained for the starter's v0.1.0 consumers; will be removed in a future major. */

/** @deprecated Superseded by {@link PanelShell}. Never consumed by any prototype (see projects/iris-system/notes/2026-07-09-diff-extract-backlog.md §1). Retained for the starter's v0.1.0 consumers; will be removed in a future major. */


/** @deprecated Superseded by {@link IrisAgent}'s host-owned `artifactSlot`. Never consumed by any prototype — both rebuilt it inline and disagreed on its width (see projects/iris-system/notes/2026-07-09-diff-extract-backlog.md §1, §2.2). Retained for the starter's v0.1.0 consumers; will be removed in a future major. */

/** @deprecated Superseded by {@link IrisAgent}'s host-owned `artifactSlot`. Never consumed by any prototype (see projects/iris-system/notes/2026-07-09-diff-extract-backlog.md §1). Retained for the starter's v0.1.0 consumers; will be removed in a future major. */


// Unused parts remain lab-only. Canonical source: akshat-lab/system/ai-system.
