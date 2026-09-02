// Sidebar nav icons, 14×14, stroke: currentColor so they take the NavItem's
// icon colour (muted normally, accent when active).
import type { ReactNode } from "react";

const S = { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", stroke: "currentColor" } as const;

export const iconOverview: ReactNode = (
  <svg {...S} strokeWidth={1.6}>
    <rect x="1.6" y="3.4" width="10.8" height="7.6" rx="1.4" />
    <path d="M1.6 6.2h10.8" />
  </svg>
);

export const iconSpending: ReactNode = (
  <svg {...S} strokeWidth={1.5}>
    <path d="M1.8 11.5V7.8M5.6 11.5V4.4M9.4 11.5V6.2M13 11.5V2.6" />
  </svg>
);

export const iconSources: ReactNode = (
  <svg {...S} strokeWidth={1.5}>
    <rect x="2" y="1.8" width="10" height="10.4" rx="1.4" />
    <path d="M4.4 5h5.2M4.4 7.4h5.2M4.4 9.8h3" />
  </svg>
);

export const iconAgents: ReactNode = (
  <svg {...S} strokeWidth={1.5}>
    <rect x="2.2" y="3.6" width="9.6" height="7.4" rx="1.6" />
    <circle cx="5.4" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8.6" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
    <path d="M7 1.4v2.2" />
  </svg>
);

export const iconSettings: ReactNode = (
  <svg {...S} strokeWidth={1.5}>
    <circle cx="7" cy="7" r="2.2" />
    <path d="M7 1.6v1.8M7 10.6v1.8M1.6 7h1.8M10.6 7h1.8" />
  </svg>
);
