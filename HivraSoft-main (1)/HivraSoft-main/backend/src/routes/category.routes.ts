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
  createCategoryController,
  getAllCategoriesController,
  getActiveCategoriesController,
  getCategoryTreeController,
  getCategoryByIdController,
  getCategoryBySlugController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller";

const router =
  Router();

/* =========================================================
   PUBLIC
========================================================= */

router.get(
  "/active",
  getActiveCategoriesController
);

/*
  Must be before /:id

  GET /api/categories/tree
  GET /api/categories/tree?active=true
*/
router.get(
  "/tree",
  getCategoryTreeController
);

router.get(
  "/slug/:slug",
  getCategoryBySlugController
);

/* =========================================================
   ADMIN
========================================================= */

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllCategoriesController
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  createCategoryController
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  updateCategoryController
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteCategoryController
);

/* =========================================================
   CATEGORY BY ID - KEEP LAST
========================================================= */

router.get(
  "/:id",
  getCategoryByIdController
);

export default router;
