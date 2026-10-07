"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const admin_controller_1 = require("../controllers/admin.controller");
const tracking_controller_1 = require("../controllers/tracking.controller");
const blog_controller_1 = require("../controllers/blog.controller");
const User_model_1 = __importDefault(require("../models/User.model"));
const jwt_1 = require("../utils/jwt");
const upload_middleware_1 = require("../middleware/upload.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const discount_controller_1 = require("../controllers/discount.controller");
const review_controller_1 = require("../controllers/review.controller");
const tax_controller_1 = require("../controllers/tax.controller");
const delivery_charge_controller_1 = require("../controllers/delivery-charge.controller");
const offer_controller_1 = require("../controllers/offer.controller");
const router = (0, express_1.Router)();
router.post("/login", (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
}), admin_controller_1.adminLogin);
const authenticateAdmin = async (req, res, next) => {
    try {
        const authorization = String(req.headers.authorization || "");
        const bearerToken = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
        const token = req.cookies?.accessToken || bearerToken;
        if (!token) {
            res.status(401).json({ success: false, message: "Not authenticated" });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded?.id) {
            res.status(401).json({ success: false, message: "Invalid session" });
            return;
        }
        const user = await User_model_1.default.findById(decoded.id);
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
    }
    catch (error) {
        console.error("ADMIN AUTH ERROR:", error);
        res.status(401).json({ success: false, message: "Invalid or expired session" });
    }
};
router.get("/me", authenticateAdmin, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    return res.json({
        success: true,
        user: {
            id: String(req.user._id),
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        },
    });
});
router.get("/dashboard", authenticateAdmin, admin_controller_1.getAdminDashboard);
router.get("/blogs", authenticateAdmin, blog_controller_1.listAdminBlogs);
router.post("/blogs", authenticateAdmin, blog_controller_1.createAdminBlog);
router.get("/blogs/:id", authenticateAdmin, blog_controller_1.getAdminBlog);
router.put("/blogs/:id", authenticateAdmin, blog_controller_1.updateAdminBlog);
router.patch("/blogs/:id", authenticateAdmin, blog_controller_1.updateAdminBlog);
router.delete("/blogs/:id", authenticateAdmin, blog_controller_1.deleteAdminBlog);
router.post("/blogs/:id/publish", authenticateAdmin, blog_controller_1.publishAdminBlog);
router.post("/blogs/:id/duplicate", authenticateAdmin, blog_controller_1.duplicateAdminBlog);
router.get("/blog-categories", authenticateAdmin, blog_controller_1.listAdminBlogCategories);
router.post("/blog-categories", authenticateAdmin, blog_controller_1.createAdminBlogCategory);
router.put("/blog-categories/:id", authenticateAdmin, blog_controller_1.updateAdminBlogCategory);
router.patch("/blog-categories/:id", authenticateAdmin, blog_controller_1.updateAdminBlogCategory);
router.delete("/blog-categories/:id", authenticateAdmin, blog_controller_1.deleteAdminBlogCategory);
router.get("/blog-tags", authenticateAdmin, blog_controller_1.listAdminBlogTags);
router.post("/blog-tags", authenticateAdmin, blog_controller_1.createAdminBlogTag);
router.put("/blog-tags/:id", authenticateAdmin, blog_controller_1.updateAdminBlogTag);
router.patch("/blog-tags/:id", authenticateAdmin, blog_controller_1.updateAdminBlogTag);
router.delete("/blog-tags/:id", authenticateAdmin, blog_controller_1.deleteAdminBlogTag);
router.get("/cart-tracking", authenticateAdmin, tracking_controller_1.getAdminCartTracking);
router.get("/wishlist-tracking", authenticateAdmin, tracking_controller_1.getAdminWishlistTracking);
router.get("/customers", authenticateAdmin, admin_controller_1.getAdminCustomers);
router.post("/customers", authenticateAdmin, admin_controller_1.createAdminCustomer);
router.get("/customers/:id", authenticateAdmin, admin_controller_1.getAdminCustomerDetails);
router.patch("/customers/:id", authenticateAdmin, admin_controller_1.updateAdminCustomer);
router.patch("/customers/:id/status", authenticateAdmin, admin_controller_1.updateAdminCustomerStatus);
router.patch("/customers/:id/last-active", authenticateAdmin, admin_controller_1.updateAdminCustomerLastActive);
router.get("/customers/:id/cart", authenticateAdmin, admin_controller_1.getAdminUserCart);
router.post("/customers/:id/cart", authenticateAdmin, admin_controller_1.adminAddCustomerCartItem);
router.patch("/customers/:id/cart/:itemId", authenticateAdmin, admin_controller_1.adminUpdateCustomerCartItem);
router.delete("/customers/:id/cart/:itemId", authenticateAdmin, admin_controller_1.adminRemoveCustomerCartItem);
router.delete("/customers/:id/cart", authenticateAdmin, admin_controller_1.adminClearCustomerCart);
router.get("/customers/:id/wishlist", authenticateAdmin, admin_controller_1.getAdminUserWishlist);
router.post("/customers/:id/wishlist", authenticateAdmin, admin_controller_1.adminAddCustomerWishlistItem);
router.delete("/customers/:id/wishlist/:itemId", authenticateAdmin, admin_controller_1.adminRemoveCustomerWishlistItem);
router.delete("/customers/:id/wishlist", authenticateAdmin, admin_controller_1.adminClearCustomerWishlist);
router.get("/customers/:id/orders", authenticateAdmin, admin_controller_1.getAdminUserOrders);
router.get("/customers/:id/activity", authenticateAdmin, admin_controller_1.getAdminCustomerActivity);
// User tracking aliases used by the admin customer intelligence screens.
router.get("/users/:userId", authenticateAdmin, admin_controller_1.getAdminCustomerDetails);
router.get("/users/:userId/cart", authenticateAdmin, admin_controller_1.getAdminUserCart);
router.get("/users/:userId/wishlist", authenticateAdmin, admin_controller_1.getAdminUserWishlist);
router.get("/users/:userId/orders", authenticateAdmin, admin_controller_1.getAdminUserOrders);
router.get("/users/:userId/activity", authenticateAdmin, admin_controller_1.getAdminCustomerActivity);
router.get("/users/:userId/notifications", authenticateAdmin, admin_controller_1.getAdminUserNotifications);
router.get("/users/:userId/reviews", authenticateAdmin, review_controller_1.getAdminUserReviews);
router.get("/orders", authenticateAdmin, admin_controller_1.getAdminOrders);
router.get("/orders/invoices", authenticateAdmin, admin_controller_1.downloadSelectedAdminInvoices);
router.get("/orders/:id/invoice", authenticateAdmin, admin_controller_1.downloadAdminOrderInvoice);
router.get("/orders/:id", authenticateAdmin, admin_controller_1.getAdminOrderById);
router.patch("/orders/:id/status", authenticateAdmin, admin_controller_1.updateAdminOrderStatus);
router.get("/system-status", authenticateAdmin, admin_controller_1.getAdminSystemStatus);
router.get("/user-settings", authenticateAdmin, admin_controller_1.getAdminUserSettings);
router.patch("/user-settings", authenticateAdmin, upload_middleware_1.upload.single("profileImage"), admin_controller_1.updateAdminUserSettings);
router.get("/reviews", authenticateAdmin, review_controller_1.listAdminReviews);
router.get("/reviews/:id", authenticateAdmin, review_controller_1.getAdminReview);
router.post("/reviews/:id/reply", authenticateAdmin, review_controller_1.addAdminReply);
router.get("/notifications", authenticateAdmin, notification_controller_1.listAdminNotifications);
router.post("/notifications", authenticateAdmin, notification_controller_1.createAdminNotification);
router.post("/notifications/preview", authenticateAdmin, notification_controller_1.previewAdminNotificationAudience);
router.post("/notifications/send", authenticateAdmin, notification_controller_1.sendAdminNotificationToOne);
router.post("/notifications/bulk-send", authenticateAdmin, notification_controller_1.sendAdminNotificationBulk);
router.post("/notifications/broadcast", authenticateAdmin, notification_controller_1.broadcastAdminNotification);
router.delete("/notifications/:id", authenticateAdmin, notification_controller_1.deleteAdminNotification);
router.get("/discounts/products", authenticateAdmin, discount_controller_1.getDiscountProducts);
router.get("/discounts/automatic", authenticateAdmin, discount_controller_1.getAutomaticDiscount);
router.post("/discounts/automatic", authenticateAdmin, discount_controller_1.createAutomaticDiscount);
router.put("/discounts/automatic", authenticateAdmin, discount_controller_1.saveAutomaticDiscount);
router.patch("/discounts/automatic/:id", authenticateAdmin, discount_controller_1.updateAutomaticDiscount);
router.delete("/discounts/automatic/:id", authenticateAdmin, discount_controller_1.deleteAutomaticDiscount);
router.get("/discounts/codes", authenticateAdmin, discount_controller_1.listDiscountCodes);
router.post("/discounts/codes", authenticateAdmin, discount_controller_1.createDiscountCode);
router.patch("/discounts/codes/:id", authenticateAdmin, discount_controller_1.updateDiscountCode);
router.delete("/discounts/codes/:id", authenticateAdmin, discount_controller_1.deleteDiscountCode);
router.get("/tax", authenticateAdmin, tax_controller_1.getTaxSettingAdmin);
router.post("/tax", authenticateAdmin, tax_controller_1.createTaxSettingAdmin);
router.put("/tax", authenticateAdmin, tax_controller_1.saveTaxSettingAdmin);
router.patch("/tax/:id", authenticateAdmin, tax_controller_1.updateTaxSettingAdmin);
router.delete("/tax/:id", authenticateAdmin, tax_controller_1.deleteTaxSettingAdmin);
router.get("/delivery-charges", authenticateAdmin, delivery_charge_controller_1.listDeliveryChargeRules);
router.post("/delivery-charges", authenticateAdmin, delivery_charge_controller_1.createDeliveryChargeRule);
router.patch("/delivery-charges/:id", authenticateAdmin, delivery_charge_controller_1.updateDeliveryChargeRule);
router.delete("/delivery-charges/:id", authenticateAdmin, delivery_charge_controller_1.deleteDeliveryChargeRule);
router.get("/offers/buy-get", authenticateAdmin, (0, offer_controller_1.listAdminOffers)("buy_get"));
router.post("/offers/buy-get", authenticateAdmin, (0, offer_controller_1.createAdminOffer)("buy_get"));
router.patch("/offers/buy-get/:id", authenticateAdmin, (0, offer_controller_1.updateAdminOffer)("buy_get"));
router.delete("/offers/buy-get/:id", authenticateAdmin, (0, offer_controller_1.deleteAdminOffer)("buy_get"));
router.get("/offers/fixed-price-bundle", authenticateAdmin, (0, offer_controller_1.listAdminOffers)("fixed_price_bundle"));
router.post("/offers/fixed-price-bundle", authenticateAdmin, (0, offer_controller_1.createAdminOffer)("fixed_price_bundle"));
router.patch("/offers/fixed-price-bundle/:id", authenticateAdmin, (0, offer_controller_1.updateAdminOffer)("fixed_price_bundle"));
router.delete("/offers/fixed-price-bundle/:id", authenticateAdmin, (0, offer_controller_1.deleteAdminOffer)("fixed_price_bundle"));
exports.default = router;
//# sourceMappingURL=admin.routes.js.map