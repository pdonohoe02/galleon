import type { Metadata } from "next";
import type { ReactNode } from "react";

// The Galleon design system ("Ice Field"): tokens + every gl-* component rule.
// globals.css follows with page-specific bits only (the glm- marketing block).
import "@galleon/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  description:
    "Agent-native payment infrastructure for publisher-hosted sources.",
  title: "Galleon",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
