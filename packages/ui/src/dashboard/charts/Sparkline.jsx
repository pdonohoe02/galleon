import * as React from 'react';
import { cx } from '../../cx.js';

export function Sparkline({ values = [], muted = false, width = 84, height = 22, className, ...rest }) {
  const n = values.length;
  const max = Math.max(...values, 1e-9), min = Math.min(...values, 0);
  const range = max - min || 1;
  const d = values.map((v, i) => {
    const x = n > 1 ? (i / (n - 1)) * (width - 2) + 1 : 1;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' L');
  return React.createElement('svg', { width, height, viewBox: '0 0 ' + width + ' ' + height, className: cx('gl-sparkline', className), fill: 'none', ...rest },
    n > 1 && React.createElement('path', { d: 'M' + d, stroke: muted ? '#c9d8e4' : '#12509b', strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' })
  );
}
