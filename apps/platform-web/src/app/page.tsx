const consumerUrl =
  process.env.GALLEON_CONSUMER_URL ?? "http://app.galleon.localhost:3000";
const publisherUrl =
  process.env.GALLEON_PUBLISHER_URL ??
  "http://publishers.galleon.localhost:3000";

export default function MarketingPage() {
  return (
    <main className="marketing-shell">
      <nav className="masthead" aria-label="Primary navigation">
        <a className="wordmark" href="/">
          Galleon
        </a>
        <span className="demo-flag">Demo credits · no real money</span>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">The payment rail for sourced answers</p>
          <h1>Agents should not merely cite the web. They should fund it.</h1>
          <p className="lede">
            Galleon lets an agent inspect, purchase, and unlock a source while
            the publisher keeps the content, customer experience, and canonical
            URL.
          </p>
        </div>

        <div className="passage" aria-label="Galleon purchase flow">
          <div className="passage-node">
            <span>01</span>
            <strong>Offer</strong>
            <small>Free metadata</small>
          </div>
          <div className="passage-line" />
          <div className="passage-node">
            <span>02</span>
            <strong>Approve</strong>
            <small>Exact price</small>
          </div>
          <div className="passage-line" />
          <div className="passage-node">
            <span>03</span>
            <strong>Unlock</strong>
            <small>Signed access</small>
          </div>
        </div>
      </section>

      <section className="portal-grid" aria-labelledby="choose-portal">
        <header>
          <p className="eyebrow" id="choose-portal">
            Choose your side of the ledger
          </p>
        </header>
        <a className="portal-card consumer-card" href={consumerUrl}>
          <span className="portal-index">C</span>
          <h2>Use Galleon</h2>
          <p>Connect your agent, set a budget, and review purchased sources.</p>
          <span className="portal-action">Open wallet →</span>
        </a>
        <a className="portal-card publisher-card" href={publisherUrl}>
          <span className="portal-index">P</span>
          <h2>Publish with Galleon</h2>
          <p>Register sources, set access terms, and follow every sale.</p>
          <span className="portal-action">Open publisher console →</span>
        </a>
      </section>
    </main>
  );
}
