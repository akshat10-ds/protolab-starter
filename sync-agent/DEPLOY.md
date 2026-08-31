# Deploy runbook — protolab sync agent

Handoff doc for finishing the deployment. Written for an interactive Claude
Code session (several steps need a browser sign-in or the user's own
credentials, so they can't be done headlessly).

## What already exists

An eve agent in `sync-agent/` that, once a month, re-captures the Docusign demo
pages listed in `specs/pages.json`, compares each against an approved baseline,
and opens one PR per page whose **structure** changed. Humans review the PR's
Vercel preview; merging deploys the update and promotes the new baseline.

Already built and verified locally:

- `sync-agent/agent/` — `agent.ts`, `instructions.md`, `schedules/monthly_sync.ts`
  (cron `0 9 1 * *`), `sandbox/sandbox.ts`, and four tools: `setup_workspace`,
  `capture_page`, `diff_page`, `open_pr`
- `specs/pages.json` — page manifest (21 entries; 16 syncable, 3 overlays
  deferred, `admin` + `scenarios` excluded)
- `specs/README.md` — baseline layout and spec schema
- `.github/CODEOWNERS` — `/specs/` and `/sync-agent/` rules
- `npx tsc --noEmit` passes; `npx eve build` succeeds with the schedule compiled in

Nothing has been committed, deployed, or run yet.

## Environment gotchas (hit these already — don't rediscover them)

- Active Node is **v24.19.0 at `/usr/local/bin/node`** — not an nvm version.
- **A bare `vercel` does not resolve in this shell.** The only global copy
  belongs to nvm's v22.16.0. The Vercel CLI is installed as a dev dependency of
  `sync-agent`, so **always run `npx vercel …` from the `sync-agent/`
  directory**.
- `npm i -g` fails: `/usr/local/lib/node_modules` needs root. Do not attempt
  sudo — ask the user if a global install ever becomes genuinely necessary.
- The user was logged out of Vercel as of this writing.

## Step 1 — get the sync work onto `main` (blocking)

`setup_workspace` runs `git clone --depth 1` of the **default branch** and reads
`specs/pages.json` out of that clone. Anything not on `main` is invisible to the
agent.

Commit **only** these:

- `specs/` (new)
- `sync-agent/` (new)
- `.github/CODEOWNERS` (modified)
- `.gitignore` (modified)
- `AGENTS.md` — **currently untracked and NOT on main.** The agent's
  instructions say to follow it in the target repo, so it must land on main.
  Confirm with the user that the local copy is the one they want published.

Leave these alone — they are unrelated in-flight work:
`.claude/skills/handoff.md`, `.claude/skills/onboard.md`, `CLAUDE.md`,
`README.md`, `.github/copilot-instructions.md`, `docs/figma-to-prototype.md`.

Branch off `main`, open a PR, let the user merge it. Note `CODEOWNERS` requires
code-owner review on the default branch, so the user merges — not you.

## Step 2 — fill in the manifest (blocking, needs the user)

Every `demoUrl` and `reviewers` field in `specs/pages.json` is `TODO(akshat)`.
The agent skips and reports TODO pages rather than guessing.

**Ask the user for these — never invent a URL or a GitHub handle.** Start with
a handful of high-value pages (`completed` is the Navigator mirror and the
highest-traffic view) rather than all 16 at once. These changes also have to
reach `main`.

## Step 3 — deploy

```bash
cd sync-agent && npx vercel login     # browser sign-in — the user does this
```

```bash
cd sync-agent && npx eve deploy
```

`eve deploy` links first if needed. When prompted for a project name use
**`protolab-sync`**. It pulls AI Gateway credentials automatically, so there is
no model API key to manage.

## Step 4 — credentials and GitHub access

Demo-site login (a throwaway demo account — **not** a personal Docusign
account). The user types the values; don't ask them to paste secrets into chat:

```bash
cd sync-agent && npx vercel env add DEMO_EMAIL production
```

```bash
cd sync-agent && npx vercel env add DEMO_PASSWORD production
```

GitHub access via Vercel Connect. **The name must be exactly `protolab-sync`** —
the tools reference the connect id `github/protolab-sync` (see
`agent/tools/setup_workspace.ts`):

```bash
cd sync-agent && npx vercel connect create github --name protolab-sync
```

```bash
cd sync-agent && npx vercel connect attach github/protolab-sync
```

When prompted, the GitHub App must be installed on
`akshat10-ds/protolab-starter` with **contents: write** and
**pull requests: write** — that's what lets it push branches and open PRs.

Re-run `npx eve deploy` after adding env vars.

## Step 5 — first supervised run

```bash
cd sync-agent && npx eve invoke --url https://<deployment> "Run the monthly protolab sync now — supervised baseline-seeding run."
```

(`curl https://<deployment>/eve/v1/health` first for a liveness check.)

**`specs/baselines/` is empty, so every page returns `no-baseline` and counts as
changed** — a full run could open one PR per syncable page. Before running,
offer the user the option to seed just two or three pages first (either by
filling only those `demoUrl`s, or by naming the pages in the invoke prompt).

Watch the run in the Vercel dashboard under Agent Runs (sessions, tool calls,
token usage).

## What is now validated (tested live 2026-08-24)

- **Capture works end to end.** Real pages captured from `apps-d.docusign.com`,
  structural fingerprints extracted, purpose-matching verified. 13 unit tests.
- **Clicking works.** Declarative `steps` reach surfaces that have no URL.
- **Modal handling works.** The site stacks promo dialogs behind a permanently
  present, undismissable "Quick Access Palette" — handled.
- **`build_view` works.** It built the PowerForms view: 13/13 production
  affordances covered, `vite build` green.

## Known unknowns — read before the first run

1. **The automated login has NEVER run.** Every capture so far used a session
   established by hand (`test/login.mjs`). The selectors in
   `agent/lib/capture-script.ts` are a best-effort guess and are now on the
   critical path — see below.
2. **A demo session expires in under 3 hours** (measured: alive 16:02, dead by
   18:47). This kills the "pre-seed a storageState file" fallback for a monthly
   job: the agent MUST log in with credentials on every run. `DEMO_EMAIL` and
   `DEMO_PASSWORD` are mandatory, not optional.
3. **Playwright inside Vercel Sandbox is still unproven.** It works locally.
   The sandbox bootstrap apt-installs Chromium; if that fails, bake it into a
   custom OCI image or use a remote browser service.
4. **Target the PUBLIC demo env.** eve runs on Vercel, outside Docusign's
   network, so internal hosts like `apps.dev.docusign.net` are unreachable.
   Use `apps-d.docusign.com` — which is what `specs/pages.json` already has.
5. **15 of 17 pages still have `TODO(akshat)` demoUrls.** Only `completed` and
   `powerforms` are filled in. The agent skips and reports TODOs.
6. **eve is beta (0.44.3).** APIs drift from the docs — the docs say
   `needsApproval` on tools, the shipped package uses `approval`. Trust the
   installed types.

## Guardrails

- Don't merge PRs on the user's behalf — review and merge are the human gate.
- Don't guess demo URLs, reviewer handles, or credentials.
- Don't run `sudo`.
- Don't commit the unrelated in-flight files listed in step 1.
- `open_pr` currently runs unattended. To make the agent pause for a yes before
  filing each PR, add `approval: always()` from `eve/tools/approval` in
  `agent/tools/open_pr.ts`.

## Done means

Deployment healthy; `DEMO_EMAIL`, `DEMO_PASSWORD`, and the GitHub connect
attached; at least one page fully round-tripped (captured → baseline written →
PR opened with a working Vercel preview); baselines for the seeded pages merged
to `main`; and the cron confirmed registered for the 1st of the month.
