import * as React from 'react';
import { cx } from '../../cx.js';

const TONE = { title: 'gl-cell-title', meta: 'gl-cell-meta', amount: 'gl-cell-amount' };

export function Cell({ children, tone = 'meta', tabular = false, className, ...rest }) {
  return React.createElement('span', { className: cx(TONE[tone], tabular && 'gl-tabular', className), ...rest }, children);
}
