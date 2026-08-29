export default function PublisherDashboardPage() {
  return (
    <main className="dashboard-shell publisher-shell">
      <header className="dashboard-header">
        <a className="wordmark" href="/">
          Galleon
        </a>
        <div>
          <span className="status-dot ready" /> Publisher demo active
        </div>
      </header>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Publisher console</p>
          <h1>Price the source. Keep the relationship.</h1>
        </div>
        <div className="balance-block">
          <span>Gross demo sales</span>
          <strong>$0.00</strong>
          <small>0 purchases</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel connection-panel">
          <p className="panel-label">Integration</p>
          <h2>One verified origin</h2>
          <p>
            Add the publisher SDK to expose offers and unlocks from your own
            source pages.
          </p>
          <code>paper.example</code>
        </article>
        <article className="panel ledger-panel">
          <p className="panel-label">Sources</p>
          <div className="empty-state">
            <span>2</span>
            <p>Seeded source records arrive with the ledger phase.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
