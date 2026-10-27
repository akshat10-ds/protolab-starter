/**
 * RecommendationCard — one thing the agent thinks you should do next.
 *
 * **The card stays small.** Akshat, 2026-08-19: the object preview opens in the
 * right panel, NOT embedded in the card. So there is no thumbnail, no table, no
 * document here — `onReview` reports the intent and the host opens the detail in
 * the dock. A card that draws the object is a card that has become the artifact.
 *
 * **The anatomy is fixed:** title · meta · body (clamped) · "Why this?" ·
 * actions. Everything that decides the question is legible without a gesture,
 * because the card's job is to be skimmed in a list.
 *
 * ── "Why this?" ──
 * The source used to be a chip: `Source: bank's employment-gap rule`, sitting
 * under the body doing nothing but naming a rule. Akshat, 2026-08-19, turned it
 * into a disclosure — the same question a person actually asks — that opens ONE
 * short paragraph in place: the rule, and what in this file tripped it. It
 * expands inline and never opens anything; a card that navigates to explain
 * itself is a card that has stopped being skimmable.
 *
 * A rec fires inline in the thread exactly once (Akshat, 2026-08-19); the sticky
 * link above the composer is the door to all of them after that. Both of those
 * are the host's rules, not this component's — it draws the card wherever it is
 * put.
 *
 * ── The flag archetype (`kind="flag"`) ──
 * A second archetype, not a second component. The agent found something it will
 * not act on and hands it to a human: a red flag mark in place of the AI mark,
 * and the officer's own words instead of a decision.
 *
 * What changes, and why:
 * - **No Dismiss, anywhere.** Not the X, not the button, not when `onDismiss`
 *   is passed — a flag exists because policy says a person has to look, so an
 *   exit that closes it without looking would be the one control it must not
 *   have.
 * - **A textarea, and it is REQUIRED.** The note IS the outcome. A flag creates
 *   no document and no request; what survives it is the line the officer wrote,
 *   which the host files (in FINS, into the audit trail). It used to be
 *   optional, and the loan-officer review (2026-08-19) cleared a flag with an
 *   empty one: *"the compliance flag clears with an empty optional note — the
 *   one field QC would make mandatory."* A flag that closes with nothing
 *   written is a policy check that left no evidence it happened, so
 *   "Mark reviewed" stays disabled until there is text.
 * - **"Mark reviewed"** is the primary, and it carries the note out through
 *   `onMarkReviewed`. `onAdd` has nothing to do here and is not drawn.
 *
 * The card is still static and still small — the textarea is three rows and the
 * anatomy above it is unchanged.
 *
 * ── `compact` ──
 * Akshat, 2026-08-19: "the recommendation card looks too heavy and we probably
 * should show some with a way to see all." So the zero-query preview draws a
 * stack of these instead of full cards: title + meta, and nothing else — no
 * body, no citation, no buttons. The whole row is the click target and it opens
 * the rec in the artifact, which is where the weight belongs.
 *
 * A flag stays a flag: the red mark still rides the title, and there is still no
 * dismiss. Compact removes the card's *volume*, never its meaning.
 *
 * Full weight survives in exactly two places, and they are the host's rules:
 * the artifact, and the one inline turn where a rec fires mid-conversation.
 *
 * ── `layout="brief"` — the redesign (2026-08-24) ──
 * Akshat's own card (Figma 511:29081/511:29115) plus what the loan-officer and
 * CPO reviews demanded of it. `layout="full"` is the card above and is still the
 * default, so nothing already drawn moves. `compact` is orthogonal and still
 * wins over both.
 *
 * The anatomy, top to bottom:
 *
 *   [icon] Draft the initial disclosures    [⋯] [⌄]  <- `icon`, `title`, overflow, chevron
 *   Disclosures are due within 3 days of the application.  <- `reason`
 *   [ Accept ] [ Decline ]                            <- two peers
 *
 * **THE EYEBROW IS GONE (2026-08-25).** It used to lead: a glyph, then
 * "Draft agreement · Apr 2". Akshat took both away — *"so we'd get rid of the
 * draft agreement and date at top?"* for the type, and *"I don't even think
 * we'll actually have a date in the real world"* for the date. The icon moved
 * inline with the title, at the title's own line, which is how his card draws
 * it. `meta` is simply not read here any more; `full` and `compact` still draw
 * it.
 *
 * **So the VERB is what says which kind of task this is.** That was the
 * eyebrow's job and nothing else took it over — there is one glyph on every
 * card (Akshat: *"I think we just keep one glyph for now. I'm not sure what the
 * different glyphs would be because we don't know the real task kinds that
 * we'll build"*), so the type is legible only in `actionLabel`: "Send request"
 * is an act, "Review" is a judgement she has to make, "Mark reviewed" is a
 * notice. A caller that guesses that verb has made the card typeless — which is
 * the standing reason `brief` ships no default label.
 *
 * `overflowPlacement="top"` moves the `⋯` off the end of the actions and onto
 * the title's row, and `actionRegister="text"` trades the two chips for the
 * card's own quiet label register. Both are opt-in and both default to the card
 * above.
 *
 * **The title is the loudest line, and its grammar is the caller's.** `stance`
 * declares which grammar it is: `'proposes'` for an imperative title (draft
 * this, request that), `'asks'` for an interrogative one — Gmail's move,
 * *"Unsubscribe from Atlassian Confluence?"*. A card that asks for a judgement
 * has no primary, so `'asks'` draws two identical tertiary buttons; a card that
 * proposes an action spends one notch of Ink's ladder on the accept.
 *
 * **The reason is always visible.** Gmail's dose: a line of why, or nothing. It
 * started clamped to exactly one line; Akshat relaxed that on 2026-08-25 —
 * *"description can be longer if needed"* — so it wraps instead of ellipsing.
 * A paragraph still belongs in `why`, which the expansion draws in full; the
 * difference is that a reason two words over no longer loses its ending.
 *
 * **Both decisions are buttons.** The loan-officer review: *"Dismissing a name
 * mismatch is a one-click, no-reason action… the field is literally labelled
 * 'Why not? (optional)'."* Decline is a peer of accept, in the same row, at the
 * same size — never a text link, never the overflow, never an X. And where the
 * finding has consequences the host sets `dismissReasonRequired` and the confirm
 * stays dead until she writes something.
 *
 * **Everything else is the overflow.** View the source document, open the
 * artifact, snooze, ask the agent — caller-supplied, so the resting state stays
 * at two decisions. `onAskIris` is NOT drawn in brief: the officer review
 * counted three names for one agent on one screen, and the agent's name is the
 * host's to say. Put it in `overflow`.
 *
 * **The press is the disclosure.** The text stack is one button and it opens the
 * expansion in place — the full rationale (`why`), the itemized `checks` with
 * the values in effect, and the policy `citation` with its section, version and
 * effective date. The CPO review: *"'8 rules' is asserted and never itemized…
 * a credit risk officer will ask 'which eight' in the first five minutes and
 * there is no answer on screen."* `checks` is that answer. Nothing about the
 * card navigates to explain itself; `onReview` moved to the accept button,
 * which is what the reviews asked for — *"that button opens the review."*
 *
 * **A flag in brief drops the red and drops the textarea.** Akshat's own review
 * variant (511:29115) carries neither: a `compare` glyph in the standing icon
 * colour, and since the eyebrow went, its verb ("Review") is what says a person
 * still has to look. And the note is
 * not captured here, because a finding is settled by looking — the accept opens
 * the review and the note belongs to that surface. `onMarkReviewed` is ignored
 * in brief. `layout="full"`'s flag is untouched.
 */

