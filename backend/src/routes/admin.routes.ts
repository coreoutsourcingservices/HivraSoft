import { Router, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

import {
  adminLogin,
  changeAdminPassword,
  adminForgotPasswordSendOtp,
  adminForgotPasswordVerifyOtp,
  adminForgotPasswordReset,
  getAdminCustomers,
  getAdminCustomerDetails,
  getAdminCustomerActivity,
  getAdminDashboard,
  getAdminOrders,
  getAdminOrderById,
  downloadAdminOrderInvoice,
  downloadSelectedAdminInvoices,
  updateAdminOrdersBulkStatus,
  exportAdminOrdersCsv,
  deleteAdminOrdersBulk,
  getAdminSystemStatus,
  getAdminUserSettings,
  updateAdminUserSettings,
  updateAdminCustomerStatus,
  createAdminCustomer,
  updateAdminCustomer,
  updateAdminCustomerLastActive,
  adminAddCustomerCartItem,
  adminUpdateCustomerCartItem,
  adminRemoveCustomerCartItem,
  adminClearCustomerCart,
  adminAddCustomerWishlistItem,
  adminRemoveCustomerWishlistItem,
  adminClearCustomerWishlist,
  updateAdminOrderStatus,
  getAdminUserCart,
  getAdminUserWishlist,
  getAdminUserOrders,
  getAdminUserNotifications,
} from "../controllers/admin.controller";
import {
  getAdminCartTracking,
  getAdminWishlistTracking,
} from "../controllers/tracking.controller";
import { runAbandonedCartWishlistReminders } from "../services/reminder.service";
import smtpTransporter from "../config/mail";
import { sendEmail } from "../services/mail.service";
import Order from "../models/Order.model";
import { lookupRazorpayOrderPayment } from "../services/razorpay.service";
import { finalizeRazorpayWebhookPayment, markRazorpayPaymentFailed } from "../services/order.service";
import { Types } from "mongoose";
import { getAdminOrderReport, exportAdminOrderReport } from "../controllers/order-report.controller";

import {
  listAdminBlogs,
  getAdminBlog,
  createAdminBlog,
  updateAdminBlog,
  deleteAdminBlog,
  publishAdminBlog,
  duplicateAdminBlog,
  listAdminBlogCategories,
  createAdminBlogCategory,
  updateAdminBlogCategory,
  deleteAdminBlogCategory,
  listAdminBlogTags,
  createAdminBlogTag,
  updateAdminBlogTag,
  deleteAdminBlogTag,
} from "../controllers/blog.controller";

import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";
import { upload } from "../middleware/upload.middleware";

import {
  createAdminNotification,
  previewAdminNotificationAudience,
  listAdminNotifications,
  deleteAdminNotification,
  sendAdminNotificationToOne,
  sendAdminNotificationBulk,
  broadcastAdminNotification,
  listAdminNotificationDeliveries,
} from "../controllers/notification.controller";

import {
  getDiscountProducts,
  getAutomaticDiscount,
  createAutomaticDiscount,
  updateAutomaticDiscount,
  deleteAutomaticDiscount,
  saveAutomaticDiscount,
  listDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "../controllers/discount.controller";

import { listAdminReviews, getAdminReview, addAdminReply, getAdminUserReviews } from "../controllers/review.controller";

import {
  getTaxSettingAdmin,
  createTaxSettingAdmin,
  updateTaxSettingAdmin,
  deleteTaxSettingAdmin,
  saveTaxSettingAdmin,
} from "../controllers/tax.controller";

import {
  listDeliveryChargeRules,
  createDeliveryChargeRule,
  updateDeliveryChargeRule,
  deleteDeliveryChargeRule,
} from "../controllers/delivery-charge.controller";

import {
  listAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  deleteAdminOffer,
} from "../controllers/offer.controller";


import {
  listSendYourBraAdmin,
  getSendYourBraAdmin,
  listResellerRegistrationsAdmin,
  getResellerRegistrationAdmin,
} from "../controllers/lead-form.controller";

import {
  listNotificationSchedules,
  getNotificationSchedule,
  createNotificationSchedule,
  updateNotificationSchedule,
  updateNotificationScheduleStatus,
  deleteNotificationSchedule,
  listNotificationScheduleHistory,
  previewNotificationScheduleAudience,
  runNotificationScheduleNow,
  getNotificationScheduleCalendar,
} from "../controllers/notification-schedule.controller";

import {
  globalAdminSearch,
  getAdminTrash,
  restoreAdminTrash,
  permanentlyDeleteAdminTrash,
  emptyAdminTrash,
} from "../controllers/admin-tools.controller";

const router = Router();

router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
  }),
  adminLogin
);

