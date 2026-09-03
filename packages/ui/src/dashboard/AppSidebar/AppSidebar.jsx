import * as React from 'react';
import { cx } from '../../cx.js';
import { NavItem } from './NavItem.jsx';

/** 216px dashboard sidebar: brand, nav, and an identity footer. */
export function AppSidebar({ chip, items = [], identity, footer, brandHref = '/', className, ...rest }) {
  return React.createElement('aside', { className: cx('gl-sidebar', className), ...rest },
    React.createElement('div', { className: 'gl-sidebar-top' },
      React.createElement('a', { className: 'gl-sidebar-brand', href: brandHref },
        React.createElement('span', { className: 'gl-brand-mark' }, 'G'),
        React.createElement('span', { className: 'gl-brand-name' }, 'Galleon'),
        chip && React.createElement('span', { className: 'gl-brand-chip' }, chip)
      ),
      React.createElement('nav', { className: 'gl-nav' },
        items.map((it) => React.createElement(NavItem, { key: it.key, icon: it.icon, label: it.label, active: it.active, href: it.href, disabled: it.disabled }))
      )
    ),
    identity && React.createElement('div', { className: 'gl-sidebar-foot' },
      React.createElement('div', { className: 'gl-ident' },
        React.createElement('span', { className: 'gl-ident-avatar' }, identity.initials),
        React.createElement('span', { className: 'gl-ident-lines' },
          React.createElement('span', { className: 'gl-ident-name' }, identity.name),
          identity.status && React.createElement('span', { className: cx('gl-ident-status', identity.statusTone === 'muted' && 'gl-ident-status--muted') }, identity.status)
        )
      ),
      identity.endpoint && React.createElement('span', { className: 'gl-ident-endpoint' }, identity.endpoint),
      footer
    )
  );
}
