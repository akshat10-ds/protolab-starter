import { defineAgent } from "eve";

export default defineAgent({
  // Routed through Vercel AI Gateway (VERCEL_OIDC_TOKEN or AI_GATEWAY_API_KEY).
  model: "anthropic/claude-opus-4.8",
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