router.post(
  "/forgot-password/send-otp",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many OTP requests. Try again later." },
  }),
  adminForgotPasswordSendOtp
);

router.post("/forgot-password/verify-otp", adminForgotPasswordVerifyOtp);
router.post("/forgot-password/reset", adminForgotPasswordReset);

const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorization = String(req.headers.authorization || "");
    const bearerToken = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
    const token = req.cookies?.accessToken || bearerToken;
    if (!token) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      res.status(401).json({ success: false, message: "Invalid session" });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Account is disabled" });
      return;
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      res.status(403).json({ success: false, message: "Admin access required." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);
    res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
};

router.get("/me", authenticateAdmin, (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    success: true,
    user: {
      id: String(req.user!._id),
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

router.post("/change-password", authenticateAdmin, changeAdminPassword);
router.get("/dashboard", authenticateAdmin, getAdminDashboard);
router.get("/send-your-bra", authenticateAdmin, listSendYourBraAdmin);
router.get("/send-your-bra/:id", authenticateAdmin, getSendYourBraAdmin);
router.get("/reseller-registration", authenticateAdmin, listResellerRegistrationsAdmin);
router.get("/reseller-registration/:id", authenticateAdmin, getResellerRegistrationAdmin);

// Admin-only verification: checks SMTP authorization, does not expose secrets or send test mail.
router.get("/reminders/smtp-status", authenticateAdmin, async (_req, res) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ success: false, message: "SMTP_USER / SMTP_PASS missing in backend environment." });
  }
  try {
    await smtpTransporter.verify();
    return res.json({ success: true, message: "Gmail SMTP login OK (no email sent). Use Send Test Email to check if SMTP accepts an actual message." });
  } catch (error) {
    console.error("REMINDER SMTP VERIFICATION FAILED:", error);
    return res.status(503).json({ success: false, message: error instanceof Error ? error.message : "SMTP verification failed." });
  }
});
// Admin test mail is rate limited to prevent sending repeatedly to arbitrary inboxes.
const testReminderMailLimit = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
router.post("/reminders/test-email", authenticateAdmin, testReminderMailLimit, async (req, res) => {
  const email = String(req.body?.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: "Enter a valid recipient email address." });
  }
  try {
    await sendEmail({
      to: email,
      subject: "HivraSoft test email – Cart/Wishlist reminders",
      html: '<div style="font-family:Arial,sans-serif;padding:24px"><h2>HivraSoft Email Test</h2><p>Mail server accepted a test message from HivraSoft. Cart and Wishlist reminders are sent only 24h / 48h after the item was added, while it is still in the list.</p></div>',
    });
    return res.json({ success: true, message: `SMTP accepted a test email for ${email}. Check inbox and spam; final delivery cannot be verified by SMTP.` });
  } catch (error) {
    console.error("ADMIN REMINDER TEST EMAIL FAILED:", error);
    return res.status(503).json({ success: false, message: error instanceof Error ? error.message : "Test email was not accepted by SMTP." });
  }
});
router.post("/reminders/run-due", authenticateAdmin, async (_req, res) => {
  try {
    const result = await runAbandonedCartWishlistReminders();
    return res.json({ success: true, message: `Due reminder run completed. ${result.emailsSent} email(s) accepted by SMTP.`, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Reminder run failed." });
  }
});
// Only provider-verified captured/failed attempts change payment status.
router.post("/orders/:id/sync-payment", authenticateAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order ID." });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (order.paymentMethod !== "razorpay") return res.status(400).json({ success: false, message: "Only Razorpay payments can be checked with the payment gateway." });
    if (order.paymentStatus === "refunded") return res.json({ success: true, message: "Payment was refunded.", order });
    if (order.paymentStatus === "paid") return res.json({ success: true, message: "Payment is already successful.", order });
    const gatewayId = String((order.payment as any)?.razorpayOrderId || "");
    if (!gatewayId) return res.status(409).json({ success: false, message: "Razorpay order ID missing. This order cannot be checked automatically." });
    const verified = await lookupRazorpayOrderPayment(gatewayId, Number(order.total));
    if (verified.status === "paid") {
      const updated = await finalizeRazorpayWebhookPayment(gatewayId, verified.paymentId);
      if (!updated) return res.status(409).json({ success: false, message: "Payment captured but local order could not be finalized; check server logs." });
      return res.json({ success: true, message: "Razorpay confirmed successful payment.", order: updated });
    }
    if (verified.status === "failed") {
      const updated = await markRazorpayPaymentFailed(gatewayId, verified.paymentId);
      return res.json({ success: true, message: "Razorpay confirmed a failed payment attempt.", order: updated });
    }
    return res.json({ success: true, message: "No captured or failed payment found at Razorpay yet. This order is not confirmed as failed.", order });
  } catch (error) {
    console.error("ADMIN RAZORPAY PAYMENT CHECK FAILED:", error);
    return res.status(502).json({ success: false, message: error instanceof Error ? error.message : "Unable to verify payment with Razorpay." });
  }
});
router.get("/notification-deliveries", authenticateAdmin, listAdminNotificationDeliveries);
router.get("/notification-schedules/calendar", authenticateAdmin, getNotificationScheduleCalendar);
router.get("/notification-schedules", authenticateAdmin, listNotificationSchedules);
router.post("/notification-schedules", authenticateAdmin, createNotificationSchedule);
router.post("/notification-schedules/preview", authenticateAdmin, previewNotificationScheduleAudience);
router.get("/notification-schedules/:id", authenticateAdmin, getNotificationSchedule);
router.put("/notification-schedules/:id", authenticateAdmin, updateNotificationSchedule);
router.patch("/notification-schedules/:id", authenticateAdmin, updateNotificationSchedule);
router.patch("/notification-schedules/:id/status", authenticateAdmin, updateNotificationScheduleStatus);
router.post("/notification-schedules/:id/run", authenticateAdmin, runNotificationScheduleNow);
router.get("/notification-schedules/:id/history", authenticateAdmin, listNotificationScheduleHistory);
router.delete("/notification-schedules/:id", authenticateAdmin, deleteNotificationSchedule);

