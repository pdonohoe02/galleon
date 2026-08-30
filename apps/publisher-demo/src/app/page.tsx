import { WebMcpTools } from "./webmcp-tools";
import { UnlockedSource } from "./unlocked-source";

const offerTerms = [
  { figure: true, label: "Price", value: "7¢" },
  { label: "Grants", value: "Full source access" },
  { label: "Publisher", value: "Northline Review" },
  { label: "Settlement", value: "Signed entitlement, redeemed on this origin" },
];

export default function PublisherDemoPage() {
  return (
    <div className="publication-shell">
      <header className="publication-header">
        <div className="publication-header-inner">
          <div className="publication-identity">
            <a className="publication-name" href="/">
              Northline Review
            </a>
            <span className="publication-tagline">
              Independent analysis of digital markets
            </span>
          </div>
          <WebMcpTools />
        </div>
      </header>

      <main>
        <div className="article-shell">
          <aside className="issue-note">
            <span>Research note 08—26</span>
            <strong>7¢</strong>
            <small>Full source access</small>
          </aside>

          <article className="article-copy">
            <p className="article-kicker">Agent commerce</p>
            <h1>What changes when a source can quote its own price?</h1>
            <p className="standfirst">
              A field study of 42 independent research publishers suggests that
              machine-readable, one-off access can complement subscriptions when
              agents need a single authoritative source.
            </p>
            <div className="byline">
              <span>Mara Venn</span>
              <span className="dot" aria-hidden="true">
                ·
              </span>
              <time dateTime="2026-08-28">28 August 2026</time>
            </div>

            <section className="abstract">
              <h2>Abstract</h2>
              <p>
                This report examines how price, provenance, citation terms, and
                narrow access rights affect an agent&apos;s decision to purchase
                a publisher-hosted source. The full note includes the observed
                conversion ranges, interview methodology, and publisher cohort
                breakdown.
              </p>
            </section>

            {/* The register switch: Galleon's product language inside an
                editorial page. The offer is published for agents to read —
                there is deliberately nothing to click. */}
            <section className="locked-source" aria-labelledby="locked-heading">
              <div className="locked-head">
                <div>
                  <h2 id="locked-heading">
                    The evidence remains with Northline.
                  </h2>
                  <p>
                    Ask your agent to inspect this page&apos;s offer. After you
                    approve the exact price, Galleon returns a signed
                    entitlement that this publication can redeem.
                  </p>
                </div>
                <span className="lock-mark" aria-hidden="true">
                  ◇
                </span>
              </div>

              <dl className="offer-terms">
                {offerTerms.map((term) => (
                  <div key={term.label}>
                    <dt>{term.label}</dt>
                    <dd className={term.figure ? "figure" : undefined}>
                      {term.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="locked-note">
                This offer is published for agents to read. There is nothing to
                click.
              </p>
            </section>

            <UnlockedSource />
          </article>
        </div>
      </main>

      <footer className="publication-footer">
        <div className="publication-footer-inner">
          <span>Northline Review</span>
          <span>Independent analysis of digital markets</span>
        </div>
      </footer>
    </div>
  );
}
