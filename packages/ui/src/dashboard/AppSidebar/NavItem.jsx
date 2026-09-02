import * as React from 'react';
import { cx } from '../../cx.js';

export function NavItem({ icon, label, active = false, href, ...rest }) {
  const cls = cx('gl-nav-item', active && 'gl-nav-item--active');
  const inner = [React.createElement('span', { className: 'gl-nav-ico', key: 'i' }, icon), label];
  return href
    ? React.createElement('a', { className: cls, href, ...rest }, inner)
    : React.createElement('span', { className: cls, ...rest }, inner);
}
