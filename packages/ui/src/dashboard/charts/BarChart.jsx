import * as React from 'react';
import { cx } from '../../cx.js';

/** Daily-spend bars. Data-driven; the peak bar goes navy, the rest accent. */
export function BarChart({ values = [], peakIndex, format = (n) => String(n), labels = [], height = 150, className, ...rest }) {
  const n = values.length;
  const W = 880, H = 120, gutter = 7;
  const max = Math.max(...values, 1e-9);
  const peak = peakIndex == null ? values.indexOf(Math.max(...values, 0)) : peakIndex;
  const barW = n > 0 ? Math.max(1, (W - gutter * (n - 1)) / n) : 0;
  const bars = values.map((v, i) => {
    const h = v <= 0 ? 0 : Math.max(2, (v / max) * (H - 8));
    return React.createElement('rect', { key: i, x: i * (barW + gutter), y: H - h, width: barW, height: h, rx: 1.5, fill: i === peak ? '#0a2540' : undefined });
  });
  const grid = [
    React.createElement('path', { key: 'g1', d: 'M0 90h' + W }),
    React.createElement('path', { key: 'g2', d: 'M0 45h' + W }),
    React.createElement('path', { key: 'g3', d: 'M0 0h' + W }),
    React.createElement('path', { key: 'b', d: 'M0 120h' + W, stroke: '#dee7ef' })
  ];
  const yLabels = [
    React.createElement('text', { key: 'y1', x: -10, y: 94 }, format(max / 3)),
    React.createElement('text', { key: 'y2', x: -10, y: 49 }, format((2 * max) / 3)),
    React.createElement('text', { key: 'y3', x: -10, y: 4 }, format(max))
  ];
  const xLabels = labels.map((l, i) =>
    React.createElement('text', { key: 'x' + i, x: l.at * (barW + gutter), y: 138, textAnchor: l.anchor }, l.text)
  );
  return React.createElement('svg', { viewBox: '-42 -8 934 152', className: cx('gl-chart', className), style: { height }, preserveAspectRatio: 'none', ...rest },
    React.createElement('g', { stroke: '#edf2f7', strokeWidth: 1 }, grid),
    React.createElement('g', { fill: '#8497ab', fontSize: 11, textAnchor: 'end' }, yLabels),
    React.createElement('g', { fill: '#12509b', opacity: 0.82 }, bars),
    React.createElement('g', { fill: '#8497ab', fontSize: 11 }, xLabels)
  );
}
