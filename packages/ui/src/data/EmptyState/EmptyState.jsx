import * as React from 'react';
import { cx } from '../../cx.js';

/** Column headers stay visible above this: they say what will appear here. */
export function EmptyState({ mark = '0', children, action, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-empty', className), ...rest },
    React.createElement('span', { className: 'gl-empty-mark', 'aria-hidden': 'true' }, mark),
    React.createElement('p', null, children),
    action
  );
}
