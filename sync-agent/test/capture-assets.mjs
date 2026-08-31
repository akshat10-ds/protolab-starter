// Pull the real illustrations off a production page.
//
//   node test/login.mjs                     # session (expires in ~2-3h)
//   node test/capture-assets.mjs powerforms # by manifest page id
//
// Saves every significant image/SVG in the page's content area to
// .captures/assets/ and prints what it found, so the asset can be copied into
// src/assets/ and used by a view instead of an invented stand-in.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CAPTURE_SCRIPT } from "../agent/lib/capture-script.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, ".captures");
const pageId = process.argv[2];
if (!pageId) {
  console.error("usage: node test/capture-assets.mjs <pageId>");
  process.exit(1);
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "../specs/pages.json"), "utf8"),
);
const page = manifest.pages.find((p) => p.id === pageId);
if (!page || !page.demoUrl || String(page.demoUrl).startsWith("TODO")) {
  console.error(`no usable demoUrl for "${pageId}" in specs/pages.json`);
  process.exit(1);
}

fs.mkdirSync(DIR, { recursive: true });
const auth = path.join(ROOT, ".auth/state.json");
if (!fs.existsSync(auth)) {
  console.error("No session. Run `node test/login.mjs` first.");
  process.exit(1);
}
fs.copyFileSync(auth, path.join(DIR, "state.json"));
fs.writeFileSync(path.join(DIR, "capture.mjs"), CAPTURE_SCRIPT);
fs.writeFileSync(
  path.join(DIR, "params.json"),
  JSON.stringify({ pageId, demoUrl: page.demoUrl, steps: page.captureSteps ?? [], email: "", password: "" }),
);

try {
  execFileSync("node", [path.join(DIR, "capture.mjs")], {
    env: { ...process.env, CAPTURE_DIR: DIR },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 180000,
  });
} catch (err) {
  const e = String(err.stderr ?? "");
  console.error(e.includes("LOGIN_REQUIRED") ? "Session expired — re-run test/login.mjs" : e.slice(0, 500));
  process.exit(1);
}

const c = JSON.parse(fs.readFileSync(path.join(DIR, `${pageId}.capture.json`), "utf8"));
const art = c.illustrations ?? [];
console.log(`${pageId}: ${art.length} illustration(s)\n`);
for (const a of art) {
  const where = a.file ? path.join(DIR, "assets", a.file) : "(not saved)";
  console.log(`  ${a.kind}  ${a.width}x${a.height}  ${where}`);
  if (a.src) console.log(`      src: ${a.src}`);
  if (a.alt) console.log(`      alt: ${a.alt}`);
}
if (art.length) console.log(`\nCopy the one you want into src/assets/ and import it in the view.`);
