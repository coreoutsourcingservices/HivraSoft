import type {
  Metadata,
} from "next";

import "./globals.css";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";
import JsonLd from "@/src/components/Seo/JsonLd";

import Loader from "@/src/components/Loader/Loader";

import Footer from "@/src/components/Footer/Footer";
import StorefrontFooter from "@/src/components/Footer/StorefrontFooter";

import {
  StorefrontCommerceProvider,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import TrafficSourceCapture from "@/src/components/Storefront/TrafficSourceCapture";
import ChatbotWidget from "@/src/components/Chatbot/ChatbotWidget";
// Main branch's click/scroll festive effects, calendar and automatic profile prompt.
import FestiveCrackerEffects from "@/src/components/Storefront/FestiveCrackerEffects";
import ScrollToTopOnRefresh from "@/src/components/Storefront/ScrollToTopOnRefresh";
import MonthlyPromotionReminder from "@/src/components/Storefront/MonthlyPromotionReminder";
import ProfileCompletionPrompt from "@/src/components/Storefront/ProfileCompletionPrompt";

export const metadata: Metadata = {
  ...pageMetadata({ path: "/", title: "Hivra Soft | Innerwear, Lingerie & Everyday Essentials" }),
  metadataBase: new URL(SITE_URL),
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
      <head>
        <link rel="stylesheet" href="/chatbot/chatbot.css" />
      </head>
      <body
        className="
          min-h-screen
        "
      >
        {/* ===============================================
            HOME PAGE LOADER

            Loader.tsx ke andar pathname check hai.
            Sirf "/" par show hoga.

            /account/thanks par show nahi hoga.
        =============================================== */}

        <ScrollToTopOnRefresh />
        <JsonLd data={{ "@context":"https://schema.org", "@graph":[
          { "@type":"Organization", "@id":`${SITE_URL}/#organization`, name:SITE_NAME, url:SITE_URL, logo:`${SITE_URL}/images/logos/hivra-soft-logo.png` },
          { "@type":"WebSite", "@id":`${SITE_URL}/#website`, name:SITE_NAME, url:SITE_URL, publisher:{ "@id":`${SITE_URL}/#organization` } },
        ] }} />
        <FestiveCrackerEffects />
        <Loader />

        {/* ===============================================
            STOREFRONT
        =============================================== */}

        <StorefrontCommerceProvider>
          <TrafficSourceCapture />

          {children}
          <MonthlyPromotionReminder />
          <ProfileCompletionPrompt />
          {/* Original Prahlad chatbot, including its existing launcher/login flows. */}
          <ChatbotWidget />

          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}
