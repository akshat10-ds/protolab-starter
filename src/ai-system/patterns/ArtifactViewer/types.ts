/**
 * The artifact model, and the renderer contract the dock plugs into.
 *
 * Akshat, 2026-08-13: "the pane is sort of like the artifacts panel can be used
 * dynamically for showing agreements, showing a document editor, showing data
 * tables, etc." The dock is a FRAME. What goes in it is a RENDERER. This file
 * is the line between the two.
 *
 * It is a separate file so a renderer can name the model without importing the
 * dock, and the dock can name the renderer contract without importing a
 * renderer. `ArtifactDock.tsx` re-exports every type here, so an old import
 * path keeps working.
 */

import type React from 'react';
import type { DocumentHighlight } from '../DocumentViewer/DocumentViewer';

/**
 * Re-exported so a host can name a citation box without importing the older
 * `DocumentViewer` it was declared in. One type, two readers — the shape is not
 * redeclared here.
 */
export type { DocumentHighlight };

// =============================================================================
// The artifact model
// =============================================================================

/**
 * What the dock is showing. Every value must have an entry in
 * `artifactRenderers.tsx`; that map is the only place a kind is named.
 * `visualization` is a declared placeholder: the API is ready for charts, the
 * system adds no chart dependency to draw one.
 */
export type ArtifactKind =
  | 'markdown'
  | 'table'
  | 'document'
  | 'sources'
  | 'visualization'
  | 'process';

/**
 * One row in a `sources` item. Clicking it drills to a `document` item.
 *
 * The fields below `icon` are the ATTACHED-SOURCE card shipping Iris draws in
 * its third column: status dot and label, what happens next, the agreement type,
 * the parties. All optional and all additive — a row with none of them is the
 * plain title/excerpt/meta line it has always been.
 */
export interface ArtifactSource {
  id: string;
  title: string;
  excerpt?: string;
  meta?: string;
  icon?: string;
  /** Drives the dot's colour: `active` | `inactive` | `expired` | `pending`. */
  status?: string;
  /** Overrides the label the status derives ("Effective Soon"). */
  statusLabel?: string;
  /** The line under the status — "Renews 7/30/2027", "Expired 1/31/2025". */
  statusDate?: string;
  agreementType?: string;
  parties?: string[];
  /**
   * Draws this row's own ✕, which reports `source:remove` through the dock's
   * `onAction` with the source id. Opt-in: the dock has no opinion about what
   * removing means, and a row nothing can remove must not offer to.
   */
  removable?: boolean;
}

/** One block of a `document` item. `highlighted` is the cited passage. */
export interface ArtifactSection {
  heading?: string;
  /** The prose path. Omit it only when `content` carries the block instead. */
  body?: string;
  /**
   * A RENDERED BLOCK, in place of prose.
   *
   * A page of a document is not always paragraphs. A 1003 and a bank statement
   * are label/value grids, and before this the only way to draw one in the dock
   * was to reach past the barrel for the page's CSS and re-host it. Give
   * `content` and `DocumentRenderer` draws it inside the same 783px page, with
   * the same margins and the same well; leave it out and the prose path is
   * untouched.
   *
   * The section still owns `heading`, `highlighted` and `citationId`, so a
   * component page is still addressable by a citation.
   */
  content?: React.ReactNode;
  highlighted?: boolean;
  citationId?: string;
}

// -----------------------------------------------------------------------------
// The table model
// -----------------------------------------------------------------------------

/**
 * The four status states frame 163:21261 draws. Two of them add a quiet second
 * line ("Expires DD-MM-YY", "Renews DD-MM-YY"); the other two do not.
 */
export type ArtifactTableStatus = 'expiring' | 'renewing' | 'active' | 'inactive';

/**
 * One cell. The frame uses four shapes and no more.
 *
 * `text` covers both the one-line cells (Expiration Date, Agreement Type) and
 * the two-line File Name cell — `sub` is the second line, `subIcon` the 16px
 * glyph in front of it.
 */
