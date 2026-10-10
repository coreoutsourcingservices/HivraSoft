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
// Main branch's click/scroll festive effects, calendar and automatic profile prompt.
import FestiveCrackerEffects from "@/src/components/Storefront/FestiveCrackerEffects";
import ScrollToTopOnRefresh from "@/src/components/Storefront/ScrollToTopOnRefresh";
import MonthlyPromotionReminder from "@/src/components/Storefront/MonthlyPromotionReminder";
import ProfileCompletionPrompt from "@/src/components/Storefront/ProfileCompletionPrompt";

export const metadata: Metadata =
  {
    title: "Hivra Soft",

    description:
      "Hivra Soft online store",
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
