import { DEMO_IDS, formatUsd } from "@galleon/contracts";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

const mcpEndpoint = process.env.GALLEON_MCP_URL ?? "http://127.0.0.1:3100/mcp";
const publisherDemoUrl =
  process.env.GALLEON_PUBLISHER_DEMO_URL ?? "http://127.0.0.1:3001";

const purchasedAtFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function ConsumerDashboardPage() {
  const [wallet, purchases] = await Promise.all([
    galleon.getWalletSummary(DEMO_IDS.consumerWallet),
    galleon.getConsumerPurchases(DEMO_IDS.consumerWallet),
  ]);

  const spentMinor = purchases.reduce(
    (total, purchase) => total + purchase.amount_minor,
    0,
  );

  return (
    <div className="gl-shell">
      <header className="gl-masthead gl-masthead--solid">
        <div className="gl-width">
          <div className="gl-masthead-left">
            <a className="gl-wordmark" href="/">
              Galleon
            </a>
            <span className="gl-surface-chip">Wallet</span>
          </div>
          <span className="gl-status">Wallet MCP ready</span>
        </div>
      </header>

      <main>
        <div className="gl-page">
          <section className="gl-page-head">
            <h1 className="gl-display">Your sources, paid precisely.</h1>
            <div className="gl-card gl-balance">
              <span className="gl-balance-label">Demo balance</span>
              <span className="gl-balance-value">{wallet.display_balance}</span>
              <span className="gl-balance-caption">
                Non-withdrawable credits
              </span>
            </div>
          </section>

          <section className="gl-card gl-detail-panel">
            <div className="gl-detail-copy">
              <div className="gl-detail-title">
                <h2 className="gl-panel-heading">Galleon wallet MCP</h2>
                <span className="gl-tag">Ready</span>
              </div>
              <p>
                The MCP holds the trusted wallet context, validates signed
                publisher offers, and returns publisher-scoped entitlements.
              </p>
            </div>
            <div className="gl-inline-value-group">
              <span className="gl-inline-label">Endpoint</span>
              <span className="gl-inline-value">{mcpEndpoint}</span>
            </div>
          </section>

          <section className="gl-section">
            <div className="gl-section-head">
              <h2 className="gl-section-heading">Recent purchases</h2>
              <span className="gl-meta">
                {purchases.length}{" "}
                {purchases.length === 1 ? "purchase" : "purchases"} ·{" "}
                {formatUsd(spentMinor)} spent
              </span>
            </div>

            <div className="gl-card gl-table">
              <div className="gl-row gl-row--head gl-purchases-row">
                <span>Source</span>
                <span>Publisher</span>
                <span>Purchased</span>
                <span className="gl-align-end">Amount</span>
              </div>

              {purchases.length === 0 ? (
                <div className="gl-empty">
                  <span className="gl-empty-mark" aria-hidden="true">
                    0
                  </span>
                  <p>Your first unlocked source will appear here.</p>
                  <a href={publisherDemoUrl}>Browse Northline Review →</a>
                </div>
              ) : (
                purchases.map((purchase) => (
                  <div
                    className="gl-row gl-purchases-row"
                    key={purchase.purchase_id}
                  >
                    <span className="gl-cell-title">{purchase.title}</span>
                    <span className="gl-cell-meta">
                      {purchase.publisher_name}
                    </span>
                    <span className="gl-cell-meta gl-tabular">
                      {purchasedAtFormat.format(
                        new Date(purchase.purchased_at),
                      )}
                    </span>
                    <span className="gl-cell-amount">
                      {formatUsd(purchase.amount_minor)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="gl-footer">
        <div className="gl-width">
          <span>Galleon settles in demo credits. No real money moves.</span>
        </div>
      </footer>
    </div>
  );
}
