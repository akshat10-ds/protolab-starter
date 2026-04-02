---
name: deploy
description: Deploy the current prototype to Vercel via a git branch push
user_invocable: true
---

# /deploy — Ship your prototype

Deploy the current prototype to a shareable Vercel preview URL.

## Steps

1. Ask the user for a short prototype name if not provided as an argument (e.g., "participant-portal", "settings-page")
2. Get the git user name: `git config user.name` (use as author slug, lowercase, hyphens)
3. Get the GitHub username: `gh api user --jq .login`
4. Create a branch: `git checkout -b prototype/{author}-{name}`
5. Stage and commit: `git add -A && git commit -m "prototype: {name}"`
6. Push to your fork: `git push -u origin HEAD`
7. Open a PR to the main repo: `gh pr create --repo akshat10-ds/protolab-starter --base main --head {github-username}:prototype/{author}-{name} --title "prototype: {name}" --body ""`
8. Construct the Vercel preview URL — the pattern is: `https://protolab-starter-git-prototype-{author}-{name}-docusign-xd.vercel.app`
9. Return the URL to the user (note: it goes live within ~1 minute while the PR is auto-merged and Vercel builds)

## Edge cases

- If not authenticated with GitHub, guide the user to run `gh auth login`
- If the branch already exists, append a number suffix (e.g., `-2`)
- If there are no changes to commit, tell the user "Nothing new to deploy"
- If already on a prototype branch, just commit, push, and open the PR (don't create a new branch)
- If origin points to the main repo (not a fork), tell the user to fork first at https://github.com/akshat10-ds/protolab-starter/fork

## Example output

```
Deployed! Your prototype will be live at:
https://protolab-starter-git-prototype-jilly-participant-portal-docusign-xd.vercel.app

It'll be ready in ~1 minute. View it in the gallery:
https://protolab-mcp.vercel.app/prototypes
```
