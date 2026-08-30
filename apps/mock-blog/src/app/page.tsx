import Link from "next/link";

import { mockPost } from "../lib/post";

export default function BlogHomePage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-name" href="/">
            Drift Signal
          </Link>
          <span className="site-tagline">
            One essay at a time, from the independent web
          </span>
        </div>
      </header>

      <main>
        <div className="index-body">
          <section className="blog-intro">
            <h1>Notes for people who still think websites can be places.</h1>
            <p className="intro-copy">
              Drift Signal follows the economics and craft of publishing useful
              work on the open web.
            </p>
          </section>

          <section className="post-index" aria-labelledby="latest-post">
            <div className="index-rule" id="latest-post">
              <strong>Latest and only</strong>
              <span>Issue 001</span>
            </div>

            <Link className="post-card" href={`/posts/${mockPost.slug}`}>
              <div className="post-card-copy">
                <div className="post-meta">
                  <time dateTime={mockPost.date}>{mockPost.displayDate}</time>
                  <span className="dot" aria-hidden="true">
                    ·
                  </span>
                  <span>{mockPost.readingTime}</span>
                </div>
                <h2>{mockPost.title}</h2>
                <p>{mockPost.excerpt}</p>
                <span className="read-link">Read the note →</span>
              </div>
              <div
                className="image-placeholder image-placeholder--thumb"
                aria-hidden="true"
              >
                Thumbnail
              </div>
            </Link>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>Drift Signal</span>
          <span>Madrid · 2026</span>
        </div>
      </footer>
    </div>
  );
}
