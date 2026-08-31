import { defineTool } from "eve/tools";
import { z } from "zod";
import { getToken } from "@vercel/connect";

export const REPO = "akshat10-ds/protolab-starter";
export const REPO_PATH = "/workspace/repo";
export const DEFAULT_BRANCH = "main";
// Created with: vercel connect create github --name protolab-sync
export const CONNECT_ID = "github/protolab-sync";

function out(result: unknown): { exitCode: number; stdout: string; stderr: string } {
  const r = result as { exitCode?: number; stdout?: string; stderr?: string };
  return { exitCode: r.exitCode ?? 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

export default defineTool({
  description:
    "Clone protolab-starter into the sandbox at /workspace/repo, install its dependencies, and return the page manifest from specs/pages.json. Call exactly once at the start of a sync run, before any capture.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const sandbox = await ctx.getSandbox();

    await sandbox.run({ command: `rm -rf ${REPO_PATH}` });

    // Try an anonymous clone first; fall back to a short-lived Connect token
    // for a private repo. The token is scoped, minutes-lived, and stripped
    // from the remote immediately after the clone — the only credential that
    // ever touches the sandbox. Pushes never happen from here; open_pr
    // commits via the GitHub API from the app runtime.
    const anon = out(
      await sandbox.run({
        command: `git clone --depth 1 https://github.com/${REPO}.git ${REPO_PATH}`,
      }),
    );
    if (anon.exitCode !== 0) {
      const token = await getToken(CONNECT_ID, { subject: { type: "app" } });
      const authed = out(
        await sandbox.run({
          command: `git clone --depth 1 https://x-access-token:${token}@github.com/${REPO}.git ${REPO_PATH} && git -C ${REPO_PATH} remote set-url origin https://github.com/${REPO}.git`,
        }),
      );
      if (authed.exitCode !== 0) {
        return { ok: false, error: `clone failed: ${authed.stderr.slice(0, 2000)}` };
      }
    }

    const install = out(
      await sandbox.run({ command: `cd ${REPO_PATH} && npm ci 2>&1 | tail -5` }),
    );
    if (install.exitCode !== 0) {
      return { ok: false, error: `npm ci failed: ${install.stdout.slice(0, 2000)}` };
    }

    const head = out(
      await sandbox.run({ command: `git -C ${REPO_PATH} rev-parse HEAD` }),
    ).stdout.trim();
    const manifestText = await Promise.resolve(
      sandbox.readTextFile({ path: `${REPO_PATH}/specs/pages.json` }),
    ).catch(() => null);

    return {
      ok: true,
      repoPath: REPO_PATH,
      headSha: head,
      manifest: manifestText ? JSON.parse(String(manifestText)) : null,
      note: "Verify builds with: cd /workspace/repo && npx vite build",
    };
  },
});
