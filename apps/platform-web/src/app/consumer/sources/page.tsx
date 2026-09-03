import { formatUsd } from "@galleon/contracts";
import { Canvas, DataRow, DataTable, EmptyState, PanelHead, Tag, TopBar } from "@galleon/ui";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { WalletSidebar } from "../wallet-nav";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  if (!user.wallet_id) {
    await revokeSession();
    redirect("/consumer/sign-in?error=wrong_surface");
  }

  const [sources, mcp] = await Promise.all([
    galleon.listSources(user.wallet_id),
    galleon.getMcpConnection(user.id),
  ]);
  const mcpStatus = mcp.connected ? "Codex connected" : mcp.has_token ? "Awaiting connection" : "Agent not connected";
  const publishers = new Set(sources.map((s) => s.publisher_name)).size;

  return (
    <div className="gl-app">
      <WalletSidebar active="sources" email={user.email} connected={mcp.connected} mcpStatus={mcpStatus} />
      <div className="gl-main">
        <TopBar name="Sources" context="Catalog" />
        <Canvas>
          <p style={{ margin: "0 2px", color: "var(--gl-text-muted)", fontSize: 15, lineHeight: 1.55, maxWidth: "62ch" }}>
            Sources your agent can buy. When it purchases one, Galleon pays the publisher&apos;s listed price from
            your wallet and returns a signed, citable receipt — the source stays on the publisher&apos;s site.
          </p>

          <DataTable columns="minmax(240px,1fr) 170px 120px 96px" minWidth={680}>
            <PanelHead
              title="Available sources"
              count={`${sources.length} ${sources.length === 1 ? "source" : "sources"} · ${publishers} ${publishers === 1 ? "publisher" : "publishers"}`}
            />
            <DataRow head>
              <span className="gl-dc-head">Source</span>
              <span className="gl-dc-head">Publisher</span>
              <span className="gl-dc-head">Status</span>
              <span className="gl-dc-head gl-dc-head--end">Price</span>
            </DataRow>
            {sources.length === 0 ? (
              <EmptyState>No sources are listed yet.</EmptyState>
            ) : (
              sources.map((s) => (
                <DataRow key={s.resource_id}>
                  <span className="gl-dc-title">{s.title}</span>
                  <span className="gl-dc-meta">{s.publisher_name}</span>
                  <span>{s.purchased ? <Tag row>Unlocked</Tag> : <span className="gl-dc-meta">Available</span>}</span>
                  <span className="gl-dc-amount">{formatUsd(s.amount_minor)}</span>
                </DataRow>
              ))
            )}
          </DataTable>

          <span style={{ padding: "2px 2px 8px", color: "var(--gl-text-meta)", fontSize: 12 }}>
            Your agent buys these over MCP — nothing to click here. Galleon settles in demo credits.
          </span>
        </Canvas>
      </div>
    </div>
  );
}
