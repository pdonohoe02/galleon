import * as React from 'react';
import { cx } from '../../cx.js';

/** Replaces the retired CodeSnippet: sans, still selectable. */
export function InlineValue({ label, children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-inline-value-group', className), ...rest },
    label && React.createElement('span', { className: 'gl-inline-label' }, label),
    React.createElement('span', { className: 'gl-inline-value' }, children)
  );
}
