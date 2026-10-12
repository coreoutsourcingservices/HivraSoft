import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Superadmin sign in | HivraSoft", description: "HivraSoft superadmin access", robots: { index: false, follow: false } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
