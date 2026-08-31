import { defineTool } from "eve/tools";
import { z } from "zod";
import { CAPTURE_SCRIPT } from "../lib/capture-script.js";

// Runs the shared capture routine (capture-script.ts) inside the sandbox from
// /workspace/toolbox, so module resolution finds the bootstrap-installed
// playwright. The session in /workspace/captures/state.json is established once
// and reused for every page in the run.
//
// TODO(first-run): the login selectors in capture-script.ts are a best-effort
// guess at the Docusign demo login form. Validate them and pin the real ones.
// If SSO or bot detection blocks headless login, seed state.json instead (the
// local harness in test/live-capture.mjs produces exactly that file).

export default defineTool({
  description:
    "Capture a Docusign demo page in the sandbox's headless browser: screenshot to /workspace/captures/<pageId>.png plus an accessibility snapshot and extracted icon SVG path prefixes. Reuses a stored session when present, and logs in automatically when it lands on a login screen.",
  inputSchema: z.object({
    pageId: z.string().describe("Page id from specs/pages.json"),
    demoUrl: z.string().url(),
    steps: z
      .array(
        z.object({
          type: z.enum(["click", "clickRow", "press", "wait"]),
          role: z.string().optional().describe("ARIA role for a click step"),
          name: z.string().optional().describe("Accessible name (regex) for a click step"),
          selector: z.string().optional().describe("CSS selector, alternative to role+name"),
          index: z.number().optional().describe("Row index for clickRow; 0 is the first data row"),
          key: z.string().optional().describe("Key for a press step, e.g. Escape"),
          ms: z.number().optional().describe("Duration for a wait step"),
          settleMs: z.number().optional().describe("Pause after the action"),
        }),
      )
      .optional()
      .describe(
        "Navigation steps run after modals are dismissed, to reach surfaces that are not URL-addressable — e.g. [{type:'clickRow',index:0}] to open a detail overlay from a table. Use the manifest entry's `entry` note to decide these.",
      ),
  }),
  async execute(input, ctx) {
    const sandbox = await ctx.getSandbox();

    await sandbox.writeTextFile({
      path: "/workspace/toolbox/capture.mjs",
      content: CAPTURE_SCRIPT,
    });

    // Demo credentials are deliberately passed into the sandbox: they are
    // throwaway demo-account creds the browser must type anyway. The GitHub
    // token is the secret that stays out (see open_pr). Written as a file so
    // shell metacharacters in the password can't break or leak via the
    // command line.
    await sandbox.writeTextFile({
      path: "/workspace/captures/params.json",
      content: JSON.stringify({
        pageId: input.pageId,
        demoUrl: input.demoUrl,
        steps: input.steps ?? [],
        email: process.env.DEMO_EMAIL ?? "",
        password: process.env.DEMO_PASSWORD ?? "",
      }),
    });

    const result = (await sandbox.run({
      command: "cd /workspace/toolbox && node capture.mjs",
    })) as { exitCode?: number; stdout?: string; stderr?: string };

    if (!(result.stdout ?? "").includes("CAPTURE_OK")) {
      const err = (result.stderr ?? result.stdout ?? "").slice(0, 2000);
      return {
        ok: false,
        pageId: input.pageId,
        error: err.includes("LOGIN_REQUIRED")
          ? "login required — no stored session and DEMO_EMAIL/DEMO_PASSWORD are unset or rejected"
          : `capture failed: ${err}`,
      };
    }

    const captureJson = await sandbox.readTextFile({
      path: `/workspace/captures/${input.pageId}.capture.json`,
    });
    return {
      ok: true,
      screenshotPath: `/workspace/captures/${input.pageId}.png`,
      ...JSON.parse(String(captureJson)),
    };
  },
});