router.get("/global-search", authenticateAdmin, globalAdminSearch);
router.get("/trash", authenticateAdmin, getAdminTrash);
router.post("/trash/:type/:id/restore", authenticateAdmin, restoreAdminTrash);
router.delete("/trash/:type/:id/permanent", authenticateAdmin, permanentlyDeleteAdminTrash);
router.delete("/trash/empty", authenticateAdmin, emptyAdminTrash);
router.get("/blogs", authenticateAdmin, listAdminBlogs);
router.post("/blogs", authenticateAdmin, createAdminBlog);
router.get("/blogs/:id", authenticateAdmin, getAdminBlog);
router.put("/blogs/:id", authenticateAdmin, updateAdminBlog);
router.patch("/blogs/:id", authenticateAdmin, updateAdminBlog);
router.delete("/blogs/:id", authenticateAdmin, deleteAdminBlog);
router.post("/blogs/:id/publish", authenticateAdmin, publishAdminBlog);
router.post("/blogs/:id/duplicate", authenticateAdmin, duplicateAdminBlog);
router.get("/blog-categories", authenticateAdmin, listAdminBlogCategories);
router.post("/blog-categories", authenticateAdmin, createAdminBlogCategory);
router.put("/blog-categories/:id", authenticateAdmin, updateAdminBlogCategory);
router.patch("/blog-categories/:id", authenticateAdmin, updateAdminBlogCategory);
router.delete("/blog-categories/:id", authenticateAdmin, deleteAdminBlogCategory);
router.get("/blog-tags", authenticateAdmin, listAdminBlogTags);
router.post("/blog-tags", authenticateAdmin, createAdminBlogTag);
router.put("/blog-tags/:id", authenticateAdmin, updateAdminBlogTag);
router.patch("/blog-tags/:id", authenticateAdmin, updateAdminBlogTag);
router.delete("/blog-tags/:id", authenticateAdmin, deleteAdminBlogTag);
router.get("/cart-tracking", authenticateAdmin, getAdminCartTracking);
router.get("/wishlist-tracking", authenticateAdmin, getAdminWishlistTracking);
router.get("/customers", authenticateAdmin, getAdminCustomers);
router.post("/customers", authenticateAdmin, createAdminCustomer);
router.get("/customers/:id", authenticateAdmin, getAdminCustomerDetails);
router.patch("/customers/:id", authenticateAdmin, updateAdminCustomer);
router.patch("/customers/:id/status", authenticateAdmin, updateAdminCustomerStatus);
router.patch("/customers/:id/last-active", authenticateAdmin, updateAdminCustomerLastActive);
router.get("/customers/:id/cart", authenticateAdmin, getAdminUserCart);
router.post("/customers/:id/cart", authenticateAdmin, adminAddCustomerCartItem);
router.patch("/customers/:id/cart/:itemId", authenticateAdmin, adminUpdateCustomerCartItem);
router.delete("/customers/:id/cart/:itemId", authenticateAdmin, adminRemoveCustomerCartItem);
router.delete("/customers/:id/cart", authenticateAdmin, adminClearCustomerCart);
router.get("/customers/:id/wishlist", authenticateAdmin, getAdminUserWishlist);
router.post("/customers/:id/wishlist", authenticateAdmin, adminAddCustomerWishlistItem);
router.delete("/customers/:id/wishlist/:itemId", authenticateAdmin, adminRemoveCustomerWishlistItem);
router.delete("/customers/:id/wishlist", authenticateAdmin, adminClearCustomerWishlist);
router.get("/customers/:id/orders", authenticateAdmin, getAdminUserOrders);
router.get("/customers/:id/activity", authenticateAdmin, getAdminCustomerActivity);

