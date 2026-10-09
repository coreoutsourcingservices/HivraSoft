import {
  Router,
} from "express";

import {
  getActiveStorefrontDiscountCodes,
} from "../controllers/discount.controller";

const router =
  Router();

/* =========================================================
   ACTIVE STOREFRONT DISCOUNT CODES

   GET /api/discounts/active
========================================================= */

router.get(
  "/active",
  getActiveStorefrontDiscountCodes
);

export default router;
