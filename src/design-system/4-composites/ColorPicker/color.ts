export interface HSVColor { h: number; s: number; v: number; }
export const clampChannel = (value: number, max = 100) => Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
export function normalizeHex(value: string): string | null {
  const text = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(text)) return `#${text.split('').map(digit => digit + digit).join('').toUpperCase()}`;
  return /^[0-9a-f]{6}$/i.test(text) ? `#${text.toUpperCase()}` : null;
}
export function hexToHSV(hex: string): HSVColor {
  const color = normalizeHex(hex) ?? '#000000';
  const rgb = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255);
  const [r, g, b] = rgb;
  const max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min;
  let h = delta === 0 ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  h = ((h * 60) + 360) % 360;
  return { h, s: max === 0 ? 0 : delta / max * 100, v: max * 100 };
}
export function hsvToHex({ h, s, v }: HSVColor): string {
  const hue = ((Number.isFinite(h) ? h : 0) % 360 + 360) % 360;
  const saturation = clampChannel(s) / 100, brightness = clampChannel(v) / 100;
  const c = brightness * saturation, x = c * (1 - Math.abs((hue / 60) % 2 - 1)), m = brightness - c;
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r, g, b].map(channel => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
