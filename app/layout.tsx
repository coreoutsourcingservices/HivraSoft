
import type {
  Metadata,
} from "next";

import "./globals.css";
import { pageMetadata, siteSchema } from "@/lib/seo";
import { STATIC_SEO } from "@/lib/seo-pages";
import StructuredData from "@/src/components/Storefront/StructuredData";
import StorefrontViewport from "@/src/components/Storefront/StorefrontViewport";

import Loader from "@/src/components/Loader/Loader";

import Footer from "@/src/components/Footer/Footer";

import StorefrontFooter from "@/src/components/Footer/StorefrontFooter";

import {
  StorefrontCommerceProvider,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import TrafficSourceCapture from "@/src/components/Storefront/TrafficSourceCapture";

import ChatbotWidget from "@/src/components/Chatbot/ChatbotWidget";
import UnreadNotificationCard from "@/src/components/Storefront/UnreadNotificationCard";

/* =========================================================
   MAIN BRANCH EXISTING FEATURES

   Do not change these components.
========================================================= */

import FestiveCrackerEffects from "@/src/components/Storefront/FestiveCrackerEffects";

import ScrollToTopOnRefresh from "@/src/components/Storefront/ScrollToTopOnRefresh";

import MonthlyPromotionReminder from "@/src/components/Storefront/MonthlyPromotionReminder";

import ProfileCompletionPrompt from "@/src/components/Storefront/ProfileCompletionPrompt";

/* =========================================================
   META PIXEL

   Reuse existing WordPress Meta Pixel.

   Only analytics integration is added.
========================================================= */

import MetaPixel from "@/src/components/Analytics/MetaPixel";

/* =========================================================
   METADATA
========================================================= */

export const metadata: Metadata = pageMetadata(STATIC_SEO["/"]);

/* =========================================================
   ROOT LAYOUT
========================================================= */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Google Tag Manager */}
        <script id="hivrasoft-gtm" dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WDJS97KF');` }} />
        <link
          rel="stylesheet"
          href="/chatbot/chatbot.css"
        />
      </head>

      <body
        className="
          min-h-screen
        "
      >
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WDJS97KF" height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="Google Tag Manager" /></noscript>
        <StorefrontViewport>
        <StructuredData data={siteSchema} />
        {/* ===============================================
            SCROLL TO TOP ON REFRESH

            Original functionality preserved.
        =============================================== */}

        <ScrollToTopOnRefresh />

        {/* ===============================================
            FESTIVE EFFECTS

            Original main branch effects preserved.
        =============================================== */}

        <FestiveCrackerEffects />

        {/* ===============================================
            HOME PAGE LOADER

            Loader.tsx ke andar pathname check hai.
            Sirf "/" par show hoga.

            /account/thanks par show nahi hoga.

            Original functionality preserved.
        =============================================== */}

        <Loader />

        {/* ===============================================
            STOREFRONT COMMERCE PROVIDER
        =============================================== */}

        <StorefrontCommerceProvider>

          {/* ============================================
              TRAFFIC SOURCE CAPTURE

              Existing referral / traffic capture.
          ============================================ */}

          <TrafficSourceCapture />

          {/* ============================================
              META PIXEL INTEGRATION

              Existing Meta Pixel ID:
              950535477792189

              Initial PageView
              +
              Next.js client-side route PageView

              No new Ad Account created.

              No cart or checkout changes.
          ============================================ */}

          <MetaPixel />

          {/* ============================================
              WEBSITE PAGES

              All existing routes preserved.
          ============================================ */}

          {children}

          {/* ============================================
              MONTHLY PROMOTION REMINDER

              Existing functionality preserved.
          ============================================ */}

          <MonthlyPromotionReminder />

          {/* ============================================
              PROFILE COMPLETION PROMPT

              Existing functionality preserved.
          ============================================ */}

          <ProfileCompletionPrompt />

          {/* ============================================
              CHATBOT

              Original Prahlad chatbot including its
              existing launcher and login flows.
          ============================================ */}

          <ChatbotWidget />
          <UnreadNotificationCard />

          {/* ============================================
              FOOTER

              Existing storefront footer preserved.
          ============================================ */}

          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>

        </StorefrontCommerceProvider>
        </StorefrontViewport>
      </body>
    </html>
  );
}
