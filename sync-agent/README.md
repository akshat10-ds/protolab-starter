# protolab-sync-agent

An [eve](https://eve.dev) agent that keeps the protolab-starter prototype in
sync with the live Docusign demo website. Once a month (Vercel Cron, from
[agent/schedules/monthly_sync.ts](agent/schedules/monthly_sync.ts)) it
re-captures every page in [`../specs/pages.json`](../specs/pages.json),
pixel-diffs against the approved baselines, and opens one PR per page that
actually changed — reviewed by the page's design-area reviewers on the PR's
Vercel preview deployment. Humans merge; the agent never does.

This folder deploys as its **own Vercel project** (set the project's root
directory to `sync-agent/`), separate from the prototype's project.

## How it works

```
Vercel Cron (monthly)
  └─ session: setup_workspace  → clone repo + npm ci in Vercel Sandbox
       for each page in specs/pages.json:
         capture_page          → Playwright in the sandbox: screenshot + a11y + icons
         diff_page             → pixelmatch vs specs/baselines/<id>.png
         (unchanged → next page, ~zero cost)
         agent edits src/App.tsx + baselines via built-in sandbox tools
         npx vite build        → must pass
         open_pr               → GitHub API from the app runtime (token never
                                 enters the sandbox), reviewers from manifest
```

## One-time setup

```bash
cd sync-agent
npm install

# Link to a NEW Vercel project (root dir = sync-agent/) and pull env
npx eve@latest link
vercel env pull

# GitHub access through Vercel Connect (managed GitHub App, short-lived tokens)
vercel connect create github --name protolab-sync
vercel connect attach github/protolab-sync
# → install the GitHub App on akshat10-ds/protolab-starter when prompted

# Demo-site login (throwaway demo account — NOT a personal account)
vercel env add DEMO_EMAIL
vercel env add DEMO_PASSWORD

npx eve@latest deploy
curl https://<deployment>/eve/v1/health
```

Model calls route through Vercel AI Gateway automatically once the project is
linked (OIDC). No Anthropic key to manage.

## First supervised run

`specs/baselines/` starts empty, so the first run treats every page as changed.
Run it deliberately, watch it, and use its PRs to seed the baselines:

```bash
curl -X POST https://<deployment>/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Run the monthly protolab sync now. This is the supervised baseline-seeding run."}'
```

The agent runs unattended end to end — capture, diff, rewrite, PR. Human
review starts at the PR: designers review the Vercel preview, and CODEOWNERS
blocks any merge without approval. If you want the agent to pause for a yes
before filing each PR (e.g. for the very first run), add `approval: always()`
in [agent/tools/open_pr.ts](agent/tools/open_pr.ts).
Watch runs, tokens, and tool calls in the Vercel dashboard (Agent Runs).

## Things to validate on the first run (known unknowns)

1. **Playwright inside Vercel Sandbox** — undocumented. The bootstrap
   apt-installs Chromium via `playwright install --with-deps`; sandboxes are
   root-access microVMs so this should work, but if it doesn't: bake Chromium
   into a custom OCI image (documented path) or point capture_page at a remote
   browser service.
2. **Demo login selectors** — `capture_page`'s login flow is a best-effort
   guess; pin the real selectors after watching one login. If SSO/bot
   detection blocks headless login, seed a `storageState` file instead.
3. **`sandbox.run` result shape** — eve is beta; the tools defensively read
   `exitCode`/`stdout`/`stderr`. Adjust if the real shape differs.
4. **Demo URLs and reviewers** — every `TODO(akshat)` in `specs/pages.json`
   must be filled in before the run covers that page (the agent skips and
   reports TODOs rather than guessing).
5. **Production session auth** — eve's default route policy "rejects browser
   traffic in production" and the docs mention replacing `placeholderAuth()`
   with a production policy. This scaffold defines no auth policy file, so
   the first-supervised-run curl may bounce off the default policy; if it
   does, set `VERCEL_AUTOMATION_BYPASS_SECRET` (Deployment Protection) or add
   a route policy per https://eve.dev/docs.

## Repo conventions

- `specs/pages.json` — the page manifest (which prototype view ↔ which demo
  URL ↔ which reviewers). The agent skips `sync: false` and TODO entries.
- `specs/baselines/` — last *approved* captures; updated in the same PR as the
  code change, so merging is what promotes a new baseline.
- Branches: `sync/<page-id>-<YYYY-MM>`, one PR per page; a re-run within the
  same month updates the existing PR instead of duplicating it.
- Invented prototype surfaces (Iris panel, `#scenarios`, walkthrough) are
  never touched by sync runs.

eve is **beta** — expect API churn; re-check https://eve.dev/docs when
upgrading the `eve` package.
