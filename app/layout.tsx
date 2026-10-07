import type {
  Metadata,
} from "next";

import "./globals.css";

import Footer from "@/src/components/Footer/Footer";
import StorefrontFooter from "@/src/components/Footer/StorefrontFooter";

import {
  StorefrontCommerceProvider,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import TrafficSourceCapture from "@/src/components/Storefront/TrafficSourceCapture";

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
          <TrafficSourceCapture />
          {children}

          <StorefrontFooter><Footer /></StorefrontFooter>
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}
