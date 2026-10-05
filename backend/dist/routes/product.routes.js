"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const admin_middleware_1 = __importDefault(require("../middleware/admin.middleware"));
const upload_middleware_1 = require("../middleware/upload.middleware");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
/* =========================================================
   PUBLIC / STOREFRONT

   IMPORTANT:
   Static routes pehle.
   /:id last me.
========================================================= */
/* Clean frontend product list */
router.get("/catalog", product_controller_1.getCatalogProductsController);
/* Clean frontend product detail */
router.get("/catalog/:slug", product_controller_1.getCatalogProductBySlugController);
/* All active products */
router.get("/active", product_controller_1.getActiveProductsController);
/* Featured products */
router.get("/featured", product_controller_1.getFeaturedProductsController);
/* New launch */
router.get("/new-launches", product_controller_1.getNewLaunchProductsController);
/* Product by slug */
router.get("/slug/:slug", product_controller_1.getProductBySlugController);
/* Related products (4 or 5 items) */
router.get("/:id/related", product_controller_1.getRelatedProductsController);
/* =========================================================
   ADMIN - PRODUCTS
========================================================= */
/* All products */
router.get("/", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.getAllProductsController);
/* Create product */
router.post("/", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.createProductController);
/* =========================================================
   ADMIN - PRODUCT COLOR IMAGES
========================================================= */
/*
  multipart/form-data

  field:
  images
*/
router.post("/:id/colors/:colorSlug/images", auth_middleware_1.default, admin_middleware_1.default, upload_middleware_1.upload.array("images", 10), product_controller_1.uploadProductColorImagesController);
/*
  Body:
  {
    "publicId": "hivrasoft/products/.../image"
  }
*/
router.delete("/:id/colors/:colorSlug/images", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.deleteProductColorImageController);
/*
  Body:
  {
    "publicId": "hivrasoft/products/.../image"
  }
*/
router.patch("/:id/colors/:colorSlug/images/default", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.setDefaultProductColorImageController);
/* =========================================================
   ADMIN - DEFAULT COLOR
========================================================= */
router.patch("/:id/colors/:colorSlug/default", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.setDefaultProductColorController);
/* =========================================================
   ADMIN - PRODUCT SIZES
========================================================= */
/* Add size */
router.post("/:id/colors/:colorSlug/sizes", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.addProductSizeController);
/* Update size */
router.patch("/:id/colors/:colorSlug/sizes/:sizeId", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.updateProductSizeController);
/* Delete size */
router.delete("/:id/colors/:colorSlug/sizes/:sizeId", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.deleteProductSizeController);
/* =========================================================
   ADMIN - SINGLE PRODUCT

   KEEP THESE LAST
========================================================= */
router.get("/:id", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.getProductByIdController);
router.patch("/:id", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.updateProductController);
router.delete("/:id", auth_middleware_1.default, admin_middleware_1.default, product_controller_1.deleteProductController);
exports.default = router;
//# sourceMappingURL=product.routes.js.map