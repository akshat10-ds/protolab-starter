// The Playwright capture routine, kept as a string so it can be written into
// the Vercel Sandbox at runtime AND run locally against a real demo page
// (see test/live-capture.mjs). One source of truth: what we validate locally is
// exactly what runs in production.
//
// Contract:
//   - reads params from `${CAPTURE_DIR}/params.json`
//     ({ pageId, demoUrl, email?, password? })
//   - reuses `${CAPTURE_DIR}/state.json` (Playwright storageState) when present,
//     so a session established once — by an automated login in production, or
//     by a human logging in during local testing — is reused for every page
//   - only attempts an automated login when it actually lands on a login screen
//     AND credentials were supplied
//   - dismisses promo/onboarding modals BEFORE snapshotting (an open dialog
//     hides the rest of the page from the accessibility tree, which would make
//     the fingerprint describe the popup instead of the page)
//   - then runs optional declarative `steps` to reach surfaces that aren't
//     URL-addressable (row-click detail overlays, tabs within them). Steps are
//     a fixed vocabulary, never arbitrary JS:
//       { type: "click", role, name }      role+accessible-name (name is a regex)
//       { type: "click", selector }        CSS selector
//       { type: "clickRow", index }        nth data row, header row skipped
//       { type: "press", key }             keyboard key
//       { type: "wait", ms }               settle
//   - writes `<pageId>.png` and `<pageId>.capture.json` into CAPTURE_DIR
//   - prints CAPTURE_OK on success
//
// NOTE: uses `locator.ariaSnapshot()`. `page.accessibility.snapshot()` was
// REMOVED from Playwright — do not reintroduce it.
export const CAPTURE_SCRIPT = `
import { chromium } from "playwright";
import fs from "node:fs";

const outDir = process.env.CAPTURE_DIR || "/workspace/captures";
const statePath = outDir + "/state.json";
const { pageId, demoUrl, email, password, steps = [] } = JSON.parse(
  fs.readFileSync(outDir + "/params.json", "utf8"),
);
const headless = process.env.CAPTURE_HEADLESS !== "false";

// Session recording: video plus a Playwright trace (DOM snapshots, screenshots,
// every action). Off by default so routine monthly runs don't pay for it; set
// CAPTURE_RECORD=1 to debug a page that is failing or fingerprinting oddly.
// View a trace with: npx playwright show-trace <file>.trace.zip
const record = process.env.CAPTURE_RECORD === "1";

const browser = await chromium.launch({ headless });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: fs.existsSync(statePath) ? statePath : undefined,
  ...(record ? { recordVideo: { dir: outDir + "/video" } } : {}),
});
if (record) {
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
}
const page = await context.newPage();
await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });

const onLoginScreen = async () =>
  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .isVisible()
    .catch(() => false);

if (await onLoginScreen()) {
  if (!email || !password) {
    console.error(
      "LOGIN_REQUIRED: landed on a login screen with no stored session and no credentials.",
    );
    await browser.close();
    process.exit(2);
  }
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.getByRole("button", { name: /next|continue/i }).first().click();
  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.waitFor({ timeout: 15000 });
  await pwInput.fill(password);
  await page.getByRole("button", { name: /log ?in|sign ?in|submit/i }).first().click();
  await page.waitForURL((u) => !/account|login|auth/.test(u.href), { timeout: 30000 });
  await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });
  await context.storageState({ path: statePath });
}

await page.waitForTimeout(2500);

// Promo and onboarding modals are the single biggest source of junk captures:
// an open modal hides the whole page from the accessibility tree.
//
// Two traps learned from the live demo site: several promos can be STACKED, and
// the app keeps a permanently-present aria-modal "Quick Access Palette" element
// that has no dismiss control. Naively closing "the first dialog" burns every
// attempt on the palette and never reaches the real promos.
const PERSISTENT_DIALOG = /quick access palette/i;
const DISMISS_LABEL = /close|dismiss|not now|skip|maybe later|got it|no thanks|later/i;

const labelOf = async (d) =>
  (
    (await d.getAttribute("aria-label").catch(() => null)) ||
    (await d.locator("h1, h2, h3").first().textContent().catch(() => null)) ||
    "unnamed dialog"
  )
    .trim()
    .slice(0, 80);

const openOverlays = async () => {
  const found = [];
  for (const d of await page.locator('[role="dialog"], [role="alertdialog"]').all()) {
    if (!(await d.isVisible().catch(() => false))) continue;
    const label = await labelOf(d);
    if (PERSISTENT_DIALOG.test(label)) continue;
    found.push({ handle: d, label });
  }
  return found;
};

const dismissed = [];
for (let attempt = 0; attempt < 6; attempt++) {
  const overlays = await openOverlays();
  if (overlays.length === 0) break;
  const { handle, label } = overlays[0];
  const closer = handle.getByRole("button", { name: DISMISS_LABEL }).first();
  if (await closer.isVisible().catch(() => false)) {
    await closer.click({ timeout: 5000 }).catch(() => {});
  } else {
    await page.keyboard.press("Escape").catch(() => {});
  }
  dismissed.push(label);
  // The DOM shifts after each dismissal, so re-query rather than reusing handles.
  await page.waitForTimeout(1200);
}

const modalStillOpen = (await openOverlays()).length > 0;

// Navigation steps run AFTER modal dismissal — an open dialog swallows clicks.
const stepLog = [];
for (const [i, step] of steps.entries()) {
  const label = step.type + (step.name || step.selector || step.key || "");
  try {
    if (step.type === "wait") {
      await page.waitForTimeout(step.ms ?? 1000);
    } else if (step.type === "press") {
      await page.keyboard.press(step.key);
      await page.waitForTimeout(step.settleMs ?? 1500);
    } else if (step.type === "clickRow") {
      // nth(0) is the header row, so data rows start at 1.
      await page
        .getByRole("row")
        .nth((step.index ?? 0) + 1)
        .click({ timeout: 15000 });
      await page.waitForTimeout(step.settleMs ?? 2500);
    } else if (step.type === "click") {
      const target = step.selector
        ? page.locator(step.selector).first()
        : page
            .getByRole(step.role || "button", { name: new RegExp(step.name, "i") })
            .first();
      await target.click({ timeout: 15000 });
      await page.waitForTimeout(step.settleMs ?? 2000);
    } else {
      throw new Error("unknown step type: " + step.type);
    }
    stepLog.push({ step: i, label, ok: true });
  } catch (err) {
    stepLog.push({ step: i, label, ok: false, error: String(err).slice(0, 200) });
    console.error("STEP_FAILED: " + label);
    break;
  }
}

// Wait for real data to render. Without this we fingerprint a loading state —
// observed on the live site as untranslated i18n keys in column headers
// ("DataTable.Checkbox.HeaderLabelSelectAll"), which would flip the diff gate
// to "changed" every single month for no reason.
await page
  .waitForFunction(() => document.querySelectorAll('[role="row"]').length > 1, {
    timeout: 20000,
  })
  .catch(() => {});
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(1500);

const loadingArtifacts = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="columnheader"]'))
    .map((h) => (h.textContent || "").trim())
    .filter((t) => /^[A-Za-z]+\\.[A-Za-z]+\\./.test(t)),
);

await page.screenshot({ path: outDir + "/" + pageId + ".png", fullPage: false });

const aria = await page.locator("body").ariaSnapshot();

// Significant imagery — empty-state illustrations, hero art, spot graphics.
// These are INVISIBLE to the accessibility tree (decorative images carry
// alt="" or aria-hidden), so a skeleton can never reveal them. Observed live:
// the PowerForms empty state ships a large illustration that produced zero
// aria nodes. Capture them explicitly or the agent rebuilds the page without
// its art.
const illustrations = await page.evaluate(() => {
  const MIN = 96;
  const inMain = (el) => !!el.closest("main") || !el.closest("header, footer, nav");
  const out = [];
  for (const img of Array.from(document.querySelectorAll("img"))) {
    const r = img.getBoundingClientRect();
    if (r.width < MIN || r.height < MIN || !inMain(img)) continue;
    out.push({ kind: "img", src: img.currentSrc || img.src, alt: img.alt || "",
      width: Math.round(r.width), height: Math.round(r.height) });
  }
  for (const svg of Array.from(document.querySelectorAll("svg"))) {
    const r = svg.getBoundingClientRect();
    if (r.width < MIN || r.height < MIN || !inMain(svg)) continue;
    if (svg.closest("button, a")) continue; // an icon inside a control, not art
    out.push({ kind: "svg", markup: svg.outerHTML,
      width: Math.round(r.width), height: Math.round(r.height) });
  }
  for (const el of Array.from(document.querySelectorAll("div, section, span"))) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = /url\(["']?(.*?)["']?\)/.exec(bg || "");
    const r = el.getBoundingClientRect();
    if (!m || r.width < MIN || r.height < MIN || !inMain(el)) continue;
    out.push({ kind: "background", src: new URL(m[1], location.href).href,
      width: Math.round(r.width), height: Math.round(r.height) });
  }
  return out;
});

// Save them next to the capture so a build can use the real asset.
const assetDir = outDir + "/assets";
fs.mkdirSync(assetDir, { recursive: true });
for (const [n, art] of illustrations.entries()) {
  const base = pageId + "-" + n;
  try {
    if (art.kind === "svg") {
      art.file = base + ".svg";
      fs.writeFileSync(assetDir + "/" + art.file, art.markup);
      delete art.markup;
    } else {
      const res = await page.request.get(art.src);
      if (!res.ok()) continue;
      const type = res.headers()["content-type"] || "";
      const ext = type.includes("svg") ? "svg" : type.includes("png") ? "png"
        : type.includes("webp") ? "webp" : type.includes("jpeg") ? "jpg" : "bin";
      art.file = base + "." + ext;
      fs.writeFileSync(assetDir + "/" + art.file, await res.body());
    }
  } catch { /* a missing asset must never fail the capture */ }
}

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
  JSON.stringify({
    pageId,
    demoUrl,
    finalUrl: page.url(),
    capturedAt: new Date().toISOString(),
    aria,
    icons,
    illustrations,
    dismissedDialogs: dismissed,
    modalStillOpen,
    steps: stepLog,
    loadingArtifacts,
  }),
);

if (record) {
  await context.tracing.stop({ path: outDir + "/" + pageId + ".trace.zip" });
}
await context.close();
await browser.close();
console.log("CAPTURE_OK");
`;
