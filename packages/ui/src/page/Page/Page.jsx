import * as React from 'react';
import { cx } from '../../cx.js';

export function Page({ children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-page', className), ...rest }, children);
}
