/** Exact Figma System component exports. See provenance.json for node IDs and SHA-256. */
const urls = import.meta.glob<string>('./*.svg', { eager: true, query: '?url&no-inline', import: 'default' });
export interface SystemIconAsset { url: string; size: 20 | 24; }
export function getSystemIconAsset(name: string, small: boolean): SystemIconAsset | undefined {
  const url = urls[`./${name}.${small ? 'small' : 'medium'}.svg`];
  return url ? { url, size: small ? 20 : 24 } : undefined;
}
