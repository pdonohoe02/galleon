import * as React from 'react';
import { cx } from '../../cx.js';

export function MetricStrip({ children, columns, className, style, ...rest }) {
  const s = { ...style };
  if (columns) s.gridTemplateColumns = columns;
  return React.createElement('section', { className: cx('gl-metric-strip', className), style: s, ...rest }, children);
}
