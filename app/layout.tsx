import type {
  Metadata,
} from "next";

import "./globals.css";

import Footer from "@/src/components/Footer/Footer";

import {
  StorefrontCommerceProvider,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

export const metadata: Metadata =
  {
    title: "HivraSoft",

    description:
      "HivraSoft online store",
  };

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className="
          min-h-screen
        "
      >
        <StorefrontCommerceProvider>
          {children}

          <Footer />
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}