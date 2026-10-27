/**
 * ProcessArtifact — the `process` renderer: a run's whole shape, in the dock.
 *
 * Akshat, 2026-08-19: loan progress follows the search pattern — the current
 * step in chat, everything in the artifact. This is the "everything": the
 * stepper across every step, one step's detail at a time, and the
 * recommendations the run produced.
 *
 * Frame 237:42269 top to bottom — stepper, the step's content, a collapsible
 * "Recommendations (N)". The cards under it are `RecommendationCard`, the same
 * ones the chat fires inline; the artifact is where all of them live, and the
 * strip above the composer is the door to here.
 *
 * The stepper is Ink's, not a redrawn one. Every control reports through the
 * dock's `onAction`, so this renderer holds no host knowledge — only which step
 * is being read and whether the section is open.
 *
 * **THE STEPPER IS THE FILTER, not only the header.** Akshat, 2026-08-20:
 * *"when I click on Classify I should see history for that, then click
 * Disclosures I see history for that."* Where the events carry a `stepId`, the
 * timeline draws one phase at a time — that phase's realized rows and its
 * planned ones — and reading starts on the phase the run is on. Where they do
 * not, it draws the whole run, unchanged.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Icon, Stepper, Timeline } from '@ink';

import { RecommendationCard } from '../../composites/RecommendationCard/RecommendationCard';
import dock from './ArtifactDock.module.css';
import styles from './ProcessArtifact.module.css';
import type { ArtifactRenderContext, ArtifactRenderer } from './types';

/** Ink's `StepStatus` names, from ours. `error` is not a state a run reports here. */
const STEP_STATUS = {
  complete: 'completed',
  active: 'active',
  upcoming: 'upcoming',
} as const;

