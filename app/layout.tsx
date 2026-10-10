
import type {
  Metadata,
} from "next";

import "./globals.css";

import Loader from "@/src/components/Loader/Loader";

import Footer from "@/src/components/Footer/Footer";

import StorefrontFooter from "@/src/components/Footer/StorefrontFooter";

import {
  StorefrontCommerceProvider,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import TrafficSourceCapture from "@/src/components/Storefront/TrafficSourceCapture";

import ChatbotWidget from "@/src/components/Chatbot/ChatbotWidget";

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

export const metadata: Metadata = {
  title: "Hivra Soft",

  description:
    "Hivra Soft online store",
};

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

          {/* ============================================
              FOOTER

              Existing storefront footer preserved.
          ============================================ */}

          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>

        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}
