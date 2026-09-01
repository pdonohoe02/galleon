import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
// Broadsheet Galleon design system, scoped under .galleon-ds so it styles only
// the dashboards (which opt in with that wrapper class) and never the marketing
// site. Imported after globals so its scoped rules win on the dashboard routes.
import "./ds/galleon-ui.css";

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