// User tracking aliases used by the admin customer intelligence screens.
router.get("/users/:userId", authenticateAdmin, getAdminCustomerDetails);
router.get("/users/:userId/cart", authenticateAdmin, getAdminUserCart);
router.get("/users/:userId/wishlist", authenticateAdmin, getAdminUserWishlist);
router.get("/users/:userId/orders", authenticateAdmin, getAdminUserOrders);
router.get("/users/:userId/activity", authenticateAdmin, getAdminCustomerActivity);
router.get("/users/:userId/notifications", authenticateAdmin, getAdminUserNotifications);
router.get("/users/:userId/reviews", authenticateAdmin, getAdminUserReviews);

router.get("/orders/reports", authenticateAdmin, getAdminOrderReport);
router.get("/orders/reports/export", authenticateAdmin, exportAdminOrderReport);
router.get("/orders", authenticateAdmin, getAdminOrders);
router.get("/orders/invoices", authenticateAdmin, downloadSelectedAdminInvoices);
router.get("/orders/export", authenticateAdmin, exportAdminOrdersCsv);
router.post("/orders/bulk-status", authenticateAdmin, updateAdminOrdersBulkStatus);
router.post("/orders/bulk-delete", authenticateAdmin, deleteAdminOrdersBulk);
router.get("/orders/:id/invoice", authenticateAdmin, downloadAdminOrderInvoice);
router.get("/orders/:id", authenticateAdmin, getAdminOrderById);
router.patch("/orders/:id/status", authenticateAdmin, updateAdminOrderStatus);
router.get("/system-status", authenticateAdmin, getAdminSystemStatus);
router.get("/user-settings", authenticateAdmin, getAdminUserSettings);
router.patch("/user-settings", authenticateAdmin, upload.single("profileImage"), updateAdminUserSettings);