import React, { useState } from 'react';
import type { ComponentProps } from 'react';
import { AIIcon, Button, Dropdown, Icon, IconButton, Input, TextArea, Tooltip } from '@ink';

import styles from './RecommendationCard.module.css';

// =============================================================================
// Types
// =============================================================================

/**
 * One thing the agent checked, and the value it checked against — the answer to
 * "which eight rules". Drawn in the expansion, label left, value right.
 *
 * The VALUE is the point. `{ label: 'Loan amount', value: '$640,000 — ceiling
 * $832,750' }` is a check; `{ label: 'Loan amount' }` is a list item. A host
 * that cannot state the configured value should say so in the label rather than
 * leave the column empty.
 */
export interface RecommendationCheck {
  /** What was checked. */
  label: string;
  /** The value in effect when it ran. */
  value?: string;
  /**
   * Makes the VALUE a target. A pair that names a place — twelve obligations,
   * three sets — is a door as much as a fact, and the reader who wants the
   * twelve should not have to find the way there themselves.
   *
   * Additive: a pair without it draws exactly as before, as text.
   */
  onSelect?: () => void;
  /**
   * Puts an ASK mark beside the value, for asking about the pair.
   *
   * Both verbs sit on the value because the value is what a reader is looking
   * at: the text opens the panel that holds it, the mark beside it asks about
   * it. Their tooltips are what tell them apart — two marks this small cannot
   * carry two different promises on shape alone.
   *
   * Nothing is added at rest. The mark appears only under the pointer or on
   * focus, which is the demotion a secondary affordance is supposed to take
   * instead of dying.
   */
  onAsk?: () => void;
  /**
   * Fires as the ask mark takes and loses the pointer (and focus).
   *
   * For hosts that want to SHOW the question before it is asked — Akshat,
   * 2026-09-01: *"when I hover over the spark next to the extraction, populate
   * a prompt in the input."* The card does not know where the question would
   * go, so it only reports the hover; the host decides what to do with it.
   */
  onAskHover?: (hovering: boolean) => void;
}

/**
 * One entry in the overflow. `icon` is an Ink icon name; `onSelect` is fired on
 * press. Every string here is the host's — the component draws them and names
 * nothing.
 */
/** Ink keeps these four apart from the icon set: they are gradients. */
const AI_LEAD_NAMES = ['ai-iris', 'ai-iris-filled', 'ai-spark', 'ai-spark-filled'] as const;

export interface RecommendationMenuItem {
  label: string;
  icon?: string;
  onSelect: () => void;
}

