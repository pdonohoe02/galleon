import Link from "next/link";

import { mockPost } from "../lib/post";

export default function BlogHomePage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-name" href="/">
          Drift Signal
        </Link>
        <p>One essay at a time, from the independent web.</p>
      </header>

      <section className="blog-intro">
        <div className="margin-note" aria-hidden="true">
          Dispatches
        </div>
        <div>
          <p className="section-label">A very small publication</p>
          <h1>Notes for people who still think websites can be places.</h1>
          <p className="intro-copy">
            Drift Signal follows the economics and craft of publishing useful
            work on the open web.
          </p>
        </div>
      </section>

      <section className="post-index" aria-labelledby="latest-post">
        <header>
          <p className="section-label" id="latest-post">
            Latest and only
          </p>
          <span>Issue 001</span>
        </header>

        <Link className="post-card" href={`/posts/${mockPost.slug}`}>
          <div className="post-number" aria-hidden="true">
            001
          </div>
          <div className="post-card-copy">
            <div className="post-meta">
              <time dateTime={mockPost.date}>{mockPost.displayDate}</time>
              <span>{mockPost.readingTime}</span>
            </div>
            <h2>{mockPost.title}</h2>
            <p>{mockPost.excerpt}</p>
            <span className="read-link">Read the note →</span>
          </div>
        </Link>
      </section>

      <footer className="site-footer">
        <span>Drift Signal</span>
        <span>Madrid · 2026</span>
      </footer>
    </main>
  );
}
