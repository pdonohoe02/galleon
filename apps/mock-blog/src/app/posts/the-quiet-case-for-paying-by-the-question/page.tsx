import type { Metadata } from "next";
import Link from "next/link";

import { mockPost } from "../../../lib/post";

export const metadata: Metadata = {
  description: mockPost.excerpt,
  title: mockPost.title,
};

export default function MockPostPage() {
  return (
    <div className="site-shell">
      <header className="site-header site-header--sticky">
        <div className="site-header-inner">
          <Link className="site-name" href="/">
            Drift Signal
          </Link>
          <Link className="back-link" href="/">
            All notes
          </Link>
        </div>
      </header>

      <main>
        <article className="post-layout">
          <h1>{mockPost.title}</h1>
          <p className="article-deck">{mockPost.excerpt}</p>

          <div className="byline">
            <span className="author">{mockPost.author}</span>
            <span className="dot" aria-hidden="true">
              ·
            </span>
            <time dateTime={mockPost.date}>{mockPost.displayDate}</time>
            <span className="dot" aria-hidden="true">
              ·
            </span>
            <span>{mockPost.readingTime}</span>
          </div>

          <figure className="lead-figure">
            <div
              className="image-placeholder image-placeholder--lead"
              aria-hidden="true"
            >
              Lead image
            </div>
            <figcaption>
              Drop the opening illustration or photograph here.
            </figcaption>
          </figure>

          <div className="article-copy">
            <p>
              The subscription is a beautiful agreement when a reader wants a
              continuing relationship with a publication. It is a clumsy one
              when they need a single fact, chart, or argument today.
            </p>
            <p>
              That mismatch matters more as software begins to research on our
              behalf. An agent may compare dozens of possible sources before it
              knows which one can resolve the question. Asking a person to begin
              a monthly commitment at that moment turns a useful exchange into a
              detour.
            </p>
            <h2>A source can describe its value first</h2>
            <p>
              The better pattern is small and legible: offer a free description
              of what the source contains, state the price and the rights being
              sold, and let the reader decide. The description should be useful
              enough to support that decision without quietly giving away the
              work itself.
            </p>
            <p>
              This does not replace subscriptions. It catches the moments they
              were never designed for. A seven-cent purchase can become an
              introduction; a durable reader relationship can still follow.
            </p>
            <blockquote>
              <p>
                The smallest viable paywall may be a clear promise, an exact
                price, and a receipt that travels.
              </p>
            </blockquote>
            <h2>Keep the source where it lives</h2>
            <p>
              Independent publishers should not have to surrender their domain,
              archive, or voice to participate. The transaction layer can be
              portable while the work remains on the site that made it. That is
              less like a marketplace and more like plumbing—which is exactly
              why it might last.
            </p>
          </div>

          <footer className="article-footer">
            <p>That is the whole note.</p>
            <Link href="/">Return to Drift Signal →</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
