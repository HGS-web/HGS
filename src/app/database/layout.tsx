import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "HGS Database",
  robots: { index: false, follow: false, nocache: true },
};

export default function DatabaseLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 text-foreground">{children}</div>;
}
