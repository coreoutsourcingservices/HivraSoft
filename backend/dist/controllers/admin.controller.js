"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeAdminPassword = changeAdminPassword;
exports.adminForgotPasswordSendOtp = adminForgotPasswordSendOtp;
exports.adminForgotPasswordVerifyOtp = adminForgotPasswordVerifyOtp;
exports.adminForgotPasswordReset = adminForgotPasswordReset;
exports.adminLogin = adminLogin;
exports.getAdminDashboard = getAdminDashboard;
exports.getAdminCustomers = getAdminCustomers;
exports.createAdminCustomer = createAdminCustomer;
exports.updateAdminCustomer = updateAdminCustomer;
exports.updateAdminCustomerLastActive = updateAdminCustomerLastActive;
exports.adminAddCustomerCartItem = adminAddCustomerCartItem;
exports.adminUpdateCustomerCartItem = adminUpdateCustomerCartItem;
exports.adminRemoveCustomerCartItem = adminRemoveCustomerCartItem;
exports.adminClearCustomerCart = adminClearCustomerCart;
exports.adminAddCustomerWishlistItem = adminAddCustomerWishlistItem;
exports.adminRemoveCustomerWishlistItem = adminRemoveCustomerWishlistItem;
exports.adminClearCustomerWishlist = adminClearCustomerWishlist;
exports.getAdminCustomerDetails = getAdminCustomerDetails;
exports.getAdminCustomerActivity = getAdminCustomerActivity;
exports.updateAdminCustomerStatus = updateAdminCustomerStatus;
exports.getAdminOrders = getAdminOrders;
exports.getAdminOrderById = getAdminOrderById;
exports.downloadAdminOrderInvoice = downloadAdminOrderInvoice;
exports.downloadSelectedAdminInvoices = downloadSelectedAdminInvoices;
exports.updateAdminOrderStatus = updateAdminOrderStatus;
exports.updateAdminOrdersBulkStatus = updateAdminOrdersBulkStatus;
exports.exportAdminOrdersCsv = exportAdminOrdersCsv;
exports.deleteAdminOrdersBulk = deleteAdminOrdersBulk;
exports.getAdminCoupons = getAdminCoupons;
exports.getAdminPages = getAdminPages;
exports.getAdminUserSettings = getAdminUserSettings;
exports.updateAdminUserSettings = updateAdminUserSettings;
exports.getAdminSystemStatus = getAdminSystemStatus;
exports.getAdminUserCart = getAdminUserCart;
exports.getAdminUserWishlist = getAdminUserWishlist;
exports.getAdminUserOrders = getAdminUserOrders;
exports.getAdminUserNotifications = getAdminUserNotifications;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const mongoose_1 = __importStar(require("mongoose"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const Banner_model_1 = __importDefault(require("../models/Banner.model"));
const Order_model_1 = __importDefault(require("../models/Order.model"));
const Cart_model_1 = __importDefault(require("../models/Cart.model"));
const Wishlist_model_1 = __importDefault(require("../models/Wishlist.model"));
const Review_model_1 = __importDefault(require("../models/Review.model"));
const address_model_1 = __importDefault(require("../models/user/address.model"));
const account_model_1 = __importDefault(require("../models/user/account.model"));
const password_1 = require("../utils/password");
const activity_service_1 = require("../services/activity.service");
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const Otp_model_1 = __importDefault(require("../models/Otp.model"));
const customer_admin_service_1 = require("../services/customer-admin.service");
const cart_service_1 = require("../services/cart.service");
const wishlist_service_1 = require("../services/wishlist.service");
const invoice_service_1 = require("../services/invoice.service");
const order_service_1 = require("../services/order.service");
const cloudinary_service_1 = require("../services/cloudinary.service");
const mail_service_1 = require("../services/mail.service");
const dummyHash = (0, password_1.hashPassword)("invalid-admin-login");
const ADMIN_PASSWORD_RESET_EMAIL = (process.env.ADMIN_PASSWORD_RESET_EMAIL || "hivrasoft@gmail.com").trim().toLowerCase();
const ADMIN_RESET_OTP_MINUTES = Math.max(1, Number(process.env.OTP_EXPIRES_MINUTES || 5));
const ADMIN_RESET_MAX_ATTEMPTS = 5;
function adminResetOtpHash(email, otp) {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
    if (!secret)
        throw new Error("OTP/JWT secret missing");
    return node_crypto_1.default
        .createHmac("sha256", secret)
        .update(`${email}:admin_password_reset:${otp}`)
        .digest("hex");
}
async function getPrimaryAdminForPasswordReset() {
    const byUsername = await User_model_1.default.findOne({
        username: "admin",
        role: { $in: ["admin", "super_admin"] },
        isActive: true,
    }).select("_id username role isActive");
    if (byUsername)
        return byUsername;
    return User_model_1.default.findOne({
        role: { $in: ["admin", "super_admin"] },
        isActive: true,
    })
        .sort({ createdAt: 1 })
        .select("_id username role isActive");
}
function validateNewAdminPassword(newPassword, confirmPassword) {
    if (typeof newPassword !== "string" || typeof confirmPassword !== "string") {
        throw new Error("New password and confirm password are required.");
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
        throw new Error("New password must be between 8 and 128 characters.");
    }
    if (newPassword !== confirmPassword) {
        throw new Error("New password and confirm password do not match.");
    }
    return newPassword;
}
/**
 * POST /api/admin/change-password
 * Authenticated admin password change using old password.
 */
async function changeAdminPassword(req, res) {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body || {};
        if (typeof oldPassword !== "string" || !oldPassword) {
            return res.status(400).json({ success: false, message: "Old password is required." });
        }
        const cleanNewPassword = validateNewAdminPassword(newPassword, confirmPassword);
        const user = await User_model_1.default.findById(req.user._id).select("+passwordHash role isActive");
        if (!user || !user.isActive || !["admin", "super_admin"].includes(user.role)) {
            return res.status(404).json({ success: false, message: "Admin user not found." });
        }
        const oldValid = await (0, password_1.verifyPassword)(oldPassword, user.passwordHash || (await dummyHash));
        if (!oldValid) {
            return res.status(400).json({ success: false, message: "Old password is incorrect." });
        }
        user.passwordHash = await (0, password_1.hashPassword)(cleanNewPassword);
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to change password.",
        });
    }
}
/**
 * POST /api/admin/forgot-password/send-otp
 * Sends OTP only to the fixed admin recovery mailbox.
 */
