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
      <head>
        <link rel="stylesheet" href="/chatbot/chatbot.css?v=product-first-20261009" />
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

        <Loader />

        {/* ===============================================
            STOREFRONT
        =============================================== */}

        <StorefrontCommerceProvider>
          <TrafficSourceCapture />

          {children}
          <ChatbotWidget />

          <StorefrontFooter>
            <Footer />
          </StorefrontFooter>
        </StorefrontCommerceProvider>
      </body>
    </html>
  );
}