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
3. Create a branch: `git checkout -b prototype/{author}-{name}`
4. Stage and commit: `git add -A && git commit -m "prototype: {name}"`
5. Push: `git push -u origin HEAD`
6. Construct the Vercel preview URL from the branch name — the pattern is: `https://protolab-starter-git-{branch-name}.vercel.app` (replace `/` with `-` in branch name)
7. Return the URL to the user

## Edge cases

- If not authenticated with GitHub, guide the user to run `gh auth login`
- If the branch already exists, append a number suffix (e.g., `-2`)
- If there are no changes to commit, tell the user "Nothing new to deploy"
- If already on a prototype branch, just commit and push (don't create a new branch)

## Example output

```
Deployed! Your prototype is live at:
https://protolab-starter-git-prototype-jilly-participant-portal.vercel.app

Share this link with your team, or view it in the gallery:
https://protolab-mcp.vercel.app/prototypes
```
