/**
 * IrisAgent — types that are genuinely part of the surface.
 *
 * These moved out of the frozen prototype's `data/types.ts`. Everything in that
 * file that described the *scripted demo* (`ScenarioResponse`, `ScenarioMap`,
 * the workflow-pipeline stage union) stayed behind — see README, "What was
 * dropped".
 */

import type { ReactNode } from 'react';

import type { AgentStep } from '@ai/composites/AgentThinking/AgentThinking';
import type { ZeroQueryActionKind } from '@ai/composites/ZeroQueryActions/ZeroQueryActions';
import type { Citation } from '@ai/primitives/CitationBadge/CitationBadge';

/** Who produced a turn. The prototype's `'system'` role was never rendered. */
export type MessageRole = 'user' | 'assistant';

/** Slash-command provenance for a user turn — renders the command bubble. */
export interface CommandMeta {
  /** Source label above the bubble, e.g. "Agents" */
  label?: string;
  /** Description shown in the hover popover */
  description?: string;
  /** Type label in the popover footer, e.g. "Skill", "Agent" */
  commandType?: string;
}

/** One row of an inline result table rendered inside an assistant turn. */
export interface InlineResultRow {
  id: string;
  name: string;
  type: string;
  status: string;
  date: string;
}

export interface InlineResults {
  rows: InlineResultRow[];
  totalCount?: number;
  /**
   * The dock item this preview stands for. Supply it and the card offers
   * "See all"; the card then reads its own label off whether this id is the one
   * currently open — see `IrisAgent`'s `openArtifactId`.
   *
   * The link is an id and nothing more. A message never learns whether it is
   * "the open one"; it is told which item it points at, and the comparison
   * happens where both facts are already in hand.
   */
  artifactId?: string;
}

/** A follow-up prompt offered after a completed turn. */
export interface FollowUp {
  /** Sent as the message text — the display bubble shows `label` instead */
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

/**
 * Terminal state of an assistant turn.
 *
 * `summary` feeds `AgentThinking.outcomeSummary`; `followUps` feeds the
 * suggestion chips. `title`, `status` and `duration` are carried but not
 * rendered — the prototype dropped them too (backlog §4.5).
 */
export interface TaskCompletion {
  title?: string;
  summary?: string;
  status?: 'completed' | 'failed';
  duration?: string;
  followUps?: FollowUp[];
}

/** One turn in the conversation. The consumer owns the array. */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  /** Plain text. For user turns this is the bubble text. */
  content: string;
  timestamp?: Date;
  /** When present, `AgentThinking` renders above the content */
  thinkingSteps?: AgentStep[];
  /** Markdown body — streams in when this is the live turn */
  markdownContent?: string;
  /** Outcome summary + follow-up prompts */
  taskCompletion?: TaskCompletion;
  /** Citation data keyed by citation id */
  citations?: Record<string, Citation>;
  /** Structured results rendered as a DataTable inside the turn */
  inlineResults?: InlineResults;
  /** Slash-command metadata — renders the command bubble variant */
  commandMeta?: CommandMeta;
  /** Question that prompted this user selection — shown as a label above the bubble */
  elicitationQuestion?: string;
}

/** Extra context handed up with `onSendMessage`. */
export interface SendMeta {
  /** Show this in the bubble instead of the raw sent text (follow-up chips) */
  displayLabel?: string;
  /** Set when the send originated from a slash command */
  commandMeta?: CommandMeta;
  /** The context pill that was attached at send time, if any */
  contextSource?: ContextSource | null;
}

/** A context attachment shown as a pill above the input. */
export interface ContextSource {
  label: string;
  icon?: string;
  /** e.g. "Agreement", "Ticket", "Party" — drives the placeholder hints */
  objectType?: string;
}

/** A cold-state category tab and the prompts underneath it. */
export interface SuggestionCategory {
  id: string;
  label: string;
  suggestions: string[];
}

/** A single cold-state suggestion, replacing the category tabs when supplied. */
/**
 * One row in the cold state's suggested-action list.
 *
 * `kind` and `description` drive the hover reveal — see `ZeroQueryActions`.
 * Both are optional, so a caller that passes only `label` gets the plain row
 * this type has always described.
 */
export interface CustomSuggestion {
  label: string;
  icon?: string;
  /** Defaults to sending `description ?? label` as a message */
  onClick?: () => void;
  /** What the row runs. Defaults to `'action'` — no chip, no reveal. */
  kind?: ZeroQueryActionKind;
  /** One line saying what this does, revealed on hover/focus. */
  description?: string;
}

/**
 * One entry in the compact header's agent picker.
 *
 * The header names the agent, not the conversation. A surface with more than one
 * agent lets the user switch between them; a surface with one shows its name and
 * no chevron.
 */
export interface AgentOption {
  id: string;
  name: string;
  /** Secondary line in the picker. Omitted for the default agent. */
  description?: string;
  /** Defaults to the Iris glyph. */
  icon?: ReactNode;
  /**
   * Ink icon NAME for places that draw the agent as a plain row — the
   * hamburger menu's Agents section. Distinct from `icon` (a ReactNode for
   * the picker) so a host can align row glyphs without touching the picker.
   * Host data — the name must exist in the host's own Ink snapshot.
   * Defaults to `flash`, which every snapshot has.
   */
  glyph?: string;
  /**
   * A lockup that replaces glyph *and* name in the header — e.g. the `iris`
   * wordmark, whose letterforms already spell the name.
   *
   * The agent with id `iris` gets the Iris lockup that ships with the pattern,
   * so a host names no art. Any other agent renders `icon` + `name` until it
   * supplies one here. `icon` still drives the picker rows either way.
   */
  wordmark?: ReactNode;
}

/** A cell selected on a host canvas/worksheet, surfaced as an input context pill. */
export interface CanvasContext {
  rowName: string;
  field: string;
  value: string;
  rowId: string;
}

/** A document the host has loaded into the agent's context. */
export interface AgreementRef {
  id: string | number;
  fileName: string;
}
