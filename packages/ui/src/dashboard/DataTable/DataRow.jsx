import * as React from 'react';
import { cx } from '../../cx.js';

export function DataRow({ head = false, children, className, ...rest }) {
  return React.createElement('div', { className: cx(head ? 'gl-data-headband' : 'gl-data-row', className), ...rest }, children);
}
