import {
  Router,
} from "express";

import {
  getFeaturedBuyGetOffer,
  getStorefrontOfferBySlug,
  listActiveOffers,
} from "../controllers/offer.controller";

const router =
  Router();

/* =========================================================
   ALL ACTIVE OFFERS
========================================================= */

router.get(
  "/",
  listActiveOffers
);

/* =========================================================
   HEADER / FEATURED BUY GET OFFER

   IMPORTANT:
   Isko /:slug se PEHLE rakhna.
========================================================= */

router.get(
  "/featured/buy-get",
  getFeaturedBuyGetOffer
);

/* =========================================================
   OFFER DETAIL BY ADMIN SLUG
========================================================= */

router.get(
  "/:slug",
  getStorefrontOfferBySlug
);

export default router;