router.get("/reviews", authenticateAdmin, listAdminReviews);
router.get("/reviews/:id", authenticateAdmin, getAdminReview);
router.post("/reviews/:id/reply", authenticateAdmin, addAdminReply);

router.get("/notifications", authenticateAdmin, listAdminNotifications);
router.post("/notifications", authenticateAdmin, createAdminNotification);
router.post("/notifications/preview", authenticateAdmin, previewAdminNotificationAudience);
router.post("/notifications/send", authenticateAdmin, sendAdminNotificationToOne);
router.post("/notifications/bulk-send", authenticateAdmin, sendAdminNotificationBulk);
router.post("/notifications/broadcast", authenticateAdmin, broadcastAdminNotification);
router.delete("/notifications/:id", authenticateAdmin, deleteAdminNotification);

router.get("/discounts/products", authenticateAdmin, getDiscountProducts);
router.get("/discounts/automatic", authenticateAdmin, getAutomaticDiscount);
router.post("/discounts/automatic", authenticateAdmin, createAutomaticDiscount);
router.put("/discounts/automatic", authenticateAdmin, saveAutomaticDiscount);
router.patch("/discounts/automatic/:id", authenticateAdmin, updateAutomaticDiscount);
router.delete("/discounts/automatic/:id", authenticateAdmin, deleteAutomaticDiscount);
router.get("/discounts/codes", authenticateAdmin, listDiscountCodes);
router.post("/discounts/codes", authenticateAdmin, createDiscountCode);
router.patch("/discounts/codes/:id", authenticateAdmin, updateDiscountCode);
router.delete("/discounts/codes/:id", authenticateAdmin, deleteDiscountCode);

router.get("/tax", authenticateAdmin, getTaxSettingAdmin);
router.post("/tax", authenticateAdmin, createTaxSettingAdmin);
router.put("/tax", authenticateAdmin, saveTaxSettingAdmin);
router.patch("/tax/:id", authenticateAdmin, updateTaxSettingAdmin);
router.delete("/tax/:id", authenticateAdmin, deleteTaxSettingAdmin);

router.get("/delivery-charges", authenticateAdmin, listDeliveryChargeRules);
router.post("/delivery-charges", authenticateAdmin, createDeliveryChargeRule);
router.patch("/delivery-charges/:id", authenticateAdmin, updateDeliveryChargeRule);
router.delete("/delivery-charges/:id", authenticateAdmin, deleteDeliveryChargeRule);

router.get("/offers/buy-get", authenticateAdmin, listAdminOffers("buy_get"));
router.post("/offers/buy-get", authenticateAdmin, createAdminOffer("buy_get"));
router.patch("/offers/buy-get/:id", authenticateAdmin, updateAdminOffer("buy_get"));
router.delete("/offers/buy-get/:id", authenticateAdmin, deleteAdminOffer("buy_get"));

router.get("/offers/fixed-price-bundle", authenticateAdmin, listAdminOffers("fixed_price_bundle"));
router.post("/offers/fixed-price-bundle", authenticateAdmin, createAdminOffer("fixed_price_bundle"));
router.patch("/offers/fixed-price-bundle/:id", authenticateAdmin, updateAdminOffer("fixed_price_bundle"));
router.delete("/offers/fixed-price-bundle/:id", authenticateAdmin, deleteAdminOffer("fixed_price_bundle"));

export default router;
