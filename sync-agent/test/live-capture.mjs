// Local tier-1 harness, step 2 of 2: capture real demo pages and report what
// the sync agent would actually see.
//
//   node test/login.mjs           # once, to establish the session
//   node test/live-capture.mjs    # capture every page below
//
// Runs the SAME capture routine that ships to the sandbox (capture-script.ts),
// then feeds the result through the SAME fingerprint the diff gate uses
// (skeleton.ts). If this prints a sane skeleton for each page, the riskiest
// unknown in the system is resolved.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CAPTURE_SCRIPT } from "../agent/lib/capture-script.ts";
import { looksLikeModalCapture, skeletonOf } from "../agent/lib/skeleton.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const CAPTURE_DIR = path.join(ROOT, ".captures");
const AUTH_STATE = path.join(ROOT, ".auth/state.json");

const PAGES = [
  { pageId: "completed", demoUrl: "https://apps-d.docusign.com/send/navigator" },
  {
    pageId: "powerforms",
    demoUrl: "https://apps-d.docusign.com/send/documents?view=powerforms",
  },
  // Proves the click path: open the first row's detail overlay, which has no
  // URL of its own. Same mechanism the deferred *-detail manifest pages need.
  {
    pageId: "agreement-detail",
    demoUrl: "https://apps-d.docusign.com/send/navigator",
    steps: [{ type: "clickRow", index: 0, settleMs: 3500 }],
  },
];

fs.mkdirSync(CAPTURE_DIR, { recursive: true });

if (!fs.existsSync(AUTH_STATE)) {
  console.error("No session found. Run `node test/login.mjs` first.");
  process.exit(1);
}
// The capture script looks for state.json alongside its output.
fs.copyFileSync(AUTH_STATE, path.join(CAPTURE_DIR, "state.json"));

const scriptPath = path.join(CAPTURE_DIR, "capture.mjs");
fs.writeFileSync(scriptPath, CAPTURE_SCRIPT);

for (const page of PAGES) {
  console.log(`\n${"=".repeat(70)}\n${page.pageId} — ${page.demoUrl}\n${"=".repeat(70)}`);
  fs.writeFileSync(
    path.join(CAPTURE_DIR, "params.json"),
    JSON.stringify({ steps: [], ...page, email: "", password: "" }),
  );

  try {
    execFileSync("node", [scriptPath], {
      cwd: ROOT,
      env: { ...process.env, CAPTURE_DIR },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 180000,
    });
  } catch (err) {
    const stderr = String(err.stderr ?? "");
    console.error(
      stderr.includes("LOGIN_REQUIRED")
        ? "FAILED: session expired or not accepted — re-run test/login.mjs"
        : `FAILED: ${stderr.slice(0, 600) || err.message}`,
    );
    continue;
  }

  const capture = JSON.parse(
    fs.readFileSync(path.join(CAPTURE_DIR, `${page.pageId}.capture.json`), "utf8"),
  );
  const skeleton = skeletonOf(capture.aria);

  if (/login|auth|account/.test(capture.finalUrl)) {
    console.log(`WARNING: redirected to ${capture.finalUrl} — session not accepted.`);
  }
  console.log(`landed on:   ${capture.finalUrl}`);
  console.log(`screenshot:  ${path.join(CAPTURE_DIR, page.pageId + ".png")}`);
  console.log(`icons found: ${capture.icons.length}`);
  console.log(`skeleton:    ${skeleton.length} structural nodes`);
  if (capture.dismissedDialogs?.length) {
    console.log(`dismissed:   ${capture.dismissedDialogs.join(" | ")}`);
  }
  if (capture.modalStillOpen) console.log("WARNING: a modal was still open at snapshot time");
  if (looksLikeModalCapture(capture.aria)) {
    console.log("WARNING: capture looks modal-dominated — fingerprint would be junk");
  }
  for (const s of capture.steps ?? []) {
    console.log(`step ${s.step}:      ${s.label} — ${s.ok ? "ok" : "FAILED: " + s.error}`);
  }

  const headers = skeleton.filter((s) => s.startsWith("columnheader:"));
  console.log(`\ncolumn headers (${headers.length}):`);
  console.log(headers.map((h) => "  " + h.replace("columnheader:", "")).join("\n") || "  (none)");
  console.log("\nfirst 30 structural nodes:");
  console.log(skeleton.slice(0, 30).map((s) => "  " + s).join("\n"));

  fs.writeFileSync(
    path.join(CAPTURE_DIR, `${page.pageId}.skeleton.json`),
    JSON.stringify(skeleton, null, 2),
  );
}

console.log(`\nArtifacts in ${CAPTURE_DIR} (gitignored).`);
