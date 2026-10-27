/**
 * RunChip — an agent RUN inside a thread, as one row that stays.
 *
 * Akshat, 2026-08-20, naming Claude's deep-research pattern: **agent work is a
 * chip in the thread, and the chip opens the record.** A run that fires
 * mid-conversation used to stream an `AgentThinking` accordion that emptied
 * itself the moment it finished — the work happened and then nothing said it
 * had. This is the same run drawn as the one-row card the surface already
 * speaks, and the row is permanent.
 *
 *   live      spark · the current activity, ticking · elapsed, with `Shimmer`
 *             sweeping. Nothing to expand and nothing to press: the run is
 *             happening and there is no record yet.
 *   resolved  spark · generic counts · duration · chevron. The row STAYS as
 *             the receipt of the work, and pressing it opens that run's slice
 *             of the record.
 *
 * ── The chip that carries its own thinking (`expandable` + `lines`) ──
 *
 * Akshat, 2026-08-24, verbatim: *"a little box that shows that the agent is
 * working on thinking on this. If I click on it, I can expand and see the
 * thinking, but otherwise it could just show us that it's working."*
 *
 * **This supersedes "the chip opens the record" — for chips that carry lines.**
 * A chip holding its own thinking has somewhere to go that is not a navigation,
 * so the press expands in place and the row stays where the work happened. A
 * chip WITHOUT `lines` is unchanged: it has nothing to open into, and pressing
 * it still opens the record. Both contracts are live; `expandable` picks.
 *
 * ONE PRESS, ONE MEANING. When `expandable` is set the row press is the expand
 * and nothing else — `onOpen` is never wired to it. A caller that passes both
 * gets the expand on the row and `onOpen` as a text link inside the open body,
 * where a second meaning has room to say what it is.
 *
 * The row is pressable WHILE IT RUNS, not only once it lands — that is the
 * point of the quote. And the box persists after `done` as the collapsed
 * receipt row, the same way the plain chip does.
 *
 * ── How long it said it would take (`expectedSeconds` + friends) ──
 *
 * The design review, 2026-08-24, settled ONE LIVE NARRATOR PER RUN and made it
 * this chip, so the loan card's live run-lines retire and their time-band
 * treatment moves here. Two bands off one wall clock: `expectation` rides the
 * elapsed seconds from second zero, and past `expectedSeconds` the live
 * activity line becomes `extendedLine`. The shimmer stays on and the clock
 * keeps counting, because both are still true — the work has not stopped, it
 * has taken longer than it said.
 *
 * Derived, never stored. The chip already counts elapsed; a band that came from
 * anywhere else could disagree with the number printed beside it. When the run
 * lands, the band is gone and the row is today's resolved row — counts and a
 * duration, no promise about a wait that is over.
 *
 * The MECHANISM is this component's. The STRINGS are the caller's, and the chip
 * authors none of them.
 *
 * **GENERIC COUNTS ONLY.** "Checked 3 documents against 8 rules · 3 findings" —
 * what the run did, never what it found. The substance arrives in the turn
 * right after, and a chip that repeated it would say one moment twice.
 *
 * **NO FEEDBACK, EVER.** A run is an act, not an answer; the host marks the
 * turn `kind: 'action'` and it never earns the copy/thumbs row. Nothing here
 * enforces that — it is stated so the next reader does not add it.
 *
 * **THE HOST OWNS `done`.** The chip paces its own activity line off
 * `durationMs`, but whether the run has landed is the host's fact: a resolved
 * chip that remounts (a panel going fullscreen relays the whole stream) must
 * come back resolved rather than replaying a run that finished minutes ago.
 *
 * Its frame is the one-row card the FINS lifecycle object draws — subtle
 * hairline, `radius-size-s`, label left, quiet state right. The two are not
 * sharing a component: a card frame with one implementation on each side of
 * the system boundary is an abstraction waiting for a third caller. They share
 * TOKENS, which is what keeps them one grammar.
 *
 * Tier 2 · UNDECIDED — one consumer (loan-workspace), no frame behind it yet.
 */

import React, { useEffect, useState } from 'react';
import { Icon } from '@ink';

import { Shimmer } from '@ai/primitives/Shimmer/Shimmer';
import { Spark } from '@ai/primitives/Spark/Spark';
import styles from './RunChip.module.css';

/**
 * What a thread turn carries to draw its run. It is DATA on the message and
 * not props on a component, because the turn is the thing the host owns and a
 * prop would have to be threaded through every layout the stream renders in.
 */
