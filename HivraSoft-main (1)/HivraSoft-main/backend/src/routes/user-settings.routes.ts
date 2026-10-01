import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  getUserSettings,
  updateUserProfile,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
} from "../controllers/user-settings.controller";
import { getMyReviews } from "../controllers/review.controller";
import {
  getMyNotifications,
  deleteMyNotification,
  deleteAllMyNotifications,
} from "../controllers/notification.controller";
import {
  getWishlistController,
  removeWishlistItemController,
  clearWishlistController,
} from "../controllers/wishlist.controller";

const router = Router();

router.use(authenticate);

const emailOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after some time.",
  },
});

/* SETTINGS OVERVIEW */
router.get("/", getUserSettings);

/* PROFILE: image, name, gender, mobile (mobile needs no OTP) */
router.patch(
  "/profile",
  upload.single("profileImage"),
  updateUserProfile
);

/* EMAIL CHANGE: OTP REQUIRED */
router.post(
  "/email/send-otp",
  emailOtpLimiter,
  sendEmailChangeOtp
);
router.post("/email/verify-otp", verifyEmailChangeOtp);

/* RATINGS / REVIEWS OF CURRENT USER */
router.get("/ratings", getMyReviews);

/* NOTIFICATIONS OF CURRENT USER */
router.get("/notifications", getMyNotifications);
router.delete("/notifications/:id", deleteMyNotification);
router.delete("/notifications", deleteAllMyNotifications);

/* WISHLIST OF CURRENT USER */
router.get("/wishlist", getWishlistController);
router.delete("/wishlist/:productId", removeWishlistItemController);
router.delete("/wishlist", clearWishlistController);

export default router;
