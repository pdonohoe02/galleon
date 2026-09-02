import { formatUsd } from "@galleon/contracts";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { signOut } from "./actions";
import { McpSetup } from "./mcp-setup";

export const dynamic = "force-dynamic";

const mcpEndpoint = process.env.GALLEON_MCP_URL ?? "http://127.0.0.1:3100/mcp";
const publisherDemoUrl =
  process.env.GALLEON_PUBLISHER_DEMO_URL ?? "http://127.0.0.1:3001";
const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

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
    // Broadsheet Galleon design system. `.galleon-ds` scopes the theme;
    // consumer surface keeps the default ocean accent (no data-gl-theme).
    <div className="galleon-ds">
      <div className="gl-shell">
        <header className="gl-masthead">
          <a className="gl-wordmark" href={marketingUrl}>
            Galleon
          </a>
          <nav className="gl-masthead__nav">
            <a href="/consumer" aria-current="page">
              Wallet
            </a>
            <a href={publisherDemoUrl}>Sources</a>
          </nav>
          <div className="gl-masthead__aside">
            <span className="gl-status">
              <span className="gl-status__dot gl-status__dot--ready" />
              Wallet MCP connected
            </span>
            <span>{user.email}</span>
            <form action={signOut}>
              <button className="gl-button gl-button--quiet gl-button--sm" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        {!user.onboarded ? (
          <div className="gl-notice" role="status" style={{ marginBlockEnd: "var(--gl-space-6)" }}>
            <div className="gl-notice__copy">
              <span>
                <strong>Finish setting up your wallet.</strong> Add test credits
                and connect your agent to start buying sources.
              </span>
            </div>
            <a className="gl-button gl-button--primary gl-button--sm" href="/consumer/onboarding">
              Finish setup
            </a>
          </div>
        ) : null}

        <div className="gl-page-header">
          <div className="gl-page-header__main">
            <p className="gl-eyebrow gl-eyebrow--accent">Consumer wallet</p>
            <h1 className="gl-display gl-display--3">
              Your sources, paid precisely.
            </h1>
          </div>
          <div className="gl-page-header__aside">
            <div className="gl-balance">
              <span className="gl-balance__label">Balance</span>
              <span className="gl-balance__value gl-amount gl-amount--hero">
                {wallet.display_balance}
              </span>
              <span className="gl-balance__caption">Non-withdrawable credits</span>
            </div>
          </div>
        </div>

        <section className="gl-section">
          <div className="gl-section__head">
            <p className="gl-eyebrow gl-eyebrow--soft">Wallet MCP</p>
            <span className="gl-section__aside">
              <span className="gl-tag gl-tag--positive">Ready</span>
            </span>
          </div>
          <p className="gl-lede gl-lede--body">
            The MCP holds this wallet&apos;s context, validates signed publisher
            offers, and returns publisher-scoped entitlements. Generate a token
            and drop the block into Codex&apos;s{" "}
            <span className="gl-input--mono" style={{ fontSize: "0.9em" }}>
              ~/.codex/config.toml
            </span>
            .
          </p>
          <McpSetup endpoint={mcpEndpoint} compact />
        </section>

        <section className="gl-section">
          <div className="gl-section__head">
            <p className="gl-eyebrow gl-eyebrow--soft">Purchases</p>
            <span className="gl-section__aside">
              {purchases.length}{" "}
              {purchases.length === 1 ? "purchase" : "purchases"} ·{" "}
              {formatUsd(spentMinor)} spent
            </span>
          </div>

          {purchases.length === 0 ? (
            <div className="gl-empty">
              <span className="gl-empty__figure" aria-hidden="true">
                0
              </span>
              <div className="gl-empty__copy">
                <p>Your first unlocked source will appear here.</p>
                <a className="gl-button gl-button--secondary gl-button--sm" href={publisherDemoUrl}>
                  Browse Northline Review
                </a>
              </div>
            </div>
          ) : (
            <div className="gl-ledger">
              <table className="gl-ledger__table">
                <caption className="gl-ledger__caption">
                  Every source this wallet has unlocked
                </caption>
                <thead>
                  <tr>
                    <th className="gl-ledger__cell--start gl-ledger__cell--grow">
                      Source
                    </th>
                    <th className="gl-ledger__cell--start">Publisher</th>
                    <th className="gl-ledger__cell--start">Purchased</th>
                    <th className="gl-ledger__cell--end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.purchase_id}>
                      <td className="gl-ledger__cell--grow">
                        <span className="gl-ledger__link">{purchase.title}</span>
                      </td>
                      <td>{purchase.publisher_name}</td>
                      <td>
                        {purchasedAtFormat.format(
                          new Date(purchase.purchased_at),
                        )}
                      </td>
                      <td className="gl-ledger__cell--end">
                        <span className="gl-amount gl-amount--sm">
                          {formatUsd(purchase.amount_minor)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
