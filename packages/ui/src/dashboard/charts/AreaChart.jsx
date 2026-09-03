import * as React from 'react';
import { cx } from '../../cx.js';

/** Revenue area chart. Blue on both surfaces — blue marks money. */
export function AreaChart({ values = [], labels = [], height = 200, gradientId = 'gl-area', className, ...rest }) {
  const n = values.length;
  const W = 880, H = 180;
  const max = Math.max(...values, 1e-9);
  const pts = values.map((v, i) => [n > 1 ? (i / (n - 1)) * W : 0, H - (v / max) * (H - 10)]);
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = pts.length ? line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z' : '';
  const last = pts[pts.length - 1] || [0, H];
  const grid = [0.25, 0.5, 0.75, 1].map((f, i) =>
    React.createElement('path', { key: i, d: 'M0 ' + (H - f * (H - 10)).toFixed(1) + 'h' + W, stroke: '#edf2f7' })
  );
  return React.createElement('svg', { viewBox: '-42 -10 934 214', className: cx('gl-chart', className), style: { height }, ...rest },
    React.createElement('defs', null,
      React.createElement('linearGradient', { id: gradientId, x1: 0, y1: 0, x2: 0, y2: 1 },
        React.createElement('stop', { offset: '0%', stopColor: '#12509b', stopOpacity: 0.16 }),
        React.createElement('stop', { offset: '100%', stopColor: '#12509b', stopOpacity: 0.01 })
      )
    ),
    React.createElement('g', { strokeWidth: 1 }, grid),
    React.createElement('path', { d: 'M0 ' + H + 'h' + W, stroke: '#dee7ef' }),
    area && React.createElement('path', { d: area, fill: 'url(#' + gradientId + ')', stroke: 'none' }),
    pts.length > 1 && React.createElement('path', { d: line, fill: 'none', stroke: '#12509b', strokeWidth: 2, vectorEffect: 'non-scaling-stroke' }),
    pts.length > 0 && React.createElement('circle', { cx: last[0], cy: last[1], r: 3.5, fill: '#12509b', stroke: '#fff', strokeWidth: 2 }),
    React.createElement('g', { fill: '#8497ab', fontSize: 11 }, labels.map((l, i) => React.createElement('text', { key: i, x: l.x, y: 200, textAnchor: l.anchor }, l.text)))
  );
}
