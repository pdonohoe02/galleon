import * as React from 'react';
import { cx } from '../../cx.js';

/** Page frame: column layout, main flexes, footer sits at the bottom. */
export function Shell({ children, marketing = false, theme, className, ...rest }) {
  return React.createElement('div', {
    className: cx('gl-shell', marketing && 'gl-shell--marketing', className),
    'data-gl-theme': theme,
    ...rest
  }, children);
}
