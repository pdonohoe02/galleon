import { formatUsd } from "@galleon/contracts";
import {
  BarChart,
  Button,
  Canvas,
  DataRow,
  DataTable,
  EmptyState,
  Notice,
  PanelHead,
  TopBar,
} from "@galleon/ui";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { AddCredits } from "./add-credits";
import { WalletSidebar } from "./wallet-nav";

export const dynamic = "force-dynamic";

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

  const [wallet, purchases, mcp] = await Promise.all([
    galleon.getWalletSummary(user.wallet_id),
    galleon.getConsumerPurchases(user.wallet_id),
    galleon.getMcpConnection(user.id),
  ]);
  const mcpStatus = mcp.connected ? "Codex connected" : mcp.has_token ? "Awaiting connection" : "Agent not connected";

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  let monthSpent = 0;
  let todaySpent = 0;
  let total = 0;
  const buckets = new Array<number>(30).fill(0);
  for (const p of purchases) {
    const t = new Date(p.purchased_at).getTime();
    total += p.amount_minor;
    if (t >= monthStart) monthSpent += p.amount_minor;
    if (t >= todayStart) todaySpent += p.amount_minor;
    const diff = Math.floor((todayStart - startOfDay(new Date(p.purchased_at))) / DAY_MS);
    if (diff >= 0 && diff < 30) buckets[29 - diff] += p.amount_minor;
  }
  const count = purchases.length;
  const cap = wallet.policy?.max_daily_spend_minor ?? 0;
  const capPct = cap > 0 ? Math.max(0, Math.min(100, (todaySpent / cap) * 100)) : 0;

  const chartValues = buckets.map((m) => m / 100);
  const peakIndex = chartValues.reduce((best, v, i) => (v > chartValues[best] ? i : best), 0);
  const labelAt = (i: number, anchor?: string) => ({
    at: i,
    text: dayFormat.format(new Date(todayStart - (29 - i) * DAY_MS)),
    anchor,
  });
  const chartLabels = [labelAt(0), labelAt(9), labelAt(19), labelAt(29, "end")];

  const recent = purchases.slice(0, 5);

  return (
    <div className="gl-app">
      <WalletSidebar active="overview" email={user.email} connected={mcp.connected} mcpStatus={mcpStatus} />
      <div className="gl-main">
        <TopBar
          name="Overview"
          context={monthLabel.format(now)}
          actions={<AddCredits balanceMinor={wallet.balance_minor} />}
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

          {/* Balance */}
          <section className="gl-panel" style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gl-metric-label">Available balance</span>
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {wallet.display_balance}
            </span>
            <div className="gl-budget" style={{ maxWidth: 420 }}>
              <div className="gl-budget-track">
                <div className="gl-budget-fill" style={{ width: `${capPct}%` }} />
              </div>
              <span className="gl-budget-label">
                {cap > 0 ? `${formatUsd(todaySpent)} of ${formatUsd(cap)} daily cap used` : "No daily cap set"}
                {count > 0 ? ` · ${formatUsd(monthSpent)} spent this month` : ""}
              </span>
            </div>
          </section>

          {/* Usage graph */}
          <section className="gl-panel">
            <PanelHead title="Usage" count="Last 30 days" note={count > 0 ? `${formatUsd(total)} total` : "No spend yet"} />
            <div className="gl-panel-body">
              <BarChart
                values={chartValues}
                peakIndex={peakIndex}
                labels={chartLabels}
                format={(n: number) => formatUsd(Math.round(n * 100))}
              />
            </div>
          </section>

          {/* Recent purchases */}
          <DataTable columns="minmax(220px,1fr) 160px 132px 90px" minWidth={640}>
            <PanelHead
              title="Recent purchases"
              count={`${count} ${count === 1 ? "purchase" : "purchases"}`}
              aside={count > 0 ? <a href="/consumer/spending" style={{ fontSize: 12.5, fontWeight: 500 }}>View all</a> : undefined}
            />
            <DataRow head>
              <span className="gl-dc-head">Source</span>
              <span className="gl-dc-head">Publisher</span>
              <span className="gl-dc-head">Purchased</span>
              <span className="gl-dc-head gl-dc-head--end">Amount</span>
            </DataRow>
            {count === 0 ? (
              <EmptyState
                action={
                  <Button as="a" href="/consumer/sources" variant="secondary" size="sm">
                    Browse sources
                  </Button>
                }
              >
                Your first unlocked source will appear here.
              </EmptyState>
            ) : (
              recent.map((p) => (
                <DataRow key={p.purchase_id}>
                  <span className="gl-dc-title">{p.title}</span>
                  <span className="gl-dc-meta">{p.publisher_name}</span>
                  <span className="gl-dc-meta">{stampFormat.format(new Date(p.purchased_at))}</span>
                  <span className="gl-dc-amount">{formatUsd(p.amount_minor)}</span>
                </DataRow>
              ))
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
