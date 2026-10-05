import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";

import User from "../models/User.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";
import Banner from "../models/Banner.model";
import Order from "../models/Order.model";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import Review from "../models/Review.model";
import Address from "../models/user/address.model";
import Account from "../models/user/account.model";
import { hashPassword, verifyPassword } from "../utils/password";
import { getUserActivities, trackUserActivity } from "../services/activity.service";
import Notification from "../models/Notification.model";
import { listAdminCustomers } from "../services/customer-admin.service";
import { addItemToCart, clearUserCart, removeCartItem, updateCartItem, getUserCart } from "../services/cart.service";
import { addProductToWishlist, clearUserWishlist, removeProductFromWishlist, getUserWishlist } from "../services/wishlist.service";
import { buildInvoicePdf, buildInvoicesPdf } from "../services/invoice.service";
import { createOrderStatusNotification, isAdminTransitionAllowed, restoreOrderInventoryIfNeeded } from "../services/order.service";
import { deleteCloudinaryImage, uploadImageBuffer } from "../services/cloudinary.service";

const dummyHash = hashPassword("invalid-admin-login");

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 256
  ) {
    return res.status(400).json({ message: "Enter your login ID and password." });
  }

  try {
    const user = await User.findOne({ username: username.trim() }).select("+passwordHash");
    const valid = await verifyPassword(password, user?.passwordHash || (await dummyHash));

    if (!valid || !user?.isActive || !["admin", "super_admin"].includes(user.role)) {
      return res.status(401).json({ message: "Incorrect login ID or password." });
    }

    if (!process.env.JWT_SECRET) throw new Error("JWT secret missing");

    const token = jwt.sign(
      { id: String(user._id), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch {
    return res.status(503).json({ message: "Login is unavailable. Please try again." });
  }
}

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database is not connected.");
  return db;
}

async function collectionExists(name: string) {
  const db = getDb();
  const result = await db.listCollections({ name }, { nameOnly: true }).toArray();
  return result.length > 0;
}

async function safeCollectionCount(name: string) {
  if (!(await collectionExists(name))) return 0;
  return getDb().collection(name).countDocuments({});
}

/**
 * GET /api/admin/dashboard
 * One request for all cards/status data used by the admin dashboard.
 */
export async function getAdminDashboard(_req: Request, res: Response) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const cancelledStatuses = ["cancelled", "canceled"];
    const revenueMatch = { status: { $nin: cancelledStatuses } };

    const [
      products,
      categories,
      banners,
      customers,
      orders,
      revenueRows,
      currentProducts,
      previousProducts,
      currentOrders,
      previousOrders,
      currentCustomers,
      previousCustomers,
      currentRevenueRows,
      previousRevenueRows,
      recentOrdersRaw,
      productRows,
    ] = await Promise.all([
      Product.countDocuments({}),
      Category.countDocuments({}),
      Banner.countDocuments({}),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({}),
      Order.aggregate([{ $match: revenueMatch }, { $group: { _id: null, revenue: { $sum: "$total" } } }]),
      Product.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
      Product.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      Order.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
      Order.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      Order.aggregate([
        { $match: { ...revenueMatch, createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { ...revenueMatch, createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
      Order.find({}).sort({ createdAt: -1 }).limit(4).populate("user", "name email").lean(),
      Product.find({ isActive: { $ne: false } }).select("colors isColor isActive createdAt").lean(),
    ]);

    const growth = (current: number, previous: number) => {
      if (previous <= 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    const revenue = Number(revenueRows[0]?.revenue || 0);
    const currentRevenue = Number(currentRevenueRows[0]?.revenue || 0);
    const previousRevenue = Number(previousRevenueRows[0]?.revenue || 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyRevenueRows = await Order.aggregate([
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

    const dailyMap = new Map(
      dailyRevenueRows.map((row: any) => [
        `${row._id.year}-${String(row._id.month).padStart(2, "0")}-${String(row._id.day).padStart(2, "0")}`,
        { revenue: Number(row.revenue || 0), orders: Number(row.orders || 0) },
      ])
    );

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

    const rawStatuses = await Order.aggregate([
      { $group: { _id: { $toLower: "$status" }, count: { $sum: 1 } } },
    ]);
    const rawStatusMap = new Map(rawStatuses.map((row: any) => [String(row._id || ""), Number(row.count || 0)]));
    const statusCount = (names: string[]) => names.reduce((sum, name) => sum + Number(rawStatusMap.get(name) || 0), 0);
    const orderStatus = {
      pending: statusCount(["pending", "pending_payment", "confirmed", "processing", "shipped", "out_for_delivery"]),
      completed: statusCount(["completed", "delivered"]),
      cancelled: statusCount(["cancelled", "canceled", "returned", "refunded"]),
    };

    const recentOrders = recentOrdersRaw.map((order: any) => {
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
      .flatMap((product: any) => {
        const colors = Array.isArray(product.colors) ? product.colors : [];

        return colors.flatMap((color: any) => {
          const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
          const images = Array.isArray(color?.images) ? color.images : [];
          const image = images.find((item: any) => item?.isDefault) || images[0] || null;

          return sizes
            .filter((size: any) => size?.isActive !== false)
            .map((size: any) => ({
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
      .filter((variant: any) => variant.stock < 10)
      .sort((a: any, b: any) => a.stock - b.stock || a.name.localeCompare(b.name))
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
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        productsApi: "ready",
        categoriesApi: "ready",
        ordersApi: "ready",
        bannersApi: "ready",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load dashboard.",
    });
  }
}

/** GET /api/admin/customers - backend-driven search, filters and pagination. */
export async function getAdminCustomers(req: Request, res: Response) {
  try {
    const result = await listAdminCustomers(req.query as Record<string, unknown>);
    return res.status(200).json({
      success: true,
      count: result.customers.length,
      customers: result.customers,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load customers.",
    });
  }
}


/** POST /api/admin/customers - create a customer for Postman/admin testing. */
export async function createAdminCustomer(req: Request, res: Response) {
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
    const existing = await User.findOne({ $or: [{ email }, { phone }] }).select("_id").lean();
    if (existing) return res.status(409).json({ success: false, message: "Email or phone is already in use." });

    const requestedStatus = String(req.body?.accountStatus || "active").toLowerCase();
    const accountStatus = (["active", "inactive", "blocked"].includes(requestedStatus) ? requestedStatus : "active") as "active" | "inactive" | "blocked";
    const customer: any = await User.create({
      name, email, phone, role: "customer", emailVerified: Boolean(req.body?.emailVerified),
      isActive: accountStatus === "active", accountStatus, lastActiveAt: req.body?.lastActiveAt || null,
    });
    await Account.updateOne(
      { user: customer._id },
      { $setOnInsert: { user: customer._id, role: "customer", emailVerified: customer.emailVerified }, $set: { isActive: accountStatus === "active", isBlocked: accountStatus === "blocked" } },
      { upsert: true }
    );
    await trackUserActivity({ userId: String(customer._id), type: "register", metadata: { source: "admin_postman" } });
    return res.status(201).json({ success: true, message: "Customer created.", data: customer });
  } catch (error: any) {
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? "Email or phone is already in use." : (error instanceof Error ? error.message : "Unable to create customer.") });
  }
}

/** PATCH /api/admin/customers/:id - update basic customer fields. */
export async function updateAdminCustomer(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer id." });
    const update: Record<string, unknown> = {};
    if (req.body?.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body?.email !== undefined) update.email = String(req.body.email).trim().toLowerCase();
    if (req.body?.phone !== undefined) update.phone = String(req.body.phone).trim();
    if (req.body?.gender !== undefined) {
      const gender = String(req.body.gender).trim().toLowerCase();
      if (!["male", "female", "other"].includes(gender)) return res.status(400).json({ success: false, message: "Gender must be male, female or other." });
      update.gender = gender;
    }
    if (req.body?.emailVerified !== undefined) update.emailVerified = Boolean(req.body.emailVerified);
    if (Object.values(update).some((value) => value === "")) return res.status(400).json({ success: false, message: "Updated fields cannot be empty." });
    const customer = await User.findOneAndUpdate({ _id: id, role: "customer" }, { $set: update }, { new: true, runValidators: true })
      .select("name email phone gender emailVerified isActive accountStatus lastActiveAt createdAt updatedAt");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    return res.json({ success: true, message: "Customer updated.", data: customer });
  } catch (error: any) {
    return res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "Email or phone is already in use." : (error instanceof Error ? error.message : "Unable to update customer.") });
  }
}

/** PATCH /api/admin/customers/:id/last-active */
export async function updateAdminCustomerLastActive(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer id." });
    const value = req.body?.lastActiveAt ? new Date(req.body.lastActiveAt) : new Date();
    if (Number.isNaN(value.getTime())) return res.status(400).json({ success: false, message: "Invalid lastActiveAt date." });
    const customer = await User.findOneAndUpdate({ _id: id, role: "customer" }, { $set: { lastActiveAt: value } }, { new: true })
      .select("name email phone lastActiveAt");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    return res.json({ success: true, message: "Last active updated.", data: customer });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update last active." });
  }
}

/** Admin/Postman cart mutation helpers. */
export async function adminAddCustomerCartItem(req: Request, res: Response) {
  try {
    const userId = String(req.params.id || "");
    let cart = await addItemToCart(userId, { productId: String(req.body?.productId || ""), colorId: String(req.body?.colorId || req.body?.variantId || ""), sizeId: String(req.body?.sizeId || ""), quantity: req.body?.quantity });
    if (req.body?.addedAt) {
      const addedAt = new Date(req.body.addedAt);
      if (Number.isNaN(addedAt.getTime())) return res.status(400).json({ success: false, message: "Invalid addedAt date." });
      await Cart.updateOne(
        { user: userId, items: { $elemMatch: { product: req.body.productId, colorId: req.body?.colorId || req.body?.variantId, sizeId: req.body?.sizeId } } },
        { $set: { "items.$.addedAt": addedAt, "items.$.updatedAt": addedAt } }
      );
      cart = await getUserCart(userId);
    }
    return res.status(201).json({ success: true, message: "Product added to cart", data: cart });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add cart item." }); }
}

export async function adminUpdateCustomerCartItem(req: Request, res: Response) {
  try {
    const cart = await updateCartItem(String(req.params.id || ""), String(req.params.itemId || ""), { quantity: Number(req.body?.quantity) });
    return res.json({ success: true, message: "Cart quantity updated", data: cart });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update cart item." }); }
}

export async function adminRemoveCustomerCartItem(req: Request, res: Response) {
  try {
    const cart = await removeCartItem(String(req.params.id || ""), String(req.params.itemId || ""));
    return res.json({ success: true, message: "Cart item removed", data: cart });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove cart item." }); }
}

export async function adminClearCustomerCart(req: Request, res: Response) {
  try {
    const cart = await clearUserCart(String(req.params.id || ""));
    return res.json({ success: true, message: "Cart cleared", data: cart });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to clear cart." }); }
}

export async function adminAddCustomerWishlistItem(req: Request, res: Response) {
  try {
    const userId = String(req.params.id || "");
    const productId = String(req.body?.productId || "");
    const colorId = req.body?.colorId || req.body?.variantId || null;
    const sizeId = req.body?.sizeId || null;
    const result = await addProductToWishlist(userId, productId, { colorId, sizeId });
    let wishlist: any = result.wishlist;
    if (req.body?.addedAt) {
      const addedAt = new Date(req.body.addedAt);
      if (Number.isNaN(addedAt.getTime())) return res.status(400).json({ success: false, message: "Invalid addedAt date." });
      await Wishlist.updateOne(
        { user: userId, items: { $elemMatch: { product: productId, colorId: colorId || null, sizeId: sizeId || null } } },
        { $set: { "items.$.addedAt": addedAt, "items.$.updatedAt": addedAt } }
      );
      wishlist = await getUserWishlist(userId);
    }
    return res.status(result.alreadyExists ? 200 : 201).json({ success: true, message: result.alreadyExists ? "Product already in wishlist" : "Product added to wishlist", data: wishlist });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add wishlist item." }); }
}

export async function adminRemoveCustomerWishlistItem(req: Request, res: Response) {
  try {
    const wishlist = await removeProductFromWishlist(String(req.params.id || ""), String(req.params.itemId || ""));
    return res.json({ success: true, message: "Wishlist item removed", data: wishlist });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove wishlist item." }); }
}

export async function adminClearCustomerWishlist(req: Request, res: Response) {
  try {
    const wishlist = await clearUserWishlist(String(req.params.id || ""));
    return res.json({ success: true, message: "Wishlist cleared", data: wishlist });
  } catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to clear wishlist." }); }
}

/** GET /api/admin/customers/:id - complete customer 360 view for admin. */
export async function getAdminCustomerDetails(req: Request, res: Response) {
  try {
    const rawCustomerId = req.params.userId ?? req.params.id;
    const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;

    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id." });
    }

    const userObjectId = new Types.ObjectId(customerId);

    const customer = await User.findOne({ _id: userObjectId, role: "customer" })
      .select("name username email phone gender role emailVerified isActive accountStatus lastActiveAt avatar createdAt updatedAt")
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const [account, addresses, orders, cart, wishlist, activities, notificationCount] = await Promise.all([
      Account.findOne({ user: userObjectId })
        .select("role emailVerified phoneVerified isActive isBlocked createdAt updatedAt")
        .lean(),
      Address.find({ user: userObjectId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Order.find({ user: userObjectId }).sort({ createdAt: -1 }).lean(),
      Cart.findOne({ user: userObjectId }).lean(),
      Wishlist.findOne({ user: userObjectId }).lean(),
      getUserActivities(customerId, 100),
      Notification.countDocuments({
        isActive: true,
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
      }),
    ]);

    const productIds = Array.from(
      new Set([
        ...((cart?.items || []).map((item: any) => String(item.product || ""))),
        ...((wishlist?.items || []).map((item: any) => String(item.product || ""))),
        ...orders.flatMap((order: any) =>
          (Array.isArray(order?.items) ? order.items : []).map((item: any) =>
            String(item?.product?._id || item?.product || item?.productId || "")
          )
        ),
      ].filter((id) => Types.ObjectId.isValid(id)))
    );

    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) } })
          .populate({ path: "categories", select: "name slug" })
          .lean()
      : [];

    const productMap = new Map(products.map((product: any) => [String(product._id), product]));

    const pickColor = (product: any, colorId?: unknown) => {
      const colors = Array.isArray(product?.colors) ? product.colors : [];
      if (!colors.length) return null;

      const requested = String(colorId || "");
      const byId = requested
        ? colors.find((color: any) => String(color?._id || "") === requested)
        : null;

      return byId || colors.find((color: any) => color?.isDefault === true) || colors[0] || null;
    };

    const pickSize = (color: any, sizeId?: unknown) => {
      const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
      const requested = String(sizeId || "");
      return (
        (requested ? sizes.find((size: any) => String(size?._id || "") === requested) : null) ||
        sizes.find((size: any) => size?.isActive !== false) ||
        sizes[0] ||
        null
      );
    };

    const productView = (product: any, colorId?: unknown, sizeId?: unknown) => {
      if (!product) return null;

      const color = pickColor(product, colorId);
      const size = pickSize(color, sizeId);
      const images = Array.isArray(color?.images) ? color.images : [];
      const mainImages = Array.isArray(product?.mainImages) ? product.mainImages : [];
      const image =
        images.find((item: any) => item?.isDefault === true) ||
        images[0] ||
        mainImages.find((item: any) => item?.isDefault === true) ||
        mainImages[0] ||
        null;
      const categoryList = Array.isArray(product?.categories) ? product.categories : [];
      const colorStock = (Array.isArray(color?.sizes) ? color.sizes : []).reduce(
        (sum: number, item: any) => sum + Math.max(0, Number(item?.stock || 0)),
        0
      );
      const stock = color ? colorStock : Math.max(0, Number(product?.stock || 0));

      return {
        _id: String(product._id),
        name: String(color?.nameProduct || product?.name || "Product"),
        slug: String(color?.slugProduct || product?.slug || ""),
        colorName: String(color?.nameColor || ""),
        colorHex: String(color?.hex || ""),
        size: String(size?.size || ""),
        originalPrice: Number(
          size?.originalPrice ?? color?.originalPrice ?? product?.compareAtPrice ?? product?.price ?? 0
        ),
        showPrice: Number(size?.showPrice ?? color?.showPrice ?? product?.price ?? 0),
        stock,
        image: image?.url ? { url: String(image.url), publicId: String(image.publicId || "") } : null,
        categories: categoryList.map((category: any) => ({
          _id: String(category?._id || category || ""),
          name: String(category?.name || ""),
          slug: String(category?.slug || ""),
        })),
        isActive: product?.isActive !== false,
      };
    };

    const purchasedAfter = (productId: string, addedAt?: unknown) => {
      if (!productId || !addedAt) return false;
      const addedTime = new Date(addedAt as any).getTime();
      if (!Number.isFinite(addedTime)) return false;

      return orders.some((order: any) => {
        const status = String(order?.status || "").toLowerCase();
        if (["cancelled", "canceled"].includes(status)) return false;
        const orderTime = new Date(order?.createdAt || 0).getTime();
        if (!Number.isFinite(orderTime) || orderTime < addedTime) return false;
        return (Array.isArray(order?.items) ? order.items : []).some(
          (orderItem: any) => String(orderItem?.product?._id || orderItem?.product || "") === productId
        );
      });
    };

    const cartItems = (cart?.items || []).map((item: any) => {
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

    const wishlistItems = (wishlist?.items || []).map((item: any) => {
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

    const normalizedOrders = orders.map((order: any) => ({
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
      items: (Array.isArray(order.items) ? order.items : []).map((item: any) => {
        const productId = String(item?.product?._id || item?.product || item?.productId || "");
        const fallback = productView(productMap.get(productId), item?.colorId, item?.sizeId);
        const image = String(
          item?.image ||
            item?.imageUrl ||
            item?.productImage ||
            fallback?.image?.url ||
            ""
        );

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
    const openOrders = normalizedOrders.filter(
      (order) => order.status !== "delivered" && !["cancelled", "canceled"].includes(order.status)
    );
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
            _id: String((account as any)._id),
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
        averageOrderValue:
          normalizedOrders.length > 0
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
      addresses: addresses.map((address: any) => ({
        ...address,
        _id: String(address._id),
        user: String(address.user || customerId),
      })),
      activities: activities.map((activity: any) => ({
        ...activity,
        _id: String(activity._id),
        user: String(activity.user || customerId),
        product: activity.product
          ? {
              _id: String(activity.product._id),
              name: String(
                activity.product?.colors?.find((color: any) => color?.isDefault)?.nameProduct ||
                activity.product?.colors?.[0]?.nameProduct ||
                "Product"
              ),
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load customer details.",
    });
  }
}

/** GET /api/admin/customers/:id/activity */
export async function getAdminCustomerActivity(req: Request, res: Response) {
  try {
    const rawCustomerId = req.params.userId ?? req.params.id;
    const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;
    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id." });
    }

    const customer = await User.findOne({ _id: customerId, role: "customer" })
      .select("_id name email phone")
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const limit = Math.min(250, Math.max(1, Number(req.query.limit || 100)));
    const activities = await getUserActivities(customerId, limit);

    return res.json({
      success: true,
      customer,
      count: activities.length,
      activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load customer activity.",
    });
  }
}

/** PATCH /api/admin/customers/:id/status */
export async function updateAdminCustomerStatus(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer id." });

    const rawStatus = req.body?.accountStatus !== undefined
      ? String(req.body.accountStatus).toLowerCase()
      : (typeof req.body?.isActive === "boolean" ? (req.body.isActive ? "active" : "inactive") : "");
    if (!["active", "inactive", "blocked"].includes(rawStatus)) {
      return res.status(400).json({ success: false, message: "accountStatus must be active, inactive or blocked." });
    }
    const isActive = rawStatus === "active";
    const customer = await User.findOneAndUpdate(
      { _id: id, role: "customer" },
      { $set: { isActive, accountStatus: rawStatus } },
      { new: true }
    ).select("name email phone gender emailVerified isActive accountStatus lastActiveAt createdAt updatedAt");

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    await Account.updateOne(
      { user: customer._id },
      { $set: { isActive, isBlocked: rawStatus === "blocked" }, $setOnInsert: { user: customer._id, role: "customer", emailVerified: customer.emailVerified } },
      { upsert: true }
    );

    return res.status(200).json({ success: true, message: "Customer status updated.", customer });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update customer.",
    });
  }
}

function adminOrderItemProductId(item: any) {
  const value = item?.product?._id || item?.product || item?.productId || "";
  const id = String(value);
  return Types.ObjectId.isValid(id) ? id : "";
}

function adminOrderProductSnapshot(product: any, item: any) {
  if (!product) return null;
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const colorId = String(item?.colorId || "");
  const color =
    colors.find((entry: any) => String(entry?._id || "") === colorId) ||
    colors.find((entry: any) => entry?.isDefault === true) ||
    colors[0] ||
    null;
  const images = Array.isArray(color?.images) ? color.images : [];
  const mainImages = Array.isArray(product?.mainImages) ? product.mainImages : [];
  const image =
    images.find((entry: any) => entry?.isDefault === true && entry?.url) ||
    images.find((entry: any) => entry?.url) ||
    mainImages.find((entry: any) => entry?.isDefault === true && entry?.url) ||
    mainImages.find((entry: any) => entry?.url) ||
    null;

  return {
    name: String(color?.nameProduct || product?.name || "Product"),
    image: String(image?.url || ""),
  };
}

async function hydrateAdminOrderProductImages(orders: any[]) {
  const ids = Array.from(
    new Set(
      orders
        .flatMap((order: any) => (Array.isArray(order?.items) ? order.items : []))
        .map(adminOrderItemProductId)
        .filter(Boolean)
    )
  );

  if (!ids.length) return orders;

  const products = await Product.find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
    .select("colors mainImages")
    .lean();
  const productMap = new Map(products.map((product: any) => [String(product._id), product]));

  return orders.map((order: any) => ({
    ...order,
    items: (Array.isArray(order?.items) ? order.items : []).map((item: any) => {
      const currentImage = String(item?.image || item?.imageUrl || item?.productImage || item?.photo || "");
      if (currentImage) return item;

      const fallback = adminOrderProductSnapshot(productMap.get(adminOrderItemProductId(item)), item);
      if (!fallback?.image) return item;

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
export async function getAdminOrders(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || "20"), 10) || 20));
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim().toLowerCase();
    const paymentStatus = String(req.query.paymentStatus || "").trim().toLowerCase();
    const paymentMethod = String(req.query.paymentMethod || "").trim().toLowerCase();
    const dateFrom = String(req.query.dateFrom || "").trim();
    const dateTo = String(req.query.dateTo || "").trim();

    const filter: Record<string, any> = {};
    if (status === "pending") {
      filter.status = { $in: ["pending", "pending_payment", "confirmed", "processing", "shipped", "out_for_delivery"] };
    } else if (status === "completed") {
      filter.status = { $in: ["completed", "delivered"] };
    } else if (status === "cancelled") {
      filter.status = { $in: ["cancelled", "canceled", "returned", "refunded"] };
    } else if (status) {
      filter.status = status;
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00.000Z`);
        if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999Z`);
        if (!Number.isNaN(to.getTime())) createdAt.$lte = to;
      }
      if (Object.keys(createdAt).length) filter.createdAt = createdAt;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const users = await User.find({ role: "customer", $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("_id").limit(100).lean();
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
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email phone")
        .lean(),
    ]);

    const hydratedOrders = await hydrateAdminOrderProductImages(orders as any[]);

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
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load orders." });
  }
}

/** GET /api/admin/orders/:id */
export async function getAdminOrderById(req: Request, res: Response) {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order id." });
    const order = await Order.findById(orderId).populate("user", "name email phone").lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    const [hydratedOrder] = await hydrateAdminOrderProductImages([order as any]);
    return res.json({ success: true, order: hydratedOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load order." });
  }
}

/** GET /api/admin/orders/:id/invoice */
export async function downloadAdminOrderInvoice(req: Request, res: Response) {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order id." });
    const order = await Order.findById(orderId).populate("user", "name email phone").lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    const pdf = buildInvoicePdf(order as any);
    const name = String((order as any).invoiceNumber || (order as any).orderNumber || "invoice").replace(/[^A-Za-z0-9_-]/g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
    res.setHeader("Content-Length", String(pdf.length));
    return res.send(pdf);
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to create invoice." });
  }
}

/** GET /api/admin/orders/invoices?ids=id1,id2 - combined PDF. */
export async function downloadSelectedAdminInvoices(req: Request, res: Response) {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => Types.ObjectId.isValid(id));
    if (!ids.length) return res.status(400).json({ success: false, message: "Select at least one valid order." });
    if (ids.length > 50) return res.status(400).json({ success: false, message: "You can download up to 50 invoices at a time." });
    const orders = await Order.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean();
    if (!orders.length) return res.status(404).json({ success: false, message: "No selected orders were found." });
    const pdf = buildInvoicesPdf(orders as any[]);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="selected-invoices.pdf"');
    res.setHeader("Content-Length", String(pdf.length));
    return res.send(pdf);
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to create selected invoices." });
  }
}

const ADMIN_SIMPLE_STATUS_MAP: Record<string, string> = {
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

function adminStatusLabel(status: unknown) {
  const value = String(status || "").trim().toLowerCase();
  if (["completed", "delivered"].includes(value)) return "Completed";
  if (["cancelled", "canceled", "returned", "refunded"].includes(value)) return "Cancelled";
  return "Pending";
}

function normalizeAdminStatus(status: unknown) {
  const raw = String(status || "").trim().toLowerCase();
  if (!ADMIN_ORDER_STATUSES.includes(raw)) throw new Error("Invalid order status.");
  return ADMIN_SIMPLE_STATUS_MAP[raw] || raw;
}

async function applyAdminOrderStatus(order: any, requestedInput: unknown, adminId?: unknown, message?: unknown) {
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

  if (!isSimpleRequest && !isAdminTransitionAllowed(current, requested)) {
    throw new Error(`Cannot change order from ${current} to ${requested}.`);
  }

  if (
    current === "pending_payment" &&
    requested === "confirmed" &&
    order.paymentMethod === "razorpay" &&
    order.paymentStatus !== "paid"
  ) {
    throw new Error("Razorpay order cannot be confirmed until payment is verified.");
  }

  if (requested === "cancelled" && order.inventoryCommitted) {
    await restoreOrderInventoryIfNeeded(order.toObject());
    order.inventoryCommitted = false;
    order.fulfillmentState = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = String(message || "Cancelled by admin").trim();
  }

  if (current !== requested) {
    order.status = requested as any;
    order.statusHistory.push({
      status: requested,
      message: String(message || `Status changed to ${adminStatusLabel(requested)}.`).trim(),
      at: new Date(),
      by: adminId || null,
    } as any);

    await order.save();

    if (order.user) {
      await createOrderStatusNotification(order.toObject(), requested, adminId as any).catch(() => undefined);
      if (["delivered", "cancelled"].includes(requested)) {
        await trackUserActivity({
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
export async function updateAdminOrderStatus(req: Request, res: Response) {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id." });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    await applyAdminOrderStatus(order, req.body?.status, req.user?._id || null, req.body?.message);

    const populated = await Order.findById(order._id).populate("user", "name email phone").lean();
    return res.status(200).json({ success: true, order: populated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update order." });
  }
}

/** POST /api/admin/orders/bulk-status - update selected orders. */
export async function updateAdminOrdersBulkStatus(req: Request, res: Response) {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((id: unknown) => String(id || "").trim()).filter((id: string) => Types.ObjectId.isValid(id))
      : [];

    if (!ids.length) return res.status(400).json({ success: false, message: "Select at least one order." });
    if (ids.length > 100) return res.status(400).json({ success: false, message: "You can update up to 100 orders at a time." });

    // Validate status before touching any order.
    normalizeAdminStatus(req.body?.status);

    const orders = await Order.find({ _id: { $in: ids } });
    const failed: Array<{ id: string; message: string }> = [];
    let updated = 0;

    for (const order of orders) {
      try {
        const before = String(order.status || "");
        await applyAdminOrderStatus(order, req.body?.status, req.user?._id || null, req.body?.message);
        if (String(order.status || "") !== before) updated += 1;
      } catch (error) {
        failed.push({ id: String(order._id), message: error instanceof Error ? error.message : "Unable to update order." });
      }
    }

    return res.status(failed.length ? 207 : 200).json({
      success: failed.length === 0,
      updated,
      failed,
      message: failed.length ? `${updated} order(s) updated, ${failed.length} failed.` : `${updated} order(s) updated.`,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update selected orders." });
  }
}

function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Avoid spreadsheet formula execution when a CSV is opened in Excel/Sheets.
  if (/^[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** GET /api/admin/orders/export?ids=id1,id2 - export selected orders as CSV. */
export async function exportAdminOrdersCsv(req: Request, res: Response) {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => Types.ObjectId.isValid(id));

    if (!ids.length) return res.status(400).json({ success: false, message: "Select at least one valid order." });
    if (ids.length > 500) return res.status(400).json({ success: false, message: "You can export up to 500 orders at a time." });

    const orders = await Order.find({ _id: { $in: ids } })
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
      ...orders.map((order: any) => {
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to export orders." });
  }
}

/** POST /api/admin/orders/bulk-delete - permanently delete selected orders. */
export async function deleteAdminOrdersBulk(req: Request, res: Response) {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((id: unknown) => String(id || "").trim()).filter((id: string) => Types.ObjectId.isValid(id))
      : [];

    if (!ids.length) return res.status(400).json({ success: false, message: "Select at least one order." });
    if (ids.length > 100) return res.status(400).json({ success: false, message: "You can delete up to 100 orders at a time." });

    const orders = await Order.find({ _id: { $in: ids } });
    for (const order of orders) {
      const status = String(order.status || "").toLowerCase();
      const isFinished = ["delivered", "completed", "returned", "refunded", "cancelled", "canceled"].includes(status);
      if (order.inventoryCommitted && !isFinished) {
        await restoreOrderInventoryIfNeeded(order.toObject());
      }
    }

    const result = await Order.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({ success: true, deleted: Number(result.deletedCount || 0) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete selected orders." });
  }
}

/** GET /api/admin/coupons */
export async function getAdminCoupons(_req: Request, res: Response) {
  try {
    if (!(await collectionExists("coupons"))) {
      return res.status(200).json({ success: true, count: 0, coupons: [] });
    }
    const coupons = await getDb().collection("coupons").find({}).sort({ createdAt: -1 }).limit(250).toArray();
    return res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load coupons.",
    });
  }
}

/** GET /api/admin/pages */
export async function getAdminPages(_req: Request, res: Response) {
  try {
    const name = (await collectionExists("sitepages"))
      ? "sitepages"
      : (await collectionExists("pages"))
        ? "pages"
        : null;

    if (!name) return res.status(200).json({ success: true, count: 0, pages: [] });

    const pages = await getDb().collection(name).find({}).sort({ updatedAt: -1 }).limit(250).toArray();
    return res.status(200).json({ success: true, count: pages.length, pages });
  } catch (error) {
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
export async function getAdminUserSettings(req: Request, res: Response) {
  try {
    const userId = String(req.user!._id);
    const userObjectId = new Types.ObjectId(userId);
    const user = await User.findById(userId)
      .select("name email phone gender avatar role createdAt updatedAt")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "Admin user not found." });
    }

    const [reviews, wishlist, notifications, usedCouponCodes] = await Promise.all([
      Review.countDocuments({ userId: userObjectId }),
      Wishlist.findOne({ user: userObjectId }).select("items").lean(),
      Notification.countDocuments({
        isActive: true,
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
      }),
      Order.distinct("discountCode", {
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
          gender: (user as any).gender || "other",
          image: {
            url: user.avatar?.url || "",
            publicId: user.avatar?.publicId || "",
          },
        },
        personalInformation: {
          name: user.name,
          gender: (user as any).gender || "other",
          email: user.email,
          mobile: user.phone,
        },
        accountActivity: {
          coupons: usedCouponCodes.filter(Boolean).length,
          reviews,
          notifications,
          wishlist: Array.isArray((wishlist as any)?.items) ? (wishlist as any).items.length : 0,
        },
      },
    });
  } catch (error) {
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
export async function updateAdminUserSettings(req: Request, res: Response) {
  let uploadedPublicId = "";
  try {
    const nameInput = req.body?.name;
    const genderInput = req.body?.gender;
    const update: Record<string, unknown> = {};

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

    const currentUser = await User.findById(req.user!._id).select("avatar");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "Admin user not found." });
    }

    if (req.file?.buffer) {
      const uploaded = await uploadImageBuffer(req.file.buffer, "hivrasoft/admin-profile");
      uploadedPublicId = uploaded.public_id;
      update.avatar = { url: uploaded.secure_url, publicId: uploaded.public_id };
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "Name, gender or profile image is required." });
    }

    const updated = await User.findByIdAndUpdate(req.user!._id, { $set: update }, { new: true, runValidators: true })
      .select("name email phone gender avatar role createdAt updatedAt")
      .lean();

    if (!updated) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId).catch(() => undefined);
      return res.status(404).json({ success: false, message: "Admin user not found." });
    }

    const oldPublicId = currentUser.avatar?.publicId || "";
    if (uploadedPublicId && oldPublicId && oldPublicId !== uploadedPublicId) {
      await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
    }

    return res.status(200).json({
      success: true,
      message: "User settings updated successfully.",
      profile: {
        id: String(updated._id),
        name: updated.name,
        gender: (updated as any).gender || "other",
        image: {
          url: updated.avatar?.url || "",
          publicId: updated.avatar?.publicId || "",
        },
      },
      personalInformation: {
        name: updated.name,
        gender: (updated as any).gender || "other",
        email: updated.email,
        mobile: updated.phone,
      },
    });
  } catch (error) {
    if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId).catch(() => undefined);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update user settings.",
    });
  }
}

/** GET /api/admin/system-status */
export async function getAdminSystemStatus(_req: Request, res: Response) {
  try {
    await getDb().command({ ping: 1 });
    const [orders, coupons, pages] = await Promise.all([
      safeCollectionCount("orders"),
      safeCollectionCount("coupons"),
      collectionExists("sitepages").then((exists) =>
        exists ? safeCollectionCount("sitepages") : safeCollectionCount("pages")
      ),
    ]);

    return res.status(200).json({
      success: true,
      services: {
        backend: "connected",
        mongodb: "connected",
        cloudinary:
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
            ? "configured"
            : "not_configured",
      },
      collections: { orders, coupons, pages },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
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

function adminUserId(req: Request) {
  const raw = req.params.userId ?? req.params.id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !Types.ObjectId.isValid(value)) {
    throw new Error("Invalid customer id.");
  }
  return value;
}

async function ensureCustomer(userId: string) {
  const customer = await User.findOne({ _id: userId, role: "customer" })
    .select("_id name email phone isActive")
    .lean();
  if (!customer) throw new Error("Customer not found.");
  return customer;
}

export async function getAdminUserCart(req: Request, res: Response) {
  try {
    const userId = adminUserId(req);
    const customer = await ensureCustomer(userId);
    const cart = await Cart.findOne({ user: userId })
      .populate({ path: "items.product", select: "colors isColor isActive categories" })
      .lean();

    const now = Date.now();
    const items = (cart?.items || []).map((item: any) => ({
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
        totalQuantity: items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0),
        updatedAt: cart?.updatedAt || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load customer cart.";
    return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
  }
}

export async function getAdminUserWishlist(req: Request, res: Response) {
  try {
    const userId = adminUserId(req);
    const customer = await ensureCustomer(userId);
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate({ path: "items.product", select: "colors isColor isActive categories" })
      .lean();

    const now = Date.now();
    const items = (wishlist?.items || []).map((item: any) => ({
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load customer wishlist.";
    return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
  }
}

export async function getAdminUserOrders(req: Request, res: Response) {
  try {
    const userId = adminUserId(req);
    const customer = await ensureCustomer(userId);
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, customer, count: orders.length, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load customer orders.";
    return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
  }
}

export async function getAdminUserNotifications(req: Request, res: Response) {
  try {
    const userId = adminUserId(req);
    const customer = await ensureCustomer(userId);
    const userObjectId = new Types.ObjectId(userId);
    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { audience: "all" },
        { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();

    const items = notifications.map((notification: any) => ({
      ...notification,
      _id: String(notification._id),
      isRead: Array.isArray(notification.readBy)
        ? notification.readBy.some((id: any) => String(id) === userId)
        : false,
    }));

    return res.json({ success: true, customer, count: items.length, notifications: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load customer notifications.";
    return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
  }
}
