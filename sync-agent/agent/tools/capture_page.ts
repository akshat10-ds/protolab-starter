import { defineTool } from "eve/tools";
import { z } from "zod";

// Playwright capture script, run inside the sandbox from /workspace/toolbox so
// module resolution finds the bootstrap-installed packages. Parameters arrive
// via env vars. Login state persists in /workspace/captures/state.json so the
// demo login happens once per sandbox session, not once per page.
//
// TODO(first-run): the login selectors below are a best-effort guess at the
// Docusign demo login form. Validate on the first supervised run and pin the
// real selectors. If SSO or bot detection blocks headless login entirely, the
// fallbacks are a pre-seeded storageState file or a remote browser service.
const CAPTURE_SCRIPT = `
import { chromium } from "playwright";
import fs from "node:fs";

const outDir = "/workspace/captures";
const statePath = outDir + "/state.json";
// Params come via a JSON file, not the command line — credentials with shell
// metacharacters must never touch a shell string.
const { pageId, demoUrl, email, password } = JSON.parse(
  fs.readFileSync(outDir + "/params.json", "utf8"),
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: fs.existsSync(statePath) ? statePath : undefined,
});
const page = await context.newPage();
await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });

// Redirected to the login screen? Do the two-step Docusign login.
const emailInput = page.locator('input[type="email"], input[name="email"]').first();
if (await emailInput.isVisible().catch(() => false)) {
  if (!email || !password) throw new Error("login required but DEMO_EMAIL/DEMO_PASSWORD not set");
  await emailInput.fill(email);
  await page.getByRole("button", { name: /next|continue/i }).first().click();
  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.waitFor({ timeout: 15000 });
  await pwInput.fill(password);
  await page.getByRole("button", { name: /log ?in|sign ?in|submit/i }).first().click();
  await page.waitForURL((u) => !/account|login|auth/.test(u.href), { timeout: 30000 });
  await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });
  await context.storageState({ path: statePath });
}

await page.waitForTimeout(2000);
await page.screenshot({ path: outDir + "/" + pageId + ".png", fullPage: false });

const a11y = await page.accessibility.snapshot();

// Icon extraction — first 80 chars of each button-borne SVG path, matched
// later against the repo's iconPaths.ts (see instructions).
const icons = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  return btns
    .filter((b) => b.querySelector("svg"))
    .map((btn) => ({
      label: (btn.textContent || "").replace(/New/g, "").trim(),
      pathPrefix: btn.querySelector("svg path")?.getAttribute("d")?.substring(0, 80) ?? null,
    }))
    .filter((r) => r.label && r.label.length < 40 && r.pathPrefix);
});

fs.writeFileSync(
  outDir + "/" + pageId + ".capture.json",
  JSON.stringify({ pageId, demoUrl, capturedAt: new Date().toISOString(), a11y, icons }),
);
await browser.close();
console.log("CAPTURE_OK");
`;

export default defineTool({
  description:
    "Capture a Docusign demo page in the sandbox's headless browser: screenshot to /workspace/captures/<pageId>.png plus an accessibility snapshot and extracted icon SVG path prefixes. Logs into the demo account automatically when redirected to login.",
  inputSchema: z.object({
    pageId: z.string().describe("Page id from specs/pages.json"),
    demoUrl: z.string().url(),
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
        email: process.env.DEMO_EMAIL ?? "",
        password: process.env.DEMO_PASSWORD ?? "",
      }),
    });
    const result = (await sandbox.run({
      command: "cd /workspace/toolbox && node capture.mjs",
    })) as { exitCode?: number; stdout?: string; stderr?: string };

    if (!(result.stdout ?? "").includes("CAPTURE_OK")) {
      return {
        ok: false,
        pageId: input.pageId,
        error: `capture failed: ${(result.stderr ?? result.stdout ?? "").slice(0, 2000)}`,
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
