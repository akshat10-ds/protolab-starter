# Sync workflow

The sync agent already works: every month it captures the live Docusign demo
site, diffs each page's structure against the approved baseline in
`specs/baselines/`, and opens one PR per page that changed. What it does not
have is a team around it. This is the operating process — who reviews, how, in
what time, what happens when the prototype is *meant* to differ from
production, and how we decide after three months whether the whole thing is
worth keeping.

## What the agent can't know

The agent is good at exactly one thing: noticing that a production page's
structure changed and proposing the matching edit. Merging its PR is the
approval — the code change lands and the fresh capture becomes the new
baseline, so next month the same change is not re-proposed.

What it cannot know is whether matching production is what we want. The
prototype is deliberately ahead of production in places — the Iris panel, the
insights band on Completed, invented AI surfaces built for design stories that
production hasn't shipped. A sync PR can be a perfectly accurate mirror of
production and still be wrong to merge, and only the designer who owns that
view can tell the difference. That judgment is the entire human job. Everything
below is arranged so the person who has it sees the PR, decides in minutes
rather than an hour, and never has to make the same decision twice.

## Who does what

Three roles. On a team of three to six, everyone is a page reviewer, one
person is the operator, and one is the design-system contact. One person can
hold two roles; the separations underneath the table cannot be collapsed.

| Role | Held by | Responsibility |
|---|---|---|
| **Operator** | One designer, plus a named deputy | Keeps `specs/pages.json` accurate (demo URLs, reviewers, deliberate differences). Reads the run summary on the 1st, posts the triage digest, sweeps on working day 5, closes stale PRs on day 7. First responder when a run fails or a capture looks wrong. |
| **Page reviewer** | Every syncable page names two designers in its `reviewers` field — an owner and a backup | Reviews that page's sync PRs against the fifteen-minute checklist. Decides approve / fix / close / escalate. Owns the page's deliberate-differences entries. |
| **Design-system contact** | One designer | Takes the two cross-page signals: `visualDrift` flags (the design system aging — handled through `/update`, never a page PR) and the single shell PR when the global chrome moves. |

The separations that are not negotiable:

- **The operator's approval is not a substitute for the page owner's.** The
  review exists to apply the view designer's intent — is this production
  change something this view *wants*? An operator approving a page they don't
  design is motion without the judgment the review exists for. The operator
  can be a page owner for views they actually designed; they cannot be the
  fallback approver for everything.
