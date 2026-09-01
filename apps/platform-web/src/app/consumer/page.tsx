import { formatUsd } from "@galleon/contracts";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { signOut } from "./actions";

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
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  if (!user.wallet_id) {
    // A session with no consumer wallet cannot use this surface. Revoke it
    // here rather than redirecting with it still valid, which would loop.
    // (revoke, not end: a page render cannot modify cookies.)
    await revokeSession();
    redirect("/consumer/sign-in?error=wrong_surface");
  }

  const [wallet, purchases] = await Promise.all([
    galleon.getWalletSummary(user.wallet_id),
    galleon.getConsumerPurchases(user.wallet_id),
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
          <div className="gl-masthead-right">
            <span className="gl-status">Wallet MCP ready</span>
            <span className="gl-masthead-user">{user.email}</span>
            <form action={signOut}>
              <button className="gl-button gl-button--quiet" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main>
        <div className="gl-page">
          <section className="gl-page-head">
            <h1 className="gl-display">Your sources, paid precisely.</h1>
            <div className="gl-balance">
              <span className="gl-balance-label">Balance</span>
              <span className="gl-balance-value">{wallet.display_balance}</span>
            </div>
          </section>

          {/* One surface: MCP panel, section heading, and ledger sit flush
              inside it, divided by rules. */}
          <section className="gl-flush">
            <div className="gl-flush-panel">
              <div className="gl-detail-copy">
                <div className="gl-detail-title">
                  <h2>Galleon wallet MCP</h2>
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
            </div>

            <div className="gl-flush-head">
              <h2 className="gl-section-heading">Recent purchases</h2>
              <span className="gl-meta">
                {purchases.length}{" "}
                {purchases.length === 1 ? "purchase" : "purchases"} ·{" "}
                {formatUsd(spentMinor)} spent
              </span>
            </div>

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
                    {purchasedAtFormat.format(new Date(purchase.purchased_at))}
                  </span>
                  <span className="gl-cell-amount">
                    {formatUsd(purchase.amount_minor)}
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
