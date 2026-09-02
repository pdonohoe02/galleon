import { DEMO_IDS, formatUsd } from "@galleon/contracts";
import {
  AppSidebar,
  AreaChart,
  Button,
  Canvas,
  DataRow,
  DataTable,
  Metric,
  MetricStrip,
  PanelHead,
  Segmented,
  Sparkline,
  Tag,
  TopBar,
} from "@galleon/ui";

import { galleon } from "@/lib/galleon";

import { iconAgents, iconOverview, iconSettings, iconSources, iconSpending } from "../consumer/nav-icons";

export const dynamic = "force-dynamic";

const publisherOrigin = process.env.GALLEON_PUBLISHER_ORIGIN ?? "http://127.0.0.1:3001";
const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

const dayFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });
const DAY_MS = 86_400_000;
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function statusLabel(status: string): string {
  const words = status.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function PublisherDashboardPage() {
  const summary = await galleon.getPublisherSummary(DEMO_IDS.publisher);

  const now = new Date();
  const todayStart = startOfDay(now);
  const buckets = new Array<number>(30).fill(0);
  for (const sale of summary.sales) {
    const diff = Math.floor((todayStart - startOfDay(new Date(sale.purchased_at))) / DAY_MS);
    if (diff >= 0 && diff < 30) buckets[29 - diff] += sale.amount_minor;
  }
  const revenueValues = buckets.map((m) => m / 100);
  const average = summary.purchase_count > 0 ? Math.round(summary.balance_minor / summary.purchase_count) : 0;

  const labelAt = (i: number, anchor?: string) => ({
    x: (i / 29) * 880,
    text: dayFormat.format(new Date(todayStart - (29 - i) * DAY_MS)),
    anchor,
  });
  const chartLabels = [labelAt(0), labelAt(9), labelAt(19), labelAt(29, "end")];

  const navItems = [
    { key: "overview", label: "Overview", icon: iconOverview, active: true, href: "/publishers" },
    { key: "revenue", label: "Revenue", icon: iconSpending, href: "/publishers" },
    { key: "articles", label: "Articles", icon: iconSources, href: "/publishers" },
    { key: "payouts", label: "Payouts", icon: iconAgents, href: "/publishers" },
    { key: "settings", label: "Settings", icon: iconSettings, href: "/publishers" },
  ];

  return (
    <div className="gl-app" data-gl-theme="publisher">
      <AppSidebar
        chip="Pub"
        brandHref={marketingUrl}
        items={navItems}
        identity={{
          initials: "NR",
          name: "Northline Review",
          status: "Origin verified",
          endpoint: publisherOrigin.replace(/^https?:\/\//, ""),
        }}
      />
      <div className="gl-main">
        <TopBar
          name="Overview"
          context="Last 30 days"
          actions={
            <>
              <Segmented items={[{ label: "7d" }, { label: "30d", active: true }, { label: "90d" }]} />
              <Button variant="secondary" size="sm">
                Export
              </Button>
            </>
          }
        />
        <Canvas>
          <MetricStrip>
            <Metric label="Gross revenue" figure={summary.display_balance} sub="Settled to Northline Review" />
            <Metric label="Purchases" figure={String(summary.purchase_count)} sub="Signed entitlements" />
            <Metric label="Average price" figure={formatUsd(average)} sub="Per source" />
            <Metric label="Live sources" figure={String(summary.resources.length)} sub="Priced on this origin" />
          </MetricStrip>

          <section className="gl-panel">
            <PanelHead
              title="Revenue"
              count="Last 30 days"
              note={summary.purchase_count > 0 ? `Gross ${summary.display_balance}` : "No sales yet"}
            />
            <div className="gl-panel-body">
              <AreaChart values={revenueValues} labels={chartLabels} />
            </div>
          </section>

          <DataTable columns="minmax(220px,1fr) 120px 96px 84px" minWidth={640}>
            <PanelHead
              title="Sources & offers"
              count={`${summary.resources.length} ${summary.resources.length === 1 ? "source" : "sources"} · ${summary.purchase_count} sold`}
            />
            <DataRow head>
              <span className="gl-dc-head">Source</span>
              <span className="gl-dc-head">Status</span>
              <span className="gl-dc-head">Trend</span>
              <span className="gl-dc-head gl-dc-head--end">Price</span>
            </DataRow>
            {summary.resources.map((resource) => {
              const live = resource.status === "active";
              return (
                <DataRow key={resource.resource_id}>
                  <span className={live ? "gl-dc-title" : "gl-dc-title gl-dc-title--muted"}>{resource.title}</span>
                  <span>
                    <Tag row>{statusLabel(resource.status)}</Tag>
                  </span>
                  <span>
                    <Sparkline values={live ? [2, 3, 2, 4, 3, 5, 4, 6] : [1, 1, 1, 1]} muted={!live} />
                  </span>
                  <span className="gl-dc-amount">{formatUsd(resource.amount_minor)}</span>
                </DataRow>
              );
            })}
          </DataTable>

          <span style={{ padding: "2px 2px 8px", color: "var(--gl-text-meta)", fontSize: 12 }}>
            Galleon settles in demo credits. No real money moves.
          </span>
        </Canvas>
      </div>
    </div>
  );
}
