import * as React from 'react';
import { cx } from '../../cx.js';

export function TableFooterBar({ count, action, children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-data-foot', className), ...rest },
    children || React.createElement(React.Fragment, null,
      count != null && React.createElement('span', { className: 'gl-data-foot-count' }, count),
      action || null
    )
  );
}