export interface RunChipData {
  /** The activity lines, in order. The chip paces itself across them. */
  activities: string[];
  /** What the resolved row says — generic counts, no substance. */
  resolved: string;
  /**
   * How long the run has. Paces the activity line and fixes the duration.
   *
   * Absent on a run with no duration to report — a chip that opens a document
   * rather than summarising a timed run. The meta span is then not drawn, and
   * the chip never invents a number it cannot source.
   */
  durationMs?: number;
  /** The host's fact: the run has landed. */
  done?: boolean;
  /**
   * Press the resolved row — opens this run's slice of the record.
   *
   * With `expandable` set this is NOT the row press. It becomes the
   * "View in progress" link inside the expanded body.
   */
  onOpen?: () => void;
  /** The running → resolved thinking pairs, revealed when the row expands in place. */
  lines?: { running: string; resolved: string }[];
  /** The row expands in place to show `lines`. Default false — today's behavior. */
  expandable?: boolean;
  /**
   * THE TIME BAND, DERIVED FROM THE ONE CLOCK THE CHIP ALREADY HAS.
   *
   * `expectedSeconds` is the window the run says it expects to land inside;
   * `expectation` is the clause that rides the elapsed seconds from second zero;
   * `extendedLine` replaces the live activity line once the clock passes the
   * window. There is no band state and no second timer — the chip compares its
   * own `elapsed` against `expectedSeconds`, which is why a band can never
   * disagree with the number sitting next to it.
   *
   * Ported here 2026-08-24, when the review made this chip the run's ONE live
   * voice: the treatment was the loan card's, and the loan card's live run-lines
   * retire. The MECHANISM is this component's; the STRINGS are the caller's, and
   * the chip authors none of them — same contract every other string here is
   * under.
   *
   * Absent on every run that has no promise to make, which is most of them.
   */
  expectedSeconds?: number;
  /** Clause rendered beside the elapsed time from second zero ("usually about 15 seconds"). */
  expectation?: string;
  /** Replaces the live activity line once elapsed passes the window. */
  extendedLine?: string;
  /**
   * WHAT THIS CHIP OPENS, by id — so a host can tell whether it is the open one.
   *
   * The same field `inlineResults.artifactId` already carries, for the same
   * reason: the host knows which artifact is in the pane, the chip knows which
   * artifact it points at, and `selected` is the comparison. Optional, because
   * a chip whose `onOpen` goes somewhere with no id is still a valid chip.
   */
  artifactId?: string;
  /**
   * THIS CHIP'S THING IS THE ONE CURRENTLY OPEN.
   *
   * Akshat, 2026-09-03: *"it seems like when it's active this should have the
   * active staet!"* Colour marks state on this surface, so the row takes the
   * same active tint a selected row takes everywhere else.
   *
   * Default false — a chip that never hears about the pane draws exactly what
   * it drew before this prop existed.
   */
  selected?: boolean;
}

export type RunChipProps = RunChipData;

