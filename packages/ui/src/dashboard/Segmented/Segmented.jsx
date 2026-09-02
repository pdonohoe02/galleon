import * as React from 'react';
import { cx } from '../../cx.js';

export function Segmented({ items = [], className, ...rest }) {
  return React.createElement('div', { className: cx('gl-segmented', className), ...rest },
    items.map((it, i) => React.createElement('button', { key: i, type: 'button', className: it.active ? 'is-active' : undefined, onClick: it.onClick }, it.label))
  );
}
