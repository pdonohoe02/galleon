import { DEMO_IDS, formatUsd } from "@galleon/contracts";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

const publisherOrigin =
  process.env.GALLEON_PUBLISHER_ORIGIN ?? "http://127.0.0.1:3001";
const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

/** `offer_available` reads as "Offer available" — the tag spells the state out. */
function statusLabel(status: string): string {
  const words = status.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function statusTone(status: string): string {
  if (status === "active") return "gl-tag--positive";
  if (status === "paused") return "gl-tag--warning";
  return "gl-tag--neutral";
}

export default async function PublisherDashboardPage() {
  const summary = await galleon.getPublisherSummary(DEMO_IDS.publisher);
  const latestSale = summary.sales[0];

  return (
    // Publisher surface: the data-gl-theme swaps the accent from ocean to mint,
    // which is how a console is told apart from a wallet at a glance.
    <div className="galleon-ds" data-gl-theme="publisher">
      <div className="gl-shell">
        <header className="gl-masthead">
          <a className="gl-wordmark" href={marketingUrl}>
            Galleon
          </a>
          <nav className="gl-masthead__nav">
            <a href="/publishers" aria-current="page">
              Console
            </a>
            <a href={publisherOrigin}>Origin</a>
          </nav>
          <div className="gl-masthead__aside">
            <span className="gl-status">
              <span className="gl-status__dot gl-status__dot--ready" />
              Publisher origin verified
            </span>
          </div>
        </header>

        <div className="gl-page-header">
          <div className="gl-page-header__main">
            <p className="gl-eyebrow gl-eyebrow--accent">Publisher console</p>
            <h1 className="gl-display gl-display--3">
              Price the source. Keep the relationship.
            </h1>
          </div>
          <div className="gl-page-header__aside">
            <div className="gl-balance">
              <span className="gl-balance__label">Gross sales</span>
              <span className="gl-balance__value gl-amount gl-amount--hero">
                {summary.display_balance}
              </span>
              <span className="gl-balance__caption">
                {summary.purchase_count}{" "}
                {summary.purchase_count === 1 ? "purchase" : "purchases"}
              </span>
            </div>
          </div>
        </div>

        <section className="gl-section">
          <div className="gl-section__head">
            <p className="gl-eyebrow gl-eyebrow--soft">Northline Review</p>
            <span className="gl-section__aside">
              <span className="gl-tag gl-tag--positive">Origin verified</span>
            </span>
          </div>
          <p className="gl-lede gl-lede--body">
            The source body remains on the publisher server. Galleon sees the
            offer, ledger movement, entitlement, and redemption receipt.
          </p>
          <div className="gl-snippet gl-snippet--inline">
            <span className="gl-snippet__label">Publisher origin</span>
            <div className="gl-snippet__row">
              <span className="gl-snippet__value">{publisherOrigin}</span>
            </div>
          </div>
        </section>

        {latestSale && (
          <div className="gl-section">
            <div className="gl-notice gl-notice--success">
              <div className="gl-notice__copy">
                <span className="gl-notice__title">Latest sale</span>
                <span>{latestSale.title}</span>
              </div>
            </div>
          </div>
        )}

        <section className="gl-section">
          <div className="gl-section__head">
            <p className="gl-eyebrow gl-eyebrow--soft">Sources &amp; offers</p>
            <span className="gl-section__aside">
              {summary.resources.length}{" "}
              {summary.resources.length === 1 ? "source" : "sources"} ·{" "}
              {summary.purchase_count} sold
            </span>
          </div>

          <div className="gl-ledger">
            <table className="gl-ledger__table">
              <caption className="gl-ledger__caption">
                Every source priced on this origin
              </caption>
              <thead>
                <tr>
                  <th className="gl-ledger__cell--start gl-ledger__cell--grow">
                    Source
                  </th>
                  <th className="gl-ledger__cell--start">Status</th>
                  <th className="gl-ledger__cell--end">Price</th>
                </tr>
              </thead>
              <tbody>
                {summary.resources.map((resource) => (
                  <tr key={resource.resource_id}>
                    <td className="gl-ledger__cell--grow">
                      <span className="gl-ledger__link">{resource.title}</span>
                    </td>
                    <td>
                      <span className={`gl-tag ${statusTone(resource.status)}`}>
                        {statusLabel(resource.status)}
                      </span>
                    </td>
                    <td className="gl-ledger__cell--end">
                      <span className="gl-amount gl-amount--sm">
                        {formatUsd(resource.amount_minor)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
