/** Preserved local extensions. Copied unchanged from iconPaths.ts; not Figma System claims. */
export interface LegacyIconPath { path: string; viewBox?: string; }
export const legacyIconFallbacks: Record<string, LegacyIconPath> = {
'sliders-horizontal': {
    path: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
  },
'ai-iris-filled': {
    // Filled version of AI Iris icon (code-only; Figma has no filled iris)
    path: 'M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z',
  },
'arrow-nested-small': {
    path: 'M13.27 8.93L8.85 4.5L7.5 5.85L10.16 8.5H5.5C4.95 8.5 4.5 8.05 4.5 7.5V1.5H2.5V7.5C2.5 9.16 3.84 10.5 5.5 10.5H10.16L7.5 13.15L8.85 14.5L13.27 10.07C13.43 9.91 13.5 9.7 13.5 9.5C13.5 9.3 13.43 9.09 13.27 8.93Z',
    viewBox: '0 0 16 16',
  },
'boolean': {
    path: 'M17 3H7C4.79 3 3 4.79 3 7s1.79 4 4 4h10c2.21 0 4-1.79 4-4s-1.79-4-4-4M4.8 7c0-1.21.99-2.2 2.2-2.2s2.2.99 2.2 2.2S8.21 9.2 7 9.2 4.8 8.21 4.8 7M17 9h-6.55c.34-.59.55-1.27.55-2s-.21-1.41-.55-2H17c1.1 0 2 .9 2 2s-.9 2-2 2m0 4H7c-2.21 0-4 1.79-4 4s1.79 4 4 4h10c2.21 0 4-1.79 4-4s-1.79-4-4-4M5 17c0-1.1.9-2 2-2h6.55c-.34.59-.55 1.27-.55 2s.21 1.41.55 2H7c-1.1 0-2-.9-2-2m12 2.2c-1.21 0-2.2-.99-2.2-2.2s.99-2.2 2.2-2.2 2.2.99 2.2 2.2-.99 2.2-2.2 2.2',
  },
'line': {
    path: 'm3 19.658 16.659-16.66 1.343 1.344-16.66 16.66z',
  },
'presentation': {
    path: 'M6 6v2H4V6zm2-2H2v6h6zM6 16v2H4v-2zm2-2H2v6h6zm14-8H10v2h12zm0 10H10v2h12z',
  }
};
