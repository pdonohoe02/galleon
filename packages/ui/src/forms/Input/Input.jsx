import * as React from 'react';
import { cx } from '../../cx.js';

export function Input({ className, ...rest }) {
  return React.createElement('input', { className: cx('gl-input', className), ...rest });
}
