import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./styles.css";

export const metadata: Metadata = {
  description:
    "Notes on independent publishing, useful software, and the small web.",
  title: {
    default: "Drift Signal",
    template: "%s · Drift Signal",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
