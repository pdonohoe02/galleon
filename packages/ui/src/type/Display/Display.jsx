import * as React from 'react';
import { cx } from '../../cx.js';

export function Display({ children, hero = false, as = 'h1', className, ...rest }) {
  return React.createElement(as, { className: cx('gl-display', hero && 'gl-display--hero', className), ...rest }, children);
}
