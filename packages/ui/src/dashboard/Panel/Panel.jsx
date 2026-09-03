import * as React from 'react';
import { cx } from '../../cx.js';

/** A bordered dashboard panel. Pass `cols`/`minWidth` when it wraps a table. */
export function Panel({ children, scroll = false, cols, minWidth, className, style, ...rest }) {
  const s = { ...style };
  if (cols) s['--gl-cols'] = cols;
  if (minWidth != null) s['--gl-min'] = typeof minWidth === 'number' ? minWidth + 'px' : minWidth;
  return React.createElement('section', { className: cx('gl-panel', scroll && 'gl-panel--scroll', className), style: s, ...rest }, children);
}
