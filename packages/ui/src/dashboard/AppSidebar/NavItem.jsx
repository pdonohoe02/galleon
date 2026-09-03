import * as React from 'react';
import { cx } from '../../cx.js';

export function NavItem({ icon, label, active = false, href, disabled = false, ...rest }) {
  const cls = cx('gl-nav-item', active && 'gl-nav-item--active', disabled && 'gl-nav-item--disabled');
  const inner = [React.createElement('span', { className: 'gl-nav-ico', key: 'i' }, icon), label];
  if (disabled) {
    return React.createElement('span', { className: cls, 'aria-disabled': 'true', title: 'Coming soon', ...rest }, inner);
  }
  return href
    ? React.createElement('a', { className: cls, href, ...rest }, inner)
    : React.createElement('span', { className: cls, ...rest }, inner);
}
