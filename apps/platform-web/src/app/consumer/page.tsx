import { DEMO_IDS, formatUsd } from "@galleon/contracts";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

export default async function ConsumerDashboardPage() {
  const [wallet, purchases] = await Promise.all([
    galleon.getWalletSummary(DEMO_IDS.consumerWallet),
    galleon.getConsumerPurchases(DEMO_IDS.consumerWallet),
  ]);

  return (
    <main className="dashboard-shell consumer-shell">
      <header className="dashboard-header">
        <a className="wordmark" href="/">Galleon</a>
        <div><span className="status-dot ready" /> Wallet MCP ready</div>
      </header>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Consumer wallet</p>
          <h1>Your sources, paid precisely.</h1>
        </div>
        <div className="balance-block">
          <span>Demo balance</span>
          <strong>{wallet.display_balance}</strong>
          <small>Non-withdrawable credits</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel connection-panel">
          <p className="panel-label">Agent connection</p>
          <h2>Galleon wallet MCP</h2>
          <p>
            The MCP holds the trusted wallet context, validates signed publisher
            offers, and returns publisher-scoped entitlements.
          </p>
          <code>http://127.0.0.1:3100/mcp</code>
        </article>
        <article className="panel ledger-panel">
          <p className="panel-label">Recent purchases</p>
          {purchases.length === 0 ? (
            <div className="empty-state">
              <span>0</span><p>Your first unlocked source will appear here.</p>
            </div>
          ) : (
            <ol className="activity-list">
              {purchases.map((purchase) => (
                <li key={purchase.purchase_id}>
                  <div>
                    <strong>{purchase.title}</strong>
                    <span>{purchase.publisher_name}</span>
                  </div>
                  <div>
                    <strong>{formatUsd(purchase.amount_minor)}</strong>
                    <time>{new Date(purchase.purchased_at).toLocaleString("en-US")}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>
    </main>
  );
}
