import { DEMO_IDS, formatUsd } from "@galleon/contracts";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

const publisherOrigin =
  process.env.GALLEON_PUBLISHER_ORIGIN ?? "http://127.0.0.1:3001";

/** `offer_available` reads as "Offer available" — the tag spells the state out. */
function statusLabel(status: string): string {
  const words = status.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function PublisherDashboardPage() {
  const summary = await galleon.getPublisherSummary(DEMO_IDS.publisher);
  const latestSale = summary.sales[0];

  return (
    <div className="gl-shell" data-gl-theme="publisher">
      <header className="gl-masthead gl-masthead--solid">
        <div className="gl-width">
          <div className="gl-masthead-left">
            <a className="gl-wordmark" href="/">
              Galleon
            </a>
            <span className="gl-surface-chip">Publishers</span>
          </div>
          <span className="gl-status">Publisher origin verified</span>
        </div>
      </header>

      <main>
        <div className="gl-page">
          <section className="gl-page-head">
            <h1 className="gl-display">
              Price the source. Keep the relationship.
            </h1>
            <div className="gl-balance">
              <span className="gl-balance-label">Gross demo sales</span>
              <span className="gl-balance-value">
                {summary.display_balance}
              </span>
              <span className="gl-balance-caption">
                {summary.purchase_count}{" "}
                {summary.purchase_count === 1 ? "purchase" : "purchases"}
              </span>
            </div>
          </section>

          <section className="gl-flush">
            <div className="gl-flush-panel">
              <div className="gl-detail-copy">
                <div className="gl-detail-title">
                  <h2>Northline Review</h2>
                  <span className="gl-tag">Origin verified</span>
                </div>
                <p>
                  The source body remains on the publisher server. Galleon sees
                  the offer, ledger movement, entitlement, and redemption
                  receipt.
                </p>
              </div>
              <div className="gl-inline-value-group">
                <span className="gl-inline-label">Origin</span>
                <span className="gl-inline-value">{publisherOrigin}</span>
              </div>
            </div>

            <div className="gl-flush-head">
              <h2 className="gl-section-heading">Sources &amp; offers</h2>
              <span className="gl-meta">
                {summary.resources.length}{" "}
                {summary.resources.length === 1 ? "source" : "sources"} ·{" "}
                {summary.purchase_count} sold
              </span>
            </div>

            <div className="gl-row gl-row--head gl-sources-row">
              <span>Source</span>
              <span>Status</span>
              <span className="gl-align-end">Price</span>
            </div>

            {summary.resources.map((resource) => (
              <div className="gl-row gl-sources-row" key={resource.resource_id}>
                <span className="gl-cell-title">{resource.title}</span>
                <span>
                  <span className="gl-tag gl-tag--row">
                    {statusLabel(resource.status)}
                  </span>
                </span>
                <span className="gl-cell-amount">
                  {formatUsd(resource.amount_minor)}
                </span>
              </div>
            ))}

            {latestSale && (
              <div className="gl-flush-note">
                <span>Latest sale</span>
                <strong>{latestSale.title}</strong>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="gl-footer gl-footer--solid">
        <div className="gl-width">
          <span>Galleon settles in demo credits. No real money moves.</span>
        </div>
      </footer>
    </div>
  );
}
