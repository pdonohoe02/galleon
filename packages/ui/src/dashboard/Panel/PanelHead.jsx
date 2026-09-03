import * as React from 'react';
import { cx } from '../../cx.js';

export function PanelHead({ title, count, note, aside, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-panel-head', className), ...rest },
    React.createElement('div', { className: 'gl-panel-head-left' },
      React.createElement('h2', { className: 'gl-panel-title' }, title),
      count != null && React.createElement('span', { className: 'gl-panel-count' }, count)
    ),
    aside || (note != null ? React.createElement('span', { className: 'gl-panel-note' }, note) : null)
  );
}