export interface RecommendationCardProps {
  /**
   * Which archetype. `request` is the default and everything below reads as
   * written; `flag` swaps the mark, drops every Dismiss and trades the primary
   * for a note + "Mark reviewed".
   *
   * In `layout="brief"` a flag keeps its meaning and loses its decoration: no
   * red mark, no textarea, and Dismiss is allowed (with a required reason).
   */
  kind?: 'request' | 'flag';
  /**
   * Which anatomy. `full` is the card as shipped — title, body, "Why this?",
   * actions — and stays the default so nothing already drawn moves.
   *
   * `brief` is the 2026-08-24 redesign: typed eyebrow, title, one-line reason,
   * two peer actions, an overflow, and the press-to-expand rationale. See the
   * header comment. `compact` is orthogonal and overrides both.
   */
  layout?: 'full' | 'brief';
  /**
   * `brief` only. What the TITLE's grammar already is, declared rather than
   * guessed: `proposes` for an imperative title, `asks` for an interrogative
   * one. The component never rewrites the title — it spends the declaration on
   * emphasis. `asks` draws two identical tertiary buttons, because a card
   * asking for a judgement has no preferred answer; `proposes` lifts the accept
   * one notch of Ink's ladder and leaves decline a full button beside it.
   *
   * It has nothing to spend under `actionRegister="text"`, where both actions
   * are the same label at the same weight by definition — `asks` and `proposes`
   * draw identically there.
   */
  stance?: 'proposes' | 'asks';
  /** The recommendation, one line. Becomes a button when `onReview` is given. */
  title: string;
  /**
   * An Ink icon name, drawn small and quiet at the row's lead (2026-08-24).
   *
   * **There is no default, and that is deliberate.** `SUGGESTION_ICON` (the
   * barrel's `'arrow-nested-small'`) is the mark the system already uses for a
   * suggested action and is the value to pass — but passing it *for* the caller
   * would put a mark on every card drawn today, and this wave changes nothing
   * anyone has already shipped. Omit it and the card is exactly the card it was.
   *
   * Ignored on `kind="flag"`: the flag mark holds that slot, and a card that
   * marks itself twice has said one thing twice.
   *
   * In `brief` it leads the TITLE, on the title's own line (2026-08-25). It led
   * an eyebrow row until the eyebrow went; there is exactly one glyph for every
   * card in that layout, so it marks the species and never the kind.
   */
  icon?: string;
  /**
   * Context · date, already formatted by the host — "MSA-1990 · expires Sep 28".
   *
   * NOT DRAWN IN `brief` (2026-08-25). It was the eyebrow there, and Akshat took
   * the eyebrow off the card — type and date both. `full` and `compact` still
   * draw it, which is why the prop stays; a brief host that passes one is
   * passing something nothing reads.
   */
  meta?: string;
  /**
   * Draw the preview row instead of the card: title + meta, the whole row a
   * click target for `onReview`. Everything below the meta line is dropped —
   * body, citation, textarea, actions — because the artifact holds them.
   */
  compact?: boolean;
  /**
   * The reasoning. Clamped to three lines; the detail lives in the dock.
   *
   * In `brief` it is NOT drawn at rest — `reason` is the visible line — and it
   * is the expansion's rationale when `why` is absent.
   */
  body: string;
  /**
   * `brief` only, and Gmail's dose: the why, always visible, never behind the
   * disclosure. "You haven't opened any emails from this sender in the last
   * month" is the shape.
   *
   * IT WRAPS. It was clamped to one line until Akshat relaxed it on 2026-08-25
   * — *"description can be longer if needed"* — because a reason that ellipses
   * at rest is a reason the officer has to press to finish reading, which is the
   * opposite of why this line exists. A paragraph still belongs in `why`; this
   * is a sentence that is allowed to be a long one.
   *
   * Omit it and the card draws no reason at all.
   */
  reason?: string;
  /**
   * `brief` only. The itemized checks, drawn in the expansion, each with the
   * value that was in effect when it ran.
   *
   * This is the CPO review's *"which eight"* — "8 rules" asserted with no way to
   * see them was the finding, and the answer is a list a host actually holds.
   * Omit it and the expansion is rationale plus policy, which is honest; a host
   * that has the checks and does not pass them is asserting a number it will not
   * show.
   */
  checks?: RecommendationCheck[];
  /**
   * `brief` only. Label/value pairs that stay visible while the card is CLOSED,
   * drawn as two columns above the actions.
   *
   * `checks` answers "which eight did you run" and lives behind the press,
   * because a rationale is only wanted once. These are different: they are the
   * card's subject, not its justification — the four things a reader came for,
   * which have to be legible without a gesture. A summary of a document whose
   * contents are all behind an expansion is a summary of nothing.
   *
   * Additive: a card that passes none is unchanged.
   */
  fields?: RecommendationCheck[];
  /**
   * `brief` only. The reason line as NODES rather than a string, for the one
   * case a string cannot carry: emphasis inside the sentence.
   *
   * The frame this archetype comes from bolds the answer inside the prose —
   * the type, the counts — so the eye lands on what changed rather than
   * reading a paragraph to find it. `reason` stays a string and stays the way
   * every existing card is written; this overrides it when given.
   */
  reasonNode?: React.ReactNode;
  /**
   * The source this rests on — "Source: bank's employment-gap rule". Shown
   * inside the "Why this?" disclosure, and the fallback for `why` when the host
   * has nothing longer to say.
   *
   * In `brief` it is the expansion's LAST line and it is the policy citation:
   * "Data Consistency Standard §7.1 · v1.8 · effective Jun 2025". Section,
   * version, effective date. Both reviews named that string as the thing that
   * earns the card its credibility, so the expansion gives it a line of its own
   * rather than folding it into the rationale.
   */
  citation?: string;
  /**
   * What "Why this?" reveals: the rule and what triggered it, one short
   * paragraph. Falls back to `citation`, so a host that has only the rule still
   * gets the disclosure rather than losing it.
   */
  why?: string;
  /**
   * Primary label. Default: "Add and request", or "Mark reviewed" on a flag.
   *
   * **In `brief` there is NO default and the accept is not drawn without one.**
   * The loan-officer review named "Add and request" as a button label that
   * contradicts the paragraph six lines above it, and the object review named
   * "Accept" as one label doing two jobs. A default here is the component
   * guessing what the host's verb means. Pass "Open review", "Draft it",
   * "Request the statement" — the verb for what pressing it does.
   */
  actionLabel?: string;
  /**
   * Primary action, `request` only. Omit it and no primary button is drawn.
   *
   * In `brief` the accept falls back to `onReview` when `onAdd` is absent, so a
   * review card whose one verb is "go and look" needs no second handler. Pass
   * both and the accept fires `onAdd`; route the review through `overflow`.
   */
  onAdd?: () => void;
  /**
   * Dismiss, in the actions row. ONE affordance — the head's X was the second
   * and it is gone (2026-08-19): two ways to dismiss one card is one too many,
   * and the actions row is where the card's other decision already lives. The
   * flag archetype has always put its one verb there and carried no X, so this
   * is the grammar the card already preferred.
   *
   * Ignored on a flag: there is no way to close one without reviewing it.
   *
   * **IT ASKS WHY FIRST.** Pressing Dismiss does not close the card — it swaps
   * the actions row for one optional line, "Why not?", and a confirm. The
   * reason is the officer's, it is allowed to be empty, and it arrives here as
   * the argument. A recommendation the agent can explain and a person can
   * decline without a word leaves the record with only one side of the
   * decision on it.
   *
   * Callers that ignore the argument keep working unchanged.
   *
   * In `brief` it is drawn on a FLAG too. The full card's rule — a flag has no
   * way out without reviewing it — was protecting the evidence trail, and
   * `dismissReasonRequired` protects it better: the officer can decline, and the
   * decline cannot be empty. The loan-officer review asked for exactly that
   * trade.
   */
  onDismiss?: (reason: string) => void;
  /**
   * The decline's verb. Default "Dismiss", the string the card already ships.
   * Pass the verb that is true where this card sits — "Not a match", "Skip",
   * "Decline".
   */
  dismissLabel?: string;
  /**
   * The placeholder on the decline's reason field. Defaults to "Why not?
   * (optional)", or "Why not?" when the reason is required — the shipped
   * placeholder says optional, and under `dismissReasonRequired` that would be
   * a lie.
   */
  dismissPrompt?: string;
  /**
   * **The decline cannot be empty.** Set it where the finding has consequences
   * — an identity mismatch, a policy exception, anything QC reads — and the
   * confirm stays disabled, and Enter does nothing, until she has written a
   * reason.
   *
   * The loan-officer review: *"The agent's reason survives. Mine doesn't,
   * because it never asked for one. On an identity mismatch, QC would make that
   * mandatory and so would I."*
   *
   * It is the CALLER's judgement which cards are consequential, because the
   * component cannot know. Default `false` — every card drawn today keeps the
   * optional line it has.
   *
   * Applies to `full` and `brief` alike.
   */
  dismissReasonRequired?: boolean;
  /**
   * `brief` only. Everything that is not accept or decline — view the source
   * document, open the artifact, snooze, ask the agent. The resting state stays
   * at two decisions and this holds the rest.
   *
   * Empty or omitted and no overflow button is drawn.
   */
  overflow?: RecommendationMenuItem[];
  /**
   * `brief` only. WHERE the overflow sits. `actions` is the shipped placement —
   * last in the actions row, pushed to its far edge — and stays the default, so
   * nothing already drawn moves.
   *
   * `top` pins it to the card's top-right corner, on the title's row. Use it
   * where the actions are quiet enough that a chip at the end of their row would
   * outweigh them, or where the card has an overflow and no decisions at all.
   *
   * One difference worth knowing: at `top` the overflow is outside the actions
   * row, so it stays reachable while the decline is asking why. At `actions` it
   * is swapped out with the row it lives in.
   */
  overflowPlacement?: 'actions' | 'top';
  /**
   * Where the accept lands in `brief`. `'actions'` (default) keeps it on its
   * own row under the card. `'top'` moves it onto the title's row, at the end,
   * beside the `⋯` and the chevron.
   *
   * Akshat, 2026-09-01: *"can the review all extractions show up in the same
   * line at the end where we have summary showing?"* A card whose body is all
   * live pairs has no quiet place to put a foot-row action — it reads as a
   * ninth pair. On the title's row it reads as what it is: a control of the
   * card, sitting with the card's other controls.
   *
   * Only the quiet register goes up there — see `actionRegister`. A filled
   * button on the title's row would outweigh the title.
   */
  actionPlacement?: 'actions' | 'top';
  /**
   * A row drawn directly above `fields` — a switch, a heading, a count.
   *
   * Added for the summary's SECTIONS (Akshat, 2026-09-01, from frame
   * 653:22493): the pairs are split into named groups and only one group is
   * shown, so something has to name the groups and sit with them. It is a
   * ReactNode because the host owns which groups exist; the card only owns
   * where the row goes.
   */
  fieldsHeader?: React.ReactNode;
  /**
   * A row drawn directly BELOW `fields`, where frame 653:22493 puts its pager.
   * Same reason as `fieldsHeader`; the frame allocates the switch's slot after
   * the pairs, not before them.
   */
  fieldsFooter?: React.ReactNode;
  /**
   * The overflow button's accessible name. Defaults to "More actions" — the one
   * string with a default in the new anatomy, because an icon button with no
   * name is broken, not terse. Pass one if the host has a better word.
   */
  overflowLabel?: string;
  /**
   * `brief` only. WHICH REGISTER the two decisions are drawn in. `button` is the
   * shipped pair of Ink chips and stays the default.
   *
   * `text` draws them as the card's quiet text register — the same register
   * `Ask Iris` and `Why this?` already use here — for a surface where a row of
   * grey chips under every card is more furniture than the cards deserve. They
   * stay peers: same colour, same weight, same size, same row, both still real
   * buttons with their own focus ring and a 24px hit target. The decline still
   * asks why first, and `dismissReasonRequired` still gates the confirm — the
   * two-step decline is untouched in either register.
   *
   * **The uppercase is a register, not a rewording.** `text` draws
   * `actionLabel` and `dismissLabel` upper-cased in CSS — a typographic
   * treatment, the way small caps does not rewrite a word. The strings
   * themselves are untouched: the host still passes "Review" and "Dismiss" in
   * sentence case, because casing of the WORDS is copy and copy is the
   * caller's. Only the display register changes.
   *
   * Ignored on `full` and `compact`: the full card's chip register is a decision
   * of Akshat's (2026-08-19, secondary + tertiary), not a default to reopen.
   */
  actionRegister?: 'button' | 'text';
  /** Opens a conversation about this rec. Drawn as a text action. NOT drawn in `brief` — put it in `overflow` under the agent's real name. */
  onAskIris?: () => void;
  /**
   * Opens the object's detail in the dock. Makes the title a button.
   *
   * In `brief` the title is NOT a button — the text stack's press opens the
   * expansion — and this becomes the accept's action when `onAdd` is absent.
   * Both reviews landed on the same sentence: accepting a finding means
   * nothing, so the button opens the review.
   */
  onReview?: () => void;
  /**
   * The card was expanded out of a compact row, and this closes it again.
   * Draws a chevron-up in the head — on a flag too, which has no dismiss X and
   * would otherwise have no way back.
   *
   * The host owns the swap (compact row <-> full card) because the host is what
   * knows whether it is in a panel; the card only draws the way back.
   *
   * ponytail: the compact row keeps its chevron-right glyph even where the
   * click expands rather than opens. Add a glyph prop if the affordance reads
   * wrong to him.
   */
  onCollapse?: () => void;
  /**
   * `flag` only: the officer looked, and this is what they wrote.
   *
   * IT NEVER FIRES EMPTY. The primary is disabled until the textarea has
   * non-whitespace in it, so a caller can rely on the argument carrying words.
   * See the flag section of the header comment for why this stopped being
   * optional.
   *
   * IGNORED IN `brief`. A finding is settled by looking at it, and the note
   * belongs to the surface the accept opens — not to a textarea sitting under a
   * summary she has not read yet.
   */
  onMarkReviewed?: (note: string) => void;
}

