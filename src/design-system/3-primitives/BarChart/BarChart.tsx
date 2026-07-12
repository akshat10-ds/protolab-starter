import React from 'react';

export interface BarChartXLabel {
  /** Zero-based index of the bar this label sits under */
  index: number;
  /** Label text */
  text: string;
}

export interface BarChartProps {
  /** Bar values (one per bar) */
  data: number[];
  /** Sparse x-axis labels (e.g. first / middle / last bar) */
  xLabels?: BarChartXLabel[];
  /** Caption centered under the x-axis */
  xAxisTitle?: string;
  /** Top of the y-axis. Defaults to the max value rounded up to a nice number. */
  yMax?: number;
  /** Y-axis gridline / tick values. Defaults to 5 evenly spaced ticks. */
  yTicks?: number[];
  /** Bar color — rendered as a top-to-bottom fade (1 → 0.65 opacity). */
  color?: string;
  /** Show the numeric value above each bar (default: true) */
  showValues?: boolean;
  /** Rendered SVG height in px (default: 200) */
  height?: number;
  /** Accessible label for the chart */
  'aria-label'?: string;
}

const niceMax = (v: number) => {
  if (v <= 0) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / step) * step;
};

/**
 * BarChart — a lightweight, dependency-free vertical bar chart (inline SVG).
 * Built for prototype dashboards (e.g. the Navigator "Upcoming renewals" band).
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  xLabels = [],
  xAxisTitle,
  yMax,
  yTicks,
  color = '#009EB3',
  showValues = true,
  height = 200,
  'aria-label': ariaLabel = 'Bar chart',
}) => {
  const gradientId = `ink-barchart-${React.useId().replace(/:/g, '')}`;
  const W = 480;
  const H = height;
  const padL = 30;
  const padR = 8;
  const padT = 12;
  const baseline = H - 40;
  const plotW = W - padL - padR;

  const max = yMax ?? niceMax(Math.max(1, ...data));
  const ticks = yTicks ?? Array.from({ length: 5 }, (_, i) => Math.round((max / 4) * i));
  const yFor = (v: number) => baseline - (v / max) * (baseline - padT);

  const n = data.length;
  const slot = plotW / Math.max(1, n);
  const barW = Math.min(20, slot * 0.55);
  const tickColor = 'rgba(19, 0, 50, 0.55)';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.65" />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={yFor(t)} x2={W - padR} y2={yFor(t)} stroke="rgba(19,0,50,0.12)" strokeWidth="1" strokeDasharray="3 3" />
          <text x={padL - 8} y={yFor(t) + 4} textAnchor="end" fontSize="11" fill={tickColor}>{t}</text>
        </g>
      ))}

      {data.map((v, i) => {
        const x = padL + i * slot + (slot - barW) / 2;
        const y = yFor(v);
        return (
          <g key={i}>
            {showValues && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fill="rgba(19,0,50,0.75)">{v}</text>
            )}
            <rect x={x} y={y} width={barW} height={baseline - y} rx="2" fill={`url(#${gradientId})`} />
          </g>
        );
      })}

      {xLabels.map((l) => (
        <text key={l.text} x={padL + l.index * slot + slot / 2} y={baseline + 18} textAnchor="middle" fontSize="11" fill={tickColor}>{l.text}</text>
      ))}

      {xAxisTitle && (
        <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="12" fill={tickColor}>{xAxisTitle}</text>
      )}
    </svg>
  );
};

BarChart.displayName = 'BarChart';
