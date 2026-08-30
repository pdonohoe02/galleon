"use client";

import { useEffect, useState } from "react";

type UnlockedPayload = {
  status: "unlocked";
  source: {
    heading: string;
    paragraphs: string[];
    methodology: string;
    citation: { display_text: string; canonical_url: string };
  };
};

function isUnlockedPayload(value: unknown): value is UnlockedPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<UnlockedPayload>;
  return (
    candidate.status === "unlocked" &&
    Array.isArray(candidate.source?.paragraphs)
  );
}

export function UnlockedSource() {
  const [payload, setPayload] = useState<UnlockedPayload>();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (isUnlockedPayload(detail)) setPayload(detail);
    };
    window.addEventListener("galleon:source-unlocked", handler);
    return () => window.removeEventListener("galleon:source-unlocked", handler);
  }, []);

  // The live region is mounted from the start so the unlock is announced.
  return (
    <section
      className={payload ? "unlocked-source" : undefined}
      aria-live="polite"
    >
      {!payload ? null : (
        <>
          {/* The marker is Galleon's; everything below it returns to serif,
          because it is the publisher's writing. */}
          <div className="redeemed-marker">
            <span className="redeemed-tag">Entitlement redeemed</span>
            <small>Returned by Galleon and unlocked on this page</small>
          </div>
          <h2>{payload.source.heading}</h2>
          {payload.source.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h3>Methodology</h3>
          <p>{payload.source.methodology}</p>
          <footer className="citation">
            <strong>Cite this source</strong>
            <a href={payload.source.citation.canonical_url}>
              {payload.source.citation.display_text}
            </a>
          </footer>
        </>
      )}
    </section>
  );
}
