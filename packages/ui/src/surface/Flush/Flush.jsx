import * as React from 'react';
import { cx } from '../../cx.js';

export function Flush({ children, className, ...rest }) {
  return React.createElement('section', { className: cx('gl-flush', className), ...rest }, children);
}
