// Keep platform navigation on the origin that served this page. Relative URLs
// preserve the active protocol, hostname, and port in every environment.
const consumerUrl = "/consumer";
const publisherUrl = "/publishers";

const passage = [
  { caption: "Free metadata", label: "Offer", step: "01" },
  { caption: "Exact price", label: "Approve", step: "02" },
  { caption: "Signed access", label: "Unlock", step: "03" },
];

export default function MarketingPage() {
  return (
    <div className="gl-shell gl-shell--marketing">
      <header className="gl-masthead">
        <div className="gl-width">
          <a className="gl-wordmark" href="/">
            Galleon
          </a>
          <nav className="gl-masthead-right" aria-label="Primary navigation">
            <a className="gl-nav-link" href={consumerUrl}>
              Wallet
            </a>
            <a className="gl-nav-link" href={publisherUrl}>
              Publishers
            </a>
            <span className="gl-demo-flag">Demo credits · no real money</span>
          </nav>
        </div>
      </header>

      <main>
        <div className="gl-width">
          <section className="gl-hero">
            <div className="gl-hero-copy">
              <h1 className="gl-display gl-display--hero">
                Agents should not merely cite the web. They should fund it.
              </h1>
              <p className="gl-lede">
                Galleon lets an agent inspect, purchase, and unlock a source
                while the publisher keeps the content, customer experience, and
                canonical URL.
              </p>
            </div>
            <div className="gl-actions">
              <a className="gl-button" href={consumerUrl}>
                Open wallet
              </a>
              <a className="gl-button gl-button--secondary" href={publisherUrl}>
                Publish with Galleon
              </a>
            </div>
          </section>

          <section aria-label="Galleon purchase flow">
            <div className="gl-card gl-passage">
              {passage.map((node) => (
                <div className="gl-passage-node" key={node.step}>
                  <span>{node.step}</span>
                  <strong>{node.label}</strong>
                  <small>{node.caption}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="gl-portals" aria-labelledby="choose-portal">
            <h2 className="gl-section-heading" id="choose-portal">
              Choose your side of the ledger
            </h2>
            <div className="gl-portal-grid">
              <a className="gl-card gl-portal-card" href={consumerUrl}>
                <span className="gl-portal-mark" aria-hidden="true">
                  C
                </span>
                <h3>Use Galleon</h3>
                <p>
                  Connect your agent, set a budget, and review purchased
                  sources.
                </p>
                <span className="gl-portal-action">Open wallet →</span>
              </a>
              <a
                className="gl-card gl-portal-card"
                data-gl-theme="publisher"
                href={publisherUrl}
              >
                <span className="gl-portal-mark" aria-hidden="true">
                  P
                </span>
                <h3>Publish with Galleon</h3>
                <p>
                  Register sources, set access terms, and follow every sale.
                </p>
                <span className="gl-portal-action">
                  Open publisher console →
                </span>
              </a>
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
