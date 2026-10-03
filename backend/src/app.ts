import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

import categoryRoutes from "./routes/category.routes";

import productRoutes from "./routes/product.routes";
import uploadRoutes from "./routes/upload.routes";
import  addressRoutes from "./routes/user/address.routes"
import bannerRoutes from "./routes/banner.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import blogRoutes from "./routes/blog.routes";
import { blogCategoryRoutes, blogTagRoutes } from "./routes/blog-taxonomy.routes";
import searchRoutes from "./routes/search.routes";
import notificationRoutes from "./routes/notification.routes";
import reviewRoutes from "./routes/review.routes";
import userSettingsRoutes from "./routes/user-settings.routes";
<<<<<<< HEAD
import homepageRoutes from "./routes/homepage.routes";
import offerRoutes from "./routes/offer.routes";
=======
>>>>>>> aman
import { razorpayWebhookController } from "./controllers/order.controller";

const app =
  express();

// Hostinger forwards requests through its reverse proxy. Trust only the
// nearest hop so client-supplied earlier X-Forwarded-For entries are ignored.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin:
      process.env
        .FRONTEND_URL ||
      "http://localhost:3000",

    credentials:
      true,
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.post(
  "/api/payments/razorpay/webhook",
  express.raw({ type: "application/json", limit: "2mb" }),
  razorpayWebhookController
);

app.use(
  express.json({
    limit:
      "10mb",
  })
);

app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "10mb",
  })
);

/* =========================================================
   COOKIE PARSER
========================================================= */

app.use(
  cookieParser()
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (
    req,
    res
  ) => {
    return res
      .status(200)
      .json({
        success:
          true,

        message:
          "HivraSoft backend is working",
      });
  }
);

/* =========================================================
   AUTH
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);
app.use("/api/admin", adminRoutes);

/* =========================================================
   CATEGORIES
========================================================= */

app.use(
  "/api/categories",
  categoryRoutes
);

/* =========================================================
   PRODUCTS
========================================================= */

app.use(
  "/api/products",
  productRoutes
);

/* =========================================================
   GLOBAL STOREFRONT SEARCH
========================================================= */

app.use(
  "/api/search",
  searchRoutes
);

app.use(
  "/api/uploads",
  uploadRoutes
);
app.use(
  "/api/address",
  addressRoutes
);


app.use(
  "/api/banners",
  bannerRoutes
);
app.use(
  "/api/wishlist",
  wishlistRoutes
);
app.use(
  "/api/cart",
  cartRoutes
);
app.use(
  "/api/orders",
  orderRoutes
);

app.use("/api/blogs", blogRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/blog-tags", blogTagRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use("/api/reviews", reviewRoutes);
app.use("/api/user-settings", userSettingsRoutes);
<<<<<<< HEAD
app.use("/api", homepageRoutes);
app.use("/api/offers", offerRoutes);
=======
>>>>>>> aman

/* =========================================================
   404
========================================================= */

app.use(
  (
    req,
    res
  ) => {
    return res
      .status(404)
      .json({
        success:
          false,

        message:
          `Route not found: ${req.originalUrl}`,
      });
  }
);

export default app;