export type ArtifactTableCell =
  | { kind: 'text'; text: string; sub?: string; subIcon?: string }
  /** Parties and Sets: 0–2 chips, and a "+N More" button when there are more. */
  | { kind: 'chips'; chips: string[]; more?: number }
  /** A dot, a label, and a second line on `expiring` and `renewing`. */
  | { kind: 'status'; state: ArtifactTableStatus; label: string; sub?: string };

export interface ArtifactTableColumn {
  /** Matches the key used in a row's `cells` and `sortValues`. */
  key: string;
  label: string;
  /** Column width in px, from the frame. Omit it and the column takes its share. */
  width?: number;
  sortable?: boolean;
  /**
   * Which edge the column aligns to — header label and body cells together.
   * Defaults to `start`. Use `end` for a column of numbers or dates: the
   * renderer also gives it tabular figures, so the digits stack in columns and
   * the values read as a ranking.
   */
  align?: 'start' | 'end';
}

export interface ArtifactTableRow {
  id: string;
  cells: Record<string, ArtifactTableCell>;
  /**
   * What a sortable column sorts on. Supply it wherever the text does not sort:
   * a DD-MM-YY date sorts wrong as a string, and a status has an order that its
   * label does not carry. Where it is absent the renderer falls back to the
   * cell's own text.
   */
  sortValues?: Record<string, string | number>;
}

export interface ArtifactTable {
  columns: ArtifactTableColumn[];
  rows: ArtifactTableRow[];
  /** Draws the leading checkbox column. Selection is the renderer's own state. */
  selectable?: boolean;
  /**
   * Draws the trailing 32px overflow button on every row, and the show/hide
   * fields button in the header row.
   *
   * These are a flag, not a cell kind. The frame gives every row the same
   * button, so it is chrome the table draws — putting it in `cells` would make
   * every row repeat one constant.
   */
  rowActions?: boolean;
}

// -----------------------------------------------------------------------------
// The process model
// -----------------------------------------------------------------------------

/**
 * One step of a multi-step run. `bullets` is what the agent did there, and the
 * renderer shows one step's bullets at a time — the chat carries the current
 * step, the artifact carries all of them (Akshat, 2026-08-19: loan progress
 * follows the search pattern, current step in chat, everything in the artifact).
 */
export interface ArtifactProcessStep {
  id: string;
  label: string;
  status: 'complete' | 'active' | 'upcoming';
  bullets?: string[];
}

/**
 * One recommendation, as DATA. No handlers: the renderer routes every control
 * through the dock's `onAction`, so the host stays the only place that knows
 * what adding or dismissing one means.
 */
export interface ArtifactRecommendation {
  id: string;
  /**
   * Which archetype the card draws.
   *
   * `flag` gets the red mark, no Dismiss and an officer-note field — see
   * `RecommendationCard`. It reports through `recommendation:markReviewed`,
   * whose `detail` is `{ id, note }` rather than the bare id the other verbs
   * send, because the note has nowhere else to go.
   *
   * `judgement` is a finding the agent PARKED rather than decided — it has no
   * preferred answer, so it draws the brief card's two peer verbs: Review, which
   * goes and looks (`recommendation:review`), and Dismiss, which settles it here
   * and REQUIRES a reason, because declining IS the verdict on a finding like
   * this. It has no accept: there is nothing to add and nothing to request.
   *
   * It exists because a list that says "See all (3)" has to hold three. A
   * parked finding is a task the host counts, and until this kind existed the
   * list could only draw the other two archetypes and quietly dropped it.
   */
  kind?: 'request' | 'flag' | 'judgement';
  title: string;
  meta?: string;
  body: string;
  citation?: string;
  /** What the card's "Why this?" reveals. Falls back to `citation`. */
  why?: string;
  /** Overrides the card's primary label. Default: "Add and request". */
  actionLabel?: string;
  /**
   * An Ink icon name, drawn quiet at the card's lead. `judgement` only — the
   * other two archetypes wear the mark their kind gives them.
   */
  icon?: string;
  /** The one visible line of why, above the expansion. `judgement` only. */
  reason?: string;
  /** The values the finding rests on, itemized in the expansion. */
  checks?: { label: string; value?: string }[];
  /**
   * The placeholder on the decline's reason field — "Why is this acceptable?"
   * rather than "Why not?", because on a parked finding declining is a verdict
   * and not a refusal.
   */
  dismissPrompt?: string;
  /** Gates the decline's confirm until the officer has written something. */
  dismissReasonRequired?: boolean;
}

