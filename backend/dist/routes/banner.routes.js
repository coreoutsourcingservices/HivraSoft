"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const bannerUpload_middleware_1 = require("../middleware/bannerUpload.middleware");
const banner_controller_1 = require("../controllers/banner.controller");
const router = (0, express_1.Router)();
/* =========================================================
   PUBLIC - STATIC ROUTES FIRST
========================================================= */
router.get("/active", banner_controller_1.getActiveBannersController);
router.get("/slug/:slug", banner_controller_1.getBannerBySlugController);
/* =========================================================
   ADMIN
========================================================= */
router.get("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, banner_controller_1.getAllBannersController);
router.post("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, bannerUpload_middleware_1.bannerUpload, banner_controller_1.createBannerController);
router.patch("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, bannerUpload_middleware_1.bannerUpload, banner_controller_1.updateBannerController);
router.delete("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, banner_controller_1.deleteBannerController);
router.get("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, banner_controller_1.getBannerByIdController);
exports.default = router;
//# sourceMappingURL=banner.routes.js.map