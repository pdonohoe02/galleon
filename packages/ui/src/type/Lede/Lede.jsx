import * as React from 'react';
import { cx } from '../../cx.js';

export function Lede({ children, className, ...rest }) {
  return React.createElement('p', { className: cx('gl-lede', className), ...rest }, children);
}
