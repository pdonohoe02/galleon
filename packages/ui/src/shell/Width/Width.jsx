import * as React from 'react';
import { cx } from '../../cx.js';

export function Width({ children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-width', className), ...rest }, children);
}
