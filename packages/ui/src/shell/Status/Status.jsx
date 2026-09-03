import * as React from 'react';
import { cx } from '../../cx.js';

export function Status({ children, className, ...rest }) {
  return React.createElement('span', { className: cx('gl-status', className), ...rest }, children);
}
