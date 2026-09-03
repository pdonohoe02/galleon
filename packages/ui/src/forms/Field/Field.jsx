import * as React from 'react';
import { cx } from '../../cx.js';

export function Field({ label, hint, htmlFor, children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-field', className), ...rest },
    label && React.createElement('label', { className: 'gl-field-label', htmlFor }, label),
    children,
    hint && React.createElement('span', { className: 'gl-field-hint' }, hint)
  );
}
