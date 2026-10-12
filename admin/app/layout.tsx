import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Hivra Soft Admin", description: "Hivra Soft administration" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="min-h-screen">{children}</body></html>;
}
