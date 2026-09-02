import * as React from 'react';
import { cx } from '../../cx.js';

export function FlushHead({ children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-flush-head', className), ...rest }, children);
}
