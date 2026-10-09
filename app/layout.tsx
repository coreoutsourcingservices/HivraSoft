import type { Metadata } from "next";

import "./globals.css";

import Footer from "@/src/components/Footer/Footer";
import StorefrontFooter from "@/src/components/Footer/StorefrontFooter";
import {
  StorefrontCommerceProvider,
} from "@/src/components/Storefront/StorefrontCommerceProvider";
import TrafficSourceCapture from "@/src/components/Storefront/TrafficSourceCapture";

const siteTitle = "HivraSoft | Bras, Lingerie & Innerwear Online";
const siteDescription =
  "Shop bras, panties, lingerie and everyday innerwear for women and men at HivraSoft. Explore comfortable essentials and fresh styles online.";

export const metadata: Metadata = {
  applicationName: "HivraSoft",
  title: {
    default: siteTitle,
    template: "%s | HivraSoft",
  },
  description: siteDescription,
  keywords: [
    "HivraSoft",
    "bras online",
    "lingerie online",
    "women's innerwear",
    "men's innerwear",
    "panties",
    "comfortable innerwear",
  ],
  // A new filename prevents the browser from using a stale cached favicon.
  // Automatic app/favicon.ico and app/icon.png contain the SAME HS monogram.
  icons: {
    icon: [
      {
        url: "/hivrasoft-hs-favicon-v3.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/hivrasoft-hs-favicon-v3.png",
    apple: "/hivrasoft-hs-favicon-v3.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "HivraSoft",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <StorefrontCommerceProvider>
          <TrafficSourceCapture />
          {children}
          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}
