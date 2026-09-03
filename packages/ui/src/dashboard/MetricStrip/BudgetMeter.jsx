import * as React from 'react';
import { cx } from '../../cx.js';

export function BudgetMeter({ pct = 0, label, className, ...rest }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone = clamped >= 100 ? 'gl-budget-fill--over' : clamped >= 80 ? 'gl-budget-fill--warn' : '';
  return React.createElement('div', { className: cx('gl-budget', className), ...rest },
    React.createElement('div', { className: 'gl-budget-track' },
      React.createElement('div', { className: cx('gl-budget-fill', tone), style: { width: clamped + '%' } })
    ),
    label && React.createElement('span', { className: 'gl-budget-label' }, label)
  );
}
