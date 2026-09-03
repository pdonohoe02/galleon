import * as React from 'react';
import { cx } from '../../cx.js';

export function SectionHeading({ children, as = 'h2', className, ...rest }) {
  return React.createElement(as, { className: cx('gl-section-heading', className), ...rest }, children);
}
