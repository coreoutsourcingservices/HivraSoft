"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const category_controller_1 = require("../controllers/category.controller");
const router = (0, express_1.Router)();
/* =========================================================
   PUBLIC
========================================================= */
router.get("/active", category_controller_1.getActiveCategoriesController);
/*
  Must be before /:id

  GET /api/categories/tree
  GET /api/categories/tree?active=true
*/
router.get("/tree", category_controller_1.getCategoryTreeController);
router.get("/slug/:slug", category_controller_1.getCategoryBySlugController);
/* =========================================================
   ADMIN
========================================================= */
router.get("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.getAllCategoriesController);
router.post("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.createCategoryController);
router.patch("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.updateCategoryController);
router.delete("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.deleteCategoryController);
/* =========================================================
   CATEGORY BY ID - KEEP LAST
========================================================= */
router.get("/:id", category_controller_1.getCategoryByIdController);
exports.default = router;
//# sourceMappingURL=category.routes.js.map