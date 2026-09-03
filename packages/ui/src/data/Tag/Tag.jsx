import * as React from 'react';
import { cx } from '../../cx.js';

export function Tag({ children, row = false, className, ...rest }) {
  return React.createElement('span', { className: cx('gl-tag', row && 'gl-tag--row', className), ...rest }, children);
}
