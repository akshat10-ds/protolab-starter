// Local end-to-end dry run of the DETERMINISTIC half of the sync loop:
// capture → fingerprint → baseline → re-capture → diff. No model, no Vercel,
// no repo writes. This is the surface to iterate on, because the diff output is
// exactly what the agent acts on when it decides whether to touch a page.
//
//   node test/login.mjs      # once
//   node test/dry-run.mjs
//
// It answers three questions:
//   1. STABILITY — capture the same page twice, minutes apart. If the skeletons
//      differ, the agent would open phantom PRs every month. Any unstable nodes
//      are printed so they can be excluded from the fingerprint.
//   2. UNCHANGED — does a second capture diffed against the seeded baseline
//      correctly report no change?
//   3. CHANGED — when production really does change, what does the agent
//      receive? Simulated by mutating the captured aria tree.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CAPTURE_SCRIPT } from "../agent/lib/capture-script.ts";
import {
  compareSkeletons,
  looksLikeModalCapture,
  splitSkeleton,
} from "../agent/lib/skeleton.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, ".captures");
const AUTH = path.join(ROOT, ".auth/state.json");

const PAGES = [
  { pageId: "completed", demoUrl: "https://apps-d.docusign.com/send/navigator" },
  {
    pageId: "powerforms",
    demoUrl: "https://apps-d.docusign.com/send/documents?view=powerforms",
  },
];

if (!fs.existsSync(AUTH)) {
  console.error("No session. Run `node test/login.mjs` first.");
  process.exit(1);
}
fs.mkdirSync(DIR, { recursive: true });
fs.copyFileSync(AUTH, path.join(DIR, "state.json"));
const scriptPath = path.join(DIR, "capture.mjs");
fs.writeFileSync(scriptPath, CAPTURE_SCRIPT);

function capture(page, label) {
  fs.writeFileSync(
    path.join(DIR, "params.json"),
    JSON.stringify({ steps: [], ...page, pageId: label, email: "", password: "" }),
  );
  execFileSync("node", [scriptPath], {
    cwd: ROOT,
    env: { ...process.env, CAPTURE_DIR: DIR },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 180000,
  });
  return JSON.parse(fs.readFileSync(path.join(DIR, `${label}.capture.json`), "utf8"));
}

const report = [];
const shells = [];

for (const page of PAGES) {
  console.log(`\n${"=".repeat(72)}\n${page.pageId}\n${"=".repeat(72)}`);

  const a = capture(page, `${page.pageId}__a`);
  const b = capture(page, `${page.pageId}__b`);

  if (looksLikeModalCapture(a.aria) || looksLikeModalCapture(b.aria)) {
    console.log("ABORT: modal-dominated capture — the agent would refuse to diff this.");
    continue;
  }

  const { shell: shellA, content: skelA } = splitSkeleton(a.aria);
  const { shell: shellB, content: skelB } = splitSkeleton(b.aria);
  shells.push({ pageId: page.pageId, shell: shellA });

  // 1. STABILITY
  const stability = compareSkeletons(skelB, skelA);
  console.log(`\n[1] stability — two captures of the same page`);
  console.log(`    nodes: ${skelA.length} then ${skelB.length}`);
  if (!stability.changed) {
    console.log(`    STABLE — identical fingerprints. No phantom PRs.`);
  } else {
    console.log(`    UNSTABLE — these nodes differ between identical captures:`);
    stability.added.forEach((x) => console.log(`      + ${x}`));
    stability.removed.forEach((x) => console.log(`      - ${x}`));
    console.log(`    ^ these must be excluded from the fingerprint.`);
  }

  // 2. UNCHANGED against a seeded baseline
  const unchanged = compareSkeletons(skelB, skelA);
  console.log(`\n[2] diff vs seeded baseline`);
  console.log(`    verdict: ${unchanged.changed ? "changed" : "unchanged"} (want: unchanged)`);

  // 3. CHANGED — simulate production shipping something new. Page-agnostic:
  // a new action after the page's first heading (works on any page), plus a new
  // column where a table exists.
  const mutated = a.aria
    .replace(
      /(\n(\s*)- heading "[^"]*"[^\n]*)/,
      `$1\n$2- button "Bulk Export"`,
    )
    .replace(
      /(\n(\s*)- columnheader "Show or Hide Fields")/,
      `\n$2- button "Risk Column options for Risk Width — Risk":\n$2  - text: Risk$1`,
    );
  const { content: skelMutated } = splitSkeleton(mutated);
  const changed = compareSkeletons(skelMutated, skelA);
  console.log(`\n[3] simulated production change`);
  console.log(`    verdict: ${changed.changed ? "changed" : "unchanged"} (want: changed)`);
  console.log(`    what the agent receives:`);
  console.log(
    JSON.stringify(
      { status: "changed", pageId: page.pageId, added: changed.added, removed: changed.removed },
      null,
      2,
    )
      .split("\n")
      .map((l) => "      " + l)
      .join("\n"),
  );

  report.push({
    pageId: page.pageId,
    stable: !stability.changed,
    content: skelA.length,
    shell: shellA.length,
    headers: skelA.filter((s) => s.startsWith("columnheader:")).length,
    detectsChange: changed.changed,
  });
}

console.log(`\n${"=".repeat(72)}\nSUMMARY\n${"=".repeat(72)}`);
console.table(report);

// The shell must be identical across every page, otherwise splitting it out
// would itself become a source of phantom diffs.
if (shells.length > 1) {
  const base = shells[0];
  const drift = shells.slice(1).filter(
    (s) => compareSkeletons(s.shell, base.shell).changed,
  );
  console.log(
    drift.length === 0
      ? `\nshell consistent across all ${shells.length} pages (${base.shell.length} nodes) — tracked once, not per page.`
      : `\nSHELL DRIFT between pages: ${drift.map((d) => d.pageId).join(", ")}`,
  );
}
