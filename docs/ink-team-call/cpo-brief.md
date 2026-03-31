---
type: brief
status: draft
created: 2026-03-27
audience: CPO
tags: [protolab, v0, cost-analysis, prototyping]
---

# Prototyping at Docusign: The Cost Problem and How We Fix It

## The Situation

Our product and design org (310 people) relies on AI prototyping tools to move fast. Today, two tools serve this need:

- **Figma Make** — available to everyone (300 tokens/person), but limited in capability
- **v0** — powerful, but only ~40 revolving seats at $20/seat. Hard monthly cap.

**The result: teams are hitting token limits mid-sprint and can't prototype.** 270 of 310 people have no access to v0 at all. Those who do are running out of tokens before the month ends.

---

## The Cost Data (Dec 27, 2025 — Mar 27, 2026)

We analyzed 3 months of v0 usage across the 40-seat pool:

| Metric | Value |
|--------|-------|
| Total spend | $4,530 |
| Messages sent | 3,990 |
| Active users | 40 |
| Prototyping sessions | 571 |

### Costs are accelerating — fast

| Month | Spend | Messages | Growth |
|-------|-------|----------|--------|
| Dec 2025 | $43 | 125 | — |
| Jan 2026 | $554 | 1,087 | 13x Dec |
| Feb 2026 | $1,013 | 907 | 1.8x Jan |
| Mar 2026 | $2,919 | 1,871 | 2.9x Feb |

**At the current trajectory, the annualized run-rate for just 40 seats is ~$35K.** And demand is growing — more teams want access.

### Why v0 costs are structurally high

The cost problem isn't about waste or overuse — it's architectural:

- **89% of spend is re-reading context, not generating code.** v0 has an 8.4:1 input/output token ratio. Every message replays the entire conversation history.
- **Context accumulation tax: +35%.** Messages at the end of a session cost 35% more than at the beginning, purely from growing context windows.
- **Deep sessions drive disproportionate cost.** 11% of sessions (16+ messages) consume 52% of total spend. Prototyping inherently requires iteration.
- **Model choice matters.** `v0-max-fast` is 10x more expensive per message than `v0-max`, yet accounts for 35% of total spend from just 5% of messages.

---

## The Case Study: Same Prototype, 40x Cheaper

We ran a direct comparison on the same prototype — a Workspaces Participant Portal:

| | Standard v0 | v0 + ProtoLab MCP |
|---|---|---|
| **Who** | Jilly | Akshat |
| **Messages** | 85 | **2** |
| **Cost** | **$68.02** | **$1.67** |
| **Time** | 3 days | 1 minute |
| **Model** | v0-max | v0-pro |
| **Output** | Participant Portal | Same Participant Portal |

**40x cost reduction. Same output.**

### Why the difference?

With standard v0, every message re-generates UI components from scratch. The AI doesn't know our design system, so it iterates — 85 times — to get the buttons, modals, navigation, and layout right.

With ProtoLab, the AI receives our **63 Ink Design System components** as structured tool calls — correct props, design tokens, and usage examples. It assembles instead of generates. Two messages instead of eighty-five.

---

## What Is ProtoLab?

ProtoLab is an MCP (Model Context Protocol) server that makes our Ink Design System available to any AI tool. Built by the Agentic Experiences team.

**Key properties:**
- **Built on Ink** — Docusign's official design system. Prototypes use the same components and tokens that ship in production, so engineers can pick them up directly.
- **App-agnostic** — works inside v0, Claude Code, Cursor, Figma Make, or any MCP-compatible tool
- **63 Ink DS components** — buttons, inputs, modals, data tables, navigation, full layouts
- **Stateless** — no context accumulation. Each tool call returns exactly what's needed.
- **Designer-to-engineer handoff** — prototypes aren't throwaway mockups. Because they use real Ink components, engineering can build from them directly, collapsing the design-to-code gap.
- **Already live** — 34 users, 4,542 tool calls, 260 sessions to date

---

## Projected Savings at Scale

### Current state (40 v0 users)

| Scenario | Monthly Cost | Annual Cost |
|----------|-------------|-------------|
| v0 only (current) | ~$2,919/mo (and growing) | ~$35K |
| v0 + ProtoLab | ~$73–117/mo (25-40x reduction) | ~$900–1,400 |
| **Savings** | **~$2,800/mo** | **~$33K–34K** |

### Scaled to 310 people

If we expand prototyping access to the full product + design org:

| Scenario | Monthly Cost | Annual Cost |
|----------|-------------|-------------|
| v0 only (310 people at current per-user rates) | ~$22,600/mo | ~$271K |
| v0 + ProtoLab (310 people) | ~$550–900/mo | ~$6,600–10,800 |
| **Annual savings** | | **~$260K–265K** |

**Assumptions:**
- Per-user monthly spend scales proportionally to current 40-user data ($56.50/user/mo)
- ProtoLab reduces message count by 25-40x (conservative, based on case study)
- Savings estimate does not include time savings (days → minutes per prototype)

### Beyond cost: what ProtoLab unlocks

- **270 more people can prototype.** ProtoLab works with Figma Make (which everyone already has) and any other MCP tool. No new seats needed.
- **Brand consistency from day one.** Every prototype uses real Ink components — no more cleaning up generic v0 output.
- **Engineers can build from prototypes directly.** Because ProtoLab outputs real Ink DS components, prototypes aren't throwaway — they're a head start on production code.
- **Tool flexibility.** Not locked into any single vendor. Works with whatever AI tool the team prefers.
- **Speed.** What took days now takes minutes. Sprint velocity increases.

---

## The Ask

**Roll out ProtoLab as standard prototyping infrastructure across the 310-person product + design org.**

- ProtoLab is already built and live (protolab-mcp.vercel.app)
- Works with every AI tool teams already use — no migration required
- Projected to save $260K+ annually at full scale
- Unblocks the 270 people who currently can't prototype with AI

---

*Data source: v0 Usage Events export, Dec 27 2025 — Mar 27 2026. ProtoLab MCP server analytics. Analysis performed Mar 27, 2026.*
