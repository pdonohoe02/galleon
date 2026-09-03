import * as React from 'react';
import { cx } from '../../cx.js';

export function DemoFlag({ children, className, ...rest }) {
  return React.createElement('span', { className: cx('gl-demo-flag', className), ...rest }, children);
}
