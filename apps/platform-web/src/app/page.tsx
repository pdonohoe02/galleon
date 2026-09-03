import { KnowledgeGraph } from "./knowledge-graph";

// The links below come from the environment. Without this the page is
// prerendered during `next build` inside the image, where none of the
// GALLEON_*_URL vars exist, so the localhost fallbacks get baked in and
// cached for a year. consumer/ and publishers/ already opt out the same way.
export const dynamic = "force-dynamic";

const consumerUrl =
  process.env.GALLEON_CONSUMER_URL ?? "http://app.galleon.localhost:3000";
const publisherUrl =
  process.env.GALLEON_PUBLISHER_URL ??
  "http://publishers.galleon.localhost:3000";
const publisherDemoUrl =
  process.env.GALLEON_PUBLISHER_DEMO_URL ?? "http://127.0.0.1:3001";

const steps = [
  {
    body: "Checks what the source covers and what it costs.",
    title: "Inspect",
  },
  {
    body: "Pays the publisher's price from the budget you set.",
    title: "Purchase",
  },
  { body: "Uses the source to answer the question you asked.", title: "Read" },
];

/* Illustrative figures for the marketing statement — not the live ledger. */
const sampleStatement = [
  {
    amount: "$0.07",
    publisher: "Northline Review",
    title: "The freight data nobody published",
  },
  {
    amount: "$0.12",
    publisher: "Harbor Index",
    title: "Port throughput, Q2 revision",
  },
  {
    amount: "$0.04",
    publisher: "Verso Papers",
    title: "Interview: the last dispatcher",
  },
];

const sampleSales = [
  { amount: "+$0.07", title: "The freight data nobody published" },
  { amount: "+$0.12", title: "Port throughput, Q2 revision" },
];

const assurances = [
  {
    body: "Codex cannot spend past it. Raise or lower the cap in your wallet at any time.",
    title: "Your budget is a hard cap",
  },
  {
    body: "The source, the publisher, the amount, and the signed entitlement that unlocked it.",
    title: "Every purchase has a receipt",
  },
  {
    body: "Galleon never hosts the content. Access is granted on the publisher's own origin, at their canonical URL.",
    title: "Publishers keep the page",
  },
];

export default function MarketingPage() {
  return (
    <div className="glm">
      <div className="glm-night">
        <KnowledgeGraph />
        <div className="glm-graph-scrim" aria-hidden="true" />

        <header className="glm-nav">
          <div className="glm-width">
            <a className="glm-wordmark" href="/">
              Galleon
            </a>
            <nav className="glm-nav-links" aria-label="Primary navigation">
              <a
                className="glm-nav-link glm-nav-link--publisher"
                href={publisherUrl}
              >
                Publisher login
              </a>
              <a className="glm-nav-link" href={consumerUrl}>
                Log in
              </a>
              <a className="glm-signup" href={consumerUrl}>
                Sign up
              </a>
            </nav>
          </div>
        </header>

        <section className="glm-hero">
          <h1 className="glm-rise">How Codex pays for knowledge.</h1>
          <p className="glm-rise" style={{ animationDelay: "0.08s" }}>
            Set a budget. Codex buys the sources it needs at the price each
            publisher sets. Publishers keep the page and get paid per read.
          </p>
          <div
            className="glm-hero-actions glm-rise"
            style={{ animationDelay: "0.16s" }}
          >
            <a className="glm-cta" href={consumerUrl}>
              Sign up
            </a>
          </div>
        </section>

        <section
          aria-label="How a purchase works"
          className="glm-steps glm-rise"
          id="how-it-works"
          style={{ animationDelay: "0.24s" }}
        >
          {steps.map((step) => (
            <div className="glm-step" key={step.title}>
              <strong>{step.title}</strong>
              <small>{step.body}</small>
            </div>
          ))}
        </section>
      </div>

      <main>
        <div className="glm-body">
          <section className="glm-split">
            <div className="glm-split-copy">
              <h2>Every source Codex reads, on one statement.</h2>
              <p>
                Set a cap and Galleon holds to it. Each purchase records what
                was bought, from whom, and for how much, with a link back to the
                publisher&apos;s own page.
              </p>
              <a className="glm-split-link" href={consumerUrl}>
                See a wallet →
              </a>
            </div>

            <div className="glm-card">
              <div className="glm-statement-head">
                <div>
                  <span>Spent this month</span>
                  <strong>$4.62</strong>
                </div>
                <span>of $25.00 budget</span>
              </div>
              <div className="glm-meter">
                <span style={{ width: "18.5%" }} />
              </div>
              <div className="glm-statement-row glm-statement-row--head">
                <span>Source</span>
                <span>Amount</span>
              </div>
              {sampleStatement.map((entry) => (
                <div className="glm-statement-row" key={entry.title}>
                  <span className="glm-statement-source">
                    {entry.title}
                    <small>{entry.publisher}</small>
                  </span>
                  <span className="glm-statement-amount">{entry.amount}</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-label="How settlement works" className="glm-trust">
            {assurances.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </section>
        </div>

        <section aria-label="For publishers" className="glm-publishers">
          <div className="glm-publishers-inner">
            <div className="glm-publishers-copy">
              <h2>Writing is worth something. Charge for it.</h2>
              <p>
                Register a source, set what access to it costs, and follow every
                sale as it settles. Your page, your reader, your price.
              </p>
              <div className="glm-publishers-actions">
                <a className="glm-button-mint" href={publisherUrl}>
                  Publish with Galleon
                </a>
                <a
                  className="glm-button-mint glm-button-mint--quiet"
                  href={publisherUrl}
                >
                  Publisher login
                </a>
              </div>
            </div>

            <div className="glm-card glm-card--publisher">
              <div className="glm-sales-head">
                <span>Gross sales, this month</span>
                <strong>$182.40</strong>
              </div>
              {sampleSales.map((sale) => (
                <div className="glm-sales-row" key={sale.title}>
                  <span>{sale.title}</span>
                  <span>{sale.amount}</span>
                </div>
              ))}
              <div className="glm-sales-note">
                Settled to Northline Review, 2 minutes ago
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="glm-footer">
        <div className="glm-footer-inner">
          <div className="glm-footer-grid">
            <div className="glm-footer-brand">
              <span className="glm-wordmark">Galleon</span>
              <p>
                A payment rail between AI agents and the people who write what
                they read.
              </p>
            </div>
            <div className="glm-footer-col">
              <span>Product</span>
              <a href={consumerUrl}>Wallet</a>
              <a href="#how-it-works">How it works</a>
              <a href={publisherDemoUrl}>Sources</a>
            </div>
            <div className="glm-footer-col">
              <span>Publishers</span>
              <a href={publisherUrl}>Publisher login</a>
              <a href={publisherUrl}>Register a source</a>
              <a href={publisherDemoUrl}>See it on a page</a>
            </div>
            <div className="glm-footer-col">
              <span>Company</span>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