// =============================================================================
// Component
// =============================================================================


/**
 * THE VALUE CELL — one line that both goes somewhere and asks about itself.
 *
 * Akshat, 2026-09-01: *"maybe add it next to the value and add a little tooltip
 * that says ask about this... and add a tooltip on the value that says open to
 * learn more."*
 *
 * Shared by `fields` (visible closed) and `checks` (behind the press), because
 * a pair means the same thing in both places.
 */
/**
 * THE ASK PREVIEW LATCH — why leaving is handled by the card, not the mark.
 *
 * Akshat, 2026-09-01: *"app jitters when I hover on the spark."* It did, and
 * measured, the loop was this: hovering the mark writes a question into the
 * composer, the composer grows one line to two (22px to 45px), the panel is
 * bottom-anchored so everything above it rises 23px, and the 12px mark travels
 * out from under a stationary cursor. Leave fires, the draft clears, the
 * composer shrinks, the mark comes back under the cursor, enter fires. At
 * about 4Hz.
 *
 * **A hover target that moves because it is hovered cannot own its own leave.**
 * So enter stays on the mark, where it needs the precision, and leave moves to
 * the card, which is 300px tall and does not care about 23px. Keyboard keeps
 * blur, because focus does not chase the pointer.
 */
const AskLatch = React.createContext<{ current: ((on: boolean) => void) | null } | null>(null);

