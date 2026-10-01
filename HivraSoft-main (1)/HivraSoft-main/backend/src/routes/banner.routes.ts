import {
  Router,
} from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

import {
  bannerUpload,
} from "../middleware/bannerUpload.middleware";

import {
  createBannerController,
  deleteBannerController,
  getActiveBannersController,
  getAllBannersController,
  getBannerByIdController,
  getBannerBySlugController,
  updateBannerController,
} from "../controllers/banner.controller";

const router = Router();

/* =========================================================
   PUBLIC - STATIC ROUTES FIRST
========================================================= */

router.get(
  "/active",
  getActiveBannersController
);

router.get(
  "/slug/:slug",
  getBannerBySlugController
);

/* =========================================================
   ADMIN
========================================================= */

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllBannersController
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  bannerUpload,
  createBannerController
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  bannerUpload,
  updateBannerController
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteBannerController
);

router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getBannerByIdController
);

export default router;
