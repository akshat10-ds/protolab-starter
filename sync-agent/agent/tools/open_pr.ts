import { defineTool } from "eve/tools";
import { getToken } from "@vercel/connect";
import { z } from "zod";
import { CONNECT_ID, DEFAULT_BRANCH, REPO, REPO_PATH } from "./setup_workspace.js";

// Commits the sandbox working-copy changes and opens (or updates) the PR for
// one page — entirely from the app runtime via the GitHub API, so the GitHub
// token never enters the sandbox. The sandbox is only read: `git status` for
// the change list, file contents for blobs. Afterwards the working copy is
// reset so the next page starts clean from main.

async function gh(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GitHub ${init?.method ?? "GET"} ${path} → ${res.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }
  return body as Record<string, any>;
}

const BINARY_EXT = /\.(png|jpg|jpeg|gif|webp|woff2?|ttf|ico)$/i;

export default defineTool({
  description:
    "Commit the current sandbox working-copy changes to a sync/<pageId>-<YYYY-MM> branch via the GitHub API and open a pull request against main (updating the existing open PR for that branch if one exists). Requests review from the given reviewers. Resets the sandbox working copy afterwards. Call once per changed page, after the build passes.",
  inputSchema: z.object({
    pageId: z.string(),
    title: z.string().describe("PR title, e.g. 'sync(requests): production added a Status column'"),
    body: z
      .string()
      .describe("PR body: what changed on the demo site, the spec diff, reviewer checklist"),
    reviewers: z.array(z.string()).describe("GitHub handles from the page's manifest entry"),
  }),
  // Runs unattended: the PR itself is the human gate (CODEOWNERS blocks any
  // merge without review). To pause the agent for a yes before each PR is
  // filed, add `approval: always()` from "eve/tools/approval".
  async execute(input, ctx) {
    const sandbox = await ctx.getSandbox();
    const token = await getToken(CONNECT_ID, { subject: { type: "app" } });

    // 1. What changed in the working copy?
    const status = (await sandbox.run({
      command: `git -C ${REPO_PATH} status --porcelain`,
    })) as { stdout?: string };
    const entries = (status.stdout ?? "")
      .split("\n")
      .map((l) => l.trimEnd())
      .filter(Boolean)
      .map((l) => ({ flag: l.slice(0, 2).trim(), path: l.slice(3).trim() }));
    if (entries.length === 0) {
      return { ok: false, error: "working copy is clean — nothing to commit" };
    }

    // 2. Base commit on main.
    const baseRef = await gh(token, `/repos/${REPO}/git/ref/heads/${DEFAULT_BRANCH}`);
    const baseSha: string = baseRef.object.sha;
    const baseCommit = await gh(token, `/repos/${REPO}/git/commits/${baseSha}`);

    // 3. Blobs for every added/modified file; deletions get sha:null.
    const tree: Array<Record<string, unknown>> = [];
    for (const entry of entries) {
      if (entry.flag.includes("D")) {
        tree.push({ path: entry.path, mode: "100644", type: "blob", sha: null });
        continue;
      }
      const abs = `${REPO_PATH}/${entry.path}`;
      let content: string;
      let encoding: "utf-8" | "base64";
      if (BINARY_EXT.test(entry.path)) {
        const b64 = (await sandbox.run({ command: `base64 -w0 ${abs}` })) as { stdout?: string };
        content = (b64.stdout ?? "").trim();
        encoding = "base64";
      } else {
        content = String(await sandbox.readTextFile({ path: abs }));
        encoding = "utf-8";
      }
      const blob = await gh(token, `/repos/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding }),
      });
      tree.push({ path: entry.path, mode: "100644", type: "blob", sha: blob.sha });
    }

    // 4. Tree + commit.
    const newTree = await gh(token, `/repos/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
    });
    const commit = await gh(token, `/repos/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `${input.title}\n\nAutomated sync run. Page: ${input.pageId}.`,
        tree: newTree.sha,
        parents: [baseSha],
      }),
    });

    // 5. Branch: create, or force-move if a previous run left one behind.
    const month = new Date().toISOString().slice(0, 7);
    const branch = `sync/${input.pageId}-${month}`;
    try {
      await gh(token, `/repos/${REPO}/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
      });
    } catch {
      await gh(token, `/repos/${REPO}/git/refs/heads/${branch}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: true }),
      });
    }

    // 6. PR: reuse the open one for this branch if it exists.
    const owner = REPO.split("/")[0];
    const existing = (await gh(
      token,
      `/repos/${REPO}/pulls?head=${owner}:${branch}&state=open`,
    )) as unknown as Array<Record<string, any>>;
    let pr: Record<string, any>;
    if (existing.length > 0) {
      pr = await gh(token, `/repos/${REPO}/pulls/${existing[0].number}`, {
        method: "PATCH",
        body: JSON.stringify({ title: input.title, body: input.body }),
      });
    } else {
      pr = await gh(token, `/repos/${REPO}/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          head: branch,
          base: DEFAULT_BRANCH,
        }),
      });
    }

    // 7. Reviewers from the manifest — non-fatal if a handle can't be requested.
    let reviewerWarning: string | undefined;
    if (input.reviewers.length > 0) {
      try {
        await gh(token, `/repos/${REPO}/pulls/${pr.number}/requested_reviewers`, {
          method: "POST",
          body: JSON.stringify({ reviewers: input.reviewers }),
        });
      } catch (err) {
        reviewerWarning = `could not request reviewers: ${(err as Error).message}`;
      }
    }

    // 8. Clean slate for the next page.
    await sandbox.run({
      command: `git -C ${REPO_PATH} reset --hard && git -C ${REPO_PATH} clean -fd`,
    });

    return {
      ok: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch,
      files: entries.map((e) => e.path),
      reviewerWarning,
    };
  },
});
