// Local tier-1 harness, step 1 of 2: establish a demo session by hand.
//
// Opens a VISIBLE browser. You log in yourself — no password is typed by the
// agent, stored in env, or written to the repo. When you're through to the app,
// press Enter here and the session cookies are saved to .auth/state.json
// (gitignored) for test/live-capture.mjs to reuse.
//
//   node test/login.mjs
//
// This also produces exactly the artifact the production fallback needs if
// headless login turns out to be blocked: a pre-seeded storageState file.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const AUTH_DIR = path.resolve(import.meta.dirname, "../.auth");
const STATE_PATH = path.join(AUTH_DIR, "state.json");
const START_URL = process.argv[2] ?? "https://apps-d.docusign.com/send/navigator";

fs.mkdirSync(AUTH_DIR, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

console.log(`\nOpening ${START_URL}`);
console.log("Log in in the browser window, then come back here and press Enter.\n");
await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 120000 });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await new Promise((resolve) => rl.question("Press Enter once you are logged in… ", resolve));
rl.close();

await context.storageState({ path: STATE_PATH });
const cookies = (await context.cookies()).length;
console.log(`\nSaved session to ${STATE_PATH} (${cookies} cookies)`);
console.log(`Landed on: ${page.url()}`);
await browser.close();
