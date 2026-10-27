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
import type { RunChipData } from '@ai/composites/RunChip/RunChip';
import type { ZeroQueryActionKind } from '@ai/composites/ZeroQueryActions/ZeroQueryActions';
import type { AnswerPair } from '@ai/primitives/MessageBubble/MessageBubble';
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
  /**
   * THIS TURN IS AN AGENT RUN — `RunChip` renders above the content, and the
   * content waits for `runChip.done`.
   *
   * Akshat, 2026-08-20, on Claude's deep-research pattern: **agent work is a
   * chip in the thread, and the chip opens the record.** A run drawn this way
   * leaves a permanent row saying it happened; `thinkingSteps` draws the
   * accordion, which empties itself the moment the run lands. Both slots exist
   * because they are two different things: a run is work, and thinking is a
   * turn reasoning about its own answer.
   *
   * **The record is no longer the only place a chip can go.** Akshat,
   * 2026-08-24: *"a little box that shows that the agent is working on thinking
   * on this. If I click on it, I can expand and see the thinking, but otherwise
   * it could just show us that it's working."* Give the chip `lines` and set
   * `expandable` and the press opens the thinking IN PLACE instead of leaving
   * for the record. The 2026-08-20 contract still governs every chip without
   * `lines` — a chip with nothing to expand into still opens the record.
   *
   * They are mutually exclusive on one turn. Give both and the chip wins.
   */
  runChip?: RunChipData;
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
  /**
   * This user turn is a RECORD OF AN ACT, not something anyone said — "You
   * approved: Request the income documents". Drawn as `MessageBubble`'s
   * `action-receipt` chip instead of a bubble.
   *
   * It is what makes the thread a ledger: an agent that acts because a person
   * pressed something appends the press, then its own response, as a pair.
   */
  actionReceipt?: boolean;
  /**
   * The overline caption over an action receipt — "Accepted Recommendation".
   * The caption is what says which verdict this was, so a dismissal or a
   * review is one string away and not a second variant.
   */
  receiptLabel?: string;
  /**
   * The mark on an action receipt. Default is the check; `none` is for a
   * verdict that did not do anything — a dismissal (Akshat, 2026-08-20).
   */
  receiptGlyph?: 'check' | 'none';
  /**
   * THE ANSWER TO A DOCKED ASK, LANDED IN THE THREAD.
   *
   * The ask itself stays in the composer — that is the HITL spec and it does
   * not move. What moves here is the confirmation: the composer frees the
   * moment she answers, and this turn is what survives. One pair is a bubble;
   * a batch is the condensed block. `receiptLabel` is the caption over it
   * ("Answered").
   */
  answerRecord?: AnswerPair[];
  /**
   * THIS TURN IS NOT SETTLED. Akshat, 2026-08-20: a turn holding a decision
   * nobody has made — an unactioned recommendation, an unreviewed flag, an
   * unanswered question — is unfinished, so it wears no copy/thumbs and offers
   * no follow-ups until every decision inside it resolves. The consumer owns
   * what "resolved" means; the pattern only obeys the flag.
   */
  pending?: boolean;
  /**
   * THIS TURN IS AN ACT, NOT AN ANSWER. Akshat, 2026-08-20: a turn whose body
   * is cards or work in flight — a recommendation, a wave of findings, a run,
   * the preamble to a docked question — carries no copy/thumbs. There is
   * nothing to rate: the thing to judge is the act, and she judges that by
   * accepting or dismissing it.
   *
   * IT IS ALLOWED TO STOP BEING ONE. The agent's response to an acceptance —
   * the ack line and the lifecycle object under it — is an act while the object
   * is ticking and a finished ANSWER once it resolves, so the consumer takes
   * the mark off and the feedback row arrives (2026-08-20). Derive it rather
   * than freezing it at append time, exactly as `pending` is derived.
   *
   * NOT `pending`, which means "a decision nobody has made" and also holds the
   * follow-up rows back. Work in flight is not a decision she owes anyone.
   *
   * Feedback is for informational turns — a question answered, an analysis
   * returned. The consumer marks; the pattern obeys. Unmarked turns are
   * informational, so no existing surface changes by adding this.
   */
  kind?: 'action';
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
