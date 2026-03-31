---
name: fork
description: Fork an existing prototype to build on top of it
user_invocable: true
---

# /fork — Build on top of an existing prototype

Fork another team member's prototype branch to iterate on it.

## Input

The user provides a source — either:
- A branch name: `prototype/jilly-participant-portal`
- A partial name: `jilly-participant-portal` (prepend `prototype/`)
- Just a keyword: search for matching branches

## Steps

1. If the input is ambiguous, list available prototype branches: `git branch -r | grep prototype/`
2. Stash any local changes: `git stash`
3. Fetch latest: `git fetch origin`
4. Get the git user name for the new branch
5. Create a new branch from the source: `git checkout -b prototype/{user}-{name}-fork origin/{source-branch}`
6. Start the dev server: `npm run dev`
7. Tell the user what was forked and that they can start editing

## Edge cases

- If the source branch doesn't exist, list available prototype branches and ask the user to pick one
- If there are local uncommitted changes, stash them first and remind the user

## Example output

```
Forked from: prototype/jilly-participant-portal
Your branch: prototype/akshat-participant-portal-fork

Dev server running at http://localhost:5173
Start editing — when you're ready, use /deploy to ship it.
```