function FieldValue({ field }: { field: RecommendationCheck }) {
  const latch = React.useContext(AskLatch);
  return (
    <>
      {field.onSelect ? (
        /* NO TOOLTIP ON THE VALUE. It rendered directly over the label it was
           describing — "Open to learn more" covering "Parties" — and the
           underline plus the pointer already say the value opens something.
           A tooltip that hides its own subject is worse than no tooltip. */
        <button type="button" className={styles.fieldLink} onClick={field.onSelect}>
          {field.value ?? ''}
        </button>
      ) : (
        (field.value ?? '')
      )}
      {field.onAsk ? (
        /* THE VERB, NOT THE SPARK. Akshat, 2026-09-01: *"is spark good? or try
           a different treatment?"* — it was not.

           `AIIcon` hardcodes one path for all four of its names ("All variants
           use the exact Figma path", its own comment), so the ask mark and this
           card's title mark were the SAME glyph at the same size in the same
           gradient. The note that used to sit here — two marks this small
           cannot differ by shape, so their tooltips tell them apart — rested on
           a shape difference that never existed.

           And the spark already means "Iris" three times on that screen: the
           viewer's Ask Iris button, the panel wordmark, and this card's title.
           A small gradient star beside $110,000.00 reads as "this value was
           AI-extracted" long before it reads as a verb.

           A word says the verb with no decoding, which is also why the tooltip
           went: a label that needs a label is not a label. */
        <button
          type="button"
          className={styles.fieldAsk}
          onClick={field.onAsk}
          onMouseEnter={() => {
            if (latch) latch.current = field.onAskHover ?? null;
            field.onAskHover?.(true);
          }}
          /* The mark owns its own leave again. It only lost that when hovering
             it moved it; a question that fits one line moves nothing. The card
             keeps a leave too, as the backstop for a pointer that jumps out. */
          onMouseLeave={() => field.onAskHover?.(false)}
          onFocus={() => field.onAskHover?.(true)}
          onBlur={() => field.onAskHover?.(false)}
          aria-label={`Ask about ${field.label}`}
        >
          Ask
        </button>
      ) : null}
    </>
  );
}