async function adminForgotPasswordSendOtp(_req, res) {
    try {
        const admin = await getPrimaryAdminForPasswordReset();
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin account not found." });
        }
        const existing = await Otp_model_1.default.findOne({
            email: ADMIN_PASSWORD_RESET_EMAIL,
            purpose: "admin_password_reset",
        }).lean();
        if (existing?.updatedAt) {
            const elapsed = Date.now() - new Date(existing.updatedAt).getTime();
            if (elapsed < 60_000) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil((60_000 - elapsed) / 1000)} seconds before requesting another OTP.`,
                });
            }
        }
        const otp = node_crypto_1.default.randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + ADMIN_RESET_OTP_MINUTES * 60_000);
        await Otp_model_1.default.findOneAndUpdate({
            email: ADMIN_PASSWORD_RESET_EMAIL,
            purpose: "admin_password_reset",
        }, {
            email: ADMIN_PASSWORD_RESET_EMAIL,
            otpHash: adminResetOtpHash(ADMIN_PASSWORD_RESET_EMAIL, otp),
            purpose: "admin_password_reset",
            userId: admin._id,
            attempts: 0,
            expiresAt,
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        await (0, mail_service_1.sendOtpEmail)(ADMIN_PASSWORD_RESET_EMAIL, otp);
        return res.status(200).json({
            success: true,
            message: `OTP sent to ${ADMIN_PASSWORD_RESET_EMAIL}.`,
            email: ADMIN_PASSWORD_RESET_EMAIL,
            expiresInMinutes: ADMIN_RESET_OTP_MINUTES,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to send reset OTP.",
        });
    }
}
/**
 * POST /api/admin/forgot-password/verify-otp
 * Verifies OTP and returns a short-lived reset token.
 */
async function adminForgotPasswordVerifyOtp(req, res) {
    try {
        const otp = String(req.body?.otp || "").trim();
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: "Enter the 6 digit OTP." });
        }
        const record = await Otp_model_1.default.findOne({
            email: ADMIN_PASSWORD_RESET_EMAIL,
            purpose: "admin_password_reset",
        });
        if (!record || record.expiresAt.getTime() < Date.now()) {
            if (record)
                await record.deleteOne();
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
        }
        if (record.attempts >= ADMIN_RESET_MAX_ATTEMPTS) {
            await record.deleteOne();
            return res.status(400).json({ success: false, message: "Too many incorrect OTP attempts. Request a new OTP." });
        }
        const receivedHash = adminResetOtpHash(ADMIN_PASSWORD_RESET_EMAIL, otp);
        const expected = Buffer.from(record.otpHash, "hex");
        const received = Buffer.from(receivedHash, "hex");
        const matches = expected.length === received.length &&
            node_crypto_1.default.timingSafeEqual(expected, received);
        if (!matches) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ success: false, message: "Incorrect OTP." });
        }
        if (!process.env.JWT_SECRET)
            throw new Error("JWT secret missing");
        const userId = String(record.userId || "");
        if (!userId)
            throw new Error("Reset request is invalid.");
        const resetToken = jsonwebtoken_1.default.sign({ id: userId, purpose: "admin_password_reset" }, process.env.JWT_SECRET, { expiresIn: "10m" });
        await record.deleteOne();
        return res.status(200).json({
            success: true,
            message: "OTP verified.",
            resetToken,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to verify OTP.",
        });
    }
}
/**
 * POST /api/admin/forgot-password/reset
 * Resets admin password after verified OTP.
 */
async function adminForgotPasswordReset(req, res) {
    try {
        const resetToken = String(req.body?.resetToken || "");
        const cleanNewPassword = validateNewAdminPassword(req.body?.newPassword, req.body?.confirmPassword);
        if (!resetToken) {
            return res.status(400).json({ success: false, message: "Password reset session is missing." });
        }
        if (!process.env.JWT_SECRET)
            throw new Error("JWT secret missing");
        const decoded = jsonwebtoken_1.default.verify(resetToken, process.env.JWT_SECRET);
        if (!decoded?.id || decoded.purpose !== "admin_password_reset") {
            return res.status(400).json({ success: false, message: "Password reset session is invalid." });
        }
        const user = await User_model_1.default.findById(decoded.id).select("+passwordHash role isActive");
        if (!user || !user.isActive || !["admin", "super_admin"].includes(user.role)) {
            return res.status(404).json({ success: false, message: "Admin account not found." });
        }
        user.passwordHash = await (0, password_1.hashPassword)(cleanNewPassword);
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can sign in with the new password.",
        });
    }
    catch (error) {
        const message = error instanceof Error && error.name === "TokenExpiredError"
            ? "Password reset session expired. Please request a new OTP."
            : error instanceof Error
                ? error.message
                : "Unable to reset password.";
        return res.status(400).json({ success: false, message });
    }
}
async function adminLogin(req, res) {
    const { username, password } = req.body || {};
    if (typeof username !== "string" ||
        typeof password !== "string" ||
        username.length > 100 ||
        password.length > 256) {
        return res.status(400).json({ message: "Enter your login ID and password." });
    }
    try {
        const user = await User_model_1.default.findOne({ username: username.trim() }).select("+passwordHash");
        const valid = await (0, password_1.verifyPassword)(password, user?.passwordHash || (await dummyHash));
        if (!valid || !user?.isActive || !["admin", "super_admin"].includes(user.role)) {
            return res.status(401).json({ message: "Incorrect login ID or password." });
        }
        if (!process.env.JWT_SECRET)
            throw new Error("JWT secret missing");
        const token = jsonwebtoken_1.default.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 8 * 60 * 60 * 1000,
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(503).json({ message: "Login is unavailable. Please try again." });
    }
}
function getDb() {
    const db = mongoose_1.default.connection.db;
    if (!db)
        throw new Error("Database is not connected.");
    return db;
}
async function collectionExists(name) {
    const db = getDb();
    const result = await db.listCollections({ name }, { nameOnly: true }).toArray();
    return result.length > 0;
}
async function safeCollectionCount(name) {
    if (!(await collectionExists(name)))
        return 0;
    return getDb().collection(name).countDocuments({});
}
/**
 * GET /api/admin/dashboard
 * One request for all cards/status data used by the admin dashboard.
 */
async function getAdminDashboard(_req, res) {
    try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const cancelledStatuses = ["cancelled", "canceled"];
        const revenueMatch = { status: { $nin: cancelledStatuses } };
        const [products, categories, banners, customers, orders, revenueRows, currentProducts, previousProducts, currentOrders, previousOrders, currentCustomers, previousCustomers, currentRevenueRows, previousRevenueRows, recentOrdersRaw, productRows,] = await Promise.all([
            Product_model_1.default.countDocuments({}),
            Category_model_1.default.countDocuments({}),
            Banner_model_1.default.countDocuments({}),
            User_model_1.default.countDocuments({ role: "customer" }),
            Order_model_1.default.countDocuments({}),
            Order_model_1.default.aggregate([{ $match: revenueMatch }, { $group: { _id: null, revenue: { $sum: "$total" } } }]),
            Product_model_1.default.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
            Product_model_1.default.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
            Order_model_1.default.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
            Order_model_1.default.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
            User_model_1.default.countDocuments({ role: "customer", createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
            User_model_1.default.countDocuments({ role: "customer", createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
            Order_model_1.default.aggregate([
                { $match: { ...revenueMatch, createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } } },
                { $group: { _id: null, revenue: { $sum: "$total" } } },
            ]),
            Order_model_1.default.aggregate([
                { $match: { ...revenueMatch, createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } },
                { $group: { _id: null, revenue: { $sum: "$total" } } },
            ]),
            Order_model_1.default.find({}).sort({ createdAt: -1 }).limit(4).populate("user", "name email").lean(),
            Product_model_1.default.find({ isActive: { $ne: false } }).select("colors isColor isActive createdAt").lean(),
        ]);
        const growth = (current, previous) => {
            if (previous <= 0)
                return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };
        const revenue = Number(revenueRows[0]?.revenue || 0);
        const currentRevenue = Number(currentRevenueRows[0]?.revenue || 0);
        const previousRevenue = Number(previousRevenueRows[0]?.revenue || 0);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const dailyRevenueRows = await Order_model_1.default.aggregate([
            { $match: { ...revenueMatch, createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                    },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 },
                },
            },
        ]);
        const dailyMap = new Map(dailyRevenueRows.map((row) => [
            `${row._id.year}-${String(row._id.month).padStart(2, "0")}-${String(row._id.day).padStart(2, "0")}`,
            { revenue: Number(row.revenue || 0), orders: Number(row.orders || 0) },
        ]));
        const salesOverview = Array.from({ length: 7 }, (_, index) => {
            const day = new Date(sevenDaysAgo);
            day.setDate(sevenDaysAgo.getDate() + index);
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const item = dailyMap.get(key) || { revenue: 0, orders: 0 };
            return {
                date: key,
                label: day.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
                revenue: item.revenue,
                orders: item.orders,
            };
        });
        const rawStatuses = await Order_model_1.default.aggregate([
            { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } },
        ]);
        const rawStatusMap = new Map(rawStatuses.map((row) => [String(row._id || ""), Number(row.count || 0)]));
        const statusCount = (names) => names.reduce((sum, name) => sum + Number(rawStatusMap.get(name) || 0), 0);
        const orderStatus = {
            pending: statusCount(["pending", "pending_payment", "confirmed", "processing", "shipped", "out_for_delivery"]),
            completed: statusCount(["completed", "delivered"]),
            cancelled: statusCount(["cancelled", "canceled", "returned", "refunded"]),
        };
        const recentOrders = recentOrdersRaw.map((order) => {
            const customerData = order.customer && typeof order.customer === "object" ? order.customer : {};
            const userData = order.user && typeof order.user === "object" ? order.user : {};
            const items = Array.isArray(order.items) ? order.items : [];
            const firstItem = items[0] && typeof items[0] === "object" ? items[0] : {};
            return {
                id: String(order._id),
                orderNumber: String(order.orderNumber || ""),
                customer: String(userData.name || customerData.name || customerData.fullName || "Customer"),
                amount: Number(order.total || 0),
                status: String(order.status || "pending"),
                date: order.createdAt,
                imageUrl: String(firstItem.image || firstItem.imageUrl || firstItem.productImage || firstItem.photo || ""),
                itemCount: items.length,
            };
        });
        const lowStockProducts = productRows
            .flatMap((product) => {
            const colors = Array.isArray(product.colors) ? product.colors : [];
            return colors.flatMap((color) => {
                const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
                const images = Array.isArray(color?.images) ? color.images : [];
                const image = images.find((item) => item?.isDefault) || images[0] || null;
                return sizes
                    .filter((size) => size?.isActive !== false)
                    .map((size) => ({
                    id: `${String(product._id)}:${String(color?._id || "default")}:${String(size?._id || size?.size || "size")}`,
                    productId: String(product._id),
                    name: String(color?.nameProduct || "Product"),
                    color: product?.isColor === false ? "Default" : String(color?.nameColor || "Default"),
                    size: String(size?.size || "—"),
                    stock: Math.max(0, Number(size?.stock || 0)),
                    imageUrl: String(image?.url || ""),
                }));
            });
        })
            .filter((variant) => variant.stock < 10)
            .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
            .slice(0, 8);
        return res.status(200).json({
            success: true,
            generatedAt: now.toISOString(),
            stats: {
                products,
                orders,
                customers,
                revenue,
                categories,
                banners,
                growth: {
                    products: growth(currentProducts, previousProducts),
                    orders: growth(currentOrders, previousOrders),
                    customers: growth(currentCustomers, previousCustomers),
                    revenue: growth(currentRevenue, previousRevenue),
                },
            },
            salesOverview,
            orderStatus,
            recentOrders,
            lowStockProducts,
            status: {
                backend: "connected",
                mongodb: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
                productsApi: "ready",
                categoriesApi: "ready",
                ordersApi: "ready",
                bannersApi: "ready",
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load dashboard.",
        });
    }
}
/** GET /api/admin/customers - backend-driven search, filters and pagination. */
async function getAdminCustomers(req, res) {
    try {
        const result = await (0, customer_admin_service_1.listAdminCustomers)(req.query);
        return res.status(200).json({
            success: true,
            count: result.customers.length,
            customers: result.customers,
            pagination: result.pagination,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load customers.",
        });
    }
}
/** POST /api/admin/customers - create a customer for Postman/admin testing. */
async function createAdminCustomer(req, res) {
    try {
        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim().toLowerCase();
        const phone = String(req.body?.phone || "").trim();
        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "name, email and phone are required." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address." });
        }
        const existing = await User_model_1.default.findOne({ $or: [{ email }, { phone }] }).select("_id").lean();
        if (existing)
            return res.status(409).json({ success: false, message: "Email or phone is already in use." });
        const requestedStatus = String(req.body?.accountStatus || "active").toLowerCase();
        const accountStatus = (["active", "inactive", "blocked"].includes(requestedStatus) ? requestedStatus : "active");
        const customer = await User_model_1.default.create({
            name, email, phone, role: "customer", emailVerified: Boolean(req.body?.emailVerified),
            birthday: req.body?.birthday ? new Date(req.body.birthday) : null,
            anniversary: req.body?.anniversary ? new Date(req.body.anniversary) : null,
            isActive: accountStatus === "active", accountStatus, lastActiveAt: req.body?.lastActiveAt || null,
        });
        await account_model_1.default.updateOne({ user: customer._id }, { $setOnInsert: { user: customer._id, role: "customer", emailVerified: customer.emailVerified }, $set: { isActive: accountStatus === "active", isBlocked: accountStatus === "blocked" } }, { upsert: true });
        await (0, activity_service_1.trackUserActivity)({ userId: String(customer._id), type: "register", metadata: { source: "admin_postman" } });
        return res.status(201).json({ success: true, message: "Customer created.", data: customer });
    }
    catch (error) {
        const duplicate = error?.code === 11000;
        return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? "Email or phone is already in use." : (error instanceof Error ? error.message : "Unable to create customer.") });
    }
}
/** PATCH /api/admin/customers/:id - update basic customer fields. */
async function updateAdminCustomer(req, res) {
    try {
        const id = String(req.params.id || "");
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        const update = {};
        if (req.body?.name !== undefined)
            update.name = String(req.body.name).trim();
        if (req.body?.email !== undefined)
            update.email = String(req.body.email).trim().toLowerCase();
        if (req.body?.phone !== undefined)
            update.phone = String(req.body.phone).trim();
        if (req.body?.gender !== undefined) {
            const gender = String(req.body.gender).trim().toLowerCase();
            if (!["male", "female", "other"].includes(gender))
                return res.status(400).json({ success: false, message: "Gender must be male, female or other." });
            update.gender = gender;
        }
        for (const field of ["birthday", "anniversary"]) {
            if (req.body?.[field] !== undefined) {
                const raw = String(req.body[field] || "").trim();
                if (!raw)
                    update[field] = null;
                else {
                    const parsed = new Date(raw);
                    if (Number.isNaN(parsed.getTime()))
                        return res.status(400).json({ success: false, message: `Invalid ${field} date.` });
                    update[field] = parsed;
                }
            }
        }
        if (req.body?.emailVerified !== undefined)
            update.emailVerified = Boolean(req.body.emailVerified);
        if (Object.values(update).some((value) => value === ""))
            return res.status(400).json({ success: false, message: "Updated fields cannot be empty." });
        const customer = await User_model_1.default.findOneAndUpdate({ _id: id, role: "customer" }, { $set: update }, { new: true, runValidators: true })
            .select("name email phone gender birthday anniversary emailVerified isActive accountStatus lastActiveAt createdAt updatedAt");
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found." });
        return res.json({ success: true, message: "Customer updated.", data: customer });
    }
    catch (error) {
        return res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "Email or phone is already in use." : (error instanceof Error ? error.message : "Unable to update customer.") });
    }
}
/** PATCH /api/admin/customers/:id/last-active */
async function updateAdminCustomerLastActive(req, res) {
    try {
        const id = String(req.params.id || "");
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        const value = req.body?.lastActiveAt ? new Date(req.body.lastActiveAt) : new Date();
        if (Number.isNaN(value.getTime()))
            return res.status(400).json({ success: false, message: "Invalid lastActiveAt date." });
        const customer = await User_model_1.default.findOneAndUpdate({ _id: id, role: "customer" }, { $set: { lastActiveAt: value } }, { new: true })
            .select("name email phone lastActiveAt");
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found." });
        return res.json({ success: true, message: "Last active updated.", data: customer });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update last active." });
    }
}
/** Admin/Postman cart mutation helpers. */
async function adminAddCustomerCartItem(req, res) {
    try {
        const userId = String(req.params.id || "");
        let cart = await (0, cart_service_1.addItemToCart)(userId, { productId: String(req.body?.productId || ""), colorId: String(req.body?.colorId || req.body?.variantId || ""), sizeId: String(req.body?.sizeId || ""), quantity: req.body?.quantity });
        if (req.body?.addedAt) {
            const addedAt = new Date(req.body.addedAt);
            if (Number.isNaN(addedAt.getTime()))
                return res.status(400).json({ success: false, message: "Invalid addedAt date." });
            await Cart_model_1.default.updateOne({ user: userId, items: { $elemMatch: { product: req.body.productId, colorId: req.body?.colorId || req.body?.variantId, sizeId: req.body?.sizeId } } }, { $set: { "items.$.addedAt": addedAt, "items.$.updatedAt": addedAt } });
            cart = await (0, cart_service_1.getUserCart)(userId);
        }
        return res.status(201).json({ success: true, message: "Product added to cart", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add cart item." });
    }
}
async function adminUpdateCustomerCartItem(req, res) {
    try {
        const cart = await (0, cart_service_1.updateCartItem)(String(req.params.id || ""), String(req.params.itemId || ""), { quantity: Number(req.body?.quantity) });
        return res.json({ success: true, message: "Cart quantity updated", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update cart item." });
    }
}
async function adminRemoveCustomerCartItem(req, res) {
    try {
        const cart = await (0, cart_service_1.removeCartItem)(String(req.params.id || ""), String(req.params.itemId || ""));
        return res.json({ success: true, message: "Cart item removed", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove cart item." });
    }
}
async function adminClearCustomerCart(req, res) {
    try {
        const cart = await (0, cart_service_1.clearUserCart)(String(req.params.id || ""));
        return res.json({ success: true, message: "Cart cleared", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to clear cart." });
    }
}
async function adminAddCustomerWishlistItem(req, res) {
    try {
        const userId = String(req.params.id || "");
        const productId = String(req.body?.productId || "");
        const colorId = req.body?.colorId || req.body?.variantId || null;
        const sizeId = req.body?.sizeId || null;
        const result = await (0, wishlist_service_1.addProductToWishlist)(userId, productId, { colorId, sizeId });
        let wishlist = result.wishlist;
        if (req.body?.addedAt) {
            const addedAt = new Date(req.body.addedAt);
            if (Number.isNaN(addedAt.getTime()))
                return res.status(400).json({ success: false, message: "Invalid addedAt date." });
            await Wishlist_model_1.default.updateOne({ user: userId, items: { $elemMatch: { product: productId, colorId: colorId || null, sizeId: sizeId || null } } }, { $set: { "items.$.addedAt": addedAt, "items.$.updatedAt": addedAt } });
            wishlist = await (0, wishlist_service_1.getUserWishlist)(userId);
        }
        return res.status(result.alreadyExists ? 200 : 201).json({ success: true, message: result.alreadyExists ? "Product already in wishlist" : "Product added to wishlist", data: wishlist });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add wishlist item." });
    }
}
async function adminRemoveCustomerWishlistItem(req, res) {
    try {
        const wishlist = await (0, wishlist_service_1.removeProductFromWishlist)(String(req.params.id || ""), String(req.params.itemId || ""));
        return res.json({ success: true, message: "Wishlist item removed", data: wishlist });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove wishlist item." });
    }
}
async function adminClearCustomerWishlist(req, res) {
    try {
        const wishlist = await (0, wishlist_service_1.clearUserWishlist)(String(req.params.id || ""));
        return res.json({ success: true, message: "Wishlist cleared", data: wishlist });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to clear wishlist." });
    }
}
/** GET /api/admin/customers/:id - complete customer 360 view for admin. */
async function getAdminCustomerDetails(req, res) {
    try {
        const rawCustomerId = req.params.userId ?? req.params.id;
        const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;
        if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        }
        const userObjectId = new mongoose_1.Types.ObjectId(customerId);
        const customer = await User_model_1.default.findOne({ _id: userObjectId, role: "customer" })
            .select("name username email phone gender birthday anniversary role emailVerified isActive accountStatus lastActiveAt avatar createdAt updatedAt")
            .lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        const [account, addresses, orders, cart, wishlist, activities, notificationCount] = await Promise.all([
            account_model_1.default.findOne({ user: userObjectId })
                .select("role emailVerified phoneVerified isActive isBlocked createdAt updatedAt")
                .lean(),
            address_model_1.default.find({ user: userObjectId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
            Order_model_1.default.find({ user: userObjectId }).sort({ createdAt: -1 }).lean(),
            Cart_model_1.default.findOne({ user: userObjectId }).lean(),
            Wishlist_model_1.default.findOne({ user: userObjectId }).lean(),
            (0, activity_service_1.getUserActivities)(customerId, 100),
            Notification_model_1.default.countDocuments({
                isActive: true,
                $or: [
                    { audience: "all" },
                    { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
                ],
            }),
        ]);
        const productIds = Array.from(new Set([
            ...((cart?.items || []).map((item) => String(item.product || ""))),
            ...((wishlist?.items || []).map((item) => String(item.product || ""))),
            ...orders.flatMap((order) => (Array.isArray(order?.items) ? order.items : []).map((item) => String(item?.product?._id || item?.product || item?.productId || ""))),
        ].filter((id) => mongoose_1.Types.ObjectId.isValid(id))));
        const products = productIds.length
            ? await Product_model_1.default.find({ _id: { $in: productIds.map((id) => new mongoose_1.Types.ObjectId(id)) } })
                .populate({ path: "categories", select: "name slug" })
                .lean()
            : [];
        const productMap = new Map(products.map((product) => [String(product._id), product]));
        const pickColor = (product, colorId) => {
            const colors = Array.isArray(product?.colors) ? product.colors : [];
            if (!colors.length)
                return null;
            const requested = String(colorId || "");
            const byId = requested
                ? colors.find((color) => String(color?._id || "") === requested)
                : null;
            return byId || colors.find((color) => color?.isDefault === true) || colors[0] || null;
        };
        const pickSize = (color, sizeId) => {
            const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
            const requested = String(sizeId || "");
            return ((requested ? sizes.find((size) => String(size?._id || "") === requested) : null) ||
                sizes.find((size) => size?.isActive !== false) ||
                sizes[0] ||
                null);
        };
        const productView = (product, colorId, sizeId) => {
            if (!product)
                return null;
            const color = pickColor(product, colorId);
            const size = pickSize(color, sizeId);
            const images = Array.isArray(color?.images) ? color.images : [];
            const mainImages = Array.isArray(product?.mainImages) ? product.mainImages : [];
            const image = images.find((item) => item?.isDefault === true) ||
                images[0] ||
                mainImages.find((item) => item?.isDefault === true) ||
                mainImages[0] ||
                null;
            const categoryList = Array.isArray(product?.categories) ? product.categories : [];
            const colorStock = (Array.isArray(color?.sizes) ? color.sizes : []).reduce((sum, item) => sum + Math.max(0, Number(item?.stock || 0)), 0);
            const stock = color ? colorStock : Math.max(0, Number(product?.stock || 0));
            return {
                _id: String(product._id),
                name: String(color?.nameProduct || product?.name || "Product"),
                slug: String(color?.slugProduct || product?.slug || ""),
                colorName: String(color?.nameColor || ""),
                colorHex: String(color?.hex || ""),
                size: String(size?.size || ""),
                originalPrice: Number(size?.originalPrice ?? color?.originalPrice ?? product?.compareAtPrice ?? product?.price ?? 0),
                showPrice: Number(size?.showPrice ?? color?.showPrice ?? product?.price ?? 0),
                stock,
                image: image?.url ? { url: String(image.url), publicId: String(image.publicId || "") } : null,
                categories: categoryList.map((category) => ({
                    _id: String(category?._id || category || ""),
                    name: String(category?.name || ""),
                    slug: String(category?.slug || ""),
                })),
                isActive: product?.isActive !== false,
            };
        };
        const purchasedAfter = (productId, addedAt) => {
            if (!productId || !addedAt)
                return false;
            const addedTime = new Date(addedAt).getTime();
            if (!Number.isFinite(addedTime))
                return false;
            return orders.some((order) => {
                const status = String(order?.status || "").toLowerCase();
                if (["cancelled", "canceled"].includes(status))
                    return false;
                const orderTime = new Date(order?.createdAt || 0).getTime();
                if (!Number.isFinite(orderTime) || orderTime < addedTime)
                    return false;
                return (Array.isArray(order?.items) ? order.items : []).some((orderItem) => String(orderItem?.product?._id || orderItem?.product || "") === productId);
            });
        };
        const cartItems = (cart?.items || []).map((item) => {
            const product = productMap.get(String(item.product || ""));
            const view = productView(product, item.colorId, item.sizeId);
            const quantity = Math.max(0, Number(item.quantity || 0));
            const unitPrice = Number(view?.showPrice || 0);
            return {
                _id: String(item._id || ""),
                product: view,
                quantity,
                unitPrice,
                lineTotal: Number((unitPrice * quantity).toFixed(2)),
                addedAt: item.addedAt || null,
                ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
                updatedAt: item.updatedAt || item.addedAt || null,
                purchasedAfterAdded: purchasedAfter(String(item.product || ""), item.addedAt),
            };
        });
        const wishlistItems = (wishlist?.items || []).map((item) => {
            const product = productMap.get(String(item.product || ""));
            return {
                _id: String(item._id || ""),
                product: productView(product, item.colorId, item.sizeId),
                colorId: item.colorId ? String(item.colorId) : null,
                sizeId: item.sizeId ? String(item.sizeId) : null,
                addedAt: item.addedAt || null,
                updatedAt: item.updatedAt || item.addedAt || null,
                ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
                purchasedAfterAdded: purchasedAfter(String(item.product || ""), item.addedAt),
            };
        });
        const normalizedOrders = orders.map((order) => ({
            _id: String(order._id),
            orderNumber: String(order.orderNumber || order._id),
            status: String(order.status || "pending").toLowerCase(),
            paymentStatus: String(order.paymentStatus || "pending").toLowerCase(),
            paymentMethod: String(order.paymentMethod || ""),
            subtotal: Number(order.subtotal || 0),
            automaticDiscount: Number(order.automaticDiscount || 0),
            automaticDiscountDetails: order.automaticDiscountDetails || {},
            codeDiscount: Number(order.codeDiscount || 0),
            codeDiscountDetails: order.codeDiscountDetails || {},
            discount: Number(order.discount || 0),
            discountCode: String(order.discountCode || ""),
            shipping: Number(order.shipping || 0),
            tax: Number(order.tax || 0),
            taxName: String(order.taxName || ""),
            taxPercentage: Number(order.taxPercentage || 0),
            taxDetails: order.taxDetails || {},
            total: Number(order.total ?? order.grandTotal ?? order.totalAmount ?? 0),
            items: (Array.isArray(order.items) ? order.items : []).map((item) => {
                const productId = String(item?.product?._id || item?.product || item?.productId || "");
                const fallback = productView(productMap.get(productId), item?.colorId, item?.sizeId);
                const image = String(item?.image ||
                    item?.imageUrl ||
                    item?.productImage ||
                    fallback?.image?.url ||
                    "");
                return {
                    ...item,
                    productId,
                    name: String(item?.name || item?.productName || fallback?.name || "Product"),
                    colorName: String(item?.colorName || fallback?.colorName || ""),
                    sizeName: String(item?.sizeName || item?.size || fallback?.size || ""),
                    image,
                    imageUrl: image,
                };
            }),
            shippingAddress: order.shippingAddress || null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }));
        const deliveredOrders = normalizedOrders.filter((order) => order.status === "delivered");
        const cancelledOrders = normalizedOrders.filter((order) => ["cancelled", "canceled"].includes(order.status));
        const openOrders = normalizedOrders.filter((order) => order.status !== "delivered" && !["cancelled", "canceled"].includes(order.status));
        const paidOrders = normalizedOrders.filter((order) => order.paymentStatus === "paid");
        const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const cartSubtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const totalOrderValue = normalizedOrders
            .filter((order) => !["cancelled", "canceled"].includes(order.status))
            .reduce((sum, order) => sum + order.total, 0);
        const deliveredValue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalDiscount = normalizedOrders.reduce((sum, order) => sum + order.discount, 0);
        return res.status(200).json({
            success: true,
            customer: {
                ...customer,
                _id: String(customer._id),
            },
            account: account
                ? {
                    ...account,
                    _id: String(account._id),
                }
                : null,
            summary: {
                totalOrders: normalizedOrders.length,
                deliveredOrders: deliveredOrders.length,
                openOrders: openOrders.length,
                cancelledOrders: cancelledOrders.length,
                paidOrders: paidOrders.length,
                totalOrderValue: Number(totalOrderValue.toFixed(2)),
                deliveredValue: Number(deliveredValue.toFixed(2)),
                totalDiscount: Number(totalDiscount.toFixed(2)),
                averageOrderValue: normalizedOrders.length > 0
                    ? Number((totalOrderValue / normalizedOrders.length).toFixed(2))
                    : 0,
                cartQuantity,
                cartSubtotal: Number(cartSubtotal.toFixed(2)),
                wishlistItems: wishlistItems.length,
                addresses: addresses.length,
                lastOrderAt: normalizedOrders[0]?.createdAt || null,
                notifications: notificationCount,
                activities: activities.length,
                lastActivityAt: activities[0]?.createdAt || null,
            },
            cart: {
                _id: cart?._id ? String(cart._id) : null,
                discountCode: String(cart?.discountCode || ""),
                items: cartItems,
                totalItems: cartQuantity,
                subtotal: Number(cartSubtotal.toFixed(2)),
                updatedAt: cart?.updatedAt || null,
            },
            wishlist: {
                _id: wishlist?._id ? String(wishlist._id) : null,
                items: wishlistItems,
                count: wishlistItems.length,
                updatedAt: wishlist?.updatedAt || null,
            },
            addresses: addresses.map((address) => ({
                ...address,
                _id: String(address._id),
                user: String(address.user || customerId),
            })),
            activities: activities.map((activity) => ({
                ...activity,
                _id: String(activity._id),
                user: String(activity.user || customerId),
                product: activity.product
                    ? {
                        _id: String(activity.product._id),
                        name: String(activity.product?.colors?.find((color) => color?.isDefault)?.nameProduct ||
                            activity.product?.colors?.[0]?.nameProduct ||
                            "Product"),
                    }
                    : null,
                order: activity.order
                    ? {
                        _id: String(activity.order._id),
                        orderNumber: String(activity.order.orderNumber || activity.order._id),
                        status: String(activity.order.status || ""),
                        total: Number(activity.order.total || 0),
                    }
                    : null,
            })),
            orders: normalizedOrders,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load customer details.",
        });
    }
}
/** GET /api/admin/customers/:id/activity */
async function getAdminCustomerActivity(req, res) {
    try {
        const rawCustomerId = req.params.userId ?? req.params.id;
        const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;
        if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        }
        const customer = await User_model_1.default.findOne({ _id: customerId, role: "customer" })
            .select("_id name email phone")
            .lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        const limit = Math.min(250, Math.max(1, Number(req.query.limit || 100)));
        const activities = await (0, activity_service_1.getUserActivities)(customerId, limit);
        return res.json({
            success: true,
            customer,
            count: activities.length,
            activities,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load customer activity.",
        });
    }
}
/** PATCH /api/admin/customers/:id/status */
async function updateAdminCustomerStatus(req, res) {
    try {
        const id = String(req.params.id || "");
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        const rawStatus = req.body?.accountStatus !== undefined
            ? String(req.body.accountStatus).toLowerCase()
            : (typeof req.body?.isActive === "boolean" ? (req.body.isActive ? "active" : "inactive") : "");
        if (!["active", "inactive", "blocked"].includes(rawStatus)) {
            return res.status(400).json({ success: false, message: "accountStatus must be active, inactive or blocked." });
        }
        const isActive = rawStatus === "active";
        const customer = await User_model_1.default.findOneAndUpdate({ _id: id, role: "customer" }, { $set: { isActive, accountStatus: rawStatus } }, { new: true }).select("name email phone gender birthday anniversary emailVerified isActive accountStatus lastActiveAt createdAt updatedAt");
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found." });
        await account_model_1.default.updateOne({ user: customer._id }, { $set: { isActive, isBlocked: rawStatus === "blocked" }, $setOnInsert: { user: customer._id, role: "customer", emailVerified: customer.emailVerified } }, { upsert: true });
        return res.status(200).json({ success: true, message: "Customer status updated.", customer });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to update customer.",
        });
    }
}
function adminOrderItemProductId(item) {
    const value = item?.product?._id || item?.product || item?.productId || "";
    const id = String(value);
    return mongoose_1.Types.ObjectId.isValid(id) ? id : "";
}
function adminOrderProductSnapshot(product, item) {
    if (!product)
        return null;
    const colors = Array.isArray(product?.colors) ? product.colors : [];
    const colorId = String(item?.colorId || "");
    const color = colors.find((entry) => String(entry?._id || "") === colorId) ||
        colors.find((entry) => entry?.isDefault === true) ||
        colors[0] ||
        null;
    const images = Array.isArray(color?.images) ? color.images : [];
    const mainImages = Array.isArray(product?.mainImages) ? product.mainImages : [];
    const image = images.find((entry) => entry?.isDefault === true && entry?.url) ||
        images.find((entry) => entry?.url) ||
        mainImages.find((entry) => entry?.isDefault === true && entry?.url) ||
        mainImages.find((entry) => entry?.url) ||
        null;
    return {
        name: String(color?.nameProduct || product?.name || "Product"),
        image: String(image?.url || ""),
    };
}
async function hydrateAdminOrderProductImages(orders) {
    const ids = Array.from(new Set(orders
        .flatMap((order) => (Array.isArray(order?.items) ? order.items : []))
        .map(adminOrderItemProductId)
        .filter(Boolean)));
    if (!ids.length)
        return orders;
    const products = await Product_model_1.default.find({ _id: { $in: ids.map((id) => new mongoose_1.Types.ObjectId(id)) } })
        .select("colors mainImages")
        .lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    return orders.map((order) => ({
        ...order,
        items: (Array.isArray(order?.items) ? order.items : []).map((item) => {
            const currentImage = String(item?.image || item?.imageUrl || item?.productImage || item?.photo || "");
            if (currentImage)
                return item;
            const fallback = adminOrderProductSnapshot(productMap.get(adminOrderItemProductId(item)), item);
            if (!fallback?.image)
                return item;
            return {
                ...item,
                name: String(item?.name || item?.productName || fallback.name),
                image: fallback.image,
                imageUrl: fallback.image,
            };
        }),
    }));
}
/** GET /api/admin/orders - paginated order management list. */
async function getAdminOrders(req, res) {
    try {
        const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || "20"), 10) || 20));
        const search = String(req.query.search || "").trim();
        const status = String(req.query.status || "").trim().toLowerCase();
        const paymentStatus = String(req.query.paymentStatus || "").trim().toLowerCase();
        const paymentMethod = String(req.query.paymentMethod || "").trim().toLowerCase();
        const dateFrom = String(req.query.dateFrom || "").trim();
        const dateTo = String(req.query.dateTo || "").trim();
        const filter = {};
        if (status === "pending") {
            filter.status = { $in: ["pending", "pending_payment", "confirmed", "processing", "shipped", "out_for_delivery"] };
        }
        else if (status === "completed") {
            filter.status = { $in: ["completed", "delivered"] };
        }
        else if (status === "cancelled") {
            filter.status = { $in: ["cancelled", "canceled", "returned", "refunded"] };
        }
        else if (status) {
            filter.status = status;
        }
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        if (paymentMethod)
            filter.paymentMethod = paymentMethod;
        if (dateFrom || dateTo) {
            const createdAt = {};
            if (dateFrom) {
                const from = new Date(`${dateFrom}T00:00:00.000Z`);
                if (!Number.isNaN(from.getTime()))
                    createdAt.$gte = from;
            }
            if (dateTo) {
                const to = new Date(`${dateTo}T23:59:59.999Z`);
                if (!Number.isNaN(to.getTime()))
                    createdAt.$lte = to;
            }
            if (Object.keys(createdAt).length)
                filter.createdAt = createdAt;
        }
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const rx = new RegExp(escaped, "i");
            const users = await User_model_1.default.find({ role: "customer", $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("_id").limit(100).lean();
            filter.$or = [
                { orderNumber: rx },
                { invoiceNumber: rx },
                { "customer.name": rx },
                { "customer.email": rx },
                { "customer.phone": rx },
                ...(users.length ? [{ user: { $in: users.map((user) => user._id) } }] : []),
            ];
        }
        const [total, orders] = await Promise.all([
            Order_model_1.default.countDocuments(filter),
            Order_model_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("user", "name email phone")
                .lean(),
        ]);
        const hydratedOrders = await hydrateAdminOrderProductImages(orders);
        return res.status(200).json({
            success: true,
            count: hydratedOrders.length,
            orders: hydratedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load orders." });
    }
}
/** GET /api/admin/orders/:id */
async function getAdminOrderById(req, res) {
    try {
        const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!orderId || !mongoose_1.Types.ObjectId.isValid(orderId))
            return res.status(400).json({ success: false, message: "Invalid order id." });
        const order = await Order_model_1.default.findById(orderId).populate("user", "name email phone").lean();
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found." });
        const [hydratedOrder] = await hydrateAdminOrderProductImages([order]);
        return res.json({ success: true, order: hydratedOrder });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load order." });
    }
}
/** GET /api/admin/orders/:id/invoice */
async function downloadAdminOrderInvoice(req, res) {
    try {
        const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!orderId || !mongoose_1.Types.ObjectId.isValid(orderId))
            return res.status(400).json({ success: false, message: "Invalid order id." });
        const order = await Order_model_1.default.findById(orderId).populate("user", "name email phone").lean();
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found." });
        const pdf = (0, invoice_service_1.buildInvoicePdf)(order);
        const name = String(order.invoiceNumber || order.orderNumber || "invoice").replace(/[^A-Za-z0-9_-]/g, "-");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
        res.setHeader("Content-Length", String(pdf.length));
        return res.send(pdf);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to create invoice." });
    }
}
/** GET /api/admin/orders/invoices?ids=id1,id2 - combined PDF. */
async function downloadSelectedAdminInvoices(req, res) {
    try {
        const ids = String(req.query.ids || "")
            .split(",")
            .map((id) => id.trim())
            .filter((id) => mongoose_1.Types.ObjectId.isValid(id));
        if (!ids.length)
            return res.status(400).json({ success: false, message: "Select at least one valid order." });
        if (ids.length > 50)
            return res.status(400).json({ success: false, message: "You can download up to 50 invoices at a time." });
        const orders = await Order_model_1.default.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean();
        if (!orders.length)
            return res.status(404).json({ success: false, message: "No selected orders were found." });
        const pdf = (0, invoice_service_1.buildInvoicesPdf)(orders);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="selected-invoices.pdf"');
        res.setHeader("Content-Length", String(pdf.length));
        return res.send(pdf);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to create selected invoices." });
    }
}
const ADMIN_SIMPLE_STATUS_MAP = {
    pending: "confirmed",
    completed: "delivered",
    cancelled: "cancelled",
};
const ADMIN_ORDER_STATUSES = [
    "pending",
    "pending_payment",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "completed",
    "delivered",
    "cancelled",
    "canceled",
    "returned",
    "refunded",
];
function adminStatusLabel(status) {
    const value = String(status || "").trim().toLowerCase();
    if (["completed", "delivered"].includes(value))
        return "Completed";
    if (["cancelled", "canceled", "returned", "refunded"].includes(value))
        return "Cancelled";
    return "Pending";
}
function normalizeAdminStatus(status) {
    const raw = String(status || "").trim().toLowerCase();
    if (!ADMIN_ORDER_STATUSES.includes(raw))
        throw new Error("Invalid order status.");
    return ADMIN_SIMPLE_STATUS_MAP[raw] || raw;
}
async function applyAdminOrderStatus(order, requestedInput, adminId, message) {
    const requestedRaw = String(requestedInput || "").trim().toLowerCase();
    const requested = normalizeAdminStatus(requestedRaw);
    const current = String(order.status || "").trim().toLowerCase();
    const isSimpleRequest = Object.prototype.hasOwnProperty.call(ADMIN_SIMPLE_STATUS_MAP, requestedRaw);
    // The admin UI intentionally groups all in-progress states as Pending.
    // Applying the same visible status should therefore be a no-op.
    if (isSimpleRequest && adminStatusLabel(current).toLowerCase() === requestedRaw) {
        return order;
    }
    if (["cancelled", "canceled"].includes(current) && requested !== "cancelled") {
        throw new Error("Cancelled order cannot be reopened because its inventory has already been restored.");
    }
    if (!isSimpleRequest && !(0, order_service_1.isAdminTransitionAllowed)(current, requested)) {
        throw new Error(`Cannot change order from ${current} to ${requested}.`);
    }
    if (current === "pending_payment" &&
        requested === "confirmed" &&
        order.paymentMethod === "razorpay" &&
        order.paymentStatus !== "paid") {
        throw new Error("Razorpay order cannot be confirmed until payment is verified.");
    }
    if (requested === "cancelled" && order.inventoryCommitted) {
        await (0, order_service_1.restoreOrderInventoryIfNeeded)(order.toObject());
        order.inventoryCommitted = false;
        order.fulfillmentState = "cancelled";
        order.cancelledAt = new Date();
        order.cancellationReason = String(message || "Cancelled by admin").trim();
    }
    if (current !== requested) {
        order.status = requested;
        order.statusHistory.push({
            status: requested,
            message: String(message || `Status changed to ${adminStatusLabel(requested)}.`).trim(),
            at: new Date(),
            by: adminId || null,
        });
        await order.save();
        if (order.user) {
            await (0, order_service_1.createOrderStatusNotification)(order.toObject(), requested, adminId).catch(() => undefined);
            if (["delivered", "cancelled"].includes(requested)) {
                await (0, activity_service_1.trackUserActivity)({
                    userId: String(order.user),
                    type: requested === "delivered" ? "order_delivered" : "order_cancelled",
                    orderId: String(order._id),
                    metadata: { orderNumber: order.orderNumber, status: requested, total: Number(order.total || 0) },
                }).catch(() => undefined);
            }
        }
    }
    return order;
}
/** PATCH /api/admin/orders/:id/status - manual Pending / Completed / Cancelled status. */
async function updateAdminOrderStatus(req, res) {
    try {
        const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!orderId || !mongoose_1.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid order id." });
        }
        const order = await Order_model_1.default.findById(orderId);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found." });
        await applyAdminOrderStatus(order, req.body?.status, req.user?._id || null, req.body?.message);
        const populated = await Order_model_1.default.findById(order._id).populate("user", "name email phone").lean();
        return res.status(200).json({ success: true, order: populated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update order." });
    }
}
/** POST /api/admin/orders/bulk-status - update selected orders. */
async function updateAdminOrdersBulkStatus(req, res) {
    try {
        const ids = Array.isArray(req.body?.ids)
            ? req.body.ids.map((id) => String(id || "").trim()).filter((id) => mongoose_1.Types.ObjectId.isValid(id))
            : [];
        if (!ids.length)
            return res.status(400).json({ success: false, message: "Select at least one order." });
        if (ids.length > 100)
            return res.status(400).json({ success: false, message: "You can update up to 100 orders at a time." });
        // Validate status before touching any order.
        normalizeAdminStatus(req.body?.status);
        const orders = await Order_model_1.default.find({ _id: { $in: ids } });
        const failed = [];
        let updated = 0;
        for (const order of orders) {
            try {
                const before = String(order.status || "");
                await applyAdminOrderStatus(order, req.body?.status, req.user?._id || null, req.body?.message);
                if (String(order.status || "") !== before)
                    updated += 1;
            }
            catch (error) {
                failed.push({ id: String(order._id), message: error instanceof Error ? error.message : "Unable to update order." });
            }
        }
        return res.status(failed.length ? 207 : 200).json({
            success: failed.length === 0,
            updated,
            failed,
            message: failed.length ? `${updated} order(s) updated, ${failed.length} failed.` : `${updated} order(s) updated.`,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update selected orders." });
    }
}
function csvCell(value) {
    let text = String(value ?? "");
    // Avoid spreadsheet formula execution when a CSV is opened in Excel/Sheets.
    if (/^[=+@-]/.test(text))
        text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}
/** GET /api/admin/orders/export?ids=id1,id2 - export selected orders as CSV. */
async function exportAdminOrdersCsv(req, res) {
    try {
        const ids = String(req.query.ids || "")
            .split(",")
            .map((id) => id.trim())
            .filter((id) => mongoose_1.Types.ObjectId.isValid(id));
        if (!ids.length)
            return res.status(400).json({ success: false, message: "Select at least one valid order." });
        if (ids.length > 500)
            return res.status(400).json({ success: false, message: "You can export up to 500 orders at a time." });
        const orders = await Order_model_1.default.find({ _id: { $in: ids } })
            .sort({ createdAt: -1 })
            .populate("user", "name email phone")
            .lean();
        const rows = [
            [
                "Order",
                "Customer",
                "Email",
                "Phone",
                "Order Status",
                "Payment Method",
                "Source",
                "Medium",
                "Campaign",
                "Total",
                "Date",
            ],
            ...orders.map((order) => {
                const user = order.user && typeof order.user === "object" ? order.user : {};
                const customer = order.customer && typeof order.customer === "object" ? order.customer : {};
                const origin = order.origin && typeof order.origin === "object" ? order.origin : {};
                return [
                    order.orderNumber || String(order._id),
                    user.name || customer.name || customer.fullName || "Customer",
                    user.email || customer.email || "",
                    user.phone || customer.phone || "",
                    adminStatusLabel(order.status),
                    String(order.paymentMethod || "").toUpperCase(),
                    String(origin.source || ""),
                    String(origin.medium || ""),
                    String(origin.campaign || ""),
                    Number(order.total || 0).toFixed(2),
                    order.createdAt ? new Date(order.createdAt).toISOString() : "",
                ];
            }),
        ];
        const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="orders-export.csv"');
        return res.status(200).send(csv);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to export orders." });
    }
}
/** POST /api/admin/orders/bulk-delete - permanently delete selected orders. */
async function deleteAdminOrdersBulk(req, res) {
    try {
        const ids = Array.isArray(req.body?.ids)
            ? req.body.ids.map((id) => String(id || "").trim()).filter((id) => mongoose_1.Types.ObjectId.isValid(id))
            : [];
        if (!ids.length)
            return res.status(400).json({ success: false, message: "Select at least one order." });
        if (ids.length > 100)
            return res.status(400).json({ success: false, message: "You can delete up to 100 orders at a time." });
        const orders = await Order_model_1.default.find({ _id: { $in: ids } });
        for (const order of orders) {
            const status = String(order.status || "").toLowerCase();
            const isFinished = ["delivered", "completed", "returned", "refunded", "cancelled", "canceled"].includes(status);
            if (order.inventoryCommitted && !isFinished) {
                await (0, order_service_1.restoreOrderInventoryIfNeeded)(order.toObject());
            }
        }
        const result = await Order_model_1.default.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({ success: true, deleted: Number(result.deletedCount || 0) });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete selected orders." });
    }
}
/** GET /api/admin/coupons */
async function getAdminCoupons(_req, res) {
    try {
        if (!(await collectionExists("coupons"))) {
            return res.status(200).json({ success: true, count: 0, coupons: [] });
        }
        const coupons = await getDb().collection("coupons").find({}).sort({ createdAt: -1 }).limit(250).toArray();
        return res.status(200).json({ success: true, count: coupons.length, coupons });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load coupons.",
        });
    }
}
/** GET /api/admin/pages */
async function getAdminPages(_req, res) {
    try {
        const name = (await collectionExists("sitepages"))
            ? "sitepages"
            : (await collectionExists("pages"))
                ? "pages"
                : null;
        if (!name)
            return res.status(200).json({ success: true, count: 0, pages: [] });
        const pages = await getDb().collection(name).find({}).sort({ updatedAt: -1 }).limit(250).toArray();
        return res.status(200).json({ success: true, count: pages.length, pages });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load pages.",
        });
    }
}
/**
 * GET /api/admin/user-settings
 * Admin account settings in one API: profile, personal information and activity counts.
 */
async function getAdminUserSettings(req, res) {
    try {
        const userId = String(req.user._id);
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const user = await User_model_1.default.findById(userId)
            .select("name email phone gender avatar role createdAt updatedAt")
            .lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Admin user not found." });
        }
        const [reviews, wishlist, notifications, usedCouponCodes] = await Promise.all([
            Review_model_1.default.countDocuments({ userId: userObjectId }),
            Wishlist_model_1.default.findOne({ user: userObjectId }).select("items").lean(),
            Notification_model_1.default.countDocuments({
                isActive: true,
                $or: [
                    { audience: "all" },
                    { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
                ],
            }),
            Order_model_1.default.distinct("discountCode", {
                user: userObjectId,
                discountCode: { $type: "string", $ne: "" },
            }),
        ]);
        return res.status(200).json({
            success: true,
            settings: {
                profile: {
                    id: String(user._id),
                    name: user.name,
                    gender: user.gender || "other",
                    image: {
                        url: user.avatar?.url || "",
                        publicId: user.avatar?.publicId || "",
                    },
                },
                personalInformation: {
                    name: user.name,
                    gender: user.gender || "other",
                    email: user.email,
                    mobile: user.phone,
                },
                accountActivity: {
                    coupons: usedCouponCodes.filter(Boolean).length,
                    reviews,
                    notifications,
                    wishlist: Array.isArray(wishlist?.items) ? wishlist.items.length : 0,
                },
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load user settings.",
        });
    }
}
/**
 * PATCH /api/admin/user-settings
 * Same user-settings API path updates only the fields requested by the UI.
 */
async function updateAdminUserSettings(req, res) {
    let uploadedPublicId = "";
    try {
        const nameInput = req.body?.name;
        const genderInput = req.body?.gender;
        const update = {};
        if (nameInput !== undefined) {
            const name = String(nameInput).trim();
            if (name.length < 2 || name.length > 100) {
                return res.status(400).json({ success: false, message: "Name must be between 2 and 100 characters." });
            }
            update.name = name;
        }
        if (genderInput !== undefined) {
            const gender = String(genderInput).trim().toLowerCase();
            if (!["male", "female", "other"].includes(gender)) {
                return res.status(400).json({ success: false, message: "Gender must be male, female or other." });
            }
            update.gender = gender;
        }
        const currentUser = await User_model_1.default.findById(req.user._id).select("avatar");
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "Admin user not found." });
        }
        if (req.file?.buffer) {
            const uploaded = await (0, cloudinary_service_1.uploadImageBuffer)(req.file.buffer, "hivrasoft/admin-profile");
            uploadedPublicId = uploaded.public_id;
            update.avatar = { url: uploaded.secure_url, publicId: uploaded.public_id };
        }
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: "Name, gender or profile image is required." });
        }
        const updated = await User_model_1.default.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true })
            .select("name email phone gender avatar role createdAt updatedAt")
            .lean();
        if (!updated) {
            if (uploadedPublicId)
                await (0, cloudinary_service_1.deleteCloudinaryImage)(uploadedPublicId).catch(() => undefined);
            return res.status(404).json({ success: false, message: "Admin user not found." });
        }
        const oldPublicId = currentUser.avatar?.publicId || "";
        if (uploadedPublicId && oldPublicId && oldPublicId !== uploadedPublicId) {
            await (0, cloudinary_service_1.deleteCloudinaryImage)(oldPublicId).catch(() => undefined);
        }
        return res.status(200).json({
            success: true,
            message: "User settings updated successfully.",
            profile: {
                id: String(updated._id),
                name: updated.name,
                gender: updated.gender || "other",
                image: {
                    url: updated.avatar?.url || "",
                    publicId: updated.avatar?.publicId || "",
                },
            },
            personalInformation: {
                name: updated.name,
                gender: updated.gender || "other",
                email: updated.email,
                mobile: updated.phone,
            },
        });
    }
    catch (error) {
        if (uploadedPublicId)
            await (0, cloudinary_service_1.deleteCloudinaryImage)(uploadedPublicId).catch(() => undefined);
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to update user settings.",
        });
    }
}
/** GET /api/admin/system-status */
async function getAdminSystemStatus(_req, res) {
    try {
        await getDb().command({ ping: 1 });
        const [orders, coupons, pages] = await Promise.all([
            safeCollectionCount("orders"),
            safeCollectionCount("coupons"),
            collectionExists("sitepages").then((exists) => exists ? safeCollectionCount("sitepages") : safeCollectionCount("pages")),
        ]);
        return res.status(200).json({
            success: true,
            services: {
                backend: "connected",
                mongodb: "connected",
                cloudinary: process.env.CLOUDINARY_CLOUD_NAME &&
                    process.env.CLOUDINARY_API_KEY &&
                    process.env.CLOUDINARY_API_SECRET
                    ? "configured"
                    : "not_configured",
            },
            collections: { orders, coupons, pages },
            environment: process.env.NODE_ENV || "development",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load system status.",
        });
    }
}
/* =========================================================
   ADMIN USER RESOURCE APIS
   GET /api/admin/users/:userId/...
========================================================= */
function adminUserId(req) {
    const raw = req.params.userId ?? req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value || !mongoose_1.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid customer id.");
    }
    return value;
}
async function ensureCustomer(userId) {
    const customer = await User_model_1.default.findOne({ _id: userId, role: "customer" })
        .select("_id name email phone isActive")
        .lean();
    if (!customer)
        throw new Error("Customer not found.");
    return customer;
}
async function getAdminUserCart(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const cart = await Cart_model_1.default.findOne({ user: userId })
            .populate({ path: "items.product", select: "colors isColor isActive categories" })
            .lean();
        const now = Date.now();
        const items = (cart?.items || []).map((item) => ({
            ...item,
            _id: String(item._id || ""),
            colorId: item.colorId ? String(item.colorId) : null,
            sizeId: item.sizeId ? String(item.sizeId) : null,
            addedAt: item.addedAt || null,
            updatedAt: item.updatedAt || item.addedAt || null,
            ageMs: item.addedAt ? Math.max(0, now - new Date(item.addedAt).getTime()) : 0,
        }));
        return res.json({
            success: true,
            customer,
            cart: {
                _id: cart?._id ? String(cart._id) : null,
                items,
                count: items.length,
                totalQuantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
                updatedAt: cart?.updatedAt || null,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer cart.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
async function getAdminUserWishlist(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const wishlist = await Wishlist_model_1.default.findOne({ user: userId })
            .populate({ path: "items.product", select: "colors isColor isActive categories" })
            .lean();
        const now = Date.now();
        const items = (wishlist?.items || []).map((item) => ({
            ...item,
            _id: String(item._id || ""),
            colorId: item.colorId ? String(item.colorId) : null,
            sizeId: item.sizeId ? String(item.sizeId) : null,
            addedAt: item.addedAt || null,
            updatedAt: item.updatedAt || item.addedAt || null,
            ageMs: item.addedAt ? Math.max(0, now - new Date(item.addedAt).getTime()) : 0,
        }));
        return res.json({
            success: true,
            customer,
            wishlist: {
                _id: wishlist?._id ? String(wishlist._id) : null,
                items,
                count: items.length,
                updatedAt: wishlist?.updatedAt || null,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer wishlist.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
async function getAdminUserOrders(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const orders = await Order_model_1.default.find({ user: userId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, customer, count: orders.length, orders });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer orders.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
async function getAdminUserNotifications(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const notifications = await Notification_model_1.default.find({
            isActive: true,
            $or: [
                { audience: "all" },
                { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(250)
            .lean();
        const items = notifications.map((notification) => ({
            ...notification,
            _id: String(notification._id),
            isRead: Array.isArray(notification.readBy)
                ? notification.readBy.some((id) => String(id) === userId)
                : false,
        }));
        return res.json({ success: true, customer, count: items.length, notifications: items });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer notifications.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
//# sourceMappingURL=admin.controller.js.map