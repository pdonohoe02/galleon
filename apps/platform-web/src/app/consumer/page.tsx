export default function ConsumerDashboardPage() {
  return (
    <main className="dashboard-shell consumer-shell">
      <header className="dashboard-header">
        <a className="wordmark" href="/">
          Galleon
        </a>
        <div>
          <span className="status-dot" /> Wallet MCP not connected
        </div>
      </header>

      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Consumer wallet</p>
          <h1>Your sources, paid precisely.</h1>
        </div>
        <div className="balance-block">
          <span>Demo balance</span>
          <strong>$5.00</strong>
          <small>Non-withdrawable credits</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel connection-panel">
          <p className="panel-label">Agent connection</p>
          <h2>Connect Galleon to Codex</h2>
          <p>
            The wallet MCP will handle identity and purchase approval outside
            publisher pages.
          </p>
          <button type="button" disabled>
            Connection setup coming next
          </button>
        </article>
        <article className="panel ledger-panel">
          <p className="panel-label">Recent purchases</p>
          <div className="empty-state">
            <span>0</span>
            <p>Your first unlocked source will appear here.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
