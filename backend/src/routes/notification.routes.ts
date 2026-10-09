import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getMyPromotionDates, saveMyPromotionDates } from "../services/promotion-date.service";

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