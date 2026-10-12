
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import categoryRoutes from "./routes/category.routes";
import productRoutes from "./routes/product.routes";
import uploadRoutes from "./routes/upload.routes";
import addressRoutes from "./routes/user/address.routes";
import bannerRoutes from "./routes/banner.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import blogRoutes from "./routes/blog.routes";

import {
  blogCategoryRoutes,
  blogTagRoutes,
} from "./routes/blog-taxonomy.routes";

import searchRoutes from "./routes/search.routes";
import notificationRoutes from "./routes/notification.routes";
import reviewRoutes from "./routes/review.routes";
import userSettingsRoutes from "./routes/user-settings.routes";
import homepageRoutes from "./routes/homepage.routes";
import offerRoutes from "./routes/offer.routes";
import leadFormRoutes from "./routes/lead-form.routes";
import discountRoutes from "./routes/discount.routes";

import {
  razorpayWebhookController,
} from "./controllers/order.controller";

/* =========================================================
   APP
========================================================= */

const app = express();

/* =========================================================
   TRUST PROXY
========================================================= */

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* =========================================================
   CORS
   Allows both www and non-www production domains.
========================================================= */

const allowedOrigins = [
  "https://hivrasoft.com",
  "https://www.hivrasoft.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Optional additional origins from Hostinger.
// Separate multiple URLs with commas.
const extraOrigins = (
  process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allAllowedOrigins = [
  ...new Set([...allowedOrigins, ...extraOrigins]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin, such as server-to-server.
      if (!origin || allAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: true,
  })
);

/* =========================================================
   RAZORPAY WEBHOOK
   Keep express.raw() before express.json().
========================================================= */

app.post(
  "/api/payments/razorpay/webhook",
  express.raw({
    type: "application/json",
    limit: "2mb",
  }),
  razorpayWebhookController
);

/* =========================================================
   BODY PARSERS
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/* =========================================================
   COOKIE PARSER
========================================================= */

app.use(cookieParser());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "HivraSoft backend is working",
  });
});

/* =========================================================
   AUTH & ADMIN
========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

/* =========================================================
   CATEGORIES & PRODUCTS
========================================================= */

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);

/* =========================================================
   UPLOADS & ADDRESS
========================================================= */

app.use("/api/uploads", uploadRoutes);
app.use("/api/address", addressRoutes);

/* =========================================================
   BANNERS, WISHLIST & CART
========================================================= */

app.use("/api/banners", bannerRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);

/* =========================================================
   ORDERS
========================================================= */

app.use("/api/orders", orderRoutes);

/* =========================================================
   BLOGS
========================================================= */

app.use("/api/blogs", blogRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/blog-tags", blogTagRoutes);

/* =========================================================
   NOTIFICATIONS & REVIEWS
========================================================= */

app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

/* =========================================================
   USER SETTINGS & HOMEPAGE
========================================================= */

app.use("/api/user-settings", userSettingsRoutes);
app.use("/api", homepageRoutes);

/* =========================================================
   OFFERS & DISCOUNTS
========================================================= */

app.use("/api/offers", offerRoutes);
app.use("/api/discounts", discountRoutes);

/* =========================================================
   LEAD FORMS
========================================================= */

app.use("/api", leadFormRoutes);

/* =========================================================
   404 - KEEP LAST
========================================================= */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

/* =========================================================
   EXPORT
========================================================= */

export default app;
