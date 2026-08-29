import { WebMcpTools } from "./webmcp-tools";
import { UnlockedSource } from "./unlocked-source";

export default function PublisherDemoPage() {
  return (
    <main>
      <header className="publication-header">
        <a className="publication-name" href="/">
          Northline Review
        </a>
        <span>Independent analysis of digital markets</span>
        <WebMcpTools />
      </header>

      <article className="article-shell">
        <aside className="issue-note">
          <span>Research note 08—26</span>
          <strong>7¢</strong>
          <small>Full source access</small>
        </aside>

        <div className="article-copy">
          <p className="article-kicker">Agent commerce</p>
          <h1>What changes when a source can quote its own price?</h1>
          <p className="standfirst">
            A field study of 42 independent research publishers suggests that
            machine-readable, one-off access can complement subscriptions when
            agents need a single authoritative source.
          </p>
          <div className="byline">
            <span>By Mara Venn</span>
            <time dateTime="2026-08-28">28 August 2026</time>
          </div>

          <section className="abstract">
            <h2>Abstract</h2>
            <p>
              This report examines how price, provenance, citation terms, and
              narrow access rights affect an agent&apos;s decision to purchase a
              publisher-hosted source. The full note includes the observed
              conversion ranges, interview methodology, and publisher cohort
              breakdown.
            </p>
          </section>

          <section className="locked-source" aria-labelledby="locked-heading">
            <div>
              <p className="article-kicker">Source boundary</p>
              <h2 id="locked-heading">The evidence remains with Northline.</h2>
              <p>
                Ask your agent to inspect this page&apos;s offer. After you
                approve the exact price, Galleon returns a signed entitlement
                that this publication can redeem.
              </p>
            </div>
            <span className="lock-mark" aria-hidden="true">
              ◇
            </span>
          </section>
          <UnlockedSource />
        </div>
      </article>
    </main>
  );
}
