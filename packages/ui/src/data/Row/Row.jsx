import * as React from 'react';
import { cx } from '../../cx.js';

/** Ledger row. `columns` picks the grid: "purchases" or "sources". */
export function Row({ children, head = false, columns, className, ...rest }) {
  return React.createElement('div', {
    className: cx('gl-row', head && 'gl-row--head', columns && 'gl-' + columns + '-row', className),
    ...rest
  }, children);
}
