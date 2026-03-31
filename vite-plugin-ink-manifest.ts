import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import type { Plugin } from 'vite';

/**
 * Vite plugin that scans src/ for Ink Design System component usage
 * and emits an ink-manifest.json to the build output.
 *
 * The gallery at protolab-mcp.vercel.app/prototypes fetches this
 * from each deployed prototype to show component usage tags.
 */
export default function inkManifest(): Plugin {
  return {
    name: 'ink-manifest',
    generateBundle() {
      const srcDir = join(process.cwd(), 'src');
      const dsDir = join(srcDir, 'design-system');

      // Collect all .tsx files in src/ excluding design-system/
      const appFiles: string[] = [];
      function walk(dir: string) {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry);
          if (full.startsWith(dsDir)) continue;
          if (statSync(full).isDirectory()) {
            walk(full);
          } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
            appFiles.push(full);
          }
        }
      }
      walk(srcDir);

      // Scan imports from @/design-system
      const components = new Set<string>();
      const importPattern = /import\s+\{([^}]+)\}\s+from\s+['"]@\/design-system['"]/g;

      for (const file of appFiles) {
        const content = readFileSync(file, 'utf-8');
        let match;
        while ((match = importPattern.exec(content)) !== null) {
          const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
          for (const name of names) {
            if (name && /^[A-Z]/.test(name)) {
              components.add(name);
            }
          }
        }
      }

      // Build simple usage tree from App.tsx
      const tree: Record<string, string[]> = {};
      for (const file of appFiles) {
        const content = readFileSync(file, 'utf-8');
        const fileName = relative(srcDir, file).replace(/\.tsx?$/, '');
        const used: string[] = [];
        for (const comp of components) {
          if (new RegExp(`<${comp}[\\s/>]`).test(content)) {
            used.push(comp);
          }
        }
        if (used.length > 0) {
          tree[fileName] = used;
        }
      }

      const manifest = {
        builtAt: new Date().toISOString(),
        components: [...components].sort(),
        componentCount: components.size,
        tree,
      };

      this.emitFile({
        type: 'asset',
        fileName: 'ink-manifest.json',
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}
