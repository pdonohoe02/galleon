import * as React from 'react';
import { cx } from '../../cx.js';
import { Width } from '../Width/Width.jsx';

export function Footer({ children, solid = false, className, ...rest }) {
  return React.createElement('footer', { className: cx('gl-footer', solid && 'gl-footer--solid', className), ...rest },
    React.createElement(Width, null, children)
  );
}
