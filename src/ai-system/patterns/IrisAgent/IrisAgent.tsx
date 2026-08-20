/**
 * IrisAgent — the full agent chat surface.
 *
 * Composes the decided pieces (ConversationLayout, MessageBubble, AgentThinking,
 * MarkdownRenderer, StreamingMarkdown, FeedbackActions, SuggestionChip,
 * ChatInput, IrisSidebar) into a complete conversational experience: cold state,
 * live turn, history rail, and a host-owned artifact surface.
 *
 * **Conversation state is controlled.** The consumer owns `messages` and
 * `isLoading`/`isStreaming`, and handles `onSendMessage`. IrisAgent owns only
 * presentation state — which turns have finished animating, sidebar lock,
 * input text, the header title.
 *
 * **IrisAgent does not own its relationship to the host page.** `layout`
 * describes internal composition only (is the sidebar docked? is this a single
 * narrow column?). Whether Iris lives in a resizable side panel, fills the
 * viewport, or sits at a route is `PanelShell`'s question. `onFullscreen` is an
 * upward callback: IrisAgent renders the affordance and reports the intent.
 *
 * Extracted from `protoLab/src/prototypes/iris-agent/index.tsx` (2,937 LOC,
 * frozen). See README.md for what was dropped and why.
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Icon,
  IconButton,
  IrisIcon,
  Dropdown,
  Tooltip,
  Button,
  DataTable,
  Badge,
} from '@ink';
import type { DataTableColumn, DropdownItemProps } from '@ink';

import { ChatInput } from '@ai/composites/ChatInput/ChatInput';
import type {
  ChatInputContextSource,
  ChatInputMentionItem,
} from '@ai/composites/ChatInput/ChatInput';
import type {
  CommandContextItem,
  CommandToolCategory,
  CommandToolChild,
} from '@ai/composites/CommandMenu/CommandMenu';
import { MarkdownRenderer } from '@ai/composites/MarkdownRenderer/MarkdownRenderer';
import { StreamingMarkdown } from '@ai/composites/StreamingMarkdown/StreamingMarkdown';
import { AgentThinking } from '@ai/composites/AgentThinking/AgentThinking';
import { ConversationLayout } from '@ai/composites/ConversationLayout/ConversationLayout';
import { ZeroQueryActions } from '@ai/composites/ZeroQueryActions/ZeroQueryActions';
import type {
  ZeroQueryActionItem,
  ZeroQueryPreview,
} from '@ai/composites/ZeroQueryActions/ZeroQueryActions';
import { HeaderMenu } from './HeaderMenu';
import { MessageBubble } from '@ai/primitives/MessageBubble/MessageBubble';
import { FeedbackActions } from '@ai/primitives/FeedbackActions/FeedbackActions';
import { SuggestionChip } from '@ai/primitives/SuggestionChip/SuggestionChip';
import type { Citation } from '@ai/primitives/CitationBadge/CitationBadge';
import { IrisSidebar } from '@ai/patterns/IrisSidebar/IrisSidebar';
import type { ConversationGroup, NavShortcut } from '@ai/patterns/IrisSidebar/IrisSidebar';
import { useSmartScroll } from '@ai/hooks/useSmartScroll';
import type { PanelArtifactState } from '@ai/hooks/usePanelMode';
import { GetStarted } from '@ai/composites/GetStarted/GetStarted';
import { InsightList } from '@ai/composites/InsightList/InsightList';
import type { Insight } from '@ai/composites/InsightList/InsightList';
import { AgreementSnapshot } from '@ai/composites/AgreementSnapshot/AgreementSnapshot';
import type { AgreementSnapshotProps } from '@ai/composites/AgreementSnapshot/AgreementSnapshot';
import { ArtifactDock } from '@ai/patterns/ArtifactViewer/ArtifactDock';
import type {
  ArtifactActionHandler,
  ArtifactItem,
} from '@ai/patterns/ArtifactViewer/ArtifactDock';

import type {
  AgentOption,
  AgreementRef,
  CanvasContext,
  ChatMessage,
  ContextSource,
  CustomSuggestion,
  InlineResultRow,
  InlineResults,
  SendMeta,
  SuggestionCategory,
} from './types';

/*
 * Iris's own brand art, three files for three jobs. It ships WITH the pattern
 * rather than being handed in: a composed surface has to look like itself with
 * no art props at all, or every host re-supplies the same three images and the
 * one that forgets falls back to a glyph.
 *
 * `iris-bloom` is the wide crop the cold-state frame uses — it only works large,
 * because it is a fragment of a bigger pattern. `iris-mark` is the complete
 * 576-square figure, which is the one that survives being shrunk to 88px for the
 * thinking state. Scaling the crop down produced an illegible tangle.
 * `iris-wordmark` is the horizontal lockup the header rests on.
 */
import irisBloom from './art/iris-bloom.svg';
import irisMark from './art/iris-mark.svg';
import irisWordmark from './art/iris-wordmark.svg';

import styles from './IrisAgent.module.css';

// =============================================================================
// Layout
// =============================================================================

/**
 * Internal composition only — never the host relationship.
 *
 * - `sidebar` — history rail docked inline, wide content column. (was `'full'`)
 * - `single-column` — history rail becomes an overlay drawer, wide content column.
 * - `compact` — overlay drawer, narrow column, compacted header. (was `'panel'`)
 */
export type IrisAgentLayout = 'sidebar' | 'single-column' | 'compact';

// =============================================================================
// Defaults — every one of these was a hardcoded constant in the prototype
// =============================================================================

// The Ink barrel exports these components but not their prop unions, so we
// recover the ones we need from the components themselves rather than widen to `any`.
type IconNameLike = React.ComponentProps<typeof Icon>['name'];
type BadgeKind = React.ComponentProps<typeof Badge>['kind'];

const DEFAULT_PLACEHOLDER_HINTS = [
  'Ask anything',
  'Use /command to invoke shortcuts and agents',
  'Use @mention to add context',
];

const DEFAULT_DISCLAIMER = 'Responses are generated with AI and are not legal advice.';

/**
 * The canonical `+` command menu (host-contract rule 6b). Ships as IrisAgent's
 * default so the affordance to bring context into a conversation has one shape
 * on every surface. A host extends the *corpus* (which agreements/parties exist)
 * by passing its own items; it does not redesign the menu. Exported so consumers
 * can spread and extend rather than re-declare.
 *
 * Provenance: the decided set from the protoLab iris-agent CommandMenu
 * exploration.
 */
export const DEFAULT_COMMAND_CONTEXT_ITEMS: CommandContextItem[] = [
  { id: 'upload', icon: 'paperclip', label: 'Upload agreements' },
  { id: 'navigator', icon: 'plus', label: 'Add from Navigator' },
  { id: 'party', icon: 'people', label: 'Add a party' },
];

export const DEFAULT_COMMAND_TOOL_CATEGORIES: CommandToolCategory[] = [
  {
    id: 'skills',
    icon: 'templates',
    label: 'Skills',
    children: [
      { id: 's1', icon: 'templates', label: 'Search Documents', description: 'Find across your agreements' },
      { id: 's2', icon: 'templates', label: 'Analyze Data', description: 'Summarize and compare' },
      { id: 's3', icon: 'templates', label: 'Web Search', description: 'Look up outside sources' },
      { id: 's4', icon: 'templates', label: 'Extract Clauses', description: 'Pull specific terms' },
    ],
  },
  {
    id: 'agents',
    icon: 'wrench',
    label: 'Agents',
    children: [
      { id: 'a1', icon: 'wrench', label: 'Review Agent', description: 'Review an agreement' },
      { id: 'a2', icon: 'wrench', label: 'Draft Agent', description: 'Draft a document' },
      { id: 'a3', icon: 'wrench', label: 'Risk Agent', description: 'Assess risk' },
    ],
  },
  {
    id: 'playbooks',
    icon: 'book-open',
    label: 'Playbooks',
    children: [
      { id: 'pb1', icon: 'book-open', label: 'Review Agreement', description: 'Run the review playbook' },
      { id: 'pb2', icon: 'book-open', label: 'Risk Assessment', description: 'Run the risk playbook' },
      { id: 'pb3', icon: 'book-open', label: 'Compare Terms', description: 'Compare across documents' },
    ],
  },
];

const DEFAULT_INLINE_RESULT_COLUMNS: DataTableColumn<InlineResultRow>[] = [
  { key: 'name', header: 'Name', width: '45%', sortable: true },
  { key: 'type', header: 'Type', width: '22%' },
  {
    key: 'status',
    header: 'Status',
    width: '18%',
    cell: (row: InlineResultRow) => {
      const kind: BadgeKind =
        row.status === 'Active' ? 'success' : row.status === 'Expiring' ? 'warning' : 'subtle';
      return <Badge kind={kind} text={row.status} />;
    },
  },
  { key: 'date', header: 'Date', width: '15%' },
];

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Fires `onComplete` after a beat when a turn has no markdown to stream.
 *
 * This exists because `useSemanticStreaming` has no empty-content path — an
 * assistant turn with only plain `content` would otherwise never report
 * completion, and its FeedbackActions would never appear. The right fix is in
 * the hook (backlog §5, Layer 3); until then this stays private to IrisAgent.
 */
