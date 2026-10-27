import { existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function findSourceShadows(root) {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) results.push(...findSourceShadows(path));
    else if (/\.(js|jsx)$/.test(path) && ['.ts', '.tsx'].some(extension => existsSync(path.replace(/\.(js|jsx)$/, extension)))) results.push(path);
  }
  return results.sort();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const shadows = findSourceShadows(resolve(process.argv[2] ?? 'src'));
  if (shadows.length) {
    console.error('JavaScript files shadow TypeScript source. Preserve and remove emitted outputs before continuing:\n' + shadows.join('\n'));
    process.exitCode = 1;
  } else console.log('Source shadow check passed.');
}
