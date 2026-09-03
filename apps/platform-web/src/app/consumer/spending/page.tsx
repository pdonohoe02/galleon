import { formatUsd } from "@galleon/contracts";
import { Button, Canvas, DataRow, DataTable, EmptyState, PanelHead, Segmented, TopBar } from "@galleon/ui";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { WalletSidebar } from "../wallet-nav";

export const dynamic = "force-dynamic";

const stampFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default async function SpendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  if (!user.wallet_id) {
    await revokeSession();
    redirect("/consumer/sign-in?error=wrong_surface");
  }

  const [purchases, mcp] = await Promise.all([
    galleon.getConsumerPurchases(user.wallet_id),
    galleon.getMcpConnection(user.id),
  ]);
  const mcpStatus = mcp.connected ? "Codex connected" : mcp.has_token ? "Awaiting connection" : "Agent not connected";
  const total = purchases.reduce((sum, p) => sum + p.amount_minor, 0);
  const count = purchases.length;

  return (
    <div className="gl-app">
      <WalletSidebar active="spending" email={user.email} connected={mcp.connected} mcpStatus={mcpStatus} />
      <div className="gl-main">
        <TopBar name="Spending" context="All purchases" />
        <Canvas>
          <DataTable columns="minmax(220px,1fr) 148px 96px 128px 84px" minWidth={760}>
            <PanelHead
              title="Spending history"
              count={`${count} ${count === 1 ? "purchase" : "purchases"} · ${formatUsd(total)}`}
              aside={<Segmented items={[{ label: "All", active: true }, { label: "This week" }, { label: "By publisher" }]} />}
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
                  <Button as="a" href="/consumer/sources" variant="secondary" size="sm">
                    Browse sources
                  </Button>
                }
              >
                Your first unlocked source will appear here.
              </EmptyState>
            ) : (
              purchases.map((p) => (
                <DataRow key={p.purchase_id}>
                  <span className="gl-dc-title">{p.title}</span>
                  <span className="gl-dc-meta">{p.publisher_name}</span>
                  <span className="gl-dc-meta">Codex</span>
                  <span className="gl-dc-meta">{stampFormat.format(new Date(p.purchased_at))}</span>
                  <span className="gl-dc-amount">{formatUsd(p.amount_minor)}</span>
                </DataRow>
              ))
            )}
          </DataTable>
        </Canvas>
      </div>
    </div>
  );
}
