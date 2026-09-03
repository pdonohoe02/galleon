import * as React from 'react';
import { cx } from '../../cx.js';

export function Metric({ label, figure, sub, delta, deltaUp = false, lead = false, children, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-metric', lead && 'gl-metric--lead', className), ...rest },
    React.createElement('span', { className: 'gl-metric-label' }, label),
    figure != null && React.createElement('span', { className: 'gl-metric-figure' }, figure),
    children,
    sub != null && React.createElement('span', { className: 'gl-metric-sub' }, sub),
    delta != null && React.createElement('span', { className: cx('gl-metric-delta', deltaUp && 'gl-metric-delta--up') }, delta)
  );
}
