import * as React from 'react';
import { cx } from '../../cx.js';

export function Wordmark({ children = 'Galleon', href = '/', className, ...rest }) {
  return React.createElement('a', { className: cx('gl-wordmark', className), href, ...rest }, children);
}
