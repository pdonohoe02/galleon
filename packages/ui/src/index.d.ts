import type * as React from 'react';

/** Every component spreads unknown props onto its root, so props are permissive. */
type Extra = Record<string, unknown>;
type Base = { className?: string; children?: React.ReactNode };
type C<P = Record<never, never>> = React.FC<P & Base & Extra>;

// shell
export const Shell: C<{ marketing?: boolean; theme?: 'publisher' }>;
export const Width: C;
export const Masthead: C<{ left?: React.ReactNode; right?: React.ReactNode; solid?: boolean }>;
export const Wordmark: C<{ href?: string }>;
export const SurfaceChip: C;
export const DemoFlag: C;
export const Status: C;
export const Footer: C<{ solid?: boolean }>;

// type
export const Display: C<{ hero?: boolean; as?: keyof React.JSX.IntrinsicElements }>;
export const Lede: C;
export const SectionHeading: C<{ as?: keyof React.JSX.IntrinsicElements }>;
export const Meta: C;

// page
export const Page: C;
export const PageHead: C;

// money
export const Balance: C<{ label?: React.ReactNode; value: React.ReactNode; caption?: React.ReactNode }>;

// surface
export const Flush: C;
export const FlushPanel: C;
export const FlushHead: C;
export const FlushNote: C;
export const Detail: C<{ title: React.ReactNode; tag?: React.ReactNode }>;

// data
export const InlineValue: C<{ label?: React.ReactNode }>;
export const Tag: C<{ row?: boolean }>;
export const Row: C<{ head?: boolean; columns?: 'purchases' | 'sources' }>;
export const Cell: C<{ tone?: 'title' | 'meta' | 'amount'; tabular?: boolean }>;
export const EmptyState: C<{ mark?: React.ReactNode; action?: React.ReactNode }>;

// dashboard shell
export interface NavItemModel { key: string; label: React.ReactNode; icon?: React.ReactNode; active?: boolean; href?: string; }
export interface IdentityModel { initials: React.ReactNode; name: React.ReactNode; status?: React.ReactNode; statusTone?: 'ok' | 'muted'; endpoint?: React.ReactNode; }
export const AppSidebar: C<{ chip?: React.ReactNode; items?: NavItemModel[]; identity?: IdentityModel; brandHref?: string }>;
export const NavItem: C<{ icon?: React.ReactNode; label?: React.ReactNode; active?: boolean; href?: string }>;
export const TopBar: C<{ name?: React.ReactNode; context?: React.ReactNode; actions?: React.ReactNode }>;
export const Canvas: C;
export const Panel: C<{ scroll?: boolean; cols?: string; minWidth?: number | string }>;
export const PanelHead: C<{ title?: React.ReactNode; count?: React.ReactNode; note?: React.ReactNode; aside?: React.ReactNode }>;
export const MetricStrip: C<{ columns?: string }>;
export const Metric: C<{ label?: React.ReactNode; figure?: React.ReactNode; sub?: React.ReactNode; delta?: React.ReactNode; deltaUp?: boolean; lead?: boolean }>;
export const BudgetMeter: C<{ pct?: number; label?: React.ReactNode }>;

export interface AxisLabel { at?: number; x?: number; text: React.ReactNode; anchor?: string; }
export const BarChart: C<{ values?: number[]; peakIndex?: number; format?: (n: number) => React.ReactNode; labels?: AxisLabel[]; height?: number }>;
export const AreaChart: C<{ values?: number[]; labels?: AxisLabel[]; height?: number; gradientId?: string }>;
export const Sparkline: C<{ values?: number[]; muted?: boolean; width?: number; height?: number }>;
export const DataTable: C<{ columns?: string; minWidth?: number | string }>;
export const DataRow: C<{ head?: boolean }>;
export const TableFooterBar: C<{ count?: React.ReactNode; action?: React.ReactNode }>;
export interface SegmentedItem { label: React.ReactNode; active?: boolean; onClick?: () => void; }
export const Segmented: C<{ items?: SegmentedItem[] }>;

// forms
export const Button: C<{ variant?: 'primary' | 'secondary' | 'quiet'; size?: 'sm'; block?: boolean; as?: keyof React.JSX.IntrinsicElements; type?: string; href?: string; disabled?: boolean }>;
export const Field: C<{ label?: React.ReactNode; hint?: React.ReactNode; htmlFor?: string }>;
export const Input: C;
export const PriceField: C<{ tight?: boolean; prefix?: React.ReactNode }>;
export const Dialog: C<{ title?: React.ReactNode; description?: React.ReactNode; footer?: React.ReactNode }>;

// status
export const Notice: C<{ tone?: 'critical' | 'warning'; action?: React.ReactNode }>;
