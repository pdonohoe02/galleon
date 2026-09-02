import * as React from 'react';
import { cx } from '../../cx.js';

export function FlushNote({ children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-flush-note', className), ...rest }, children);
}
