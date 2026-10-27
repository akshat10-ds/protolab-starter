import React from 'react';
import { AIIcon } from './AIIcon';
import type { AIIconName } from './AIIcon';
import { getSystemIconAsset } from './assets/system/systemIcons';
import { legacyIconFallbacks } from './assets/system/legacyIconFallbacks';
import styles from './Icon.module.css';

/** Existing consumers may supply dynamic icon names. Unknown names warn and render nothing. */
export type IconName = string;
export type IconSize = 'small' | 'medium' | number;
export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'color' | 'children'> {
  name: IconName;
  /** Small uses the independent 20px master; medium uses 24px. Numbers retain their exact dimensions. */
  size?: IconSize;
  /** Recolors monochrome assets, applying caller opacity once to their geometric coverage. */
  color?: string;
}
const aliases: Record<string, string> = {
  settings: 'gear', spark: 'ai-spark', 'table-border-slash': 'table-border-off',
  transaction: 'transactions', edit: 'pencil', info: 'status-info', database: 'data-server',
  'more-vertical': 'overflow-vertical', user: 'person',
};
const aiNames = new Set<AIIconName>(['ai-iris', 'ai-iris-filled', 'ai-iris-inverse', 'ai-spark', 'ai-spark-filled']);
const normalizeName = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'medium', color, fill, className, style, 'aria-label': label, 'aria-hidden': hidden, ...props }, ref) => {
    const maskId = `ink-icon-mask-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const coverageId = `${maskId}-coverage`;
    const normalizedName = normalizeName(name);
    const canonicalName = aliases[normalizedName] ?? normalizedName;
    const small = size === 'small' || (typeof size === 'number' && size <= 20);
    const pixels = typeof size === 'number' ? size : size === 'small' ? 20 : 24;
    const paint = color ?? fill ?? 'currentColor';
    const hasName = !!(label || props['aria-labelledby']);
    if (aiNames.has(canonicalName as AIIconName)) {
      return <AIIcon {...props} ref={ref} name={canonicalName as AIIconName} size={size} color={color} className={className} style={style} aria-label={label} aria-hidden={hidden} />;
    }
    const asset = getSystemIconAsset(canonicalName, small);
    const legacy = asset ? undefined : legacyIconFallbacks[name] ?? legacyIconFallbacks[normalizedName];
    if (!asset && !legacy) {
      console.warn(`Icon "${name}" not found in the System assets or preserved local extensions`);
      return null;
    }
    const bounds = asset?.size ?? 24;
    return (
      <svg {...props} ref={ref} data-ink-component="Icon" data-ink-prop-name={name} data-ink-prop-size={size}
        data-ink-icon-master={asset ? (small ? 'small' : 'medium') : 'legacy'}
        xmlns="http://www.w3.org/2000/svg" viewBox={asset ? `0 0 ${bounds} ${bounds}` : legacy?.viewBox ?? '0 0 24 24'}
        width={props.width ?? pixels} height={props.height ?? pixels} fill={paint} color={paint}
        className={[styles.icon, className].filter(Boolean).join(' ')} style={style}
        aria-label={label} aria-hidden={hidden ?? !hasName} focusable="false" role={props.role ?? (hasName ? 'img' : undefined)}>
        {asset ? <>
          <defs><filter id={coverageId} x="0" y="0" width={bounds} height={bounds} filterUnits="userSpaceOnUse">
            {/* All 574 monochrome masters have base fill-opacity=.9. Remove that paint
                opacity from mask coverage so currentColor's alpha is applied once. */}
            <feComponentTransfer><feFuncA type="linear" slope={1 / 0.9} /></feComponentTransfer>
          </filter><mask id={maskId} x="0" y="0" width={bounds} height={bounds} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
            <image href={asset.url} x="0" y="0" width={bounds} height={bounds} filter={`url(#${coverageId})`} />
          </mask></defs>
          <rect x="0" y="0" width={bounds} height={bounds} fill={paint} mask={`url(#${maskId})`} />
        </> : <path d={legacy?.path} fill={paint} />}
      </svg>
    );
  }
);
Icon.displayName = 'Icon';
