import * as React from 'react';
import { cx } from '../../cx.js';

export function SurfaceChip({ children, className, ...rest }) {
  return React.createElement('span', { className: cx('gl-surface-chip', className), ...rest }, children);
}
