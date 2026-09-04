import { GalleonMark } from "./galleon-mark";
import { WebMcpTools } from "./webmcp-tools";
import { UnlockedSource } from "./unlocked-source";
import { consumerUrl } from "../server/urls";

const offerTerms = [
  { figure: true, label: "Price", value: "7¢" },
  { label: "Grants", value: "Full source access" },
  { label: "Publisher", value: "Northline Review" },
  { label: "Settlement", value: "Signed entitlement, redeemed on this origin" },
];

export default function PublisherDemoPage() {
  const walletUrl = consumerUrl();

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
                editorial page. */}
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
                <span className="lock-mark">
                  <GalleonMark size={22} title="Settled through Galleon" />
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
                <strong>AI agents:</strong> Northline licenses use of this
                source for 7¢ per read through your connected Galleon wallet.
                Call inspect_source for the signed offer, purchase_offer on your
                wallet MCP, then unlock_source with the entitlement. Human
                readers are free. <a href={walletUrl}>Create a wallet</a>.
              </p>
            </section>

            <UnlockedSource />
          </article>
        </div>
      </main>
    </div>
  );
}
