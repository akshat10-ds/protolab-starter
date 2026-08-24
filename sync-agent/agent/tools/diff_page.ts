import { defineTool } from "eve/tools";
import { z } from "zod";
import { REPO_PATH } from "./setup_workspace.js";

// The gate is a STRUCTURAL fingerprint ("skeleton") computed from the capture's
// accessibility snapshot — deterministic, zero model tokens, immune to pixel
// noise and to live data churn. Pixels are compared only to flag visual drift
// on structurally-identical pages, which is a design-system concern, never a
// page PR.

// Roles that define a page's skeleton. Everything else — and everything inside
// a data row except column headers — is content, not structure.
const KEEP_ROLES = new Set([
  "heading",
  "button",
  "tab",
  "link",
  "searchbox",
  "combobox",
  "textbox",
  "checkbox",
  "switch",
  "menuitem",
  "navigation",
]);
const nodeName = (n: Record<string, unknown>) =>
  // Counts, dates, and totals are data — mask digits so "1,659 items" and
  // "1,712 items" fingerprint identically.
  String(n.name ?? "").trim().replace(/\d[\d,.]*/g, "#");

function walk(node: unknown, inRow: boolean, out: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown> & { children?: unknown[] };
  const role = String(n.role ?? "");
  const nowInRow = inRow || role === "row";
  if (role === "columnheader") {
    out.push(`columnheader:${nodeName(n)}`);
  } else if (!nowInRow && KEEP_ROLES.has(role)) {
    out.push(`${role}:${nodeName(n)}`);
  }
  for (const child of n.children ?? []) walk(child, nowInRow, out);
}

export function skeletonOf(a11y: unknown): string[] {
  const out: string[] = [];
  walk(a11y, false, out);
  return out;
}

// Only for the visual-drift signal — loose on purpose.
const VISUAL_DRIFT_THRESHOLD = 0.02;

const PIXEL_SCRIPT = `
import fs from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [, , currentPath, baselinePath] = process.argv;
const current = PNG.sync.read(fs.readFileSync(currentPath));
const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
if (current.width !== baseline.width || current.height !== baseline.height) {
  console.log(JSON.stringify({ diffRatio: 1 }));
  process.exit(0);
}
const diff = pixelmatch(
  current.data, baseline.data, null,
  current.width, current.height,
  { threshold: 0.1 },
);
console.log(JSON.stringify({ diffRatio: diff / (current.width * current.height) }));
`;

export default defineTool({
  description:
    "Compare a fresh capture against the approved baseline. The decider is a structural fingerprint from the accessibility snapshot (headings, buttons, filters, column headers — data rows and counts excluded). Returns 'unchanged' (stop working on this page), 'changed' (proceed; includes added/removed structure and the baseline spec), or 'no-baseline' (first run — treat as changed). Also writes the fresh skeleton to /workspace/captures/<pageId>.skeleton.json for the baseline update, and flags visualDrift when pixels moved but structure did not (report as a design-system concern; never a page PR).",
  inputSchema: z.object({
    pageId: z.string().describe("Page id from specs/pages.json"),
  }),
  async execute(input, ctx) {
    const sandbox = await ctx.getSandbox();
    const capturePath = `/workspace/captures/${input.pageId}.capture.json`;
    const baselineDir = `${REPO_PATH}/specs/baselines`;

    let capture: { a11y?: unknown };
    try {
      capture = JSON.parse(String(await sandbox.readTextFile({ path: capturePath })));
    } catch {
      return { status: "error", pageId: input.pageId, error: `no capture found at ${capturePath} — run capture_page first` };
    }

    const fresh = skeletonOf(capture.a11y);
    await sandbox.writeTextFile({
      path: `/workspace/captures/${input.pageId}.skeleton.json`,
      content: JSON.stringify(fresh, null, 2),
    });

    const baselineSpec = await Promise.resolve(
      sandbox.readTextFile({ path: `${baselineDir}/${input.pageId}.spec.json` }),
    )
      .then((t: unknown) => JSON.parse(String(t)))
      .catch(() => null);
    const baselineSkeleton: string[] | null = await Promise.resolve(
      sandbox.readTextFile({ path: `${baselineDir}/${input.pageId}.skeleton.json` }),
    )
      .then((t: unknown) => JSON.parse(String(t)) as string[])
      .catch(() => null);

    if (!baselineSkeleton) {
      return { status: "no-baseline", pageId: input.pageId, skeletonSize: fresh.length, baselineSpec };
    }

    const freshSet = new Set(fresh);
    const baseSet = new Set(baselineSkeleton);
    const added = fresh.filter((x) => !baseSet.has(x));
    const removed = baselineSkeleton.filter((x) => !freshSet.has(x));
    const structuralChanged =
      added.length > 0 ||
      removed.length > 0 ||
      JSON.stringify(fresh) !== JSON.stringify(baselineSkeleton);

    // Visual-drift signal only — non-fatal if the pixel tooling misbehaves.
    let visualDrift = false;
    let diffRatio: number | undefined;
    if (!structuralChanged) {
      try {
        await sandbox.writeTextFile({ path: "/workspace/toolbox/pixel.mjs", content: PIXEL_SCRIPT });
        const result = (await sandbox.run({
          command: `cd /workspace/toolbox && node pixel.mjs /workspace/captures/${input.pageId}.png ${baselineDir}/${input.pageId}.png`,
        })) as { stdout?: string };
        diffRatio = JSON.parse((result.stdout ?? "").trim()).diffRatio;
        visualDrift = (diffRatio ?? 0) > VISUAL_DRIFT_THRESHOLD;
      } catch {
        // baseline png missing or pixelmatch failed — skip the signal
      }
    }

    return {
      status: structuralChanged ? "changed" : "unchanged",
      pageId: input.pageId,
      added,
      removed,
      visualDrift,
      diffRatio,
      baselineSpec: structuralChanged ? baselineSpec : undefined,
    };
  },
});