/**
 * One event in the run's narration — a thing the agent or the person did, or a
 * thing the plan says will happen and has not yet.
 *
 * Akshat, 2026-08-19: agent work needs a standing surface, not *"updating the
 * entire experience through one little box"* — the whole plan visible before it
 * runs, future steps drawn grey, the current one marked by mass. That is Ink's
 * `Timeline`, and this is its data.
 *
 * APPEND, NEVER MUTATE. An event that has been shown does not change its label
 * or its detail; the run moves by adding rows, and only `status` follows the
 * frontier. A narration that rewrites itself is not a narration.
 */
export interface ArtifactProcessEvent {
  id: string;
  label: string;
  /** Realized events carry one. A planned event has not happened, so it has none. */
  timestamp?: string;
  /** What was read, the rule cited — the row's expandable body. */
  detail?: string;
  status: 'complete' | 'current' | 'incomplete';
  /** The row's own control, inside its detail. Reports `process:event` with `id`. */
  action?: { label: string; id: string };
  /**
   * WHICH STEP THIS BELONGS TO — the id of an `ArtifactProcessStep`.
   *
   * Stamp it and the stepper stops being only a header and becomes the filter:
   * selecting a step draws that phase's events and its planned rows, and
   * nothing else. Akshat, 2026-08-20: *"when I click on Classify I should see
   * history for that, then click Disclosures I see history for that."*
   *
   * ALL OR NOTHING. If no event carries one, the renderer draws the whole run
   * as one timeline, exactly as before — a host that has not stamped its events
   * is not asking for a filter, and a per-row escape hatch would leak the
   * unstamped rows into every phase.
   */
  stepId?: string;
}

/** The `process` payload: the stepper, and the recommendations under it. */
export interface ArtifactProcess {
  steps: ArtifactProcessStep[];
  /**
   * The run narrated, oldest first, planned-but-unrun events last.
   *
   * Give it and the renderer draws one `Timeline` across the whole run in place
   * of the per-step bullets: the stepper is the phase header ACROSS the flow,
   * the timeline narrates WITHIN it — the same vocabulary, 90° apart. Omit it
   * and the renderer falls back to one step's `bullets`, as before.
   */
  events?: ArtifactProcessEvent[];
  recommendations?: ArtifactRecommendation[];
  /**
   * TAKE ME TO THIS ONE. The id of the recommendation the reader was sent here
   * for — the renderer opens the section, scrolls that card into view and rings
   * it once.
   *
   * It lives in the DATA rather than as a prop because the process surface is
   * mounted in two places (the dock, and a host's own nav page) and a prop
   * would have to be threaded through both. A count that says "Needs you (2)"
   * has to be able to reach the two things it counts; this is how.
   */
  focusRecId?: string;
  /**
   * READ THIS PHASE. The id of the step whose slice the reader was sent here
   * for — the stepper's filter jumps to it instead of following the run.
   *
   * Same shape and same reason as `focusRecId`: a run-chip in the thread opens
   * the record scoped to the run it is a receipt for, and the surface is
   * mounted in two places, so the destination travels in the data rather than
   * as a prop threaded through both.
   *
   * The host clears it after the jump, exactly as it clears `focusRecId` —
   * that is what lets a second press of the same chip fire again.
   */
  focusStepId?: string;
  /**
   * TAKE ME TO ALL OF THEM. A door that promises the whole list — a cold
   * state's "See all (N)" — lands on the recommendations section rather than
   * on the run: the section opens and its header scrolls to the top.
   *
   * NOT `focusRecId` WITH THE FIRST ID IN IT. That one means "the one card you
   * were sent for" and rings it; a reader sent to all of them has no first
   * card, and a ring on one of three is a claim the door never made.
   *
   * A COUNTER, not an id the host clears: bump it and the jump fires. Pressing
   * See all twice is two presses, and the value has changed both times, so
   * there is no window in which the second one is a no-op.
   */
  focusRecs?: number;
}

