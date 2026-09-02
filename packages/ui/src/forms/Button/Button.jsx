import * as React from 'react';
import { cx } from '../../cx.js';

export function Button({ children, variant = 'primary', size, block = false, as, className, ...rest }) {
  const Comp = as || 'button';
  const props = { className: cx('gl-button', 'gl-button--' + variant, size === 'sm' && 'gl-button--sm', block && 'gl-button--block', className), ...rest };
  if (Comp === 'button' && props.type == null) props.type = 'button';
  return React.createElement(Comp, props, children);
}
