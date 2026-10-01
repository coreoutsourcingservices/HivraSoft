import { Router, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

import {
  adminLogin,
  getAdminCustomers,
  getAdminCustomerDetails,
  getAdminCustomerActivity,
  getAdminDashboard,
  getAdminOrders,
  getAdminOrderById,
  downloadAdminOrderInvoice,
  downloadSelectedAdminInvoices,
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

router.get("/dashboard", authenticateAdmin, getAdminDashboard);
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

router.get("/orders", authenticateAdmin, getAdminOrders);
router.get("/orders/invoices", authenticateAdmin, downloadSelectedAdminInvoices);
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

export default router;
