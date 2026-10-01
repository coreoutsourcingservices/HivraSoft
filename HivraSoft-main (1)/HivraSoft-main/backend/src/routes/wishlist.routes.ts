import {
  Router,
} from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  addWishlistItemController,
  getWishlistController,
  checkWishlistItemController,
  removeWishlistItemController,
  clearWishlistController,
} from "../controllers/wishlist.controller";

const router =
  Router();

/* =========================================================
   ALL WISHLIST ROUTES REQUIRE LOGIN
========================================================= */

router.use(
  authenticate
);

/* =========================================================
   ADD PRODUCT
========================================================= */

router.post(
  "/",
  addWishlistItemController
);

/* =========================================================
   GET USER WISHLIST
========================================================= */

router.get(
  "/",
  getWishlistController
);

/* =========================================================
   CHECK PRODUCT

   Keep static /check route before /:productId.
========================================================= */

router.get(
  "/check/:productId",
  checkWishlistItemController
);

/* =========================================================
   REMOVE PRODUCT
========================================================= */

router.delete(
  "/:productId",
  removeWishlistItemController
);

/* =========================================================
   CLEAR WISHLIST
========================================================= */

router.delete(
  "/",
  clearWishlistController
);

export default router;
