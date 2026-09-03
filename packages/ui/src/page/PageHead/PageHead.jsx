import * as React from 'react';
import { cx } from '../../cx.js';

export function PageHead({ children, className, ...rest }) {
  return React.createElement('section', { className: cx('gl-page-head', className), ...rest }, children);
}
