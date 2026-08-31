import { defineAgent } from "eve";

export default defineAgent({
  // Routed through Vercel AI Gateway (VERCEL_OIDC_TOKEN or AI_GATEWAY_API_KEY),
  // which passes provider rates through without markup.
  //
  // Chosen over Opus on cost: the same session caps below bound a run at
  // ~$6 here vs ~$15 on opus-4.8. The hard part of this job is editing an
  // existing 3k-line App.tsx correctly, and two things make a mid-tier
  // model safe for it — `npx vite build` gates every edit, and a human
  // reviews every PR. A weaker model costs iterations, not breakage.
  //
  // If edit quality disappoints, "anthropic/claude-sonnet-5" is the same
  // list price and scores 63.2% on SWE-bench Pro. "zai/glm-5.2" is a third
  // of the cost at 62.1%, if a non-US provider is acceptable for this data.
  model: "openai/gpt-5.6-sol",
  reasoning: "medium",
  limits: {
    // A full monthly sweep of ~16 pages, most of which short-circuit at the
    // structural-fingerprint diff. Codegen only runs for changed pages.
    maxInputTokensPerSession: 2_000_000,
    maxOutputTokensPerSession: 200_000,
    sessionTimeoutMs: 12 * 60 * 60 * 1_000,
  },
  compaction: { thresholdPercent: 0.75 },
});
