import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  getHomepageAdminOptions,
  getPublicOnTrendPicks,
  getAdminOnTrendPicks,
  getAdminOnTrendHistory,
  createAdminOnTrendPick,
  updateAdminOnTrendPick,
  deleteAdminOnTrendPick,
  getPublicAlwaysInIt,
  getAdminAlwaysInIt,
  getAdminAlwaysHistory,
  createAdminAlwaysInIt,
  updateAdminAlwaysInIt,
  deleteAdminAlwaysInIt,
  getPublicPrimeSelection,
  getAdminPrimeSelection,
  getAdminPrimeHistory,
  createAdminPrimeSelection,
  updateAdminPrimeSelection,
  deleteAdminPrimeSelection,
  addPrimeHotspot,
  updatePrimeHotspot,
  deletePrimeHotspot,
} from "../controllers/homepage.controller";

const router = Router();

/* Public storefront APIs */
router.get("/on-trend-picks", getPublicOnTrendPicks);
router.get("/always-in-it", getPublicAlwaysInIt);
router.get("/prime-selection", getPublicPrimeSelection);

/* Shared admin options */
router.get("/admin/homepage/options", authenticate, requireAdmin, getHomepageAdminOptions);

/* On Trend Picks admin */
router.get("/admin/on-trend-picks/history", authenticate, requireAdmin, getAdminOnTrendHistory);
router.get("/admin/on-trend-picks", authenticate, requireAdmin, getAdminOnTrendPicks);
router.post("/admin/on-trend-picks", authenticate, requireAdmin, createAdminOnTrendPick);
router.patch("/admin/on-trend-picks/:id", authenticate, requireAdmin, updateAdminOnTrendPick);
router.delete("/admin/on-trend-picks/:id", authenticate, requireAdmin, deleteAdminOnTrendPick);

/* Always In It admin */
router.get("/admin/always-in-it/history", authenticate, requireAdmin, getAdminAlwaysHistory);
router.get("/admin/always-in-it", authenticate, requireAdmin, getAdminAlwaysInIt);
router.post("/admin/always-in-it", authenticate, requireAdmin, createAdminAlwaysInIt);
router.patch("/admin/always-in-it/:id", authenticate, requireAdmin, updateAdminAlwaysInIt);
router.delete("/admin/always-in-it/:id", authenticate, requireAdmin, deleteAdminAlwaysInIt);

/* Prime Selection admin */
router.get("/admin/prime-selection/history", authenticate, requireAdmin, getAdminPrimeHistory);
router.get("/admin/prime-selection", authenticate, requireAdmin, getAdminPrimeSelection);
router.post("/admin/prime-selection", authenticate, requireAdmin, createAdminPrimeSelection);
router.post("/admin/prime-selection/:id/hotspots", authenticate, requireAdmin, addPrimeHotspot);
router.patch("/admin/prime-selection/:id/hotspots/:hotspotId", authenticate, requireAdmin, updatePrimeHotspot);
router.delete("/admin/prime-selection/:id/hotspots/:hotspotId", authenticate, requireAdmin, deletePrimeHotspot);
router.patch("/admin/prime-selection/:id", authenticate, requireAdmin, updateAdminPrimeSelection);
router.delete("/admin/prime-selection/:id", authenticate, requireAdmin, deleteAdminPrimeSelection);

export default router;
