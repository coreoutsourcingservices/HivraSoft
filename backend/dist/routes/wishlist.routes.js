"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const router = (0, express_1.Router)();
/* =========================================================
   ALL WISHLIST ROUTES REQUIRE LOGIN
========================================================= */
router.use(auth_middleware_1.authenticate);
/* =========================================================
   ADD PRODUCT
========================================================= */
router.post("/", wishlist_controller_1.addWishlistItemController);
/* =========================================================
   GET USER WISHLIST
========================================================= */
router.get("/", wishlist_controller_1.getWishlistController);
/* =========================================================
   CHECK PRODUCT

   Keep static /check route before /:productId.
========================================================= */
router.get("/check/:productId", wishlist_controller_1.checkWishlistItemController);
/* =========================================================
   REMOVE PRODUCT
========================================================= */
router.delete("/:productId", wishlist_controller_1.removeWishlistItemController);
/* =========================================================
   CLEAR WISHLIST
========================================================= */
router.delete("/", wishlist_controller_1.clearWishlistController);
exports.default = router;
//# sourceMappingURL=wishlist.routes.js.map