export const RunChip = ({
  activities,
  resolved,
  durationMs,
  done = false,
  onOpen,
  lines,
  expandable = false,
  expectedSeconds,
  expectation,
  extendedLine,
  selected = false,
}: RunChipProps) => {
  /* Which activity the line is on, and how long the run has been going. */
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  /* Open/closed is the reader's, and it is kept away from the run's timers so
     that opening the box never restarts the work it is reporting. */
  const [open, setOpen] = useState(false);

  /*
    One timeout per activity rather than an interval, so the last one lands on
    the run's own deadline instead of drifting past it — the same shape the
    cold receipt's working line uses. Deps are the LENGTH and the duration, not
    the array: the host rebuilds this data on every scenario change, and a new
    array identity each render would restart the run forever.
  */
  useEffect(() => {
    if (done || activities.length === 0 || durationMs == null) return;
    const every = durationMs / activities.length;
    const ids = activities.map((_, i) =>
      window.setTimeout(() => setStep(i + 1), every * (i + 1)),
    );
    const tick = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      ids.forEach(clearTimeout);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, activities.length, durationMs]);

  if (activities.length === 0 && !resolved) return null;

  /*
    A run genuinely takes seconds, so the chip reports seconds. The resolved
    row reads its duration off `durationMs` rather than off the counter, so a
    remounted chip says the same thing it said when it landed.
  */
  const seconds =
    done && durationMs != null ? Math.max(1, Math.round(durationMs / 1000)) : elapsed;

  /*
    PAST THE WINDOW IT SAID. Derived, not stored: the run said how long it
    expects to take and the chip is already counting how long it has taken.

    A landed run has no band — the resolved row is the run's last word and it
    says counts and a duration, not a promise about a wait that is over.
  */
  const extended =
    !done && expectedSeconds != null && elapsed >= expectedSeconds && Boolean(extendedLine);

  const activity = extended
    ? (extendedLine as string)
    : (activities[Math.min(step, activities.length - 1)] ?? '');
  const line = done ? resolved : activity;

  /* `expandable` alone is a promise with nothing behind it — the pairs are what
     there is to expand into, so the row only grows a chevron when it has them. */
  const pairs = lines ?? [];
  const expands = expandable && pairs.length > 0;
  /* The record door survives only where the row is not already the expand. */
  const pressable = !expands && done && Boolean(onOpen);
  /* Either press earns the swap; nothing else does. */
  const swaps = expands || pressable;

  const row = (
    <div className={styles.row}>
      {/*
        THE MARK WORKS WHILE THE RUN DOES. Akshat's sparkleTunnel, ported in
        `Spark` — rings while it ticks, the plain glyph the moment it lands, so
        the chip never has one part still claiming to be busy.
      */}
      {/*
        AND THE MARK BECOMES A CHEVRON UNDER THE POINTER. Akshat, 2026-08-25:
        *"can we have this same treatment for this one too?"* — the task card and
        the workspace row already swap their lead glyph for a `chevron-right` on
        hover, and this is the third object in the same column. One gesture for
        all three beats three rows that each say "this opens" their own way.

        THE SPARK IS NOT LOST WHILE THE RUN IS LIVE. The row shimmers for as long
        as the work does, so the pointer resting on it for a moment does not take
        away the signal that something is happening — it only trades the mark for
        the affordance while she is deciding whether to press.

        ONLY WHERE THE ROW OPENS. No press, no swap; a chevron over a row that
        goes nowhere is the affordance lying.
      */}
      <span className={`${styles.glyph}${swaps ? ` ${styles.glyphSwap}` : ''}`}>
        <span className={swaps ? styles.glyphMark : undefined} style={{ display: 'flex' }}>
          <Spark active={!done} size={16} />
        </span>
        {swaps && (
          <span className={styles.glyphChevron} aria-hidden="true">
            <Icon name="chevron-right" size={16} />
          </span>
        )}
      </span>
      <span className={styles.line}>{line}</span>
      {/*
        THE EXPECTATION RIDES THE CLOCK, from second zero — the same muted span
        the seconds were always in. A promise about the wait belongs with the
        number counting it, not on a line of its own.
      */}
      {/*
        AND A RUN WITH NO DURATION SAYS NOTHING HERE. The span is the whole
        duration — separator included — so a chip that has no timed run to
        report simply has one fewer item in the row. `.row` spaces with `gap`
        and `.line` is `flex: 1`, so nothing is left hanging and nothing shifts.
      */}
      {durationMs != null && (
        <span className={`${styles.meta} ${!done && expectation ? styles.metaClause : ''}`}>
          {seconds}s{!done && expectation ? ` · ${expectation}` : ''}
        </span>
      )}
      {/*
        NO TRAILING CHEVRON. It sat here at rest — after the clock, on every
        chip — and it is the caret this panel keeps killing: chrome that is only
        useful in the instant before a press, drawn permanently. The promise
        moved into the lead glyph, which was already on the row and costs
        nothing (2026-08-25).
      */}
    </div>
  );

  if (expands) {
    /*
      How far down the pairs the run has got. `step` counts ACTIVITIES, and the
      host builds both lists off one run — usually the same length, sometimes
      not — so the fraction is the mapping that stays honest either way.
    */
    const reached =
      done || activities.length === 0
        ? pairs.length
        : Math.min(pairs.length, Math.floor((step / activities.length) * pairs.length));

    return (
      <div className={styles.wrap}>
        <button
          type="button"
          className={styles.press}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {done ? row : <Shimmer active>{row}</Shimmer>}
        </button>
        {open && (
          <div className={styles.body}>
            {/* One line past what has resolved — that one is the live one. */}
            {pairs.slice(0, Math.min(reached + (done ? 0 : 1), pairs.length)).map((pair, i) => {
              const settled = i < reached;
              return (
                <div key={i} className={styles.pair}>
                  <span className={styles.pairDot} />
                  {settled ? (
                    <span className={styles.pairText}>{pair.resolved}</span>
                  ) : (
                    /* The band swaps the live line here too — one run, one story,
                       whether the reader is looking at the row or inside it. */
                    <Shimmer active>
                      <span className={styles.pairText}>
                        {extended ? extendedLine : pair.running}
                      </span>
                    </Shimmer>
                  )}
                </div>
              );
            })}
            {/* The record, where a second meaning has room to name itself. */}
            {onOpen && (
              <button type="button" className={styles.viewLink} onClick={onOpen}>
                View in progress
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  /*
    THE SWEEP RUNS BECAUSE THE AGENT IS WORKING. Same rule the receipt and the
    lifecycle object obey — a box shimmers while someone else holds the work and
    stops the moment the ball is back.

    The frame is the OUTER element and `Shimmer` sits inside it. `Shimmer` takes
    its radius by `inherit`, so the sweep is clipped to this card's corners only
    when the card is its parent — putting both classes on one element leaves the
    corners to whichever stylesheet the bundler wrote last.
  */
  return (
    <div className={styles.wrap}>
      {done ? (
        pressable ? (
          /*
            SELECTED IS THE RECORD DOOR'S ALONE. The expandable chip's "thing"
            is its own body, which is already reported by `aria-expanded` — a
            second, differently-coloured way to say open would be the same fact
            twice. `aria-current` and not `aria-pressed`: the row does not
            toggle, it points at what is showing.
          */
          <button
            type="button"
            className={`${styles.press}${selected ? ` ${styles.selected}` : ''}`}
            aria-current={selected || undefined}
            onClick={onOpen}
          >
            {row}
          </button>
        ) : (
          row
        )
      ) : (
        <Shimmer active>{row}</Shimmer>
      )}
    </div>
  );
};

RunChip.displayName = 'RunChip';