function CompleteOnMount({ onComplete }: { onComplete: () => void }) {
  // Held in a ref so a re-render mid-countdown doesn't restart the timer —
  // the prototype's version listed `onComplete` as a dep and reset on every
  // parent render.
  const callbackRef = useRef(onComplete);
  callbackRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => callbackRef.current(), 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

// =============================================================================
// The orchestration model
//
// Everything below is a piece of the chat app IrisAgent runs, rather than a
// piece of chrome the host draws. Akshat, 2026-08-18: *"I have to ship the
// entire chat app — to sort of let all the behaviors be known."* So the cold
// state's sequence, the checklist's memory, the insight cards' dismissal, the
// nav pages and the artifact dock are all IrisAgent's now. The host supplies
// content and fixtures; it no longer supplies behaviour.
// =============================================================================

/** A step in the onboarding checklist. IrisAgent owns whether it is complete. */
export interface GetStartedStep {
  id: string;
  label: string;
  /** Glyph from the host's Ink snapshot. Without one the row loses its lead box. */
  icon?: string;
  /** The step asks something: IrisAgent sends this and marks the step done. */
  query?: string;
  /** The step opens a surface instead. Runs in place of a send. */
  onOpen?: () => void;
  /** The step opens one of `navPages`, by id. IrisAgent owns which page is up. */
  opens?: string;
}

/**
 * The onboarding checklist.
 *
 * ONE THING AT A TIME on a first open — Akshat, 2026-08-18: *"I don't need to
 * see the get started, the zero query and suggestion cards all at once — let's
 * just show the get started… if you dismiss then you see the zero query."* That
 * is `sequence`, and it is the default: the checklist is the whole cold state
 * until it is dismissed, and the suggestion rows arrive when it leaves.
 *
 * IrisAgent holds the three pieces of state the card cannot: which steps are
 * done, whether it was dismissed, and the epoch that brings it back. A
 * "Get started" shortcut is appended to `navShortcuts` automatically, because
 * a card that has hidden itself cannot be the way back to itself.
 */
export interface IrisGetStarted {
  steps: GetStartedStep[];
  title?: string;
  variant?: 'rows' | 'inline' | 'next';
  marker?: 'check' | 'number';
  /**
   * The checklist replaces the suggestion rows until it is dismissed. Default
   * true. Pass false for the both-at-once state, which is now a comparison
   * only.
   */
  sequence?: boolean;
  tryLabel?: string;
  dismissLabel?: string;
}

/**
 * A finding the surface already made, with the question it opens.
 *
 * `query` is the whole question, not the title — Poonam, 2026-08-11: a
 * suggestion is a prompt, not a subject. IrisAgent sends it with the title as
 * the display label, so the answer lands in the chat like any other turn.
 * Dismissal is IrisAgent's; a finding has no done state.
 *
 * Insights are OFF unless the host passes them, and they are suppressed on a
 * single agreement — corpus findings are about a set the user is not looking at.
 */
export interface IrisInsight extends Omit<Insight, 'onAction' | 'onDismiss'> {
  query: string;
}

/**
 * A host page rendered in place of the conversation — Prompt Library, Agents,
 * Activity. IrisAgent owns which one is open: a `navShortcuts` entry whose `id`
 * matches opens it, the header names it, the back arrow leaves it, and anything
 * that puts a conversation back on screen clears it.
 */
export interface NavPageEntry {
  /** Matches the `navShortcuts` id that opens this page. */
  id: string;
  /** Named in the compact header while the page is up. */
  title?: string;
  /** The hamburger section whose "View all" lands here. */
  menuSection?: 'prompts' | 'agents' | 'history';
  render: (ctx: NavPageContext) => React.ReactNode;
}

// =============================================================================
// Props
// =============================================================================

/** What `navPageSlot`'s function form is handed — the composer's preview channel. */
export interface NavPageContext {
  onPreview: (preview: ZeroQueryPreview | null) => void;
  /**
   * Send a query from the page. Goes through the chat's own send, so the page
   * closes behind it and the answer lands in the conversation.
   */
  send: (text: string) => void;
  /**
   * Go back to the conversation. A page whose job is done the moment you act on
   * it — Agents, once you have switched — closes itself with this.
   */
  close: () => void;
}

export interface IrisAgentProps {
  // ── Composition ─────────────────────────────────────────────────────────
  /** Internal composition only. Not the host relationship. Default `'sidebar'`. */
  layout?: IrisAgentLayout;
  /**
   * The panel that holds this surface fills its extent. Host-owned truth, from
   * the host's own panel-mode machine — `usePanelMode` derives
   * `mode: 'fullscreen'`, so pass `panel.mode === 'fullscreen'`. Default false.
   *
   * IrisAgent still does not own its relationship to the host page; it is told
   * about it. The flag gates the outside-chrome grammar: the menu becomes a
   * rail beside the chat, the chat chrome lifts off that ground, and the
   * artifact dock is promoted from a card to a pane. Outside fullscreen the
   * host app is beside the panel and its own rail is visible, so a second rail
   * reads as two apps — Akshat, 2026-08-13: "as long as we're not in fullscreen
   * I think we shouldn't do this nav otherwise it's confusing."
   *
   * `compact` only today, because it is the only layout with a menu to draw.
   */
  isFullscreen?: boolean;
  /**
   * Which grounds the three fullscreen regions take. AT FULLSCREEN ONLY —
   * below it every scheme draws what the surface draws today.
   *
   * An open question, not a decided one. Akshat, 2026-08-14, on the finding
   * that the fullscreen composition holds four surfaces within ~3% of each
   * other: "i'm kinda stuck on this one -- we can experiment but I want text to
   * stay legible." So the three readings are switchable rather than chosen:
   *
   *   `flat`      — today. Rail and page on `--iris-rail-ground`, chat frost,
   *                 pane transparent. One hairline carries the pane.
   *   `step`      — the pane alone takes the page canvas, one clear step darker
   *                 than the chat. Chat is the stage, pane is the work surface.
   *   `sandwich`  — rail AND pane take the page canvas, the chat stays light.
   *                 Ground, stage, ground — frame 153:19655's own reading.
   *   `warm`      — one hue. Rail, page and pane on `--ink-ecru-20` #f2edea,
   *                 the chat on plain white. The 2026-08-14 proposal: #F5 is
   *                 the lightest a ground can be and stay perceptible, and the
   *                 opaque Ink neutrals are violet against ecru, so this scheme
   *                 also sweeps them to their ecru equivalents.
   *
   * Stamped as `data-ground` on the compact root; `flat` stamps nothing, so a
   * consumer that omits this prop renders exactly as before. Every rule that
   * reads it is gated on `[data-fullscreen]` as well.
   */
  groundScheme?: 'flat' | 'step' | 'sandwich' | 'warm';
  /** Start with the history rail locked open. Defaults to true when `layout='sidebar'`. */
  initialSidebarLocked?: boolean;

  // ── Conversation (controlled) ───────────────────────────────────────────
  /** The turns to render. The consumer owns this array. */
  messages: ChatMessage[];
  /** The user sent something. Append the user turn and produce a reply. */
  onSendMessage: (text: string, meta?: SendMeta) => void;
  /** An assistant turn has been requested but not yet returned — shows the skeleton. */
  isLoading?: boolean;
  /** The last assistant turn is still arriving — it streams instead of rendering whole. */
  isStreaming?: boolean;
  /** The streaming turn finished animating. Flip `isStreaming` off here. */
  onStreamingComplete?: (messageId: string) => void;

  // ── Input ───────────────────────────────────────────────────────────────
  /** Controlled input text. Omit to let IrisAgent own it. */
  inputValue?: string;
  onInputChange?: (value: string) => void;
  /** Cycling placeholder hints. */
  placeholderHints?: string[];
  /** Direct actions in the `+` command menu. */
  commandContextItems?: CommandContextItem[];
  /** Drill-down categories in the `+` command menu and the `/` dropdown. */
  commandToolCategories?: CommandToolCategory[];
  /**
   * A command item was selected. Tool items (those with a `description`) are
   * also sent as a slash command automatically.
   */
  onCommandSelect?: (item: CommandContextItem | CommandToolChild) => void;
  /** Items in the `@` mention picker. */
  mentionItems?: ChatInputMentionItem[];
  /** A mention was picked. Defaults to attaching it as the context pill. */
  onMentionSelect?: (item: ChatInputMentionItem) => void;
  /**
   * Fine print under the input. `compact` layout only.
   *
   * A node, not a string: the shipping panel's disclaimer ends in a link
   * ("Learn how we use AI at Docusign."), which a string cannot carry.
   */
  disclaimer?: React.ReactNode;

  // ── Agent picker (compact header) ───────────────────────────────────────
  /**
   * The agents this surface can be switched between. The compact header's title
   * is a picker over these, not the conversation's name — clicking it opens a
   * "Selected Agent" menu, exactly as the shipping panel does.
   *
   * Omit, and the header renders a static identity with no chevron.
   */
  agents?: AgentOption[];
  /** Which of `agents` is active. Defaults to the first. */
  selectedAgentId?: string;
  /** The user picked a different agent. */
  onSelectAgent?: (id: string) => void;

  // ── Chrome ──────────────────────────────────────────────────────────────
  onClose?: () => void;
  closeLabel?: string;
  /**
   * Inert since 2026-08-12. The title-dropdown header (rename, star) is
   * retired — every layout draws the agent-identity header. Kept so existing
   * call sites do not break; no consumer passes them today.
   */
  title?: string;
  /** Inert — see `title`. */
  onTitleChange?: (title: string) => void;
  /** Inert — see `title`. */
  onStarChange?: (starred: boolean) => void;
  onShare?: () => void;
  /**
   * The user asked to go fullscreen. Points **up** — IrisAgent does not own
   * panel mode. Render nothing if the host has no fullscreen to give.
   */
  onFullscreen?: () => void;

  // ── Cold state ──────────────────────────────────────────────────────────
  greeting?: string;
  greetingSubtitle?: string;
  /** Category tabs and the prompts underneath each. Omit to hide the tabs. */
  categories?: SuggestionCategory[];
  /** Flat suggestion list. Replaces `categories` when supplied. */
  customSuggestions?: CustomSuggestion[];
  /** Rendered below the cold-state input, in place of the default discovery section. */
  /**
   * The cold state's top block, directly under the greeting and above the
   * suggestions. Both other cold-state slots render below the suggestions, and
   * what goes here is about the object the surface has open — an agreement
   * snapshot, an envelope's outstanding signers — so it has to come first.
   *
   * Rendered in both layouts. Compact puts it above the suggestion rows;
   * fullscreen puts it above the hero composer.
   */
  /**
   * The agreement the host page has open. Draws `AgreementSnapshot` at the head
   * of the cold state — above `coldStateHeaderSlot`, because the snapshot is the
   * price of collapsing the extraction panel and goes where that panel would
   * have been looked for.
   *
   * Presence is also the "one agreement" switch: corpus `insights` are
   * suppressed while it is set, because the Q3 renewal findings are about a set
   * the user is not looking at. Everything else about that surface — the
   * subtitle, the rows, the placeholder — is content the host passes.
   *
   * `onSeeAll` points **up**: the extraction panel is the host page's, and it
   * opens BESIDE the chat, never instead of it. Sid, 2026-08-17: *"both will be
   * open at that point in time… think of it as it opening the citation."*
   */
  agreementContext?: AgreementSnapshotProps;
  /**
   * The findings this surface already made, as cards. Drawn at the foot of the
   * cold state, above the checklist — they are about the set the user is looking
   * at, so they come first; the checklist is about the product and keeps.
   *
   * Omit them and there are none: off is the decided default (Akshat,
   * 2026-08-18, *"let's not show the suggestion cards here for now"*). IrisAgent
   * owns dismissal and the heading's count.
   */
  insights?: IrisInsight[];
  /** Override the line above the cards. Defaults to "N things to look at". */
  insightsHeading?: string;
  /**
   * The onboarding checklist, and the cold state's sequence. See
   * {@link IrisGetStarted} — IrisAgent owns the done, dismissed and epoch state
   * the card cannot hold for itself.
   */
  getStarted?: IrisGetStarted;
  coldStateHeaderSlot?: React.ReactNode;
  coldStateSlot?: React.ReactNode;
  /**
   * Rendered at the foot of the cold-state content column — **below the
   * suggestion rows and above the composer**. `compact` only.
   *
   * This is the onboarding checklist's place, and it is not `coldStateSlot`'s:
   * that one lands under the composer in `sidebar`, so a node passed to it would
   * change position with the layout. This slot has one position in one layout.
   *
   * A node, not data. The host owns what is in the checklist, which steps are
   * done, and whether it is there at all — the same way it owns `coldBackdrop`.
   */
  coldStateFooterSlot?: React.ReactNode;
  /**
   * Art behind the cold state, filling the space the greeting is anchored under.
   * `compact` only.
   *
   * Defaults to the Iris bloom, which ships with the pattern. Pass a node to put
   * another surface's brand there; pass `null` for no art at all.
   */
  coldBackdrop?: React.ReactNode;
  /**
   * The mark shown while Iris is working, in place of the loading skeleton.
   *
   * Defaults to the Iris mark — the complete figure, not the cold state's crop,
   * because this one is drawn at 88px. Pass `null` and the grey skeleton stands.
   */
  thinkingMark?: React.ReactNode;

  // ── Context attachment ──────────────────────────────────────────────────
  /**
   * The surface the chat lives on — a workspace, an agreement, a request
   * (host-contract rule 6a). Rendered as the standing context pill, superseded
   * by a more specific context (a picked cell, attached documents). Omit when
   * the chat is not scoped to a page (e.g. global Iris across the whole book).
   */
  pageContext?: { label: string; icon?: string; onClick?: () => void; onClose?: () => void };
  /** Documents the host loaded into context. Drives the indexing animation + pill. */
  agreements?: AgreementRef[];
  /**
   * The user dismissed the agreements pill.
   *
   * Points **up**: `agreements` is the host's, so only the host can drop it.
   * Supply this and the pill gains a close button; omit it and the pill is a
   * chevron that opens the sources, as before.
   */
  onClearAgreements?: () => void;
  /** A cell selected on a host canvas. Shown as a context pill. */
  canvasContext?: CanvasContext | null;
  onCanvasContextDismiss?: () => void;
  /** The user clicked the multi-document context pill or the Sources button. */
  onOpenSources?: () => void;

  // ── Artifact surface (host-owned) ───────────────────────────────────────
  /**
   * The artifact column, rendered beside the chat column. The host owns its state.
   *
   * It has two render sites and is mounted at exactly one of them: inside the
   * chat's content surface below fullscreen, and as a sibling of the chat chrome
   * at fullscreen, where it runs the full height of the panel.
   */
  /**
   * The artifact dock's state machine, from `usePanelMode`'s `artifact`.
   *
   * Supply it and IrisAgent runs the dock: "See all" promotes a result set,
   * an `artifact:` citation opens what it cites, the active card closes the
   * pane, and every one of those goes fullscreen first — a 420px dock does not
   * fit beside the chat in a 360px sidebar.
   *
   * It supersedes `openArtifactId` and `artifactExpanded`, which stay for
   * consumers that hold this state themselves.
   */
  artifact?: PanelArtifactState;
  /**
   * Every artifact this conversation could show — the corpus, a search's
   * tables, a document per row. Fixtures, so the host owns them; the dock lists
   * only the ones `artifact.openedIds` says this conversation has opened.
   *
   * Akshat, 2026-08-19: *"we don't need all the tabs by default — it makes no
   * sense, because if you just start a chat and you're seeing search results
   * you don't have the other tabs."*
   *
   * Pass these with `artifact` and IrisAgent renders the dock itself.
   * `artifactSlot` still wins if the host would rather draw it.
   */
  artifacts?: ArtifactItem[];
  /**
   * Every dock control that needs a backend — download, Open in Navigator,
   * search, a row's overflow, show/hide fields. `row-open` is not among them:
   * a row opens the agreement it names, which is navigation IrisAgent does.
   */
  onArtifactAction?: ArtifactActionHandler;
  artifactSlot?: React.ReactNode;
  /**
   * Collapse the chat column so the artifact fills the surface.
   *
   * Renamed from the prototype's `artifactFullscreen`, which read as a sibling
   * of panel fullscreen and is not (backlog §4.1). This is an independent axis.
   *
   * At fullscreen it collapses the whole chat chrome, header included, because
   * the chrome is what sits beside the pane there. The dock's own contract
   * button is then the way back — the panel's Exit fullscreen and Close go with
   * the header. Below fullscreen the header stands and only the column folds.
   */
  artifactExpanded?: boolean;
  /** A citation badge was clicked. */
  onCitationClick?: (citation: Citation) => void;
  /** A row in an inline result table was clicked. */
  onInlineResultClick?: (row: InlineResultRow) => void;
  /** Show an "Add as context" action under inline results. */
  onAddInlineResultsAsContext?: (rows: InlineResultRow[]) => void;
  /**
   * "See all" on a result card. The host promotes that set into the artifact
   * dock — see `openArtifactId`, which is what makes the card change its own
   * label afterwards.
   *
   * Drawn only when the results carry an `artifactId`: without somewhere to go,
   * "See all" is a button that does nothing.
   */
  onSeeAllResults?: (results: InlineResults) => void;
  /**
   * The active card was pressed — the user is asking for the pane to close and
   * the preview to come back. The card is the toggle for its own set: it is the
   * thing that says "you are looking at this", so it is the thing that stops.
   */
  onCloseResults?: () => void;
  /**
   * The dock item the host currently has open, if any.
   *
   * A card compares this to its own `inlineResults.artifactId` and says either
   * "Showing N results" or "Seeing results in right panel". DERIVED, never
   * stored: a follow-up previews while the pane still holds the earlier set,
   * and promoting the new one reverts the old card with no second piece of
   * state to keep in step. Frame 273:47692 is this comparison and nothing else.
   */
  openArtifactId?: string | null;
  /** Override the inline result table columns. */
  inlineResultColumns?: DataTableColumn<InlineResultRow>[];

  // ── History rail ────────────────────────────────────────────────────────
  conversations?: ConversationGroup[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  navShortcuts?: NavShortcut[];
  /**
   * A host-owned page rendered in place of the conversation (Inbox, Agents,
   * Shortcuts…). It replaces the chat stream; **the composer stays**, because
   * the rows on those pages preview their query into it on hover. The host
   * decides which page a `navShortcuts` click opens.
   *
   * Pass a function to get that preview channel: it is called with IrisAgent's
   * own `onPreview`, which the host threads into `NavPage`. A plain node still
   * works and simply cannot preview.
   *
   * `compact` only today — it is the only layout with a peek menu to open one from.
   */
  /**
   * The host pages a `navShortcuts` entry can open, keyed by that entry's id.
   *
   * Supply these and IrisAgent owns which page is up: the shortcut opens it,
   * the header names it, the back arrow leaves it, and a send, a new
   * conversation or a picked conversation clears it. `navPageSlot`,
   * `navPageTitle` and `onNavBack` stay for consumers that hold that state
   * themselves.
   */
  navPages?: NavPageEntry[];
  navPageSlot?: ((ctx: NavPageContext) => React.ReactNode) | React.ReactNode;
  /**
   * Leave the nav page and go back to the conversation.
   *
   * Frame 94:13551 puts an `arrowLeftSmall` immediately left of the hamburger,
   * so the control lives in the header rather than on the page — one place to
   * go back from, whatever page is up. Shown only while `navPageSlot` is set.
   */
  onNavBack?: () => void;
  /**
   * The open nav page's name. `compact` only.
   *
   * The header names the surface: give it a title and the compact header becomes
   * back arrow + that title, in the slot the wordmark sits in and at its type
   * scale. The hamburger and the wordmark stand down, because the back arrow is
   * the only way out a page needs.
   *
   * Akshat, 2026-08-12: "we could just update the title in the hamburger to the
   * page so then we wouldn't need the hamburger and just keep the back buttons."
   *
   * The host owns it, the same way it owns `navPageSlot` — IrisAgent is handed a
   * node and cannot read a name out of it. Omit it and the header is unchanged.
   */
  navPageTitle?: string;
  /**
   * Context the host thinks belongs to this conversation but has not attached.
   * Drawn as a strip directly above the composer: "Suggested Context: {label}"
   * with an Add on the right. Attaching it is the host's job — do it in `onAdd`
   * and stop passing this, the same way `onClearAgreements` goes the other way.
   *
   * The suggestion is the host's knowledge, not the system's, which is why this
   * is a prop and not something IrisAgent works out.
   */
  suggestedContext?: {
    label: string;
    onAdd: () => void;
    addLabel?: string;
    /**
     * Offered only when the conversation already holds context. The user picks
     * which one wins — the suggestion never replaces anything on its own.
     * Sid, 2026-08-17: "we will not be intent-wise be able to understand any of
     * this stuff, we need to just have them explicitly choose."
     */
    onReplace?: () => void;
    replaceLabel?: string;
  };
  /**
   * "View all" on a section of the hamburger's full-page menu (frame
   * 123:24563). The targets are host pages (Prompt Library, Agents, a full
   * history), so the host wires them. Omit it and the links do not render.
   */
  onMenuViewAll?: (section: 'prompts' | 'agents' | 'history') => void;
  /**
   * How the full-page hamburger menu draws.
   *
   * - `'sections'` (default) — a shortcut group, then Prompts / Agents /
   *   History sections, each with a "View all" link.
   * - `'accordion'` — no shortcut group, no "View all". Each section's header
   *   row IS the link ("Prompts ›" runs `onMenuViewAll('prompts')`), with the
   *   section's three preview rows under it. `navShortcuts` entries with no
   *   section (Activity, Get started) render as plain header rows running
   *   their own `onClick`.
   */
  menuStyle?: 'sections' | 'accordion';
  /**
   * The mark at the top of the fullscreen rail — 24×24 at the frame's inset
   * (163:21258). Host-owned, because it is brand: `iris` is Docusign's and
   * another surface brings its own, the same way `coldBackdrop` is the host's.
   *
   * Drawn only while the rail is up — `compact` + `isFullscreen` + menu open.
   * Omit it and nothing renders; no other layout is touched.
   */
  railBrand?: React.ReactNode;
  /**
   * Pinned to the foot of the fullscreen rail, clear of its floor by the rail's
   * own bottom padding — Settings, in frame 163:21258.
   *
   * It takes the rail's SHORTCUT treatment (36 tall, Regular 14, full-ink label
   * and icon), so a `ZeroQueryActions` passed here matches the group at the top
   * with no styling from the host:
   *
   * ```tsx
   * railFooter={
   *   <ZeroQueryActions
   *     appearance="card"
   *     items={[{ label: 'Settings', kind: 'action', icon: 'settings', onClick: openSettings }]}
   *     onSend={() => {}}
   *   />
   * }
   * ```
   *
   * Drawn only while the rail is up. Omit it and nothing renders.
   */
  railFooter?: React.ReactNode;
  /** Rendered beside the agent identity in the compact header — e.g. a status badge. */
  headerBadge?: React.ReactNode;
  /** Rendered as a strip below the compact header — e.g. a Chat / Progress tab bar. */
  subHeader?: React.ReactNode;

  // ── Inline slot ─────────────────────────────────────────────────────────
  /** Rendered inline after the last completed assistant turn. */
  chatSuffix?: React.ReactNode;
  /**
   * Render custom content inside a specific assistant turn, after its text —
   * e.g. a recommendation card the agent surfaced. Returns null for turns that
   * carry no extra content. The message id keys which turn it belongs to.
   */
  renderMessageExtra?: (message: ChatMessage) => React.ReactNode;
}

// =============================================================================
// IrisAgent
// =============================================================================

export function IrisAgent({
  layout = 'sidebar',
  isFullscreen = false,
  groundScheme = 'flat',
  initialSidebarLocked,

  messages,
  onSendMessage,
  isLoading = false,
  isStreaming = false,
  onStreamingComplete,

  inputValue,
  onInputChange,
  placeholderHints = DEFAULT_PLACEHOLDER_HINTS,
  commandContextItems = DEFAULT_COMMAND_CONTEXT_ITEMS,
  commandToolCategories = DEFAULT_COMMAND_TOOL_CATEGORIES,
  onCommandSelect,
  mentionItems = [],
  onMentionSelect,
  disclaimer = DEFAULT_DISCLAIMER,
  agents,
  selectedAgentId,
  onSelectAgent,

  onClose,
  closeLabel = 'Close',
  title,
  onTitleChange,
  onStarChange,
  onShare,
  onFullscreen,

  greeting = 'Hello',
  greetingSubtitle = 'What would you like to know?',
  categories = [],
  customSuggestions,
  agreementContext,
  insights,
  insightsHeading,
  getStarted,
  coldStateHeaderSlot,
  coldStateSlot,
  coldStateFooterSlot,
  coldBackdrop = <img src={irisBloom} alt="" />,
  thinkingMark = <img src={irisMark} alt="" />,

  pageContext,
  agreements = [],
  onClearAgreements,
  canvasContext,
  onCanvasContextDismiss,
  onOpenSources,

  artifact,
  artifacts,
  onArtifactAction,
  artifactSlot,
  artifactExpanded: artifactExpandedProp = false,
  onCitationClick,
  onInlineResultClick,
  onAddInlineResultsAsContext,
  onSeeAllResults,
  onCloseResults,
  openArtifactId: openArtifactIdProp,
  inlineResultColumns = DEFAULT_INLINE_RESULT_COLUMNS,

  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  navShortcuts = [],
  navPages,
  navPageSlot,
  onNavBack,
  navPageTitle,
  suggestedContext,
  onMenuViewAll,
  menuStyle = 'sections',
  railBrand,
  railFooter,
  headerBadge,
  subHeader,

  chatSuffix,
  renderMessageExtra,
}: IrisAgentProps) {
  const isCompact = layout === 'compact';
  const isSingleColumn = layout === 'single-column' || isCompact;

  // ── Presentation state (IrisAgent owns this; the consumer owns `messages`) ──

  const [internalInput, setInternalInput] = useState('');
  const inputText = inputValue !== undefined ? inputValue : internalInput;
  const setInputText = useCallback(
    (value: string) => {
      if (inputValue === undefined) setInternalInput(value);
      onInputChange?.(value);
    },
    [inputValue, onInputChange]
  );

  /** Turns whose entrance animation has finished during this mount. */
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  /** Turns whose AgentThinking accordion has finished animating. */
  const [thinkingDoneIds, setThinkingDoneIds] = useState<Set<string>>(new Set());

  const [contextSource, setContextSource] = useState<ContextSource | null>(null);

  // ── Orchestration state (the chat app, not the chrome) ────────────────────

  /** Which nav page is open, if any. `null` is the conversation. */
  const [navPageId, setNavPageId] = useState<string | null>(null);

  /**
   * The checklist's three pieces of state.
   *
   * `done` is which steps the user has finished — the card only draws it.
   * `dismissed` is the skip Poonam required. `epoch` is how it comes back: it is
   * the card's `key`, so bumping it re-mounts the card, and every mount after
   * the first opens. One counter covers both cases — the card was dismissed, or
   * the card is sitting there closed.
   */
  const [getStartedDone, setGetStartedDone] = useState<string[]>([]);
  const [getStartedDismissed, setGetStartedDismissed] = useState(false);
  const [getStartedEpoch, setGetStartedEpoch] = useState(0);

  /** Which insights the user has taken away. Dismiss only — a finding has no done state. */
  const [insightsDismissed, setInsightsDismissed] = useState<string[]>([]);

  /**
   * The zero-query row the pointer is on, shown in the composer.
   *
   * The row stays 40px and the composer does the explaining, in the box the row
   * would act on. A prompt writes its query into the placeholder. An agent
   * writes its slash token — `/counterparty-brief` — at the head of the input
   * and its job in the placeholder after it. Both only ever touch the
   * placeholder layer, so neither can cover anything already typed.
   *
   * The agent used to arrive as a chip in the context row instead, which had to
   * outrank the agreements pill to be seen at all. Akshat, 2026-08-13: "I don't
   * think that on hover the agent will change the chip — maybe we do something
   * in the input? like how claude does for skills in the input?" The token
   * needs no slot of its own, so the precedence problem goes with the chip.
   */
  const [preview, setPreview] = useState<ZeroQueryPreview | null>(null);

  /** Bumped to put the caret in the composer. See `ChatInput.focusKey`. */
  const [inputFocusKey, setInputFocusKey] = useState(0);

  /**
   * Clicking an agent row commits its token and hands over the caret. It sends
   * nothing — the token is the start of a message, not a message.
   *
   * It *prepends*, because anything already typed is the user's. The trailing
   * space is load-bearing twice: it keeps the next keystroke out of the slash
   * filter, and it is where the caret lands.
   */
  const handleAttachAgent = useCallback(
    (p: ZeroQueryPreview) => {
      if (!p.token) return;
      setInputText(inputText ? `${p.token} ${inputText}` : `${p.token} `);
      setInputFocusKey((k) => k + 1);
    },
    [inputText, setInputText]
  );

  /**
   * The Suggested Context strip the user dismissed, held by its label.
   *
   * The state lives here so a host gets the behaviour without adding state of
   * its own. Holding the label rather than a boolean does the reset for free:
   * the same offer stays hidden for the session, and a different label is a
   * different offer, so it shows again.
   */
  const [dismissedContextLabel, setDismissedContextLabel] = useState<string | null>(null);

  /** The Suggested Context strip's overflow. Closes on Escape or a click outside. */
  const [suggestedMenuOpen, setSuggestedMenuOpen] = useState(false);
  const suggestedMenuRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!suggestedMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!suggestedMenuRef.current?.contains(e.target as Node)) setSuggestedMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSuggestedMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [suggestedMenuOpen]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /**
   * The hamburger's menu. Compact only. Outside fullscreen it replaces the page
   * content with a full-page menu (frame 123:24563); at fullscreen the same
   * state draws the rail beside the chat. `isFullscreen` decides which — going
   * fullscreen transitions between them with no state change.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  /**
   * Menu sections the user has folded shut. Presentation state, so it lives
   * here and not with the host — and it is the *collapsed* set, not the open
   * one, so every section starts open with no seeding.
   *
   * One set for both presentations: `.menuPage` and `.menuOuterRail` call one
   * `menuSectionsNode` builder, so entering or leaving fullscreen keeps whatever
   * the user folded. The rail draws fewer sections than the page; a section the
   * rail does not draw simply keeps its fold for when the page draws it again.
   */
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isNavLocked, setIsNavLocked] = useState(
    initialSidebarLocked !== undefined ? initialSidebarLocked : layout === 'sidebar'
  );

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');

  const {
    scrollRef,
    spacerRef,
    handleScroll,
    pinToTop,
    prepareEnforcement,
    stopEnforcement,
    spacerHeight,
  } = useSmartScroll();

  /**
   * The one gate on the cold state. `isLoading` does **not** open the
   * conversation: a host that flips it before appending the user turn gets the
   * cold state and no skeleton. Append the turn first — see README, "States".
   */
  const hasMessages = messages.length > 0;
  const lastAssistantIdx = useMemo(
    () => messages.reduce((last, m, i) => (m.role === 'assistant' ? i : last), -1),
    [messages]
  );

  /**
   * `customSuggestions` replaces `categories` when supplied — and an empty array
   * is not a supplied list. The prototype tested the prop for truthiness, so
   * `[]` rendered an empty discovery section and silently shadowed the tabs.
   */
  /*
    ONE THING AT A TIME. The checklist is the whole cold state until it is
    dismissed — an empty list draws no rows, and the rows arrive when the card
    leaves. `sequence: false` is the both-at-once state, kept for comparison.

    The empty array rather than `undefined`, so `categories` cannot leak back in
    underneath a checklist that is standing.
  */
  const sequencedSuggestions =
    getStarted && getStarted.sequence !== false && !getStartedDismissed
      ? []
      : customSuggestions;

  const coldSuggestions =
    sequencedSuggestions && sequencedSuggestions.length > 0 ? sequencedSuggestions : null;

  // ── Effects ─────────────────────────────────────────────────────────────

  /** Canvas cell selection becomes the active context pill. */
  useEffect(() => {
    if (!canvasContext) return;
    setContextSource({
      label: `${canvasContext.rowName} → ${canvasContext.field}: "${canvasContext.value}"`,
      icon: 'ai-spark-filled',
      objectType: 'canvas-cell',
    });
  }, [canvasContext]);

  /** The menu closes, the folds go with it — reopening starts all sections open. */
  useEffect(() => {
    if (!menuOpen) setCollapsedSections((prev) => (prev.size ? new Set() : prev));
  }, [menuOpen]);

  /** Keep the category tab valid when the categories prop changes. */
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // ── Send ────────────────────────────────────────────────────────────────

  const send = useCallback(
    (text: string, meta?: SendMeta) => {
      if (!text.trim() || isLoading || isStreaming) return;
      setMenuOpen(false);
      // Anything that puts a conversation back on screen clears the nav page,
      // or the page outlives the thing that replaced it.
      setNavPageId(null);
      onSendMessage(text.trim(), { ...meta, contextSource: contextSource ?? null });
      setInputText('');

      // Pin the new user turn to the top of the viewport — rAF so the ref is
      // available after the consumer's re-render commits.
      requestAnimationFrame(() => {
        prepareEnforcement();
        pinToTop('[data-role="user"]');
      });
    },
    [isLoading, isStreaming, onSendMessage, contextSource, setInputText, prepareEnforcement, pinToTop]
  );

  const handleStreamingComplete = useCallback(
    (messageId: string) => {
      setCompletedIds((prev) => new Set(prev).add(messageId));
      stopEnforcement();
      onStreamingComplete?.(messageId);
    },
    [stopEnforcement, onStreamingComplete]
  );

  const handleFollowUp = useCallback(
    (id: string, label: string) => send(id, { displayLabel: label }),
    [send]
  );

  // ── The artifact dock ────────────────────────────────────────────────────
  //
  // `artifact` is the machine; the two loose props are what a consumer that
  // holds this state itself still passes. The machine wins where both exist.

  const openArtifactId = artifact ? artifact.openId : openArtifactIdProp;
  const artifactExpanded = artifact ? artifact.expanded : artifactExpandedProp;

  /**
   * A citation whose url is `artifact:<id>` opens that artifact. Everything else
   * is the host's — a real url, a scroll target, a document it wants to fetch.
   */
  const handleCitationClick = useCallback(
    (citation: Citation) => {
      if (artifact && citation.url?.startsWith('artifact:')) {
        artifact.open(citation.url.slice('artifact:'.length));
        return;
      }
      onCitationClick?.(citation);
    },
    [artifact, onCitationClick]
  );

  /**
   * "See all" promotes a result set into the dock. Through `artifact.open`, not
   * a bare id assignment — it goes fullscreen first, which is the whole reason
   * it exists: a 420px dock does not fit beside the chat in a sidebar, and
   * setting the id directly crushed the chat to a 43px sliver. Frame 209:37365
   * draws the promoted state at fullscreen too.
   */
  const handleSeeAllResults = useCallback(
    (results: InlineResults) => {
      if (artifact && results.artifactId) {
        artifact.open(results.artifactId);
        return;
      }
      onSeeAllResults?.(results);
    },
    [artifact, onSeeAllResults]
  );

  /** The other direction, from the same control: the active card closes the pane. */
  const handleCloseResults = useCallback(() => {
    if (artifact) {
      artifact.close();
      return;
    }
    onCloseResults?.();
  }, [artifact, onCloseResults]);

  const resolvedSeeAllResults = artifact || onSeeAllResults ? handleSeeAllResults : undefined;
  const resolvedCloseResults = artifact || onCloseResults ? handleCloseResults : undefined;

  /**
   * Tool commands (those carrying a description) are sent as a slash command.
   * The prototype tried to read the parent category from a second argument that
   * `ChatInput.onCommandSelect` never passes — so `commandType` was always
   * undefined. We look the parent up instead.
   */
  const handleCommandSelect = useCallback(
    (item: CommandContextItem | CommandToolChild) => {
      const description = (item as CommandToolChild).description;
      if (description) {
        const parent = commandToolCategories.find((cat) =>
          cat.children.some((child) => child.id === item.id)
        );
        const slug = item.label.toLowerCase().replace(/\s+/g, '-');
        send(`/${slug}`, {
          commandMeta: {
            label: parent?.label ?? item.label,
            description,
            commandType: parent?.label,
          },
        });
      }
      onCommandSelect?.(item);
    },
    [commandToolCategories, send, onCommandSelect]
  );

  const handleMentionSelect = useCallback(
    (item: ChatInputMentionItem) => {
      if (onMentionSelect) {
        onMentionSelect(item);
        return;
      }
      setContextSource({
        label: item.label,
        icon: item.icon,
        objectType: item.secondary?.split(' · ')[0] || undefined,
      });
    },
    [onMentionSelect]
  );

  // ── Derived ─────────────────────────────────────────────────────────────

  /** Type-specific cycling hints once something is attached to the input. */
  const activeHints = useMemo(() => {
    if (!contextSource) return placeholderHints;
    const name = contextSource.label;
    switch (contextSource.objectType) {
      case 'Agreement':
        return [`Summarize ${name}...`, 'What are the key terms?', 'Flag risks in this agreement...'];
      case 'Ticket':
        return ["What's the status of this ticket?", `Summarize ${name}...`, "Who's assigned?"];
      case 'Party':
        return [`Show all agreements with ${name}...`, "What's the relationship history?"];
      case 'Contact':
        return [`Show agreements involving ${name}...`, "What's their role?"];
      default:
        return [`Ask about ${name}...`];
    }
  }, [contextSource, placeholderHints]);

  /**
   * Three special cases of one prop. The prototype proved this with a
   * three-deep nested ternary (backlog §2.3); it survives here because
   * collapsing them into a single `contextSource` prop is a design decision
   * that belongs with the ChatInput spec, not with this extraction.
   */
  const inputContextSource: ChatInputContextSource | undefined = useMemo(() => {
    /*
     * No agent branch here. A previewed agent used to land as a chip that had
     * to outrank the agreements pill to be seen at all; it is a slash token in
     * the input now, so the two no longer want the same slot and this chain is
     * about documents only.
     */
    if (canvasContext) {
      return {
        label: `${canvasContext.rowName} → ${canvasContext.field}`,
        icon: 'ai-spark-filled',
        onClear: () => {
          setContextSource(null);
          onCanvasContextDismiss?.();
        },
      };
    }
    /*
     * The moment the host supplies agreements, the pill is there. There is no
     * step between the two: this used to wait on an indexing run — a progress
     * bar and a "Reading N agreements..." subtitle for about 800ms — and Akshat
     * cut it. The pill animates in from `ChatInput`; see `.contextRow` there.
     */
    if (agreements.length > 0) {
      return {
        label: `${agreements.length} agreement${agreements.length !== 1 ? 's' : ''}`,
        icon: 'document-stack',
        onClick: agreements.length > 1 ? onOpenSources : undefined,
        /*
         * Dismissible only when the host can actually drop the context.
         * `agreements` is the host's prop, so nothing here can clear it — and a
         * close button that does nothing is worse than no close button.
         *
         * Ink's FilterTag draws a chevron when it is not dismissible and a close
         * when it is, which is the difference between frame 101:17898 and what
         * this rendered before.
         */
        onClear: onClearAgreements,
      };
    }
    if (contextSource) {
      return {
        label: contextSource.label,
        icon: contextSource.icon,
        onClear: () => setContextSource(null),
        onClick: onOpenSources,
      };
    }
    // The page the chat lives on — the standing base context (rule 6a).
    // Dismissible only if the host provides `onClose` (clears the page scope for
    // this conversation); the icon makes it clear which surface is in context.
    if (pageContext) {
      return {
        label: pageContext.label,
        icon: pageContext.icon ?? 'transaction',
        onClick: pageContext.onClick,
        onClear: pageContext.onClose,
      };
    }
    return undefined;
  }, [
    canvasContext,
    onCanvasContextDismiss,
    agreements,
    onOpenSources,
    contextSource,
    pageContext,
  ]);

  /**
   * Resets the presentation state IrisAgent owns, then reports the intent.
   *
   * It does **not** empty `messages` — the consumer owns that array, and the
   * surface only returns to its cold state once the consumer clears it. Nor
   * does it replay indexing: the effect is keyed on the agreement names, which
   * a reset does not change, so a post-reset cold state with `agreements` still
   * attached shows suggestions and the context pill immediately, with no
   * progress bar. Both are intentional (README, "States").
   */
  const handleNewConversation = useCallback(() => {
    setCompletedIds(new Set());
    setThinkingDoneIds(new Set());
    setInputText('');
    setContextSource(null);
    setNavPageId(null);
    onNewConversation?.();
  }, [setInputText, onNewConversation]);

  // ── Nav pages, and the way back to the checklist ─────────────────────────

  /**
   * Bring the checklist back. Not a page — it clears the dismissal and re-mounts
   * the card open, which is why it does not go through `navPageId`.
   */
  const openGetStarted = useCallback(() => {
    setNavPageId(null);
    setGetStartedDismissed(false);
    setGetStartedEpoch((n) => n + 1);
  }, []);

  const closeNavPage = useCallback(() => setNavPageId(null), []);

  /**
   * The host's shortcuts, plus the one IrisAgent owns.
   *
   * A shortcut whose id names a `navPages` entry opens that page; anything else
   * runs its own `onClick`, as before. "Get started" is appended last, and only
   * when there is a checklist to come back to.
   */
  const resolvedNavShortcuts = useMemo<NavShortcut[]>(() => {
    const wired = navShortcuts.map((shortcut) =>
      navPages?.some((page) => page.id === shortcut.id)
        ? { ...shortcut, onClick: () => setNavPageId(shortcut.id) }
        : shortcut
    );
    return getStarted
      ? [...wired, { id: 'get-started', label: 'Get started', icon: 'flag', onClick: openGetStarted }]
      : wired;
  }, [navShortcuts, navPages, getStarted, openGetStarted]);

  const activeNavPage = navPages?.find((page) => page.id === navPageId);

  /**
   * "View all" on a menu section. A `navPages` entry claiming that section wins;
   * otherwise the host's own handler runs. The two naming schemes do not match —
   * the section is `'prompts'`, the page is `'prompt-library'` — so the entry
   * declares which section it answers rather than the ids being compared.
   */
  const handleMenuViewAll = useMemo(() => {
    const claimed = navPages?.some((page) => page.menuSection);
    if (!claimed) return onMenuViewAll;
    return (section: 'prompts' | 'agents' | 'history') => {
      const page = navPages?.find((entry) => entry.menuSection === section);
      if (page) setNavPageId(page.id);
      else onMenuViewAll?.(section);
    };
  }, [navPages, onMenuViewAll]);

  // ── Sidebar ─────────────────────────────────────────────────────────────

  const sidebarNode = (
    <IrisSidebar
      onNewChat={() => {
        handleNewConversation();
        if (isSingleColumn) setSidebarOpen(false);
      }}
      navShortcuts={resolvedNavShortcuts.map((shortcut) => ({
        ...shortcut,
        onClick: () => {
          shortcut.onClick?.();
          if (isSingleColumn) setSidebarOpen(false);
        },
      }))}
      conversationGroups={conversations}
      activeConversationId={activeConversationId}
      onConversationClick={(id) => {
        setNavPageId(null);
        onSelectConversation?.(id);
        if (isSingleColumn) setSidebarOpen(false);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
        });
      }}
      isLocked={isSingleColumn ? true : isNavLocked}
      onLockChange={isSingleColumn ? undefined : setIsNavLocked}
    />
  );

  const sidebarOverlay = (
    <>
      <div
        className={`${styles.sidebarOverlayBackdrop} ${sidebarOpen ? styles.sidebarOverlayBackdropOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayOpen : ''}`}>
        {sidebarNode}
      </div>
    </>
  );

  // ── Conversation stream ─────────────────────────────────────────────────
  //
  // The prototype rendered this block twice, near-identically, once per layout
  // branch. It is rendered once here; the layouts differ only in their wrapper.

  const conversationStream = (
    <ConversationLayout>
      {messages.map((msg, idx) => {
        if (msg.role === 'user') {
          return (
            <ConversationLayout.UserTurn key={msg.id}>
              <MessageBubble
                text={msg.content}
                variant={
                  msg.commandMeta
                    ? 'slash-command'
                    : msg.elicitationQuestion
                      ? 'suggestion-selected'
                      : 'plain-text'
                }
                label={msg.commandMeta?.label ?? msg.elicitationQuestion}
                commandDescription={msg.commandMeta?.description}
                commandType={msg.commandMeta?.commandType}
              />
            </ConversationLayout.UserTurn>
          );
        }

        // Only the last assistant turn can be live, and only while the consumer
        // says so. Everything else — including a conversation loaded whole from
        // history — renders finished.
        const isLiveTurn = isStreaming && idx === lastAssistantIdx;
        const isCompleted = completedIds.has(msg.id) || !isLiveTurn;
        const hasThinking = !!msg.thinkingSteps?.length;
        const showContent = !hasThinking || isCompleted || thinkingDoneIds.has(msg.id);
        const isLastMessage = idx === messages.length - 1;
        const isLastAssistantMessage = idx === lastAssistantIdx;

        return (
          <ConversationLayout.AssistantTurn key={msg.id} isFirst={idx === 0}>
            {hasThinking && (
              <AgentThinking
                steps={msg.thinkingSteps!}
                outcomeSummary={msg.taskCompletion?.summary || 'Analysis complete'}
                initialDone={isCompleted}
                onComplete={() => setThinkingDoneIds((prev) => new Set(prev).add(msg.id))}
              />
            )}

            {showContent && msg.content && (
              <MarkdownRenderer content={msg.content} onCitationClick={handleCitationClick} />
            )}

            {showContent &&
              msg.inlineResults &&
              (() => {
                /*
                  The result card. Frame 196:17576: a search glyph and a count on
                  the left, "See all" on the right, the preview under both.

                  ACTIVE is the card whose set the dock currently has open. It
                  loses the preview and takes the tint: the same five rows in a
                  narrow column beside the full table is the data twice, and the
                  chat has no room to spare. Akshat, 2026-08-18: *"we need some
                  sort of an active state so it's clear you're viewing it in the
                  right… should we collapse the table in left if you're viewing
                  on right?"* — the two asks answer each other, and collapsing
                  makes the state legible by shape before colour does any work.

                  Derived, never stored, so the three frames are one expression:
                  preview, collapsed-and-marked, and back to preview when a later
                  set takes the pane.
                */
                const results = msg.inlineResults;
                const isActive = Boolean(results.artifactId) && results.artifactId === openArtifactId;
                return (
                  <>
                    <div className={styles.inlineResultsWrap} data-active={isActive || undefined}>
                      {/*
                        Collapsed, the whole card is one button. The row already
                        reads "you are looking at this"; pressing it stops, and
                        the preview comes back with it. Expanded it is a plain
                        container — "See all" is the target there, and making the
                        whole card clickable would put two targets on top of
                        each other.
                      */}
                      <div
                        className={styles.inlineResultsHeader}
                        role={isActive && resolvedCloseResults ? 'button' : undefined}
                        tabIndex={isActive && resolvedCloseResults ? 0 : undefined}
                        aria-label={isActive && resolvedCloseResults ? 'Close the results panel' : undefined}
                        onClick={isActive && resolvedCloseResults ? resolvedCloseResults : undefined}
                        onKeyDown={
                          isActive && resolvedCloseResults
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  resolvedCloseResults();
                                }
                              }
                            : undefined
                        }
                      >
                        <span className={styles.inlineResultsLabel}>
                          {/*
                            The same glyph in both states. It says what the card
                            IS — a result set — and the state is carried by the
                            collapse, the tint and the label. Swapping it would
                            give one element two jobs, and no prototype's
                            `iconPaths` has a right-panel glyph to swap to.
                          */}
                          <Icon name="search" size={16} />
                          {isActive
                            ? 'Seeing results in right panel'
                            : `Showing ${results.rows.length} results`}
                        </span>
                        {/*
                          The same slot "See all" uses, so the card keeps one
                          grammar: state on the left, what you can do on the
                          right. Revealed on hover and on focus rather than
                          standing there — the dock has its own close, so this
                          is the second way out, not the only one.
                        */}
                        {isActive && resolvedCloseResults && (
                          <span className={styles.inlineResultsClose}>Close</span>
                        )}
                        {results.artifactId && resolvedSeeAllResults && !isActive && (
                          <button
                            type="button"
                            className={styles.inlineResultsSeeAll}
                            onClick={() => resolvedSeeAllResults(results)}
                          >
                            See all
                            <Icon name="chevron-right" size={14} />
                          </button>
                        )}
                      </div>
                      {!isActive && (
                        <DataTable
                          columns={inlineResultColumns}
                          data={results.rows}
                          getRowKey={(row: InlineResultRow) => row.id}
                          rowHeight="compact"
                          className={styles.inlineResultsTable}
                          onRowClick={onInlineResultClick}
                        />
                      )}
                    </div>
                    {/*
                      Nothing to add as context when there is nothing shown —
                      the button would be pointing at a table that is not there.
                    */}
                    {onAddInlineResultsAsContext && !isActive && (
                      <div className={styles.inlineResultsActions}>
                        <Button
                          kind="tertiary"
                          size="small"
                          startElement={<Icon name="plus" size={14} />}
                          onClick={() => onAddInlineResultsAsContext(results.rows)}
                        >
                          Add as context
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}

            {showContent &&
              msg.markdownContent &&
              (isCompleted ? (
                <MarkdownRenderer
                  content={msg.markdownContent}
                  citations={msg.citations}
                  onCitationClick={handleCitationClick}
                />
              ) : (
                <StreamingMarkdown
                  content={msg.markdownContent}
                  citations={msg.citations}
                  onComplete={() => handleStreamingComplete(msg.id)}
                  onCitationClick={handleCitationClick}
                />
              ))}

            {showContent && !msg.markdownContent && !isCompleted && (
              <CompleteOnMount onComplete={() => handleStreamingComplete(msg.id)} />
            )}

            {showContent && renderMessageExtra?.(msg)}

            {isCompleted && isLastAssistantMessage && chatSuffix && (
              <div className={styles.chatSuffixSlot}>{chatSuffix}</div>
            )}

            {isCompleted && (msg.content || msg.markdownContent) && (
              <FeedbackActions copyText={msg.markdownContent || msg.content} />
            )}

            {isCompleted && isLastMessage && msg.taskCompletion?.followUps && (
              <ConversationLayout.Suggestions>
                {msg.taskCompletion.followUps.map((fu) => (
                  <SuggestionChip
                    key={fu.id}
                    label={fu.label}
                    onClick={() => handleFollowUp(fu.id, fu.label)}
                  />
                ))}
              </ConversationLayout.Suggestions>
            )}
          </ConversationLayout.AssistantTurn>
        );
      })}

      {/*
        The bloom is the thinking state in the shipping product, so the system
        should not be showing a generic grey skeleton here. The mark is the
        pattern's default now, same as `coldBackdrop` — the skeleton is reached
        only by a surface that passes `thinkingMark={null}` to refuse the art.

        This is a different appearance from the cold state's, not a violation of
        "the art goes the moment you send a message". Arrival ends on send;
        thinking begins. The mark means Iris is doing something, and it is
        absent for the one state where she is not: you, reading.
      */}
      {isLoading && thinkingMark && (
        <div className={styles.thinkingMark} aria-label="Iris is thinking">
          {thinkingMark}
        </div>
      )}

      {isLoading && !thinkingMark && (
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      )}
    </ConversationLayout>
  );

  const bottomSpacer = (
    <div
      ref={spacerRef}
      className={styles.chatBottomSpacer}
      style={{ minHeight: spacerHeight }}
      data-scroll-spacer
    />
  );

  /**
   * A single hint renders static, so previewing also stops the cycling — the
   * placeholder holds still while the user reads what they hovered.
   */
  const previewHints = preview ? [preview.text] : activeHints;

  /**
   * The nav page, given the preview channel if it asked for one.
   *
   * A `navPages` entry IrisAgent opened wins; `navPageSlot` is what a consumer
   * holding that state itself still passes.
   */
  const navPageContext: NavPageContext = { onPreview: setPreview, send, close: closeNavPage };
  const navPage = activeNavPage
    ? activeNavPage.render(navPageContext)
    : typeof navPageSlot === 'function'
      ? navPageSlot(navPageContext)
      : navPageSlot;

  /** The header names the open page; `navPageTitle` covers the slot form. */
  const resolvedNavPageTitle = activeNavPage ? activeNavPage.title : navPageTitle;
  /** One way out, whichever form the page arrived in. */
  const resolvedNavBack = activeNavPage ? closeNavPage : onNavBack;

  // ── The cold state IrisAgent assembles ───────────────────────────────────

  /**
   * The snapshot, above everything. It is the price of collapsing the extraction
   * panel, so it goes where the panel would have been looked for — first.
   */
  const coldStateHeader = (
    <>
      {agreementContext && <AgreementSnapshot {...agreementContext} />}
      {coldStateHeaderSlot}
    </>
  );

  /*
    Corpus scope. On a single agreement the findings are about a set the user is
    not looking at, so they stay out — the snapshot and the agreement's own rows
    are the whole cold state there.
  */
  const liveInsights = agreementContext
    ? []
    : (insights ?? []).filter((insight) => !insightsDismissed.includes(insight.id));

  const getStartedItems = (getStarted?.steps ?? []).map((step) => ({
    id: step.id,
    label: step.label,
    icon: step.icon,
    complete: getStartedDone.includes(step.id),
    onTry: () => {
      /*
        A step that asks something sends it directly rather than typing into the
        composer and pressing send — sending clears the box, so the two are the
        same result by a longer road.
      */
      if (step.query) send(step.query);
      else if (step.opens) setNavPageId(step.opens);
      else step.onOpen?.();
      setGetStartedDone((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]));
    },
  }));

  const coldStateFooter = (
    <>
      {/*
        The insights, above the checklist. They are about the set the user is
        looking at, so they come first; the checklist is about the product and
        keeps. A card sends its whole query — the same road every other
        suggestion takes — so the answer lands in the chat and its citations can
        open the dock. Akshat: "way more interesting to have them be in iris
        because then you can interact with them."
      */}
      {liveInsights.length > 0 && (
        <InsightList
          heading={
            insightsHeading ??
            `${liveInsights.length} thing${liveInsights.length === 1 ? '' : 's'} to look at`
          }
          insights={liveInsights.map((insight) => ({
            ...insight,
            onAction: () => send(insight.query, { displayLabel: insight.title }),
            onDismiss: () => setInsightsDismissed((prev) => [...prev, insight.id]),
          }))}
        />
      )}

      {getStarted && !getStartedDismissed && (
        <GetStarted
          /* The epoch is the key: bumping it re-mounts the card, and every mount
             after the first opens. */
          key={getStartedEpoch}
          items={getStartedItems}
          title={getStarted.title}
          variant={getStarted.variant}
          marker={getStarted.marker}
          tryLabel={getStarted.tryLabel}
          dismissLabel={getStarted.dismissLabel}
          /* Sequencing means the card IS the cold state, so it stands open.
             Without it the first mount is closed and only a reopen opens. */
          defaultOpen={getStarted.sequence !== false || getStartedEpoch > 0}
          onDismiss={() => setGetStartedDismissed(true)}
        />
      )}

      {coldStateFooterSlot}
    </>
  );

  // ── The dock ─────────────────────────────────────────────────────────────

  /**
   * The host's node wins; otherwise IrisAgent draws the dock over the corpus it
   * was given. The dock lists only what this conversation has opened.
   */
  const resolvedArtifactSlot =
    artifactSlot ??
    (artifact && artifacts && artifact.openId ? (
      <ArtifactDock
        items={artifacts.filter((item) => artifact.openedIds.includes(item.id))}
        openId={artifact.openId}
        onOpenChange={artifact.setOpenId}
        expanded={artifact.expanded}
        onToggleExpand={artifact.toggleExpanded}
        /* A source row navigates inside the dock — no fullscreen, no new tab. */
        onSourceOpen={artifact.setOpenId}
        onAction={(action, item, detail) => {
          /*
            A row opens the agreement it names. The document's id is the table's
            plus the row's, so the pair needs no lookup table — and the document
            carries `parentId`, which is what puts the breadcrumb back to these
            results in the dock's header.
          */
          if (action === 'row-open' && typeof detail === 'string') {
            artifact.open(`${item.id}:${detail}`);
            return;
          }
          onArtifactAction?.(action, item, detail);
        }}
      />
    ) : undefined);

  // ── Hamburger menu (compact) — frame 123:24563 ──────────────────────────
  //
  // Three sections, all from props the surface already has: Prompts from the
  // cold suggestions, Agents from the picker's list, History from the
  // conversations. Rows are ZeroQueryActions in the nav pages' card appearance.
  // Icons follow the ZeroQueryActions rule: defaults name glyphs every
  // prototype's Ink snapshot carries (`task-list`, `messages`, `flash`); the
  // frame's small cuts are not in every snapshot.

  // The nav shortcuts, same handler the peek menu runs. Icons come from the
  // host's shortcut data — `NavShortcut.icon` is required, so no default.
  const menuShortcutItems: ZeroQueryActionItem[] = resolvedNavShortcuts.map((shortcut) => ({
    label: shortcut.label,
    kind: 'action' as const,
    icon: shortcut.icon,
    onClick: () => {
      setMenuOpen(false);
      shortcut.onClick?.();
    },
  }));

  const menuPromptItems: ZeroQueryActionItem[] = (coldSuggestions ?? [])
    .slice(0, 3)
    .map((s) => ({
      label: s.label,
      description: s.description,
      kind: 'prompt' as const,
      icon: s.icon ?? 'task-list',
      onClick: () => {
        setMenuOpen(false);
        if (s.onClick) s.onClick();
        else send(s.description ?? s.label);
      },
    }));

  // `kind: 'action'` — picking an agent opens nothing to preview.
  const menuAgentItems: ZeroQueryActionItem[] = (agents ?? []).slice(0, 3).map((a) => ({
    label: a.name,
    kind: 'action' as const,
    icon: a.glyph ?? 'flash',
    onClick: () => {
      setMenuOpen(false);
      onSelectAgent?.(a.id);
    },
  }));

  const menuHistoryItems: ZeroQueryActionItem[] = conversations
    .flatMap((group) => group.items)
    .map((c) => ({
      label: c.title,
      kind: 'action' as const,
      icon: 'messages',
      onClick: () => {
        setMenuOpen(false);
        setNavPageId(null);
        onSelectConversation?.(c.id);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
        });
      },
    }));

  const menuSection = (
    title: string,
    section: 'prompts' | 'agents' | 'history',
    items: ZeroQueryActionItem[]
  ) =>
    items.length > 0 ? (
      <section className={styles.menuSection}>
        <div className={styles.menuSectionHeader}>
          {/*
            The title is the disclosure. Frame 132:25908 drew the
            `chevronDownSmall` as decoration on Prompts and Agents only; it now
            has a job, so all three sections carry it and it turns when the
            section is shut. Deliberate deviation from the frame — a toggle
            with no glyph on it is a toggle nobody finds.

            A native `<button>` inside the `<h3>`: the heading stays a heading,
            and Enter/Space come for free. "View all" is a separate control
            outside the button, so navigating never folds the section, and
            folding never navigates. This is the one control in the menu that
            does NOT close the menu.

            No `aria-controls`: the menu renders twice at once (`.menuPage` and
            `.menuOuterRail` are both in the DOM, and `data-fullscreen` shows
            one and hides the other with `display: none`), so an id here would
            be a duplicate id. `aria-expanded` on a native button carries the
            state on its own.
          */}
          <h3 className={styles.menuSectionTitle}>
            <button
              type="button"
              className={styles.menuSectionToggle}
              aria-expanded={!collapsedSections.has(section)}
              onClick={() =>
                setCollapsedSections((prev) => {
                  const next = new Set(prev);
                  if (!next.delete(section)) next.add(section);
                  return next;
                })
              }
            >
              <span>{title}</span>
              <span
                className={`${styles.menuSectionChevron} ${
                  collapsedSections.has(section) ? styles.menuSectionChevronClosed : ''
                }`}
                aria-hidden="true"
              >
                <Icon name="chevron-down" size={16} />
              </span>
            </button>
          </h3>
          {/*
            "View all" removed — Akshat, 2026-08-13 page feedback: "remove" on
            all three. The shortcut rows above the sections carry navigation;
            the section header's job is the fold. `onMenuViewAll` stays in the
            props for the accordion variant, which still uses it.
          */}
        </div>
        {!collapsedSections.has(section) && (
          <ZeroQueryActions
            items={items}
            onSend={(query) => {
              setMenuOpen(false);
              send(query);
            }}
            onPreview={setPreview}
            appearance="card"
          />
        )}
      </section>
    ) : null;

  // ── Accordion variant — the section header IS the link ──────────────────

  /**
   * Which menu section a nav shortcut duplicates, by id + label.
   *
   * ponytail: heuristic string match; the clean fix is an explicit `section`
   * field on `NavShortcut` (IrisSidebar.tsx, outside this change's scope).
   */
  const sectionForShortcut = (
    shortcut: NavShortcut
  ): 'prompts' | 'agents' | 'history' | null => {
    const key = `${shortcut.id} ${shortcut.label}`.toLowerCase();
    if (/prompt/.test(key)) return 'prompts';
    if (/agent/.test(key)) return 'agents';
    if (/histor|conversation/.test(key)) return 'history';
    return null;
  };

  const accordionHeader = (label: string, onClick?: () => void) =>
    onClick ? (
      <button type="button" className={styles.menuAccordionHeader} onClick={onClick}>
        <span>{label}</span>
        <span className={styles.menuAccordionChevron} aria-hidden="true">
          <Icon name="chevron-right" size={16} />
        </span>
      </button>
    ) : (
      <div className={styles.menuAccordionHeader}>{label}</div>
    );

  const accordionSection = (
    label: string,
    section: 'prompts' | 'agents' | 'history',
    items: ZeroQueryActionItem[]
  ) => (
    <section key={section} className={styles.menuSection}>
      {accordionHeader(
        label,
        handleMenuViewAll
          ? () => {
              setMenuOpen(false);
              handleMenuViewAll(section);
            }
          : undefined
      )}
      {items.length > 0 && (
        <ZeroQueryActions
          items={items}
          onSend={(query) => {
            setMenuOpen(false);
            send(query);
          }}
          onPreview={setPreview}
          appearance="card"
        />
      )}
    </section>
  );

  /**
   * The accordion menu: no shortcut group, no "View all" — each section's
   * header row is the link, three preview rows under it. Shortcut order wins;
   * sections that no shortcut names (History) follow at the end. A shortcut whose
   * section renders is dropped — the header replaces it. One with no section
   * (Activity, Get started) is a plain header row running its own `onClick`.
   */
  const accordionNodes: React.ReactNode[] = [];
  if (menuOpen && menuStyle === 'accordion') {
    const SECTION_LABELS = { prompts: 'Prompts', agents: 'Agents', history: 'History' } as const;
    const sectionItems = {
      prompts: menuPromptItems,
      agents: menuAgentItems,
      history: menuHistoryItems.slice(0, 3),
    };
    const drawn = new Set<string>();
    const drawSection = (section: 'prompts' | 'agents' | 'history') => {
      if (drawn.has(section)) return;
      if (sectionItems[section].length === 0 && !handleMenuViewAll) return;
      drawn.add(section);
      accordionNodes.push(
        accordionSection(SECTION_LABELS[section], section, sectionItems[section])
      );
    };
    for (const shortcut of resolvedNavShortcuts) {
      const section = sectionForShortcut(shortcut);
      if (section && (sectionItems[section].length > 0 || handleMenuViewAll)) {
        drawSection(section);
      } else {
        accordionNodes.push(
          <section key={`shortcut-${shortcut.id}`} className={styles.menuSection}>
            {accordionHeader(shortcut.label, () => {
              setMenuOpen(false);
              shortcut.onClick?.();
            })}
          </section>
        );
      }
    }
    (['prompts', 'agents', 'history'] as const).forEach(drawSection);
  }

  /**
   * The menu's content, for one of its two render sites. `.menuPage` draws it
   * outside fullscreen (the menu as the page); `.menuOuterRail` draws it at
   * fullscreen (the menu as a rail outside the chat's chrome). `data-fullscreen`
   * shows exactly one of them — the other is `display: none`, so nothing hidden
   * is focusable.
   *
   * IT TAKES THE PRESENTATION, because the two now differ in *content*, not only
   * in paint. Frame 163:21258 draws the rail as a shortcut group and a single
   * History section: no Prompts, no Agents. Those two are shortcut rows there,
   * not section headers with three previews under them.
   *
   * The full-page menu keeps all three. It is a different presentation of the
   * same menu — the whole page rather than a 338px column beside the chat — and
   * the frame does not draw it, so nothing about it is decided here.
   *
   * A parameter rather than a second builder: `menuSection()` and the four item
   * lists are written once and both sites call the same code. The accordion
   * variant is untouched, and is the same in both sites as before.
   */
  const menuSectionsNode = (presentation: 'page' | 'rail') =>
    menuOpen ? (
      menuStyle === 'accordion' ? (
        accordionNodes
      ) : (
        <>
          {menuShortcutItems.length > 0 && (
            /*
              `.menuRailShortcuts` is the hook for the rail's shortcut treatment
              (36 tall, no gap, Regular 14, full ink). It is a container-scoped
              class rather than a per-row flag because the two groups already sit
              in different containers — one rule reaches every row in this one and
              cannot touch History. Inert outside `.menuOuterRail`.
            */
            <section className={`${styles.menuSection} ${styles.menuRailShortcuts}`}>
              <ZeroQueryActions
                items={menuShortcutItems}
                onSend={(query) => {
                  setMenuOpen(false);
                  send(query);
                }}
                onPreview={setPreview}
                appearance="card"
              />
            </section>
          )}
          {presentation === 'page' && menuSection('Prompts', 'prompts', menuPromptItems)}
          {presentation === 'page' && menuSection('Agents', 'agents', menuAgentItems)}
          {menuSection('History', 'history', menuHistoryItems)}
        </>
      )
    ) : null;

  /**
   * The default presentation: the menu as the page, at every non-fullscreen
   * width. Rendered whenever the menu is open; `data-fullscreen` hides it at
   * fullscreen, where the rail stands instead. The composer stays below it,
   * same as a nav page.
   */
  const fullMenuNode = menuOpen ? (
    <div className={styles.menuPage}>{menuSectionsNode('page')}</div>
  ) : null;


  /**
   * Context the host is offering but has not attached. Frame 86:11249 — a
   * `neutral-10` strip the width of the composer card, 12px type, an Add on the
   * right. It sits above the composer rather than in the card because it is
   * *about* the next message rather than part of it.
   *
   * Held here, not inline, because two things read it: the compact layout draws
   * it, and the composer under it squares its top corners only while it is
   * there. One expression, so the two cannot disagree.
   */
  const suggestedContextStrip =
    suggestedContext && suggestedContext.label !== dismissedContextLabel ? (
      <div className={styles.suggestedContext}>
        <span className={styles.suggestedContextLabel}>
          <strong>Suggested Context</strong>: {suggestedContext.label}
        </span>
        <span className={styles.suggestedContextActions}>
          {/*
            Add is the whole visible offer — Akshat, 2026-08-18: "flip it, Add
            first". It is also the safe one: adding is undone by dropping a
            pill, replacing throws away a set the user assembled.
          */}
          <button
            type="button"
            className={styles.suggestedContextAdd}
            onClick={suggestedContext.onAdd}
          >
            {suggestedContext.addLabel ?? 'Add'}
          </button>
          {/*
            With something to replace, Replace and Dismiss go behind an
            overflow and the strip keeps two targets. With nothing to replace
            there is only Dismiss to hide, and a menu holding one item is worse
            than the glyph it replaced — so the plain close stays.
          */}
          {suggestedContext.onReplace ? (
            <span className={styles.suggestedContextMenuWrap} ref={suggestedMenuRef}>
              <IconButton
                icon="overflow-horizontal"
                variant="tertiary"
                size="small"
                aria-label="More actions for suggested context"
                aria-expanded={suggestedMenuOpen}
                aria-haspopup="menu"
                className={styles.suggestedContextDismiss}
                onClick={() => setSuggestedMenuOpen((v) => !v)}
              />
              {suggestedMenuOpen && (
                <div className={styles.suggestedContextMenu} role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.suggestedContextMenuItem}
                    onClick={() => {
                      setSuggestedMenuOpen(false);
                      suggestedContext.onReplace?.();
                    }}
                  >
                    {suggestedContext.replaceLabel ?? 'Replace'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.suggestedContextMenuItem}
                    onClick={() => {
                      setSuggestedMenuOpen(false);
                      setDismissedContextLabel(suggestedContext.label);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </span>
          ) : (
            /*
              Same gesture as the context pill, so the same control: FilterTag
              dismisses with `IconButton icon="close" size="small"`. `close` is
              in every prototype's `iconPaths.ts`.
            */
            <IconButton
              icon="close"
              variant="tertiary"
              size="small"
              aria-label="Dismiss suggested context"
              className={styles.suggestedContextDismiss}
              onClick={() => setDismissedContextLabel(suggestedContext.label)}
            />
          )}
        </span>
      </div>
    ) : null;

  const chatInputNode = (variant: 'default' | 'expanded', flushTop = false) => (
    <ChatInput
      value={inputText}
      onChange={setInputText}
      onSend={send}
      isLoading={isLoading}
      isStreaming={isStreaming}
      variant={variant}
      flushTop={flushTop}
      contextSource={inputContextSource}
      focusKey={inputFocusKey}
      commandContextItems={commandContextItems}
      commandToolCategories={commandToolCategories}
      onCommandSelect={handleCommandSelect}
      placeholderHints={previewHints}
      placeholderToken={preview?.token}
      mentionItems={mentionItems}
      onMentionSelect={handleMentionSelect}
    />
  );

  /**
   * The wash and the bloom live in the cold state only — no messages, no nav
   * page, no menu. Akshat, 2026-08-12: "the gradient needs to sort of go away
   * the moment you start interacting or get to a chat / detail page otherwise
   * it muddies the content." Every other state draws the plain surface.
   *
   * Where it shows has not changed; how it leaves has. It used to unmount on
   * the frame this flag went false — Akshat: "when I remove it it feels
   * jarring." Now it fades out (`.panelColdBackdropOut`, 400ms) and fades back
   * in quicker (200ms), so the node stays mounted in every state.
   */
  const isCold = !hasMessages && !navPage && !menuOpen;

  // ==========================================================================
  // Agent picker — the compact header's title
  // ==========================================================================

  const activeAgent = useMemo(
    () =>
      agents?.find((a) => a.id === selectedAgentId) ??
      agents?.[0] ?? { id: 'iris', name: 'Iris' },
    [agents, selectedAgentId],
  );

  /** `null` when there is nothing to pick between — the header goes chevron-less. */
  /**
   * What the header's switcher shows for the active agent.
   *
   * An agent that supplies a `wordmark` renders it alone — the mark already
   * contains the name as letterforms, so drawing a glyph and a text label
   * beside it would say the name twice. Everything else keeps glyph + name.
   *
   * Iris's own lockup ships with the pattern, so the header reads right with no
   * art props at all; any agent supplies its own through `wordmark`. Frame
   * 101:17846.
   */
  const agentIdentity =
    activeAgent.wordmark ??
    (activeAgent.id === 'iris' ? (
      <img src={irisWordmark} alt="Iris" />
    ) : (
      <>
        <IrisIcon />
        <span className={styles.panelIdentityName}>{activeAgent.name}</span>
      </>
    ));

  const agentMenuItems = useMemo<DropdownItemProps[] | null>(() => {
    if (!agents?.length) return null;
    return agents.map((agent) => ({
      label: agent.name,
      description: agent.description,
      icon: agent.icon ?? <IrisIcon />,
      selected: agent.id === activeAgent.id,
      onClick: () => onSelectAgent?.(agent.id),
    }));
  }, [agents, activeAgent.id, onSelectAgent]);

  /**
   * The header names the surface. Akshat, 2026-08-12: "we could just update the
   * title in the hamburger to the page so then we wouldn't need the hamburger
   * and just keep the back buttons."
   *
   * On a nav page the identity slot becomes the page's name; in a conversation
   * it becomes `iris / {title}`. The title comes from the first *user* turn —
   * `find`, not `[0]`, because a host can seed a conversation with an assistant
   * turn — and is cut at 32 characters.
   */
  const showNavTitle = Boolean(navPage && resolvedNavPageTitle);

  /*
   * THE CONVERSATION TITLE IS GONE. Akshat, 2026-08-19: "let's hide the chat
   * title, it's not working well."
   *
   * It was the first user turn cut to 32 characters, centred in the header. The
   * cut is why it did not work: a question truncated mid-clause names nothing,
   * and "Show me my agreements with ACME,…" is the question you can already see
   * in the stream directly below it. The header names the agent; the
   * conversation names itself in its own first bubble.
   *
   * The centre slot stays in the layout — a nav page still uses it, and the
   * header's three-slot grammar is what keeps the identity left and the actions
   * right at every width.
   */

  /**
   * The one header identity, every layout, every state. The header names the
   * *agent*, never the conversation — cold, mid-conversation, nav page, menu.
   * Akshat, 2026-08-12: "everything should just use the new styling and not
   * feel like two apps."
   */
  const identityNode = agentMenuItems ? (
    <Dropdown items={agentMenuItems} header="Selected Agent" position="bottom" align="start">
      <button className={styles.panelIdentity} aria-label="Switch agent">
        {agentIdentity}
        {/*
          The chevron is hidden at rest and appears on approach. Akshat: "It's
          muddying and adding more information overload, and it's not even
          doing its job" — the job to teach is that hovering the agent name
          lets you change it, and the container already says "clickable".

          `visibility`, not conditional rendering: the space is reserved either
          way, so the wordmark does not shift left when the pointer arrives.
        */}
        <span className={styles.panelIdentityChevron} aria-hidden="true">
          <Icon name="chevron-down" size={14} />
        </span>
      </button>
    </Dropdown>
  ) : (
    <span className={styles.panelIdentity}>{agentIdentity}</span>
  );

  if (isCompact) {
    return (
      <div
        className={`${styles.page} ${styles.pageCompact} ${menuOpen ? styles.pageMenuOpen : ''}`}
        /*
          The one signal the CSS reads for the outside-chrome grammar. An empty
          string, so the attribute is present or absent — `[data-fullscreen]`
          then matches the fact, with no value to compare. `ArtifactDock` reads
          it from here too, through `:global([data-fullscreen])`.
        */
        data-fullscreen={isFullscreen ? '' : undefined}
        /*
          The second gate on the fullscreen grammar: is there a pane beside the
          chat? Frame 163:21261 pins the chat to its panel measure and lets the
          pane take everything left over, and that rule must not fire when there
          is no pane — a chat pinned to 480 with nothing to its right would leave
          the surplus empty. `artifactSlot` is the host's node, so its presence
          is the fact; nothing new is asked of the host.
        */
        data-pane-open={resolvedArtifactSlot ? '' : undefined}
        /*
          The ground experiment's one signal. `flat` is the absence of the
          attribute, not a value to match, so the baseline carries no selector
          at all. Every rule that reads it also asks for `[data-fullscreen]`,
          so the schemes cannot reach a panel-width surface.
        */
        data-ground={groundScheme === 'flat' ? undefined : groundScheme}
      >
        {sidebarOverlay}

        {/*
          The rail at fullscreen — a SIBLING of the chat's chrome, not a column
          inside it. Akshat, from his mock: "can this type of sidebar work?
          where it's literally outside the chrome of the chat?" And on the build
          that put it inside: "the gradient going to white and then goign dark
          again in the left nav is weird."

          That is the whole reason it moved out here. The header, the cold wash
          and the 64px remnant all live on `.rightArea`, so a rail inside it sat
          under the light: the wash dissolved to white over the rail's top 64px
          and the rail's own warm ground resumed below — warm, white, warm. Out
          here the light cannot reach it, with no change to the light layers.

          It comes before `.rightArea` in the DOM, which is also the reading and
          tab order: rail, then chat. Outside fullscreen it is `display: none`,
          so its copy of the rows is not focusable and the full-page menu is the
          only presentation.
        */}
        {/*
          Three bands, because the rail pins at both ends. The scroller is the
          middle one and takes the overflow, so a long history cannot push the
          brand off the top or scroll Settings past the floor — which is what a
          `margin-top: auto` footer inside a scrolling rail does. The 24px the
          frame leaves under Settings is the rail's own bottom padding.
        */}
        {menuOpen && (
          <div className={styles.menuOuterRail}>
            {railBrand && <div className={styles.menuRailBrand}>{railBrand}</div>}
            <div className={styles.menuRailScroll}>{menuSectionsNode('rail')}</div>
            {railFooter && (
              <div className={`${styles.menuRailFooter} ${styles.menuRailShortcuts}`}>
                {railFooter}
              </div>
            )}
          </div>
        )}

        {/*
          THE CHAT CHROME. At fullscreen it is the middle of three siblings —
          rail, chat, pane — so the pane starts at the top of the panel and not
          below the 64px header. The header therefore spans the chat column
          only, which is what frame 158:18134 draws: the pane carries its own
          73px header at the same y.

          `chatColumnCollapsed` moves onto this element at fullscreen, because
          the element the expand gesture has to collapse is the one in the flex
          row. Below fullscreen the pane is still inside `.contentSurface`, so
          the class stays on `.panelChatColumn` and nothing changes.
        */}
        <div
          className={`${styles.rightArea} ${
            isFullscreen && artifactExpanded ? styles.chatColumnCollapsed : ''
          }`}
        >
          {/*
            The wash sits at the top of the whole right area, not inside the
            welcome block — it has to run behind the header, or the gradient
            restarts below a flat 64px band and reads as sitting too low.
            Cold state only, art and wash together.

            Always mounted, opacity driven by the class: the exit is a fade,
            and its end state is `visibility: hidden` + `pointer-events: none`,
            so no content ever sits on an invisible interactive layer. A
            `transitionend` unmount would do the same with a way for a ghost
            layer to survive a cancelled transition.
          */}
          <div
            className={`${styles.panelColdBackdrop} ${
              isCold ? '' : styles.panelColdBackdropOut
            }`}
            aria-hidden="true"
          >
            {coldBackdrop}
          </div>
          <div className={styles.contentHeader}>
            <div className={styles.contentHeaderLeft}>
              {/*
                Back to the conversation, immediately left of the hamburger.
                Frame 94:13551 draws an `arrowLeftSmall` there and nothing above
                the page's title, so the way out of a nav page sits with the
                rest of the chrome rather than inside the page. It exists only
                while a page is up.
              */}
              {/*
                While the menu is up outside fullscreen, the header shows only a
                back arrow on the left — frame 123:24563 hides the hamburger and
                the agent switcher. At fullscreen the arrow hides and the
                hamburger stays, toggling the rail off.
              */}
              {menuOpen ? (
                <IconButton
                  icon="arrow-left"
                  variant="tertiary"
                  size="small"
                  aria-label="Close menu"
                  className={styles.menuBack}
                  onClick={() => setMenuOpen(false)}
                />
              ) : (
                navPage &&
                resolvedNavBack && (
                  <IconButton
                    icon="arrow-left"
                    variant="tertiary"
                    size="small"
                    aria-label="Back to conversation"
                    onClick={resolvedNavBack}
                  />
                )
              )}
              <div
                className={`${styles.menuChrome} ${
                  menuOpen ? styles.menuChromeHiddenNarrow : ''
                }`}
              >
              {menuOpen ? (
                <>
                  <IconButton
                    icon="menu"
                    variant="tertiary"
                    size="small"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  {identityNode}
                </>
              ) : showNavTitle ? (
                /*
                  A page names itself. No hamburger — the back arrow to its left
                  is the only way out a page needs, and the title stands where
                  the wordmark stands, in the wordmark's type.
                */
                <span className={styles.panelIdentity}>
                  <span className={styles.panelIdentityName}>{resolvedNavPageTitle}</span>
                </span>
              ) : (
                <>
                  {/*
                    Hovering the hamburger peeks at the sidebar. Clicking it opens
                    the menu — full page outside fullscreen, rail at fullscreen —
                    never the scrim drawer (Akshat, 2026-08-12). The peek's
                    "See all" still reaches the drawer.
                  */}
                  <HeaderMenu
                    navShortcuts={resolvedNavShortcuts}
                    conversationGroups={conversations}
                    onNewConversation={handleNewConversation}
                    onSelectConversation={(id) => onSelectConversation?.(id)}
                    onSeeAll={() => setSidebarOpen(true)}
                  >
                    <IconButton
                      icon="menu"
                      variant="tertiary"
                      size="small"
                      aria-label="Open menu"
                      onClick={() => setMenuOpen(true)}
                    />
                  </HeaderMenu>
                  {identityNode}
                </>
              )}
              {headerBadge}
              </div>
            </div>
            <div className={styles.contentHeaderCenter} />
            <div className={styles.contentHeaderRight}>
              {/*
                No "New chat" on a new chat — the button would do nothing you
                can see. It appears once there is a conversation to leave.
                Frame 79:8822's header agrees: menu, wordmark, fullscreen, close.
              */}
              {hasMessages && (
                <Tooltip text="New chat">
                  <IconButton
                    icon="edit"
                    variant="tertiary"
                    size="small"
                    aria-label="New chat"
                    onClick={handleNewConversation}
                  />
                </Tooltip>
              )}
              {/*
                The glyph names the destination, not the control. Frame
                163:21261 is a fullscreen state and draws `arrowsIn` here — the
                way out — where every earlier frame drew `arrowsOut`. The host's
                handler is already a toggle (`panel.toggleFullscreen`), so the
                glyph and the label were the only things still saying "open" on
                a surface that was already open. `arrows-in` is in all six
                prototypes' `iconPaths.ts`.
              */}
              {onFullscreen && (
                <Tooltip text={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}>
                  <IconButton
                    icon={isFullscreen ? 'arrows-in' : 'arrows-out'}
                    variant="tertiary"
                    size="small"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
                    onClick={onFullscreen}
                  />
                </Tooltip>
              )}
              {onClose && (
                <Tooltip text={closeLabel}>
                  <IconButton
                    icon="close"
                    variant="tertiary"
                    size="small"
                    aria-label={closeLabel}
                    onClick={onClose}
                  />
                </Tooltip>
              )}
            </div>
          </div>

          {subHeader}

          {/*
            No card in compact, in any state. It was opaque white with rounded
            top corners, so the moment a conversation started it drew a seam
            under the header and turned the header strip into a filled band —
            the "older" header Akshat kept seeing. One surface now.
          */}
          <div className={styles.contentSurface}>
            {/*
              The docked card is gone. It was the menu as a 338px bordered card
              inside the chrome, drawn between 640 and 900 (frame 132:25908),
              and it existed because a rail at those widths competed with the
              host app's own rail. `isFullscreen` answers that question
              directly, so the middle presentation has nothing left to do:
              outside fullscreen the menu is the page, at every width.
            */}
            <div
              className={`${styles.panelChatColumn} ${
                artifactExpanded && !isFullscreen ? styles.chatColumnCollapsed : ''
              }`}
            >
              {fullMenuNode}
              {navPage ? (
                navPage
              ) : !hasMessages ? (
                <div className={styles.panelWelcome}>
                  <div className={styles.panelWelcomeContent}>
                    <div className={styles.greeting}>
                      <p className={styles.greetingBold}>{greeting}</p>
                      <p className={styles.greetingSubtitle}>{greetingSubtitle}</p>
                    </div>

                    {coldStateHeader}

                    {coldSuggestions && (
                      <div className={styles.panelSuggestionsSection}>
                        <ZeroQueryActions
                          items={coldSuggestions}
                          onSend={send}
                          onAttach={handleAttachAgent}
                          onPreview={setPreview}
                          animateIn
                        />
                      </div>
                    )}

                    {coldStateFooter}

                    {coldStateSlot}
                  </div>
                </div>
              ) : (
                <div ref={scrollRef} className={styles.panelChatMessages} onScroll={handleScroll}>
                  {conversationStream}
                  {bottomSpacer}
                </div>
              )}

              {/*
                The composer survives a nav page. It is not decoration there —
                hovering a row previews its query into this box, which is the
                whole reason the rows stay one line. Akshat: "we also want to
                keep the input below so you can hover the items and see the
                preview in the input." Frame 94:13551 draws it, disclaimer and all.
              */}
              <div className={styles.panelChatInput}>
                {/*
                    `default`, not `expanded` — the row count follows the content.

                    This was pinned to `expanded` on the grounds that the composer
                    cannot hold the `+`, the pill and the send button beside the
                    text without them colliding. True, but only while a pill is
                    there: frame 107:23699 shows `+ · text · send` sitting happily
                    on one 40px row with nothing attached, and frame 101:17898
                    shows the two-row form the moment a chip appears.

                    ChatInput already decides this — it expands for attachments or
                    context and collapses for an empty input. `expanded` was
                    short-circuiting that detection entirely, which is why the
                    single-line state had never been seen.
                  */}
                {/*
                  Positioned so it paints over the strip tucked beneath it. The
                  strip is not positioned, so this wins the stack without a
                  z-index race.
                */}
                {/*
                  Above the composer, tucked behind it. Akshat, 2026-08-18: the
                  strip peeks out, and the composer keeps all four of its own
                  corners — so only the edge that clears the composer's ceiling
                  is ever seen.
                */}
                {suggestedContextStrip}
                <div className={styles.panelComposer}>{chatInputNode('default')}</div>
                {disclaimer && <p className={styles.panelDisclaimer}>{disclaimer}</p>}
              </div>
            </div>

            {/*
              ONE SITE PER STATE. The pane renders here below fullscreen and as
              a sibling of `.rightArea` at fullscreen — see the block after this
              container. The two gates are one boolean and its negation, so the
              node is mounted exactly once in either state: no duplicate DOM, no
              duplicate focus target, no duplicate close button.

              Toggling fullscreen therefore remounts the dock. Nothing is lost —
              `ArtifactDock` holds no state (the host owns `openId` and
              `expanded`) — but a renderer's scroll position resets.
            */}
            {!isFullscreen && resolvedArtifactSlot}
          </div>
        </div>

        {/*
          THE PANE, at fullscreen only — the third sibling in the row.

          Akshat, 2026-08-13, on frame 158:18134: "the panel on the right is
          like this... so it goes all the way to the top". Inside
          `.contentSurface` the pane began under the chat's 64px header; out
          here it starts at the top of the panel, the same way the rail already
          does.

          It comes AFTER `.rightArea`, which keeps
          `.menuOuterRail + .rightArea` matching (the chrome's left corners and
          its ground) and puts the tab order in reading order: rail, chat, pane.
        */}
        {isFullscreen && resolvedArtifactSlot}
      </div>
    );
  }

  // ==========================================================================
  // Sidebar / single-column layout
  // ==========================================================================

  return (
    <div className={`${styles.page} ${isSingleColumn ? styles.pageSingleColumn : ''}`}>
      {isSingleColumn ? sidebarOverlay : sidebarNode}

      <div className={styles.rightArea}>
        {/*
          One header for every state — the compact header's grammar, not the
          old title-dropdown one. The identity names the agent; the right side
          carries the actions. The pencil appears once there is a conversation
          to leave; the back arrow while a nav page is up.
        */}
        <div className={styles.contentHeader}>
          <div className={styles.contentHeaderLeft}>
            {isSingleColumn && (
              <IconButton
                icon="menu"
                variant="tertiary"
                size="small"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
              />
            )}
            {navPage && resolvedNavBack && (
              <IconButton
                icon="arrow-left"
                variant="tertiary"
                size="small"
                aria-label="Back to conversation"
                onClick={resolvedNavBack}
              />
            )}
            {identityNode}
            {headerBadge}
          </div>
          <div className={styles.contentHeaderCenter} />
          <div className={styles.contentHeaderRight}>
            {hasMessages && (
              <Tooltip text="New chat">
                <IconButton
                  icon="edit"
                  variant="tertiary"
                  size="small"
                  aria-label="New chat"
                  onClick={handleNewConversation}
                />
              </Tooltip>
            )}
            {onShare && (
              <Tooltip text="Share">
                <IconButton
                  icon="export"
                  variant="tertiary"
                  size="small"
                  aria-label="Share"
                  onClick={onShare}
                />
              </Tooltip>
            )}
            {onOpenSources && (
              <Tooltip text="Sources">
                <IconButton
                  icon="document-stack"
                  variant="tertiary"
                  size="small"
                  aria-label="Sources"
                  onClick={onOpenSources}
                />
              </Tooltip>
            )}
            {onFullscreen && (
              <Tooltip text="Open fullscreen">
                <IconButton
                  icon="arrows-out"
                  variant="tertiary"
                  size="small"
                  aria-label="Open fullscreen"
                  onClick={onFullscreen}
                />
              </Tooltip>
            )}
            {onClose && (
              <Tooltip text={closeLabel}>
                <IconButton
                  icon="close"
                  variant="tertiary"
                  size="small"
                  aria-label={closeLabel}
                  onClick={onClose}
                />
              </Tooltip>
            )}
          </div>
        </div>

        <div className={styles.contentSurface}>
          <div className={styles.contentLayout}>
            <div
              className={`${styles.contentMain} ${artifactExpanded ? styles.chatColumnCollapsed : ''}`}
            >
              {navPage ? (
                navPage
              ) : !hasMessages ? (
                <div className={styles.welcomeArea}>
                  <div className={styles.welcomeContent}>
                    <div className={styles.greeting}>
                      <p className={styles.greetingBold}>{greeting}</p>
                      <p className={styles.greetingSubtitle}>{greetingSubtitle}</p>
                    </div>

                    {coldStateHeader}

                    <div className={styles.inputHero}>{chatInputNode('expanded')}</div>

                    {coldSuggestions ? (
                      <div className={styles.discoverySection}>
                        <div className={styles.suggestionItems}>
                          {coldSuggestions.map((suggestion, i) => (
                            <button
                              key={suggestion.label}
                              className={styles.suggestionItem}
                              /*
                                The same string the compact layout sends. A row
                                stands for one query — its `description` when it
                                has one, its label when it does not — and the
                                click sends that query, never a shorter one. The
                                two layouts read one value, so they cannot say
                                different things.
                              */
                              onClick={() =>
                                suggestion.onClick
                                  ? suggestion.onClick()
                                  : send(suggestion.description ?? suggestion.label)
                              }
                              style={{ animationDelay: `${i * 40}ms` }}
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : categories.length > 0 ? (
                      <div className={styles.discoverySection}>
                        <div className={styles.categoryTabs}>
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              className={`${styles.categoryTab} ${activeCategory === cat.id ? styles.categoryTabActive : ''}`}
                              onClick={() => setActiveCategory(cat.id)}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        <div className={styles.suggestionItems} key={activeCategory}>
                          {categories
                            .find((c) => c.id === activeCategory)
                            ?.suggestions.map((text, i) => (
                              <button
                                key={text}
                                className={styles.suggestionItem}
                                onClick={() => send(text)}
                                style={{ animationDelay: `${i * 40}ms` }}
                              >
                                {text}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : null}

                    {coldStateSlot}
                  </div>
                </div>
              ) : (
                <div className={styles.chatArea}>
                  <div ref={scrollRef} className={styles.chatMessages} onScroll={handleScroll}>
                    {conversationStream}
                    {bottomSpacer}
                  </div>

                  <div className={styles.chatInput}>{chatInputNode('default')}</div>
                </div>
              )}
            </div>

            {resolvedArtifactSlot}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IrisAgent;
