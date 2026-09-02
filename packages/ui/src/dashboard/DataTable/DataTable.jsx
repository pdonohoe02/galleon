import * as React from 'react';
import { cx } from '../../cx.js';

/** A horizontally-scrolling bordered table surface. `columns` is the grid. */
export function DataTable({ columns, minWidth = 760, children, className, style, ...rest }) {
  const s = { ...style, '--gl-cols': columns, '--gl-min': typeof minWidth === 'number' ? minWidth + 'px' : minWidth };
  return React.createElement('section', { className: cx('gl-panel', 'gl-panel--scroll', className), style: s, ...rest }, children);
}
