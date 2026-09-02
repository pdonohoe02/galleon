import * as React from 'react';
import { cx } from '../../cx.js';

export function TopBar({ name, context, actions, className, ...rest }) {
  return React.createElement('header', { className: cx('gl-topbar', className), ...rest },
    React.createElement('div', { className: 'gl-topbar-title' },
      React.createElement('span', { className: 'gl-topbar-name' }, name),
      context != null && React.createElement('span', { className: 'gl-topbar-sep' }, '/'),
      context != null && React.createElement('span', { className: 'gl-topbar-ctx' }, context)
    ),
    actions && React.createElement('div', { className: 'gl-topbar-actions' }, actions)
  );
}
