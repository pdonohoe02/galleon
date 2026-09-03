import * as React from 'react';
import { cx } from '../../cx.js';

/** Wash-filled notice. No left accent bar; text darkens on the wash. */
export function Notice({ children, tone, action, className, ...rest }) {
  return React.createElement('div', { className: cx('gl-notice', tone && 'gl-notice--' + tone, className), role: 'status', ...rest },
    React.createElement('div', { className: 'gl-notice__copy' }, children),
    action || null
  );
}
