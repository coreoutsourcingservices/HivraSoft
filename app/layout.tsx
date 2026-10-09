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

import MonthlyPromotionReminder from "@/src/components/Storefront/MonthlyPromotionReminder";

import ProfileCompletionPrompt from "@/src/components/Storefront/ProfileCompletionPrompt";

import TrafficSourceCapture from "@/src/components/Storefront/TrafficSourceCapture";
import ChatbotWidget from "@/src/components/Chatbot/ChatbotWidget";

import ScrollToTopOnRefresh from "@/src/components/Storefront/ScrollToTopOnRefresh";

export const metadata: Metadata =
  {
    title:
      "HivraSoft",

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
      <head>
        <link rel="stylesheet" href="/chatbot/chatbot.css" />
      </head>
      <body
        className="
          min-h-screen
        "
      >
        {/* =============================================
            GLOBAL REFRESH SCROLL FIX

            Refresh hone par page top se open hoga.
        ============================================= */}

        <ScrollToTopOnRefresh />

        <Loader />

        <StorefrontCommerceProvider>
          <TrafficSourceCapture />

          {children}
          <ChatbotWidget />

          {/* =============================================
              MONTHLY PROMOTION REMINDER
          ============================================= */}

          <MonthlyPromotionReminder />

          {/* =============================================
              PROFILE COMPLETION NOTIFICATIONS

              Birthday
              Anniversary
              Gender
          ============================================= */}

          <ProfileCompletionPrompt />

          {/* =============================================
              FOOTER

              Thanks page hide logic
              StorefrontFooter ke andar hai.
          ============================================= */}

          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}