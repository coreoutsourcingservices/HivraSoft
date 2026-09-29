"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cart_controller_1 = require("../controllers/cart.controller");
const router = (0, express_1.Router)();
/* =========================================================
   ALL CART ROUTES REQUIRE LOGIN
========================================================= */
router.use(auth_middleware_1.authenticate);
/* =========================================================
   GET CART COUNT

   Keep /count before /:cartItemId.
========================================================= */
router.get("/count", cart_controller_1.getCartCountController);
/* =========================================================
   GET CART
========================================================= */
router.get("/", cart_controller_1.getCartController);
router.post("/discount-code", cart_controller_1.applyDiscountCodeController);
router.delete("/discount-code", cart_controller_1.removeDiscountCodeController);
/* =========================================================
   ADD ITEM
========================================================= */
router.post("/", cart_controller_1.addToCartController);
/* =========================================================
   UPDATE ITEM QUANTITY
========================================================= */
router.patch("/:cartItemId", cart_controller_1.updateCartItemController);
/* =========================================================
   REMOVE ITEM
========================================================= */
router.delete("/:cartItemId", cart_controller_1.removeCartItemController);
/* =========================================================
   CLEAR CART
========================================================= */
router.delete("/", cart_controller_1.clearCartController);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map