import * as React from 'react';
import { cx } from '../../cx.js';

export function FlushPanel({ children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-flush-panel', className), ...rest }, children);
}