// -----------------------------------------------------------------------------
// The item
// -----------------------------------------------------------------------------

/** One artifact. The host owns the list. */
export interface ArtifactItem {
  id: string;
  title: string;
  kind: ArtifactKind;
  /**
   * Parties, date, row count.
   *
   * The 73px header of frames 158:18134 and 163:21261 draws the title alone, so
   * the dock no longer renders this. It stays on the model because hosts and
   * fixtures set it, and because a renderer may still want it.
   */
  subtitle?: string;
  /** `markdown`, and `table` when it has no structured model: a markdown string. */
  content?: string;
  /** `table`: the structured model. Preferred over `content`. */
  table?: ArtifactTable;
  /** `document`: the agreement's sections, paged by the renderer. */
  sections?: ArtifactSection[];
  /**
   * `document`: FIELD-LEVEL CITATION, as boxes over the page.
   *
   * `ArtifactSection.highlighted` tints a whole section, which is the right
   * scale for a cited clause and the wrong one for a cited FIELD — an employer
   * address on a 1003 is one row of a grid, not a paragraph. These are the
   * smaller mark: percentage boxes drawn over the page, the same
   * `DocumentHighlight` shape `DocumentViewer` has always used, so a host that
   * knows one knows both.
   *
   * ONE REFERENCE BOX: THE PAGE'S CONTENT BOX. `top`/`left`/`width`/`height`
   * are percentages of the page inside its 82px margins — not of the padding
   * box, which is what `DocumentViewer` measures. That is deliberate: the page
   * content a host lays out in percentages measures the same content box, so a
   * row at 55% and a band at 55% are the same line with no margin term to carry.
   *
   * The boxes are inert unless the dock has an `onAction`, in which case a
   * press reports `highlight` with the highlight's id.
   */
  highlights?: DocumentHighlight[];
  /** `sources`: the file rows. */
  sources?: ArtifactSource[];
  /** `process`: the steps, and the recommendations the run produced. */
  process?: ArtifactProcess;
  /**
   * Where this item was reached FROM. The dock draws a back control naming that
   * item, before the title.
   *
   * It exists because a document can be arrived at more than one way — out of a
   * sources list, or out of a search result table — and "back" has to mean the
   * one you actually came through. Akshat, 2026-08-19: *"we do need breadcrumb
   * before the agreement name to go back to the search results."*
   *
   * The host sets it, because the host is what knows the route. An id not in
   * `items` draws nothing.
   */
  parentId?: string;
}

// =============================================================================
// The renderer contract
// =============================================================================

/**
 * The host hook every renderer- and header-supplied control routes through.
 * One prop covers download, Open in Navigator, search, a row's overflow menu
 * and the show/hide fields button, because the dock has no opinion about any of
 * them — it only reports that one was pressed.
 */
export type ArtifactActionHandler = (
  action: string,
  item: ArtifactItem,
  detail?: unknown
) => void;

/** What the dock hands a renderer. */
export interface ArtifactRenderContext {
  item: ArtifactItem;
  onAction?: ArtifactActionHandler;
  /** A `sources` row was clicked. The host opens the matching `document` item. */
  onSourceOpen?: (sourceId: string) => void;
}

/**
 * A renderer.
 *
 * `Body` owns EVERYTHING below the universal header — its own optional 48px
 * toolbar and its own well — and returns them as a fragment, so they become
 * direct children of the dock's flex column. Two facts force that split rather
 * than a `renderToolbar` slot the dock places itself:
 *
 * 1. The toolbar and the well share state. The document's page number and zoom
 *    are set in the toolbar and read by the page.
 * 2. The wells differ. The table is full-bleed, the document is a canvas ground
 *    with a white page centred in it, markdown keeps the padded well.
 *
 * The dock supplies the `.toolbar` and `.well` classes for both to use, so
 * every renderer draws the same 48px band and the same scroll behaviour.
 *
 * `HeaderActions` is what the renderer contributes to the header, between the
 * title and download · expand · close.
 */
export interface ArtifactRenderer {
  Body: React.FC<ArtifactRenderContext>;
  HeaderActions?: React.FC<ArtifactRenderContext>;
}
