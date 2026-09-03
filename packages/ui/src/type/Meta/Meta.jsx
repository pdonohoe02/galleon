import * as React from 'react';
import { cx } from '../../cx.js';

export function Meta({ children, className, ...rest }) {
  return React.createElement('span', { className: cx('gl-meta', className), ...rest }, children);
}
