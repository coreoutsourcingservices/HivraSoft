"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const address_routes_1 = __importDefault(require("./routes/user/address.routes"));
const banner_routes_1 = __importDefault(require("./routes/banner.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const blog_routes_1 = __importDefault(require("./routes/blog.routes"));
const blog_taxonomy_routes_1 = require("./routes/blog-taxonomy.routes");
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const user_settings_routes_1 = __importDefault(require("./routes/user-settings.routes"));
const order_controller_1 = require("./controllers/order.controller");
const app = (0, express_1.default)();
// Hostinger forwards requests through its reverse proxy. Trust only the
// nearest hop so client-supplied earlier X-Forwarded-For entries are ignored.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}
/* =========================================================
   CORS
========================================================= */
app.use((0, cors_1.default)({
    origin: process.env
        .FRONTEND_URL ||
        "http://localhost:3000",
    credentials: true,
}));
/* =========================================================
   BODY PARSER
========================================================= */
app.post("/api/payments/razorpay/webhook", express_1.default.raw({ type: "application/json", limit: "2mb" }), order_controller_1.razorpayWebhookController);
app.use(express_1.default.json({
    limit: "10mb",
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: "10mb",
}));
/* =========================================================
   COOKIE PARSER
========================================================= */
app.use((0, cookie_parser_1.default)());
/* =========================================================
   HEALTH CHECK
========================================================= */
app.get("/api/health", (req, res) => {
    return res
        .status(200)
        .json({
        success: true,
        message: "HivraSoft backend is working",
    });
});
/* =========================================================
   AUTH
========================================================= */
app.use("/api/auth", auth_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
/* =========================================================
   CATEGORIES
========================================================= */
app.use("/api/categories", category_routes_1.default);
/* =========================================================
   PRODUCTS
========================================================= */
app.use("/api/products", product_routes_1.default);
/* =========================================================
   GLOBAL STOREFRONT SEARCH
========================================================= */
app.use("/api/search", search_routes_1.default);
app.use("/api/uploads", upload_routes_1.default);
app.use("/api/address", address_routes_1.default);
app.use("/api/banners", banner_routes_1.default);
app.use("/api/wishlist", wishlist_routes_1.default);
app.use("/api/cart", cart_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/blogs", blog_routes_1.default);
app.use("/api/blog-categories", blog_taxonomy_routes_1.blogCategoryRoutes);
app.use("/api/blog-tags", blog_taxonomy_routes_1.blogTagRoutes);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/user-settings", user_settings_routes_1.default);
/* =========================================================
   404
========================================================= */
app.use((req, res) => {
    return res
        .status(404)
        .json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map