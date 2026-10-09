import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getMyPromotionDates, saveMyPromotionDates } from "../services/promotion-date.service";
import type { Request, Response, NextFunction } from "express";
import {
  getMyScheduledPromotions, addMyScheduledPromotion,
  editMyScheduledPromotion, deleteMyScheduledPromotion,
} from "../services/customer-promotion-message.service";

import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  deleteMyNotification,
  deleteAllMyNotifications,
} from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

// Customer-only routes: all data is scoped by the logged-in user's token/cookie.
function customerOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "customer") {
    res.status(403).json({ success: false, message: "Customer account required." });
    return;
  }
  next();
}

router.get("/my-promotions", customerOnly, getMyScheduledPromotions);
router.post("/my-promotions", customerOnly, addMyScheduledPromotion);
router.patch("/my-promotions/:id", customerOnly, editMyScheduledPromotion);
router.delete("/my-promotions/:id", customerOnly, deleteMyScheduledPromotion);

router.get("/promotion-dates", getMyPromotionDates);
router.put("/promotion-dates", saveMyPromotionDates);

router.get(
  "/",
  getMyNotifications
);

router.get(
  "/unread-count",
  getMyUnreadNotificationCount
);

router.patch(
  "/read-all",
  markAllNotificationsRead
);

router.patch(
  "/:id/read",
  markNotificationRead
);

router.delete(
  "/:id",
  deleteMyNotification
);

router.delete(
  "/",
  deleteAllMyNotifications
);

export default router;