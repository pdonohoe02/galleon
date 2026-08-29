import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./publication.css";

export const metadata: Metadata = {
  description:
    "An independent research publication used to demonstrate Galleon.",
  title: "Northline Review",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
