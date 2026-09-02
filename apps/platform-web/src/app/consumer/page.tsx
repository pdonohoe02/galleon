import { formatUsd } from "@galleon/contracts";
import {
  AppSidebar,
  BarChart,
  Button,
  Canvas,
  DataRow,
  DataTable,
  EmptyState,
  Metric,
  MetricStrip,
  Notice,
  PanelHead,
  Segmented,
  TableFooterBar,
  TopBar,
} from "@galleon/ui";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { signOut } from "./actions";
import { AddCredits } from "./add-credits";
import { iconAgents, iconOverview, iconSettings, iconSources, iconSpending } from "./nav-icons";

export const dynamic = "force-dynamic";

const mcpEndpoint = process.env.GALLEON_MCP_URL ?? "http://127.0.0.1:3100/mcp";
const publisherDemoUrl = process.env.GALLEON_PUBLISHER_DEMO_URL ?? "http://127.0.0.1:3001";
const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

const stampFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dayFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const DAY_MS = 86_400_000;
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default async function ConsumerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  if (!user.wallet_id) {
    await revokeSession();
    redirect("/consumer/sign-in?error=wrong_surface");
  }

  const [wallet, purchases] = await Promise.all([
    galleon.getWalletSummary(user.wallet_id),
    galleon.getConsumerPurchases(user.wallet_id),
  ]);

  // Metrics from real ledger rows.
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const sevenStart = todayStart - 6 * DAY_MS;
  let monthSpent = 0;
  let todaySpent = 0;
  let last7Count = 0;
  let highest = 0;
  let total = 0;
  const publishers = new Set<string>();
  const buckets = new Array<number>(30).fill(0);
  for (const p of purchases) {
    const t = new Date(p.purchased_at).getTime();
    total += p.amount_minor;
    if (p.amount_minor > highest) highest = p.amount_minor;
    if (t >= monthStart) {
      monthSpent += p.amount_minor;
      publishers.add(p.publisher_name);
    }
    if (t >= todayStart) todaySpent += p.amount_minor;
    if (t >= sevenStart) last7Count += 1;
    const diff = Math.floor((todayStart - startOfDay(new Date(p.purchased_at))) / DAY_MS);
    if (diff >= 0 && diff < 30) buckets[29 - diff] += p.amount_minor;
  }
  const count = purchases.length;
  const average = count > 0 ? Math.round(total / count) : 0;
  const cap = wallet.policy?.max_daily_spend_minor ?? 0;
  const capPct = cap > 0 ? (todaySpent / cap) * 100 : 0;

  // Daily-spend chart in dollars, with a few x-axis date labels.
  const chartValues = buckets.map((m) => m / 100);
  const peakIndex = chartValues.reduce((best, v, i) => (v > chartValues[best] ? i : best), 0);
  const labelAt = (i: number, anchor?: string) => {
    const d = new Date(todayStart - (29 - i) * DAY_MS);
    return { at: i, text: dayFormat.format(d), anchor };
  };
  const chartLabels = [labelAt(0), labelAt(9), labelAt(19), labelAt(29, "end")];
  const peakStamp =
    count > 0 && chartValues[peakIndex] > 0
      ? `Peak ${formatUsd(buckets[peakIndex])} · ${dayFormat.format(new Date(todayStart - (29 - peakIndex) * DAY_MS))}`
      : "No spend yet";

  const navItems = [
    { key: "overview", label: "Overview", icon: iconOverview, active: true, href: "/consumer" },
    { key: "spending", label: "Spending", icon: iconSpending, href: "/consumer" },
    { key: "sources", label: "Sources", icon: iconSources, href: publisherDemoUrl },
    { key: "agents", label: "Agents", icon: iconAgents, href: "/consumer/onboarding?step=mcp" },
    { key: "settings", label: "Settings", icon: iconSettings, href: "/consumer/onboarding" },
  ];
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <div className="gl-app">
      <AppSidebar
        chip="Wallet"
        brandHref={marketingUrl}
        items={navItems}
        identity={{
          initials,
          name: user.email,
          status: user.onboarded ? "Codex connected" : "Setup unfinished",
          endpoint: mcpEndpoint.replace(/^https?:\/\//, ""),
        }}
      />
      <div className="gl-main">
        <TopBar
          name="Overview"
          context={monthLabel.format(now)}
          actions={
            <>
              <Button as="a" href={publisherDemoUrl} variant="secondary" size="sm">
                Browse sources
              </Button>
              <AddCredits balanceMinor={wallet.balance_minor} />
              <form action={signOut}>
                <Button variant="quiet" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          }
        />
        <Canvas>
          {!user.onboarded ? (
            <Notice
              action={
                <Button as="a" href="/consumer/onboarding" variant="primary" size="sm">
                  Finish setup
                </Button>
              }
            >
              <span>
                <strong>Finish setting up your wallet.</strong> Add test credits and connect your agent to
                start buying sources.
              </span>
            </Notice>
          ) : null}

          <MetricStrip columns="1.35fr 1fr 1fr 1fr">
            <Metric lead label="Available balance" figure={wallet.display_balance}>
              <div className="gl-budget">
                <div className="gl-budget-track">
                  <div
                    className="gl-budget-fill"
                    style={{ width: `${Math.max(0, Math.min(100, capPct))}%` }}
                  />
                </div>
                <span className="gl-budget-label">
                  {cap > 0
                    ? `${formatUsd(todaySpent)} of ${formatUsd(cap)} daily cap used`
                    : "No daily cap set"}
                </span>
              </div>
            </Metric>
            <Metric
              label="Spent this month"
              figure={formatUsd(monthSpent)}
              sub={`Across ${publishers.size} ${publishers.size === 1 ? "publisher" : "publishers"}`}
            />
            <Metric
              label="Sources bought"
              figure={String(count)}
              sub={`${last7Count} in the last 7 days`}
            />
            <Metric
              label="Average per source"
              figure={formatUsd(average)}
              sub={highest > 0 ? `Highest ${formatUsd(highest)}` : "—"}
            />
          </MetricStrip>

          <section className="gl-panel">
            <PanelHead title="Daily spend" count="Last 30 days" note={peakStamp} />
            <div className="gl-panel-body">
              <BarChart
                values={chartValues}
                peakIndex={peakIndex}
                labels={chartLabels}
                format={(n: number) => formatUsd(Math.round(n * 100))}
              />
            </div>
          </section>

          <DataTable columns="minmax(220px,1fr) 148px 96px 128px 84px" minWidth={760}>
            <PanelHead
              title="Spending history"
              count={`${count} ${count === 1 ? "purchase" : "purchases"} · ${formatUsd(total)}`}
              aside={
                <Segmented
                  items={[{ label: "All", active: true }, { label: "This week" }, { label: "By publisher" }]}
                />
              }
            />
            <DataRow head>
              <span className="gl-dc-head">Source</span>
              <span className="gl-dc-head">Publisher</span>
              <span className="gl-dc-head">Agent</span>
              <span className="gl-dc-head">Purchased</span>
              <span className="gl-dc-head gl-dc-head--end">Amount</span>
            </DataRow>
            {count === 0 ? (
              <EmptyState
                action={
                  <Button as="a" href={publisherDemoUrl} variant="secondary" size="sm">
                    Browse Northline Review
                  </Button>
                }
              >
                Your first unlocked source will appear here.
              </EmptyState>
            ) : (
              <>
                {purchases.map((p) => (
                  <DataRow key={p.purchase_id}>
                    <span className="gl-dc-title">{p.title}</span>
                    <span className="gl-dc-meta">{p.publisher_name}</span>
                    <span className="gl-dc-meta">Codex</span>
                    <span className="gl-dc-meta">{stampFormat.format(new Date(p.purchased_at))}</span>
                    <span className="gl-dc-amount">{formatUsd(p.amount_minor)}</span>
                  </DataRow>
                ))}
                <TableFooterBar count={`Showing ${count} of ${count}`} />
              </>
            )}
          </DataTable>

          <span style={{ padding: "2px 2px 8px", color: "var(--gl-text-meta)", fontSize: 12 }}>
            Galleon settles in demo credits. No real money moves.
          </span>
        </Canvas>
      </div>
    </div>
  );
}