const Body: React.FC<ArtifactRenderContext> = ({ item, onAction }) => {
  const steps = item.process?.steps ?? [];
  const events = item.process?.events ?? [];
  const recommendations = item.process?.recommendations ?? [];

  /*
    Reading starts at the step the run is on — the one the user came here to
    check. `null` means "follow the run"; picking a step pins it.
  */
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [recsOpen, setRecsOpen] = useState(true);

  /*
    "Needs you (2)" has to reach the two things it counts. `focusRecId` names
    the card the reader was sent here for: the section opens, the card scrolls
    into view and rings once. The ring is a class the CSS removes on animation
    end, so pressing the same count twice fires it twice.
  */
  /*
    TAKE ME TO THIS PHASE. A run-chip is a receipt for one stage of the run, and
    pressing it opens the record already filtered to that stage — the pinned
    step, not the active one.

    An effect rather than an initial value, because the pane is often ALREADY
    open when the chip is pressed and there is no mount to read a default at.
    The host clears the id after the jump, so pressing the same chip again is a
    change again and the jump repeats.
  */
  const focusStepId = item.process?.focusStepId;
  useEffect(() => {
    if (focusStepId) setPinnedId(focusStepId);
  }, [focusStepId]);

  /*
    AND TAKE ME TO ALL OF THEM. "See all (N)" in a cold state promises the whole
    list, so it lands on the list — the section opens and its header goes to the
    top of the well. No ring: nothing here is THE card, which is exactly what
    separates this from `focusRecId` below.

    A counter rather than an id the host clears, because there is no id to
    clear. Every press is a new value, so every press jumps.
  */
  const focusRecs = item.process?.focusRecs;
  const recsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!focusRecs) return;
    setRecsOpen(true);
    /*
      IT RE-PINS EVERY FRAME FOR HALF A SECOND, AND NOTHING CANCELS IT.

      The pane MOUNTS on this press, and every single-shot moment loses. A
      smooth scroll fired in the effect ended at scrollTop 10 against a target
      of 2232 — the panel's own open scroll outran it. An instant jump two
      frames later landed at 0, because the timeline above had not taken its
      height yet: the section was ALREADY at the top of an almost-empty well,
      the scroll was a legitimate no-op, and the run then grew underneath it.
      A "stop once it is at the top" test fails for the same reason — on frame
      one it is true, and it is true of the wrong layout.

      So there is no test. The jump is re-asserted every frame until the layout
      has certainly settled, and the last one is the one that counts.

      AND THE EFFECT RETURNS NO CLEANUP, which is the part that took the
      measuring. The panel mounts and tears this body down more than once inside
      the opening frame — logged: effect, cleanup, effect, cleanup, all before
      the first animation frame — so an effect that cancelled its own timer on
      cleanup cancelled it every time and the frame callback never ran once. A
      loop that outlives its instance is the price, and it is nothing: it lasts
      half a second and calls `scrollIntoView` on a node that is either the live
      section or detached, where the call does nothing.

      ponytail: a fixed 500ms window, and the reader cannot scroll away from the
      section inside it. Both are cheap here — the window opens with the pane, so
      there is nothing to scroll away from yet. A ResizeObserver on the well is
      the upgrade if the pane ever mounts slower than this.
    */
    const deadline = performance.now() + 500;
    const pin = () => {
      recsRef.current?.scrollIntoView({ block: 'start' });
      if (performance.now() < deadline) requestAnimationFrame(pin);
    };
    requestAnimationFrame(pin);
  }, [focusRecs]);

  const focusRecId = item.process?.focusRecId;
  const focusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!focusRecId) return;
    setRecsOpen(true);
    const node = focusRef.current;
    if (!node) return;
    /* `center`, not `nearest`: nearest parks the card on the container's edge,
       which is where "I cannot see what you sent me to" comes from. */
    node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    node.classList.remove(styles.focusRing);
    /* Two frames, so a repeat lands: the class has to leave the DOM between. */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => node.classList.add(styles.focusRing)),
    );
  }, [focusRecId]);

  /*
    WHERE READING STARTS. The step the run is on — and when nothing is active
    because the run has finished, the last one, which is where it finished.
    Falling back to index 0 sent a completed run back to its first phase, which
    is the one phase nobody opens the artifact to read.
  */
  const foundActive = steps.findIndex((s) => s.status === 'active');
  const activeIndex =
    foundActive >= 0
      ? foundActive
      : steps.some((s) => s.status === 'complete')
        ? steps.length - 1
        : 0;
  const shown = steps.find((s) => s.id === pinnedId) ?? steps[activeIndex];

  /*
    THE STEPPER IS ALSO THE FILTER. Akshat, 2026-08-20: *"when I click on
    Classify I should see history for that, then click Disclosures I see history
    for that."* So the timeline under the stepper is one phase's slice — its
    realized events and its planned rows — and reading starts on the phase the
    run is on.

    ALL OR NOTHING, so a host that has not stamped its events keeps the whole-run
    timeline it had before. A per-row fallback would leak every unstamped row
    into all four phases, which is the same as not filtering, only surprising.
  */
  const filtered = events.some((e) => e.stepId)
    ? events.filter((e) => e.stepId === shown?.id)
    : events;

  return (
    <div className={dock.well}>
      {steps.length > 0 && (
        <Stepper
          steps={steps.map((step, i) => ({
            id: step.id,
            title: step.label,
            status: STEP_STATUS[step.status],
            label: i + 1,
          }))}
          activeStep={activeIndex}
          orientation="horizontal"
          showDescription={false}
          /*
            Navigation. Ink accepts clicks on completed and active steps only,
            so a phase the run has not reached cannot be read yet — flagged, not
            worked around: the vendored Stepper is not this component's to fork.
          */
          clickable
          onStepClick={(_i, step) => setPinnedId(step.id)}
        />
      )}

      {/*
        THE RUN, NARRATED. One timeline across the whole loan: what has happened
        in order, then what the plan says is still to come, pre-drawn grey. The
        current row carries the mass. Rows open to their own detail — what was
        read, the rule cited — and to whatever control that row has.
      */}
      {filtered.length > 0 && (
        <section className={styles.step}>
          {/* Which phase you are reading. Ink's stepper has no selected mark of
              its own, so the heading is the one that says where you are. */}
          {shown && <h3 className={styles.stepTitle}>{shown.label}</h3>}
          <Timeline
            /* The stepper above already measures the run, so the rail here is a
               spine and not a second progress bar. */
            railTone="subtle"
            /*
              WHAT SHE IS READING IS HERS. The key used to carry the frontier
              event's id too, so every landing event remounted the timeline and
              closed the row she had opened by hand — measured: two events
              landing took an open row from `[8, 27]` to `[29]`.

              The phase stays in the key, because a stepper click is her own
              act: the slice swaps anyway, and the fresh mount is what opens
              that phase's current row through `defaultOpenIds`. Landing events
              now reconcile against the rows already there, so the timeline
              GROWS instead of rebuilding.

              ponytail: the newest row no longer opens itself mid-read — the
              price of not moving her place, and the smaller of the two. Ink's
              Timeline owns its open set with no controlled prop, and this
              component does not fork it; lift the open set into a controlled
              `openIds` on the Timeline if the auto-open is ever wanted back.
            */
            key={shown?.id ?? ''}
            items={filtered.map((event) => ({
              id: event.id,
              label: event.label,
              timestamp: event.timestamp,
              status: event.status,
              description:
                event.detail || event.action ? (
                  <>
                    {event.detail}
                    {event.action && (
                      <div className={styles.eventAction}>
                        <Button
                          kind="tertiary"
                          size="small"
                          endElement={<Icon name="chevron-right" size={14} />}
                          onClick={() => onAction?.('process:event', item, event.action!.id)}
                        >
                          {event.action.label}
                        </Button>
                      </div>
                    )}
                  </>
                ) : undefined,
            }))}
            collapsible
            /* The row you came to read is the one that is open. */
            defaultOpenIds={filtered.filter((e) => e.status === 'current').map((e) => e.id)}
          />
        </section>
      )}

      {/* The fallback: one step's bullets — for a run with no event log, and
          now also for a phase whose slice is empty. */}
      {filtered.length === 0 && shown && (
        <section className={styles.step}>
          <h3 className={styles.stepTitle}>{shown.label}</h3>
          {shown.bullets && shown.bullets.length > 0 && (
            <ul className={styles.bullets}>
              {shown.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {recommendations.length > 0 && (
        <section className={styles.recs} ref={recsRef}>
          <button
            type="button"
            className={styles.recsHeader}
            aria-expanded={recsOpen}
            onClick={() => setRecsOpen((v) => !v)}
          >
            <span className={styles.recsTitle}>Recommendations ({recommendations.length})</span>
            <Icon name={recsOpen ? 'chevron-up' : 'chevron-down'} size={16} />
          </button>

          {recsOpen && (
            <div className={styles.recsList}>
              {recommendations.map((rec) => {
                /*
                  A flag has one control and it carries a payload. `detail` is
                  `{ id, note }` here, not the bare id every other verb sends —
                  the officer's note is the outcome, and the host is the only
                  thing that can file it.
                */
                const isFlag = rec.kind === 'flag';
                /*
                  A PARKED FINDING IS THE THIRD ARCHETYPE, and it is the one the
                  card already knows how to draw — the brief layout with
                  `stance="asks"`, which is exactly what the host puts on its own
                  cold state. So it is drawn as that here rather than as a
                  variation of the other two: one finding, one card, two
                  surfaces, and the officer meets the same two verbs wherever she
                  finds it.

                  NO ACCEPT. `onAdd` is absent, so the brief card's accept falls
                  back to `onReview` on its own — which is the point: accepting a
                  finding means nothing, and the button has to go and look.
                */
                const isJudgement = rec.kind === 'judgement';
                return (
                  <div key={rec.id} ref={rec.id === focusRecId ? focusRef : undefined}>
                  <RecommendationCard
                    /* `judgement` is this data model's word, not the card's — the
                       card's own archetype for it is a flag drawn brief. */
                    kind={rec.kind === 'judgement' ? 'flag' : rec.kind}
                    layout={isJudgement ? 'brief' : undefined}
                    stance={isJudgement ? 'asks' : undefined}
                    icon={rec.icon}
                    reason={rec.reason}
                    checks={rec.checks}
                    title={rec.title}
                    meta={rec.meta}
                    body={rec.body}
                    citation={rec.citation}
                    why={rec.why}
                    actionLabel={rec.actionLabel}
                    dismissPrompt={rec.dismissPrompt}
                    dismissReasonRequired={rec.dismissReasonRequired}
                    onAdd={
                      isFlag || isJudgement
                        ? undefined
                        : () => onAction?.('recommendation:add', item, rec.id)
                    }
                    onMarkReviewed={
                      isFlag
                        ? (note) =>
                            onAction?.('recommendation:markReviewed', item, { id: rec.id, note })
                        : undefined
                    }
                    onDismiss={
                      isFlag
                        ? undefined
                        : (reason) =>
                            onAction?.('recommendation:dismiss', item, { id: rec.id, reason })
                    }
                    onAskIris={() => onAction?.('recommendation:ask', item, rec.id)}
                    onReview={() => onAction?.('recommendation:review', item, rec.id)}
                  />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export const ProcessArtifact: ArtifactRenderer = { Body };