export const RecommendationCard = ({
  kind = 'request',
  layout = 'full',
  stance = 'proposes',
  compact = false,
  title,
  icon,
  meta,
  body,
  reason: reasonLine,
  reasonNode,
  checks,
  fields,
  citation,
  why,
  actionLabel,
  onAdd,
  onDismiss,
  dismissLabel,
  dismissPrompt,
  dismissReasonRequired = false,
  overflow,
  overflowPlacement = 'actions',
  actionPlacement = 'actions',
  fieldsHeader,
  fieldsFooter,
  overflowLabel = 'More actions',
  actionRegister = 'button',
  onAskIris,
  onReview,
  onCollapse,
  onMarkReviewed,
}: RecommendationCardProps) => {
  const isFlag = kind === 'flag';
  const isBrief = layout === 'brief' && !compact;
  /* The note is the flag's whole output, so the card holds it until it is filed. */
  const [note, setNote] = useState('');
  /* Closed. The reason is available, not asserted. */
  const [whyOpen, setWhyOpen] = useState(false);
  /* Dismiss is two steps: the card asks why before it closes. */
  const [declining, setDeclining] = useState(false);
  /** The ask mark currently previewing, so the CARD can end it. See AskLatch. */
  const askLatch = React.useRef<((on: boolean) => void) | null>(null);
  const [reason, setReason] = useState('');
  const whyText = why ?? citation;
  /*
    In brief the flag has no mark of its own — Akshat's own review variant
    (511:29115) draws the caller's `compare` glyph in the standing icon colour
    and lets the eyebrow ("Waiting for Review · Apr 12") carry the meaning. The
    full card keeps its one-mark rule: the flag's red is the one that means
    something and the lead icon yields to it.
  */
  const leadIcon =
    (isBrief || !isFlag) && icon ? (icon as ComponentProps<typeof Icon>['name']) : null;

  /* Structural, not conditional-on-the-handler: a flag drops Dismiss even when
     a host passes one, because the host is not the thing that decides this.
     Brief reverses it — see the `onDismiss` doc: a required reason is the better
     guard than no exit at all. */
  const dismiss = isFlag && !isBrief ? undefined : onDismiss;
  const primary = isFlag ? onMarkReviewed && (() => onMarkReviewed(note)) : onAdd;
  const primaryLabel = actionLabel ?? (isFlag ? 'Mark reviewed' : 'Add and request');
  /* The one gate on this card: a flag does not close without a note. */
  const primaryDisabled = isFlag && !note.trim();

  /* The decline's own gate, and it is the same in both layouts. */
  const declineBlocked = dismissReasonRequired && !reason.trim();
  const confirmLabel = dismissLabel ?? 'Dismiss';
  const reasonPlaceholder =
    dismissPrompt ?? (dismissReasonRequired ? 'Why not?' : 'Why not? (optional)');

  /*
    THE DECLINE, ASKED FOR. One line and its two buttons, in the space the
    actions row had — the card does not grow into a dialog to ask one question.
    Cancel puts the card back exactly as it was.

    Optional by default and the run goes on either way; `dismissReasonRequired`
    is the host saying this one finding is not declinable in silence.
  */
  const renderDecline = (onCancel: () => void) =>
    dismiss ? (
      <div className={styles.decline}>
        <Input
          label="Why not?"
          hideLabel
          size="small"
          placeholder={reasonPlaceholder}
          value={reason}
          autoFocus
          aria-required={dismissReasonRequired || undefined}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !declineBlocked) dismiss(reason);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className={styles.actions}>
          <Button
            kind="secondary"
            size="small"
            onClick={() => dismiss(reason)}
            disabled={declineBlocked}
            /* Disabled with no reason given is a dead end. */
            title={declineBlocked ? 'Write why first' : undefined}
          >
            {confirmLabel}
          </Button>
          <Button kind="tertiary" size="small" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    ) : null;

  /* Everything that is not a decision. Ink's Dropdown owns the menu. */
  const overflowOnTop = overflowPlacement === 'top';
  const overflowMenu =
    overflow && overflow.length > 0 ? (
      <div
        className={
          overflowOnTop ? `${styles.overflowSlot} ${styles.overflowTop}` : styles.overflowSlot
        }
      >
        <Dropdown
          items={overflow.map((entry) => ({
            label: entry.label,
            icon: entry.icon ? (
              <Icon name={entry.icon as ComponentProps<typeof Icon>['name']} size="small" />
            ) : undefined,
            onClick: entry.onSelect,
          }))}
          position="bottom"
          align="end"
        >
          <IconButton
            icon="overflow-horizontal"
            variant="tertiary"
            size="small"
            aria-label={overflowLabel}
          />
        </Dropdown>
      </div>
    ) : null;

  if (isBrief) {
    /*
      THE PRESS IS THE DISCLOSURE. The text stack is one target and the actions
      are its siblings, so there is no nested button and no aiming: the whole
      block of words opens the expansion, and the two decisions sit below it
      untouched by the press.

      `onReview` used to own the title. It moved to the accept, because both
      reviews landed on the same sentence — accepting a finding means nothing,
      the button goes and looks.
    */
    const accept = onAdd ?? onReview;
    /* No default label in brief. A guessed verb is what the officer review
       caught: "Add and request" on a button that only drafts. */
    const drawAccept = Boolean(accept && actionLabel);
    const rationale = why ?? body;
    const hasExpansion = Boolean(rationale || citation || (checks && checks.length > 0));
    const Stack = hasExpansion ? 'button' : 'div';
    /* `asks` has no preferred answer, so neither button outranks the other. */
    const acceptKind = stance === 'asks' ? 'tertiary' : 'secondary';
    /* The quiet register. Both decisions in it, or neither — see `actionRegister`. */
    const quietActions = actionRegister === 'text';
    /* Only the quiet register rides the title's row; a filled button up there
       would outweigh the title it sits beside. */
    const acceptOnTop = actionPlacement === 'top' && quietActions && drawAccept;
    const topAccept = acceptOnTop ? (
      <button type="button" className={`${styles.textAction} ${styles.topAction}`} onClick={accept}>
        {actionLabel}
      </button>
    ) : null;

    /*
      THE CHEVRON IS THE LAST THING ON THE TITLE'S ROW, and the `⋯` is the
      second-to-last. Akshat, 2026-08-25: *"maybe let's swap out the chevron and
      the overflow menu buttons."* They were the other way round, which is why
      the chevron left the text stack: order in one flex row is the only way two
      things swap, and the stack takes the whole width to its left.

      Out of the stack it needs its own press, or it becomes a glyph that looks
      pressable and is not. It is not a second FOCUS stop, though — `tabIndex=-1`
      and `aria-hidden` keep the words as the one control a keyboard and a screen
      reader see, which is the rule the compact row taught this card.
    */
    /*
      THE LEAD GLYPH IS THE AFFORDANCE, and it only becomes one on hover.

      Akshat, 2026-08-25, 551:35199 and 551:35200: the card at rest wears its
      type mark — the checklist, the compare, the status check — and on hover
      that same 20px slot becomes a `chevron-right`. Two frames, one per card,
      and both say the same thing: no new chrome, no shifted layout, and the
      glyph the officer already reads turns into the thing that says it opens.

      It is the standing law kept rather than bent — a caret at REST is the mark
      this panel has killed six times, and this one is never at rest. So the
      corner caret below goes wherever this swap can happen, and survives only
      where there is no lead glyph to swap.

      RIGHT, NOT DOWN, and that is the drawing's word. The pair is drawn on both
      the workspace row and the task card, and on the row it goes somewhere; one
      glyph across both beats two that disagree about which is which.

      NO PRESS OF ITS OWN. It sits inside the text stack, which is already the
      one button, so it cannot become a second focus stop the way the corner
      caret had to be told not to be.
    */
    const swaps = Boolean(leadIcon && hasExpansion);
    const mark = leadIcon ? (
      <span
        className={`${styles.leadIcon} ${swaps ? styles.leadSwap : ''}`}
        aria-hidden="true"
      >
        {/* THE FOUR AI NAMES DRAW THROUGH AIIcon. Ink keeps them apart because
            the AI mark is a gradient, not a monochrome glyph — `Icon` renders
            the flat shape and loses it. Nothing else about the lead changes,
            and a non-AI name is untouched. */}
        {AI_LEAD_NAMES.includes(leadIcon as (typeof AI_LEAD_NAMES)[number]) ? (
          <AIIcon
            name={leadIcon as 'ai-iris' | 'ai-iris-filled' | 'ai-spark' | 'ai-spark-filled'}
            /* THE BOX IS 24, THE GLYPH IS 12. The frame's `AI_sparkFilledSmall`
               is a 24 instance with 4 padding around a 12 vector, so matching
               the instance size draws the mark at double weight — which is
               exactly what "the ai icon is too big" was. */
            size={fields && fields.length > 0 ? 12 : 16}
            className={swaps ? styles.leadGlyph : undefined}
          />
        ) : (
          <Icon name={leadIcon} size={16} className={swaps ? styles.leadGlyph : undefined} />
        )}
        {swaps && (
          <Icon
            name="chevron-right"
            size={16}
            className={`${styles.leadChevron} ${whyOpen ? styles.leadChevronOpen : ''}`}
          />
        )}
      </span>
    ) : null;
    /*
      The corner caret, for a card with no glyph to swap. Every card in this
      prototype passes one, so this is the fallback for a host that does not —
      without it such a card would have no visible affordance at all.
    */
    const chevron =
      hasExpansion && !swaps ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.briefChevronSlot}
          onClick={() => setWhyOpen((v) => !v)}
        >
          <Icon
            name="chevron-down"
            size={14}
            className={`${styles.briefChevron} ${whyOpen ? styles.briefChevronOpen : ''}`}
          />
        </button>
      ) : null;
    const titleText = <span className={styles.briefTitle}>{title}</span>;

    /*
      ONE ROW OF WORDS. The glyph leads the title at the title's own size, and
      `meta` is not read — the eyebrow it used to be is gone (2026-08-25). See
      the header: the VERB is what says which kind of task this is now.
    */
    const words = mark ? (
      <span className={styles.titleRow}>
        {mark}
        {titleText}
      </span>
    ) : (
      titleText
    );

    const textStack = (
      <Stack
        {...(hasExpansion
          ? {
              type: 'button' as const,
              'aria-expanded': whyOpen,
              onClick: () => setWhyOpen((v) => !v),
            }
          : {})}
        className={styles.briefText}
      >
        {words}
        {/* Gmail's dose: one line of why, or nothing. */}
        {(reasonNode ?? reasonLine) && (
          <span className={styles.reason}>{reasonNode ?? reasonLine}</span>
        )}
      </Stack>
    );

    return (
      <AskLatch.Provider value={askLatch}>
      <div
        className={`${styles.card} ${styles.brief}${mark ? ` ${styles.hasLead}` : ''}${
          whyOpen ? ` ${styles.isOpen}` : ''
        }${fields && fields.length > 0 ? ` ${styles.summary}` : ''}`}
        /* The CARD ends an ask preview, not the mark that started it — see
           AskLatch. A 12px target that moves 23px because you hovered it cannot
           be trusted to notice you never left. */
        onMouseLeave={() => {
          askLatch.current?.(false);
          askLatch.current = null;
        }}
      >
        {/*
          The corner controls are SIBLINGS of the press target, not controls
          inside it — the words stay one button, and the menu keeps its own focus
          stop right after them. `⋯` then chevron, left to right.
        */}
        {chevron || topAccept || (overflowOnTop && overflowMenu) ? (
          <div className={styles.briefHead}>
            {textStack}
            {topAccept}
            {overflowOnTop && overflowMenu}
            {chevron}
          </div>
        ) : (
          textStack
        )}

        {whyOpen && hasExpansion && (
          <div className={styles.expansion}>
            {rationale && <p className={styles.expansionBody}>{rationale}</p>}
            {/* "Which eight." Label left, the value in effect right. */}
            {checks && checks.length > 0 && (
              <dl className={styles.checks}>
                {checks.map((check, i) => (
                  <div key={i} className={styles.check}>
                    <dt className={styles.checkLabel}>{check.label}</dt>
                    <dd className={styles.checkValue}>
                      <FieldValue field={check} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {/* Section · version · effective date, on its own line. */}
            {citation && <p className={styles.policy}>{citation}</p>}
          </div>
        )}

        {fieldsHeader}

        {fields && fields.length > 0 && (
          <dl className={styles.fields}>
            {fields.map((field, i) => (
              <div key={i} className={styles.field}>
                <dt className={styles.fieldLabel}>{field.label}</dt>
                <dd className={styles.fieldValue}>
                  <FieldValue field={field} />
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Wrapped so the archetype can order it. `.card.summary` is a flex
            column that reorders its children, and an unclassed node lands at
            order 0 — which is how a footer rendered itself above the fields it
            sits under. */}
        {fieldsFooter && <div className={styles.fieldsFooter}>{fieldsFooter}</div>}

        {declining && dismiss ? (
          renderDecline(() => setDeclining(false))
        ) : (drawAccept && !acceptOnTop) || dismiss || (!overflowOnTop && overflowMenu) ? (
          <div
            className={
              quietActions ? `${styles.actions} ${styles.textActions}` : styles.actions
            }
          >
            {drawAccept &&
              !acceptOnTop &&
              (quietActions ? (
                <button type="button" className={styles.textAction} onClick={accept}>
                  {actionLabel}
                </button>
              ) : (
                <Button kind={acceptKind} size="small" onClick={accept}>
                  {actionLabel}
                </Button>
              ))}
            {/* A PEER, NOT AN ESCAPE. Same row, same size, same family. */}
            {dismiss &&
              (quietActions ? (
                <button
                  type="button"
                  className={styles.textAction}
                  onClick={() => setDeclining(true)}
                >
                  {confirmLabel}
                </button>
              ) : (
                <Button kind="tertiary" size="small" onClick={() => setDeclining(true)}>
                  {confirmLabel}
                </Button>
              ))}
            {!overflowOnTop && overflowMenu}
          </div>
        ) : null}
      </div>
      </AskLatch.Provider>
    );
  }

  if (compact) {
    /* One target, not a title button inside a row — two nested click targets in
       a 40px row is a hit area you have to aim at. */
    const Row = onReview ? 'button' : 'div';
    return (
      <Row
        {...(onReview ? { type: 'button' as const, onClick: onReview } : {})}
        className={`${styles.card} ${styles.compact}`}
      >
        {isFlag && (
          <span className={styles.flagMark} role="img" aria-label="Flagged for review">
            <Icon name="flag" size={14} />
          </span>
        )}
        {leadIcon && (
          <span className={styles.leadIcon} aria-hidden="true">
            <Icon name={leadIcon} size={16} />
          </span>
        )}
        <span className={styles.compactText}>
          <span className={styles.title}>{title}</span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
        {onReview && (
          <Icon name="chevron-right" size={14} className={styles.compactChevron} />
        )}
      </Row>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        {isFlag && (
          <span className={styles.flagMark} role="img" aria-label="Flagged for review">
            <Icon name="flag" size={14} />
          </span>
        )}
        {leadIcon && (
          <span className={styles.leadIcon} aria-hidden="true">
            <Icon name={leadIcon} size={16} />
          </span>
        )}
        {onReview ? (
          <button type="button" className={styles.titleButton} onClick={onReview}>
            {title}
          </button>
        ) : (
          <p className={styles.title}>{title}</p>
        )}
        {onCollapse && (
          <IconButton
            icon="chevron-up"
            variant="tertiary"
            size="small"
            aria-label={`Collapse: ${title}`}
            className={styles.collapseUp}
            onClick={onCollapse}
          />
        )}
      </div>

      {meta && <p className={styles.meta}>{meta}</p>}

      <p className={styles.body}>{body}</p>

      {whyText && (
        <div className={styles.why}>
          <button
            type="button"
            className={styles.whyToggle}
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((v) => !v)}
          >
            Why this?
            <Icon name={whyOpen ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
          {whyOpen && <p className={styles.whyBody}>{whyText}</p>}
        </div>
      )}

      {isFlag && onMarkReviewed && (
        <TextArea
          label="Officer notes"
          hideLabel
          rows={3}
          resize="vertical"
          placeholder="What did you find, and what did you do about it?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-required="true"
        />
      )}

      {declining && dismiss ? (
        renderDecline(() => setDeclining(false))
      ) : (primary || dismiss || onAskIris) && (
        <div className={styles.actions}>
          {/*
            `secondary`, not `primary` — one step lighter (Akshat, 2026-08-19).
            A recommendation is a proposal, and a filled primary in a stack of
            three proposals reads as three things the surface wants done. The
            flag's "Mark reviewed" lightens with it: one card, one weight of
            decision.
          */}
          {primary && (
            <Button
              kind="secondary"
              size="small"
              onClick={primary}
              disabled={primaryDisabled}
              /* Disabled with no reason given is a dead end. */
              title={primaryDisabled ? 'Write what you found first' : undefined}
            >
              {primaryLabel}
            </Button>
          )}
          {dismiss && (
            <Button kind="tertiary" size="small" onClick={() => setDeclining(true)}>
              {confirmLabel}
            </Button>
          )}
          {/* A text action, not a third button — asking is cheaper than either
              decision and should not look as heavy as them. */}
          {onAskIris && (
            <button type="button" className={styles.askIris} onClick={onAskIris}>
              Ask Iris
            </button>
          )}
        </div>
      )}
    </div>
  );
};

RecommendationCard.displayName = 'RecommendationCard';
