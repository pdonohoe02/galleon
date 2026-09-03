import * as React from 'react';
import { cx } from '../../cx.js';

/** A figure on the page, not a card — boxing it made the page read as tiles. */
export function Balance({ label, value, caption, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-balance', className), ...rest },
    label && React.createElement('span', { className: 'gl-balance-label' }, label),
    React.createElement('span', { className: 'gl-balance-value' }, value),
    caption && React.createElement('span', { className: 'gl-balance-caption' }, caption)
  );
}
