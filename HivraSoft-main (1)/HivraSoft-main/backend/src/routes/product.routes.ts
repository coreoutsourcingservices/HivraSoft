import {
  Router,
} from "express";

import authenticate from "../middleware/auth.middleware";

import requireAdmin from "../middleware/admin.middleware";

import {
  upload,
} from "../middleware/upload.middleware";

import {
  createProductController,

  getAllProductsController,

  getActiveProductsController,

  getFeaturedProductsController,

  getNewLaunchProductsController,

  getCatalogProductsController,

  getCatalogProductBySlugController,

  getProductByIdController,

  getProductBySlugController,

  updateProductController,

  uploadProductColorImagesController,

  deleteProductColorImageController,

  setDefaultProductColorImageController,

  setDefaultProductColorController,

  addProductSizeController,

  updateProductSizeController,

  deleteProductSizeController,

  deleteProductController,
} from "../controllers/product.controller";

const router =
  Router();

/* =========================================================
   PUBLIC / STOREFRONT

   IMPORTANT:
   Static routes pehle.
   /:id last me.
========================================================= */

/* Clean frontend product list */
router.get(
  "/catalog",
  getCatalogProductsController
);

/* Clean frontend product detail */
router.get(
  "/catalog/:slug",
  getCatalogProductBySlugController
);

/* All active products */
router.get(
  "/active",
  getActiveProductsController
);

/* Featured products */
router.get(
  "/featured",
  getFeaturedProductsController
);

/* New launch */
router.get(
  "/new-launches",
  getNewLaunchProductsController
);

/* Product by slug */
router.get(
  "/slug/:slug",
  getProductBySlugController
);

/* =========================================================
   ADMIN - PRODUCTS
========================================================= */

/* All products */
router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllProductsController
);

/* Create product */
router.post(
  "/",
  authenticate,
  requireAdmin,
  createProductController
);

/* =========================================================
   ADMIN - PRODUCT COLOR IMAGES
========================================================= */

/*
  multipart/form-data

  field:
  images
*/
router.post(
  "/:id/colors/:colorSlug/images",
  authenticate,
  requireAdmin,

  upload.array(
    "images",
    10
  ),

  uploadProductColorImagesController
);

/*
  Body:
  {
    "publicId": "hivrasoft/products/.../image"
  }
*/
router.delete(
  "/:id/colors/:colorSlug/images",
  authenticate,
  requireAdmin,
  deleteProductColorImageController
);

/*
  Body:
  {
    "publicId": "hivrasoft/products/.../image"
  }
*/
router.patch(
  "/:id/colors/:colorSlug/images/default",
  authenticate,
  requireAdmin,
  setDefaultProductColorImageController
);

/* =========================================================
   ADMIN - DEFAULT COLOR
========================================================= */

router.patch(
  "/:id/colors/:colorSlug/default",
  authenticate,
  requireAdmin,
  setDefaultProductColorController
);

/* =========================================================
   ADMIN - PRODUCT SIZES
========================================================= */

/* Add size */
router.post(
  "/:id/colors/:colorSlug/sizes",
  authenticate,
  requireAdmin,
  addProductSizeController
);

/* Update size */
router.patch(
  "/:id/colors/:colorSlug/sizes/:sizeId",
  authenticate,
  requireAdmin,
  updateProductSizeController
);

/* Delete size */
router.delete(
  "/:id/colors/:colorSlug/sizes/:sizeId",
  authenticate,
  requireAdmin,
  deleteProductSizeController
);

/* =========================================================
   ADMIN - SINGLE PRODUCT

   KEEP THESE LAST
========================================================= */

router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getProductByIdController
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  updateProductController
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteProductController
);

export default router;