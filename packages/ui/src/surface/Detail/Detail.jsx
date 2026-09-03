import * as React from 'react';
import { cx } from '../../cx.js';

export function Detail({ title, tag, children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-detail-copy', className), ...rest },
    React.createElement('div', { className: 'gl-detail-title' },
      React.createElement('h2', null, title),
      tag
    ),
    children && React.createElement('p', null, children)
  );
}
