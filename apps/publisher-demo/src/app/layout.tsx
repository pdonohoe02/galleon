import type { Metadata } from "next";
import type { ReactNode } from "react";

import { consumerUrl } from "../server/urls";
import { GalleonMark } from "./galleon-mark";

import "./publication.css";

export const metadata: Metadata = {
  description:
    "An independent research publication used to demonstrate Galleon.",
  title: "Northline Review",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const walletUrl = consumerUrl();

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
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Schibsted+Grotesk:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {children}
        <footer className="publication-footer">
          <div className="publication-footer-inner">
            <span>Northline Review</span>
            <span>Independent analysis of digital markets</span>
            <span className="powered-by">
              <GalleonMark size={16} />
              Powered by Galleon · <a href={walletUrl}>create a wallet</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
