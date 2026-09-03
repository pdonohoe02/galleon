import * as React from 'react';
import { cx } from '../../cx.js';

export function PriceField({ tight = false, prefix = '$', className, ...rest }) {
  return React.createElement('span', { className: cx('gl-price', tight && 'gl-price--tight', className) },
    React.createElement('span', { className: 'gl-price-prefix' }, prefix),
    React.createElement('input', { ...rest })
  );
}
