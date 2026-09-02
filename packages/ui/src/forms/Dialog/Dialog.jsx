import * as React from 'react';
import { cx } from '../../cx.js';

export function Dialog({ title, description, children, footer, className, ...rest }) {
  return React.createElement('div', { className: 'gl-scrim' },
    React.createElement('div', { className: cx('gl-dialog', className), role: 'dialog', 'aria-modal': 'true', ...rest },
      (title || description) && React.createElement('div', { className: 'gl-dialog-head' },
        title && React.createElement('h2', null, title),
        description && React.createElement('p', null, description)
      ),
      React.createElement('div', { className: 'gl-dialog-body' }, children),
      footer && React.createElement('div', { className: 'gl-dialog-foot' }, footer)
    )
  );
}