- **The person who built and runs the agent must not be the only person who
  can merge its output.** Today that is exactly the situation: CODEOWNERS is
  `* @akshat10-ds` with code-owner review required, so every sync PR needs
  approval from the same person who wrote the agent, operates it, and
  designed most of the views. That is both a bottleneck (nothing merges when
  he's out) and a rubber stamp (nobody checks the system except through its
  author's eyes). The fix is a CODEOWNERS change — a team-level entry for
  `src/App.tsx` and `/specs/baselines/` so any page owner's approval merges a
  sync PR — and it is a hard prerequisite, listed at the end.
- **Deliberate-difference decisions belong to the page owner and land in the
  repo**, not in PR comment threads. A decision recorded only in a closed PR
  gets re-made every month by whoever reviews next.

Today `reviewers` reads `TODO(akshat)` on every page and the default is a
single handle. Filling it — two names per page — is the first prerequisite;
the workflow does not start until it's done.

## The first of the month

The cron fires at 09:00 UTC on the 1st. A normal month produces zero to three
PRs and costs the team well under an hour in total.

| When | Who | What | Budget |
|---|---|---|---|
| 1st, before end of day | Operator | **Triage.** Read the run summary: PR count matches the "changed" count; skipped pages and their reasons; needs-human pages; suspicious-content flags; whether a shell PR or `build_view` candidates appeared. Post a digest to the team channel: one line per PR — page, one-line change, assigned reviewer, due date. | 20 min |
| Working days 1–3 | Page reviewers | Review assigned PRs with the fifteen-minute checklist. Approve-and-merge, fix-and-merge, close-and-record, or escalate. | 15 min per PR |
| Working day 5 | Operator | **Sweep.** Chase unreviewed PRs, hand them to the backup reviewer, merge anything approved but unmerged, land any deliberate-difference entries decided this cycle. | 15 min |
| Working day 7 | Operator | **Close** anything still undecided, with a comment saying so. Never merge on an absent owner's behalf. | 5 min |

Closing is cheap by design: the baseline only advances on merge, so an
unreviewed production change is re-detected and re-proposed next run. A missed
month costs a month of drift, never data.

**The burst month (5+ PRs at once).** Five pages tripping together almost
always means one shared change, and the response is to review the *pattern*
once, not the page five times.

1. First check it isn't the global chrome: the agent is instructed to fold a
   shell change into one dedicated PR instead of sixteen. If you're looking at
   a stack of near-identical page PRs, that's an agent bug — close all but
   one, and the operator files the fix against
   `sync-agent/agent/instructions.md`.
2. If the change is real across pages (say, a new column rolled out to every
   table): the operator picks one representative PR. Its owner does one full
   review of the pattern — 30 minutes — and posts the verdict on the digest
   thread. Every other affected reviewer then does a 5-minute confirmation on
   their own page: before/after image plus preview, checking only that their
   view took the pattern correctly.
3. The deadline extends to working day 5, the close to day 10. No reviewer
   carries more than three PRs in a cycle; the operator moves the overflow to
   backups.

**The absent reviewer.** The backup (second name in `reviewers`) steps in at
the day-5 sweep. If both are away, the PR waits and gets closed at day 7 like
anything else. The operator does not merge it: only the view's designer knows
whether matching production is desired there, and a wrong merge can flatten
deliberate work. The agent re-proposes next month; the returning owner reviews
then.

## Reviewing a sync PR in fifteen minutes

The order matters. The spec diff and the pictures make the decision; the code
diff is for exceptions. Nobody should be reading a 3,200-line `App.tsx` diff
to find out that a column was added.

1. **The structural diff in the PR body** — 1 minute. Forty lines of "added:
   Status column; removed: promo banner", not React. The question: is this
   change real, and does this view want it? If any line overlaps the page's
   deliberate-differences entries, the body says so — stop here and close.
2. **The before/after image** — 2 minutes. The PR overwrites
   `specs/baselines/<id>.png`, so the Files-changed tab renders GitHub's
   native image diff: swipe or onion-skin between last month's production and
   this month's. This is where you confirm the change with your own eyes.
3. **Preview against production** — 5–10 minutes. The body carries the live
   `demoUrl` and the Vercel preview link side by side. Check structure and
   composition — arrangement, illustration, column order. Not spacing, colors,
   or typography; the design system owns those and per-page patches for them
   are always wrong.
4. **The flags** — 1 minute. Anything the agent guessed or couldn't resolve:
   an unmatched icon, an asset it couldn't fetch, an uncertain label. Each one
   is either a small fix now or a follow-up.
5. **The code diff — only if steps 1–4 raised a doubt.** If you find yourself
   reading `App.tsx` to figure out *what* changed, the PR body failed its job;
   say so on the digest thread so the operator fixes the agent's template.

If a review is heading past 30 minutes, stop and escalate. The artifact is
broken, not you.

| What you see | What you do |
|---|---|
| Change is real, prototype matches, flags minor or none | **Approve and merge.** Merging promotes the baseline — that's the approval. |
| Right structure, small details wrong (icon, label, cell renderer) | **Fix, then merge.** Under ten minutes of work: push a fixup commit to the branch and merge. Larger: merge anyway and file the follow-up the same day. Don't park a correct structural change over a nit — parked means re-proposed next month. |
| Change is real in production, but this view is deliberately different | **Close, and record it.** Add the deliberate-differences entry *before* closing, or the identical decision comes back every month. |
| Capture looks wrong (a modal ate the page, an empty demo account read as an empty state), the change would touch Iris / `#scenarios` / the walkthrough, captured content reads like instructions, or you're unsure whether the difference is deliberate | **Escalate** — to the operator for capture problems, to the page owner for intent. Don't approve to be agreeable, don't close to make it go away. |

**What the PR body must contain** for the review to take minutes. The agent's
instructions already require the first five; the last two are additions the
operator owes:

1. One line on what changed on the demo site
2. The structural diff — added and removed, in plain component-and-content terms
3. The pointer to the baseline image diff in Files changed
4. `demoUrl` and the Vercel preview link, side by side
5. Every guess and unresolved item
6. *(new)* The page's deliberate-differences status: "none recorded", or the
   list, with a flag if any overlap this diff
7. *(new)* A review-size line: "small — one column" vs. "large — section
   restructured", so reviewers can order their morning

## When the difference is deliberate

Two situations recur. The prototype carries things production doesn't — an
invented AI surface, a richer insights band — and production carries things a
view has chosen not to mirror. In both, the agent will faithfully re-propose
the "correction" every month, and every month someone re-decides. The decision
needs to live where both the agent and the next reviewer will find it.

The mechanism: a `deliberate` list on the page's entry in `specs/pages.json`.
That file is already the one artifact both the agent and humans read, it's
per-page, and a new entry is a five-line PR.

```jsonc
{
  "id": "completed",
  "deliberate": [
    {
      "keep": "Insights band above the table",
      "skeleton": ["heading: Insights", "button: Ask Iris"],
      "why": "Invented surface for the Navigator story; production has no equivalent.",
      "who": "akshat10-ds",
      "since": "2026-09",
      "revisit": "2027-03"
    }
  ]
}
```

- `keep` — the plain sentence a reviewer reads in the PR body.
- `skeleton` — the fingerprint line(s) it corresponds to, copied verbatim from
  `specs/baselines/<id>.skeleton.json` or from a sync PR's diff. This is what
  makes the entry machine-checkable, not just prose.
- `why`, `who`, `since` — enough that a cold reader two years on understands
  the call and who to ask.
- `revisit` — a date, default six months out. Production catches up sometimes
  (they ship the AI surface for real); an entry should be able to die.

What the agent does with it — an instruction change the operator owes, listed
at the end: after computing a page's structural diff, drop every added/removed
line that matches a `skeleton` entry; if nothing remains, the page is
unchanged and no PR opens. Every PR for a page prints its active entries in
the body. When `revisit` has passed, the agent keeps honoring the entry but
flags it in the run summary as due for re-decision — expiry nags, it never
silently flips.

Ground rules: only the page owner adds an entry, it arrives as its own small
PR, and the `keep` sentence must pass a cold read. For a *wholly* invented
surface, the coarse tool already exists — `sync: false`, which is how
Scenarios and Admin are excluded. The deliberate list is for the common
middle: a page that should keep syncing except for the parts we've claimed.

## What a new designer needs to know

Three things, and only three:

1. **If your name is in `specs/pages.json`, one morning a month a PR may
   arrive with it on.** It's a fifteen-minute review with a fixed checklist —
   diff, image, preview, flags — and four possible outcomes. The digest in the
   team channel tells you your due date.
2. **The deliberate list is where your intent survives your holiday.** If you
   build something on a synced page that production doesn't have and it should
   stay, add the entry when you build it — not after the agent's third attempt
   to remove it.
3. **Merging is the approval.** It lands the code and promotes the baseline.
   Never merge a sync PR you haven't looked at.

What they can ignore: everything inside `sync-agent/` (capture mechanics,
subagents, cron plumbing — the operator's problem), the contents of
`specs/baselines/` (agent-written, never hand-edited), and how the fingerprint
is computed.

Where it sits among the skills: `/fork`, `/deploy`, and `/handoff` are the
daily prototyping loop and have nothing to do with sync. Sync only touches the
shared starter app's pages, on `main`. The rule of thumb: building your own
prototype, sync is irrelevant to you; maintaining a page of the shared app,
you're in the reviewer rotation. `/onboard` currently says nothing about any
of this — adding one line ("check whether your name is in `specs/pages.json`;
if so, read `docs/sync-workflow.md`") is on the prerequisite list.

## What forking costs

The honest line at fork time: **the shared starter app keeps tracking
production monthly; your fork does not.** The agent's repo and GitHub
connection are hardcoded to the starter, there is no per-fork deployment, and
we are not building one — a fork is an exploration, not a second product to
operate. From the day you fork, your copy freezes against that day's
production.

For most forks that costs nothing: a two-to-six-week exploration doesn't care
that production moved a column. For a longer-lived fork, the cheap hygiene is
to rebase from `main` after a sync PR merges — you inherit the team's reviewed
sync for free instead of re-deriving it.

The migration path back, when a fork becomes something the team maintains:

1. Land its views into the starter as new views through a normal PR — the
   `build_view` brief (`sync-agent/agent/subagents/build_view/instructions.md`)
   is the reference for the wiring: union type, label map, sidebar entry,
   render branch.
2. Add each page to `specs/pages.json` with its `demoUrl` and two reviewers —
   usually the fork's author as owner, plus a backup.
3. For views that mirror a production page, a supervised agent run captures
   the initial baselines. For views that are invented, mark `sync: false` or
   record deliberate-differences entries.

From the next run the agent maintains them like everything else. The path is
always "merge into the perimeter", never "extend the perimeter out to the
fork".

## How we decide whether to keep it

Three signals, read after three run cycles. The operator keeps the tally on
the monthly digest thread — a dashboard would cost more than the numbers are
worth.

| Signal | It's working | Kill it |
|---|---|---|
| **Decision latency** — PR opened to merged-or-closed | Median at or under 3 working days; nothing survives to the day-7 close unreviewed | PRs habitually die at the day-7 close untouched; the digest is treated as noise |
| **Merge quality** — share of sync PRs merged with at most a small fixup | Two-thirds or more, fixups measured in minutes | Most PRs closed as wrong or rewritten by the reviewer — reviewing the agent costs more than a quarterly manual `/reference-to-prototype` refresh would |
| **Repeat decisions** — PRs closed over an already-recorded deliberate difference | Near zero from month two onward | The same argument happens monthly, meaning the deliberate list isn't being written or isn't being honored |

The call is made at a 30-minute month-three retro with the tally on screen,
whole team. "Kill it" means turning off the cron and nothing else: `specs/`
stays as documentation, and `/reference-to-prototype` — the proven manual
workflow the agent automates — still covers a page whenever a designer wants a
refresh. The exit costs nothing, which is exactly why the experiment is safe
to run.

## What has to change before the first real run

None of this operates on the repo as it stands today. In order:

| # | Change | Where | Owner |
|---|---|---|---|
| 1 | Fill `demoUrl` for every syncable page — all but two are `TODO` | `specs/pages.json` | Operator |
| 2 | Name two reviewers per page (owner + backup), replacing the single-handle default — a 30-minute team mapping session | `specs/pages.json` | Whole team |
| 3 | CODEOWNERS: team-level entry for `src/App.tsx` and `/specs/baselines/` so any page owner's approval merges a sync PR; `sync-agent/` stays with the operator | `.github/CODEOWNERS` + the protect-main ruleset | Repo admin |
| 4 | Teach the agent the deliberate list: subtract matching `skeleton` lines from the diff before deciding changed/unchanged; print active entries in the PR body; flag past-`revisit` entries in the run summary | `sync-agent/agent/instructions.md` | Operator |
| 5 | Add the review-size line and deliberate-status line to the PR body template | `sync-agent/agent/instructions.md` | Operator |
| 6 | First supervised run to populate the empty `specs/baselines/` — the operator and one other designer approve the captures together, so the initial baselines aren't a single person's judgment | One afternoon | Operator + one reviewer |
| 7 | `/onboard` gains one line pointing reviewers here | `.claude/skills/onboard.md` | Operator |

Until 1–3 are done, the cron stays off and any run is manual. Items 4–5 can
land after the first cycle; 6 must precede it; 7 is whenever, but before the
next designer joins.
