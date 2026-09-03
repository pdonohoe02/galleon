import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Galleon | App" };

export default function ConsumerLayout({ children }: { children: ReactNode }) {
  return children;
}
