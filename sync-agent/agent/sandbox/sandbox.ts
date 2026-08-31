import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";

// The sandbox is where everything untrusted runs: the headless browser, the
// cloned protolab-starter working copy, edits, and build verification. Per
// eve's security model no secrets live here — the GitHub token never enters
// the sandbox (open_pr commits via the GitHub API from the app runtime).
//
// RISK (validate on first run): Playwright + Chromium inside Vercel Sandbox is
// undocumented. Sandboxes are Firecracker microVMs with root access, so
// `playwright install --with-deps` is expected to work, but if it doesn't the
// fallbacks are (a) a custom OCI image with Chromium baked in (documented
// path, via Vercel Container Registry) or (b) a remote browser service.
export default defineSandbox({
  backend: vercel({ resources: { vcpus: 4 } }),
  // Bump to invalidate the cached template after changing bootstrap.
  revalidationKey: () => "protolab-sync-v1",
  async bootstrap({ use }) {
    const sandbox = await use();
    await sandbox.run({
      command:
        "mkdir -p /workspace/toolbox /workspace/captures && cd /workspace/toolbox && npm init -y >/dev/null && npm install playwright pixelmatch pngjs && npx playwright install --with-deps chromium",
    });
  },
});
