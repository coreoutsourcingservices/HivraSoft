import {
  Router,
} from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  addToCartController,
  clearCartController,
  getCartController,
  getCartCountController,
  removeCartItemController,
  updateCartItemController,
  applyDiscountCodeController,
  removeDiscountCodeController,
} from "../controllers/cart.controller";

const router =
  Router();

/* =========================================================
   ALL CART ROUTES REQUIRE LOGIN
========================================================= */

router.use(
  authenticate
);

/* =========================================================
   GET CART COUNT

   Keep /count before /:cartItemId.
========================================================= */

router.get(
  "/count",
  getCartCountController
);

/* =========================================================
   GET CART
========================================================= */

router.get(
  "/",
  getCartController
);

router.post(
  "/discount-code",
  applyDiscountCodeController
);

router.delete(
  "/discount-code",
  removeDiscountCodeController
);


/* =========================================================
   ADD ITEM
========================================================= */

router.post(
  "/",
  addToCartController
);

/* =========================================================
   UPDATE ITEM QUANTITY
========================================================= */

router.patch(
  "/:cartItemId",
  updateCartItemController
);

/* =========================================================
   REMOVE ITEM
========================================================= */

router.delete(
  "/:cartItemId",
  removeCartItemController
);

/* =========================================================
   CLEAR CART
========================================================= */

router.delete(
  "/",
  clearCartController
);

export default router;
