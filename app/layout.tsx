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

import ScrollToTopOnRefresh from "@/src/components/Storefront/ScrollToTopOnRefresh";

import FestiveCrackerEffects from "@/src/components/Storefront/FestiveCrackerEffects";

/* =========================================================
   METADATA
========================================================= */

export const metadata: Metadata =
  {
    title:
      "HivraSoft",

    description:
      "HivraSoft online store",
  };

/* =========================================================
   ROOT LAYOUT
========================================================= */

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
        {/* ================================================
            PAGE REFRESH -> TOP
        ================================================ */}

        <ScrollToTopOnRefresh />

        {/* ================================================
            FESTIVE CLICK + SCROLL CRACKERS

            Component ke andar hi hidden hai:
            /admin/*
            /account/*
            /cart/*
            /wishlist/*
            /checkout/*
            /payment/*
            /thanks/*
        ================================================ */}

        <FestiveCrackerEffects />

        {/* ================================================
            GLOBAL LOADER
        ================================================ */}

        <Loader />

        {/* ================================================
            STOREFRONT
        ================================================ */}

        <StorefrontCommerceProvider>
          <TrafficSourceCapture />

          {children}

          {/* ==============================================
              MONTHLY PROMOTION REMINDER

              Iske apne hidden routes already hain.
          ============================================== */}

          <MonthlyPromotionReminder />

          {/* ==============================================
              PROFILE COMPLETION PROMPT

              Iske apne hidden routes already hain.
          ============================================== */}

          <ProfileCompletionPrompt />

          {/* ==============================================
              FOOTER
          ============================================== */}

          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}