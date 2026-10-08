"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type {
  StorefrontOffer,
} from "@/src/services/offers";

/* =========================================================
   CONTEXT
========================================================= */

const FixedPriceOfferContext =
  createContext<
    StorefrontOffer | null
  >(null);

/* =========================================================
   PROVIDER
========================================================= */

export function FixedPriceOfferScope({
  offer,
  children,
}: {
  offer:
    | StorefrontOffer
    | null
    | undefined;

  children:
    ReactNode;
}) {
  const validOffer =
    offer &&
    offer.isActive !==
      false &&
    offer.offerType ===
      "fixed_price_bundle"
      ? offer
      : null;

  return (
    <FixedPriceOfferContext.Provider
      value={
        validOffer
      }
    >
      {children}
    </FixedPriceOfferContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useFixedPriceOfferScope() {
  return useContext(
    FixedPriceOfferContext
  );
}