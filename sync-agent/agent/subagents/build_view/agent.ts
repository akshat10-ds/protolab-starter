import { defineAgent } from "eve";

// Builds a NEW prototype view for a production page that has no counterpart in
// protolab-starter yet (PowerForms is the motivating case). Deliberately a
// separate agent from the monthly sync:
//
//   sync      surgical, unattended, edits one existing view in place, monthly
//   build     creates files, wires routes and nav, on-demand and human-invoked
//
// eve forbids local subagents from defining schedules, so this can never be
// attached to the cron — the isolation is enforced by the framework, not by
// convention.
export default defineAgent({
  model: "openai/gpt-5.6-sol",
  reasoning: "high",
  description:
    "Builds a brand-new prototype view from a captured production page that protolab-starter does not have yet. Delegate ONLY when a human explicitly asks to build a new surface, never during a scheduled sync run.",
  limits: {
    maxInputTokensPerSession: 1_000_000,
    maxOutputTokensPerSession: 150_000,
    sessionTimeoutMs: 4 * 60 * 60 * 1_000,
  },
  compaction: { thresholdPercent: 0.75 },
});
