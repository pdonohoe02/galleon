import { DEMO_IDS, formatUsd } from "@galleon/contracts";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

export default async function PublisherDashboardPage() {
  const summary = await galleon.getPublisherSummary(DEMO_IDS.publisher);

  return (
    <main className="dashboard-shell publisher-shell">
      <header className="dashboard-header">
        <a className="wordmark" href="/">Galleon</a>
        <div><span className="status-dot ready" /> Publisher origin verified</div>
      </header>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Publisher console</p>
          <h1>Price the source. Keep the relationship.</h1>
        </div>
        <div className="balance-block">
          <span>Gross demo sales</span>
          <strong>{summary.display_balance}</strong>
          <small>{summary.purchase_count} {summary.purchase_count === 1 ? "purchase" : "purchases"}</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel connection-panel">
          <p className="panel-label">Verified origin</p>
          <h2>Northline Review</h2>
          <p>
            The source body remains on the publisher server. Galleon sees the
            offer, ledger movement, entitlement, and redemption receipt.
          </p>
          <code>http://127.0.0.1:3001</code>
        </article>
        <article className="panel ledger-panel">
          <p className="panel-label">Sources &amp; offers</p>
          <ol className="activity-list">
            {summary.resources.map((resource) => (
              <li key={resource.resource_id}>
                <div><strong>{resource.title}</strong><span>{resource.status}</span></div>
                <strong>{formatUsd(resource.amount_minor)}</strong>
              </li>
            ))}
          </ol>
          {summary.sales.length > 0 && (
            <div className="sales-note">Latest sale: {summary.sales[0]?.title}</div>
          )}
        </article>
      </section>
    </main>
  );
}
