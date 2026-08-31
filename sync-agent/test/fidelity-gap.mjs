// Prototype ↔ production fidelity gap.
//
// The skeleton is roles + accessible names, so it is renderer-independent: the
// SAME fingerprint works on the live Docusign demo and on the local prototype.
// That means we can measure the gap directly today, instead of waiting a month
// for a change event to show up against a baseline.
//
//   node test/login.mjs           # once, for the production session
//   npm run dev                   # prototype on :5173
//   node test/fidelity-gap.mjs
//
// Output is exactly what the sync agent would act on: what production has that
// the prototype is missing, and what the prototype has that production doesn't.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CAPTURE_SCRIPT } from "../agent/lib/capture-script.ts";
import { compareSkeletons, matchPurpose, splitSkeleton } from "../agent/lib/skeleton.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, ".captures");
const PROTOTYPE = process.env.PROTOTYPE_URL ?? "http://localhost:5173";

// pageId ↔ where it lives in production ↔ how to reach it in the prototype.
const PAIRS = [
  {
    pageId: "completed",
    production: "https://apps-d.docusign.com/send/navigator",
    prototype: PROTOTYPE, // the prototype lands on Completed by default
    prototypeSteps: [],
  },
];

fs.mkdirSync(DIR, { recursive: true });
if (fs.existsSync(path.join(ROOT, ".auth/state.json"))) {
  fs.copyFileSync(path.join(ROOT, ".auth/state.json"), path.join(DIR, "state.json"));
}
const scriptPath = path.join(DIR, "capture.mjs");
fs.writeFileSync(scriptPath, CAPTURE_SCRIPT);

function capture(label, url, steps = [], useAuth = true) {
  // The prototype needs no session; hide state.json so a stale cookie jar can't
  // confuse a localhost capture.
  const statePath = path.join(DIR, "state.json");
  const hidden = path.join(DIR, "state.json.off");
  if (!useAuth && fs.existsSync(statePath)) fs.renameSync(statePath, hidden);
  try {
    fs.writeFileSync(
      path.join(DIR, "params.json"),
      JSON.stringify({ pageId: label, demoUrl: url, steps, email: "", password: "" }),
    );
    execFileSync("node", [scriptPath], {
      cwd: ROOT,
      env: { ...process.env, CAPTURE_DIR: DIR },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 180000,
    });
  } finally {
    if (!useAuth && fs.existsSync(hidden)) fs.renameSync(hidden, statePath);
  }
  return JSON.parse(fs.readFileSync(path.join(DIR, `${label}.capture.json`), "utf8"));
}

for (const pair of PAIRS) {
  console.log(`\n${"=".repeat(74)}\n${pair.pageId}\n${"=".repeat(74)}`);

  const prod = capture(`${pair.pageId}__prod`, pair.production);
  const proto = capture(`${pair.pageId}__proto`, pair.prototype, pair.prototypeSteps, false);

  const p = splitSkeleton(prod.aria);
  const q = splitSkeleton(proto.aria);

  console.log(`production: ${p.content.length} content / ${p.shell.length} shell`);
  console.log(`prototype:  ${q.content.length} content / ${q.shell.length} shell`);

  const m = matchPurpose(p.content, q.content);

  console.log(`\nCOVERED — same purpose, present in both (${m.matched.length})`);
  for (const x of m.matched) {
    const same = x.production === x.prototype;
    console.log(same ? `  ${x.production}` : `  ${x.production}   ->   ${x.prototype}`);
  }

  console.log(`\nLIKELY COVERED — same slot, different wording; human judgement (${m.likely.length})`);
  for (const x of m.likely) console.log(`  ${x.production}   ~   ${x.prototype}`);

  console.log(`\nMISSING — production has this, the prototype has no counterpart (${m.missing.length})`);
  console.log(m.missing.length ? m.missing.map((x) => "  " + x).join("\n") : "  (none)");

  console.log(`\nPROTOTYPE-ONLY — usually deliberate design work. Reported, never removed (${m.extra.length})`);
  console.log(m.extra.length ? m.extra.map((x) => "  " + x).join("\n") : "  (none)");

  const covered = m.matched.length + m.likely.length;
  console.log(
    `\npurpose coverage: ${covered}/${p.content.length} of production's affordances accounted for ` +
      `(${m.matched.length} confident, ${m.likely.length} to confirm)`,
  );
}
