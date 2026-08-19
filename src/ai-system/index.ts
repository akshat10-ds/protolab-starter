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
export { usePanelMode, resolvePanelSize } from './hooks/usePanelMode';
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
  MessageBubbleProps,
  MessageBubbleVariant,
} from './primitives/MessageBubble/MessageBubble';

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

// -----------------------------------------------------------------------------
// Tier 2 · UNDECIDED — scaffolded, NOT designed. Will change or be removed.
// Do not rely on these for new work.
// -----------------------------------------------------------------------------

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

export { CommandMenu } from './composites/CommandMenu/CommandMenu';
export type {
  CommandMenuProps,
  CommandContextItem,
  CommandToolCategory,
  CommandToolChild,
} from './composites/CommandMenu/CommandMenu';

export { ZeroQueryActions } from './composites/ZeroQueryActions/ZeroQueryActions';
export type {
  ZeroQueryActionsProps,
  ZeroQueryActionItem,
  ZeroQueryActionKind,
  ZeroQueryPreview,
} from './composites/ZeroQueryActions/ZeroQueryActions';

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

export { ChatInput } from './composites/ChatInput/ChatInput';
export type {
  ChatInputProps,
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
export { ArtifactDock } from './patterns/ArtifactViewer/ArtifactDock';
export { ARTIFACT_RENDERERS } from './patterns/ArtifactViewer/artifactRenderers';
export type {
  ArtifactActionHandler,
  ArtifactDockProps,
  ArtifactItem,
  ArtifactRenderContext,
  ArtifactRenderer,
  ArtifactSection,
  ArtifactSource,
  ArtifactTable,
  ArtifactTableCell,
  ArtifactTableColumn,
  ArtifactTableRow,
  ArtifactTableStatus,
  ArtifactKind as ArtifactDockKind,
} from './patterns/ArtifactViewer/ArtifactDock';

export { sampleArtifactItems } from './patterns/ArtifactViewer/sampleArtifacts';

// =============================================================================
// Tier 3 and the unused Tier 2 parts are lab-only. Canonical source: akshat-lab/system/ai-system.
// =============================================================================
