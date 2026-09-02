import * as React from 'react';
import { cx } from '../../cx.js';

export function Canvas({ children, className, ...rest }) {
  return React.createElement('main', { className: cx('gl-canvas', className), ...rest }, children);
}
