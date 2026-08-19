# Fix spec — dead Ink tokens in ai-system

Read this fully before editing. Akshat approved every change here on 2026-08-10.

Root: `/Users/akshat.mishra/Documents/Work/akshat-lab/system/ai-system/`

Ink's token definitions, for checking any token you are unsure of:
`/Users/akshat.mishra/Documents/Work/protolab-starter/src/design-system/1-tokens/tokens.css`

## Context

`ai-system` references 166 Ink tokens. 40 do not exist anywhere, across about
215 occurrences. The browser drops each of those declarations, so the property
falls back to its initial value, or inherits.

This is the prototyping system, not the shipping product. The goal is that a
prototype renders what its author intended, so a review looks at the right
thing.

## The replacement table — use these exactly

Do not improvise. Every agent uses the same replacements.

| Replace | With | Why |
|---|---|---|
| `--ink-font-color-subtle` | `--ink-font-color-secondary` | Both are `rgba(19,0,50,0.7)`. This is the value Figma publishes as `fontColorSubtle`. |
| `--ink-font-size-body-s` | `--ink-font-body-s-size` | Name inverted. 14px. |
| `--ink-font-size-body-m` | `--ink-font-body-m-size` | Name inverted. 16px. |
| `--ink-font-size-detail-xs` | `--ink-font-detail-xs-size` | Name inverted. 10px. |
| `--ink-font-size-heading-m` | `--ink-font-heading-m-size` | Name inverted. |
| `--ink-font-size-body-xs` | `--ink-font-detail-s-size` | **Judgement call.** Ink has no `body-xs` at any spelling. Its ramp is detail-xs 10 · detail-s 12 · body-s 14. The code wanted a step below body-s, so 12px. Flag this in your report. |
| `--ink-spacing-75` | `--ink-spacing-100` | Ink has no 75. Its scale is 50=4px, 100=8px. The intent was 6px; 8px is chosen for a consistent 4/8/12/16 rhythm. |
| `--ink-spacing-175` | `--ink-spacing-200` | Ink has no 175. 16px matches the 16px padding used elsewhere in the same files. |
| `--ink-spacing-050` | `--ink-spacing-50` | A leading-zero typo. 4px. |
| `--ink-font-color-neutral-default` | `--ink-font-color-default` | Clear intent. |
| `--ink-font-color-danger` | `--ink-font-color-error` | Ink uses "error", not "danger". |
| `--ink-bg-color-danger-subtle` | `--ink-bg-color-error-subtle` | Same. |
| `--ink-bg-color-hover` | `--ink-item-bg-color-hover` | Verify it exists in tokens.css before using it. |
| `--ink-font-family-display` | `--ink-font-family-default` | Ink has no display family. |
| `--ink-font-family-mono` | **leave as is** | Its declaration has a `monospace` fallback, so it resolves. |

## Delete these — do not replace them

Akshat's instruction, in his words: "I don't really know what the blue color,
red color, and green are, so you can delete them."

```
--ink-color-blue-50   --ink-color-blue-100  --ink-color-blue-300
--ink-color-blue-400  --ink-color-blue-500  --ink-color-blue-600
--ink-color-red-50    --ink-color-red-200   --ink-color-red-300
--ink-color-red-500   --ink-color-red-700
--ink-color-green-50  --ink-color-green-500 --ink-color-green-700
--ink-blue-20  --ink-blue-50  --ink-blue-60  --ink-yellow-70
```

Ink has no blue ramp and no yellow ramp at all.

**How to delete.** Remove the whole declaration, not just the `var()`. If that
leaves a rule with no declarations, delete the rule too. Do not leave an empty
block.

**Report every place where the deletion removes the only thing that
distinguished a state.** Those are real design gaps that need a colour decision
later, and Akshat should see the list. Known examples: `ToolCallCard` becomes
monochrome across its four statuses, `ArtifactCard`'s `isActive` becomes inert,
`ExecutionTrace`'s active dot becomes invisible. These are all true today — the
deletion makes them explicit instead of accidental.

## Near-miss steps — decide, then report

These are single uses of a step Ink does not have. For each one, look at the
neighbouring values in the same file and pick the nearest live Ink step. Report
what you chose and why.

```
--ink-ecru-05     (Ink's ecru starts at 10)
--ink-neutral-05  (Ink has neutral-5 and neutral-10)
--ink-neutral-25  (Ink has 20 and 30)
--ink-cobalt-05   (Ink's cobalt starts at 10)
--ink-cobalt-fade-5   --ink-cobalt-fade-10   (Ink has no cobalt fade ramp)
--ink-action-color-primary
```

For the cobalt fades and `action-color-primary`, if you cannot find a defensible
equivalent, delete the declaration and report it. Do not guess a colour.

## Method

1. Work one file at a time.
2. Before editing, list the dead tokens in that file so your report is complete.
3. Edit. Prefer a targeted replacement over a whole-file rewrite.
4. **After editing every file, run this check and paste the output in your
   report.** It must come back empty for your files:

```
cd /Users/akshat.mishra/Documents/Work/akshat-lab/system/ai-system
grep -rhoE 'var\(--ink-[a-z0-9-]+' --include='*.css' <your dirs> | sed 's/var(//' | sort -u > /tmp/used-check.txt
grep -ohE '^\s*--ink-[a-z0-9-]+:' /Users/akshat.mishra/Documents/Work/protolab-starter/src/design-system/1-tokens/tokens.css | sed 's/[: ]//g' | sort -u > /tmp/defined-check.txt
comm -23 /tmp/used-check.txt /tmp/defined-check.txt
```

Note: this shell is zsh. Unquoted variables do not word-split — use a `while
read` loop or an array, never a bare `for x in $VAR`.

5. Do not touch `.tsx` files. Other agents own those.
6. Do not touch any file outside your assigned list.

## Your report

- One line per file: how many replacements, how many deletions.
- The empty output of the verification command.
- Every deletion that removed the only distinguishing style for a state.
- Every near-miss decision, with your reasoning.
- Anything that looked wrong but was out of scope.

Keep it short. Do not pad.
