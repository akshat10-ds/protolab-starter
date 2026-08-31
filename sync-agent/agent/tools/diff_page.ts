import { defineTool } from "eve/tools";
import { z } from "zod";
import { REPO_PATH } from "./setup_workspace.js";
import { compareSkeletons, looksLikeModalCapture, splitSkeleton } from "../lib/skeleton.js";

// The gate is a STRUCTURAL fingerprint ("skeleton") computed from the capture's
// accessibility snapshot — deterministic, zero model tokens, immune to pixel
// noise and to live data churn (see skeleton.ts). Pixels are compared only to
// flag visual drift on structurally-identical pages, which is a design-system
// concern, never a page PR.

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

    let capture: { aria?: string; modalStillOpen?: boolean };
    try {
      capture = JSON.parse(String(await sandbox.readTextFile({ path: capturePath })));
    } catch {
      return { status: "error", pageId: input.pageId, error: `no capture found at ${capturePath} — run capture_page first` };
    }

    // A modal-dominated capture describes the popup, not the page. Diffing it
    // would produce a garbage "everything changed" result.
    if (looksLikeModalCapture(capture.aria ?? "")) {
      return {
        status: "error",
        pageId: input.pageId,
        error:
          "capture looks modal-dominated (an overlay hid the page from the accessibility tree). Do not treat this as a change; re-capture or report the page as needs-human.",
      };
    }

    // The page gate is CONTENT only. Global chrome (top bar, sidebar, footer)
    // is identical on every page, so folding it in would make one nav change
    // trip all ~16 pages and produce 16 near-identical PRs. It gets its own
    // shared baseline instead.
    const { shell: freshShell, content: fresh } = splitSkeleton(capture.aria ?? "");
    await sandbox.writeTextFile({
      path: `/workspace/captures/${input.pageId}.skeleton.json`,
      content: JSON.stringify(fresh, null, 2),
    });
    await sandbox.writeTextFile({
      path: `/workspace/captures/${input.pageId}.shell.json`,
      content: JSON.stringify(freshShell, null, 2),
    });

    const baselineShell: string[] | null = await Promise.resolve(
      sandbox.readTextFile({ path: `${baselineDir}/_shell.skeleton.json` }),
    )
      .then((t: unknown) => JSON.parse(String(t)) as string[])
      .catch(() => null);
    const shellDelta = baselineShell
      ? compareSkeletons(freshShell, baselineShell)
      : { changed: false, added: [], removed: [] };

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
      return {
        status: "no-baseline",
        pageId: input.pageId,
        skeletonSize: fresh.length,
        shellSize: freshShell.length,
        baselineSpec,
      };
    }

    const {
      changed: structuralChanged,
      added,
      removed,
    } = compareSkeletons(fresh, baselineSkeleton);

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
      // Chrome moved. Report it ONCE for the whole run — never as a per-page
      // change — and update _shell.skeleton.json in a single dedicated PR.
      shellChanged: shellDelta.changed,
      shellAdded: shellDelta.added,
      shellRemoved: shellDelta.removed,
      baselineSpec: structuralChanged ? baselineSpec : undefined,
    };
  },
});
