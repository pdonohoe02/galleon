import * as React from 'react';
import { cx } from '../../cx.js';
import { Width } from '../Width/Width.jsx';

/** Product masthead. `solid` gives it a white ground and a stronger rule. */
export function Masthead({ left, right, solid = false, className, ...rest }) {
  return React.createElement('header', { className: cx('gl-masthead', solid && 'gl-masthead--solid', className), ...rest },
    React.createElement(Width, null,
      React.createElement('div', { className: 'gl-masthead-left' }, left),
      right
    )
  );
}
