import { Types } from "mongoose";
import User from "../models/User.model";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import Order from "../models/Order.model";
import Product from "../models/Product.model";
import UserActivity from "../models/UserActivity.model";
import Account from "../models/user/account.model";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export type CustomerFilterInput = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function bool(value: unknown): boolean | undefined {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
}

function num(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateValue(value: unknown): Date | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function customerPipeline(filters: CustomerFilterInput, options: { includePagination?: boolean } = {}) {
  const now = Date.now();
  const pipeline: any[] = [{ $match: { role: "customer" } }];
  const baseMatch: Record<string, any> = {};

  const search = text(filters.search || filters.q);
  if (search) {
    const searchConditions: any[] = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { email: { $regex: escapeRegex(search), $options: "i" } },
      { phone: { $regex: escapeRegex(search), $options: "i" } },
    ];
    if (Types.ObjectId.isValid(search)) searchConditions.push({ _id: new Types.ObjectId(search) });
    baseMatch.$or = searchConditions;
  }

  const status = text(filters.accountStatus || filters.status).toLowerCase();

  const joined = text(filters.joined).toLowerCase();
  const joinedFrom = dateValue(filters.joinedFrom);
  const joinedTo = dateValue(filters.joinedTo);
  const createdAt: Record<string, Date> = {};
  if (joined === "today") createdAt.$gte = startOfToday();
  if (["7d", "7days", "last7days"].includes(joined)) createdAt.$gte = new Date(now - 7 * DAY_MS);
  if (["30d", "30days", "last30days"].includes(joined)) createdAt.$gte = new Date(now - 30 * DAY_MS);
  if (joinedFrom) createdAt.$gte = joinedFrom;
  if (joinedTo) createdAt.$lte = joinedTo;
  if (Object.keys(createdAt).length) baseMatch.createdAt = createdAt;

  if (Object.keys(baseMatch).length) pipeline.push({ $match: baseMatch });

  pipeline.push(
    {
      $lookup: {
        from: Cart.collection.name,
        localField: "_id",
        foreignField: "user",
        as: "cartDocs",
      },
    },
    {
      $lookup: {
        from: Wishlist.collection.name,
        localField: "_id",
        foreignField: "user",
        as: "wishlistDocs",
      },
    },
    {
      $lookup: {
        from: Order.collection.name,
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpend: {
                $sum: {
                  $cond: [
                    { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["cancelled", "canceled"]] },
                    0,
                    { $ifNull: ["$total", 0] },
                  ],
                },
              },
              lastOrderAt: { $max: "$createdAt" },
              couponUsed: { $max: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$discountCode", ""] } }, 0] }, 1, 0] } },
              discountUsed: { $max: { $cond: [{ $gt: [{ $ifNull: ["$discount", 0] }, 0] }, 1, 0] } },
            },
          },
        ],
        as: "orderStats",
      },
    },
    {
      $lookup: {
        from: Account.collection.name,
        localField: "_id",
        foreignField: "user",
        as: "accountDocs",
      },
    },
    {
      $lookup: {
        from: UserActivity.collection.name,
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, createdAt: 1 } },
        ],
        as: "lastActivityDocs",
      },
    },
    {
      $set: {
        cart: { $ifNull: [{ $arrayElemAt: ["$cartDocs", 0] }, { items: [] }] },
        wishlist: { $ifNull: [{ $arrayElemAt: ["$wishlistDocs", 0] }, { items: [] }] },
        orders: { $ifNull: [{ $arrayElemAt: ["$orderStats", 0] }, { orderCount: 0, totalSpend: 0, lastOrderAt: null, couponUsed: 0, discountUsed: 0 }] },
        lastActivityAt: { $arrayElemAt: ["$lastActivityDocs.createdAt", 0] },
        account: { $arrayElemAt: ["$accountDocs", 0] },
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        let: { productIds: { $ifNull: ["$cart.items.product", []] } },
        pipeline: [{ $match: { $expr: { $in: ["$_id", "$$productIds"] } } }, { $project: { colors: 1 } }],
        as: "cartProducts",
      },
    },
    {
      $set: {
        cartItems: { $ifNull: ["$cart.items", []] },
        wishlistItems: { $ifNull: ["$wishlist.items", []] },
        cartItemCount: { $size: { $ifNull: ["$cart.items", []] } },
        cartQuantity: {
          $reduce: {
            input: { $ifNull: ["$cart.items", []] },
            initialValue: 0,
            in: { $add: ["$$value", { $ifNull: ["$$this.quantity", 0] }] },
          },
        },
        wishlistCount: { $size: { $ifNull: ["$wishlist.items", []] } },
        oldestCartItemAt: { $min: "$cart.items.addedAt" },
        oldestWishlistItemAt: { $min: "$wishlist.items.addedAt" },
        orderCount: { $ifNull: ["$orders.orderCount", 0] },
        totalSpend: { $ifNull: ["$orders.totalSpend", 0] },
        lastOrderAt: "$orders.lastOrderAt",
        couponUsed: { $eq: ["$orders.couponUsed", 1] },
        discountUsed: { $eq: ["$orders.discountUsed", 1] },
        resolvedLastActiveAt: { $ifNull: ["$lastActivityAt", { $ifNull: ["$lastActiveAt", "$updatedAt"] }] },
        resolvedAccountStatus: {
          $cond: [
            { $or: [{ $eq: ["$accountStatus", "blocked"] }, { $eq: ["$account.isBlocked", true] }] },
            "blocked",
            {
              $cond: [
                { $or: [{ $eq: ["$accountStatus", "inactive"] }, { $eq: ["$isActive", false] }, { $eq: ["$account.isActive", false] }] },
                "inactive",
                "active",
              ],
            },
          ],
        },
      },
    },
    {
      $set: {
        cartValue: {
          $round: [
            {
              $reduce: {
                input: "$cartItems",
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $let: {
                        vars: {
                          item: "$$this",
                          product: {
                            $arrayElemAt: [
                              { $filter: { input: "$cartProducts", as: "p", cond: { $eq: ["$$p._id", "$$this.product"] } } },
                              0,
                            ],
                          },
                        },
                        in: {
                          $let: {
                            vars: {
                              color: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: { $ifNull: ["$$product.colors", []] },
                                      as: "c",
                                      cond: { $eq: ["$$c._id", "$$item.colorId"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              $let: {
                                vars: {
                                  size: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: { $ifNull: ["$$color.sizes", []] },
                                          as: "s",
                                          cond: { $eq: ["$$s._id", "$$item.sizeId"] },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: {
                                  $multiply: [
                                    { $ifNull: ["$$size.showPrice", { $ifNull: ["$$color.showPrice", 0] }] },
                                    { $ifNull: ["$$item.quantity", 0] },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            2,
          ],
        },
        productsInBothCount: {
          $size: {
            $setIntersection: [
              { $map: { input: "$cartItems", as: "i", in: "$$i.product" } },
              { $map: { input: "$wishlistItems", as: "i", in: "$$i.product" } },
            ],
          },
        },
      },
    }
  );

  const statsMatch: Record<string, any> = {};
  if (["active", "inactive", "blocked"].includes(status)) statsMatch.resolvedAccountStatus = status;
  const hasCart = bool(filters.hasCart);
  if (hasCart === true) statsMatch.cartItemCount = { $gt: 0 };
  if (hasCart === false) statsMatch.cartItemCount = 0;
  const cartCountMin = num(filters.cartCountMin ?? filters.minCartItems);
  const cartCountMax = num(filters.cartCountMax ?? filters.maxCartItems);
  if (cartCountMin !== undefined || cartCountMax !== undefined) statsMatch.cartItemCount = { ...(statsMatch.cartItemCount || {}), ...(cartCountMin !== undefined ? { $gte: cartCountMin } : {}), ...(cartCountMax !== undefined ? { $lte: cartCountMax } : {}) };
  const minCartValue = num(filters.minCartValue);
  const maxCartValue = num(filters.maxCartValue);
  if (minCartValue !== undefined || maxCartValue !== undefined) statsMatch.cartValue = { ...(minCartValue !== undefined ? { $gte: minCartValue } : {}), ...(maxCartValue !== undefined ? { $lte: maxCartValue } : {}) };

  const cartAgePreset = text(filters.cartAge).toLowerCase();
  let cartAgeMinHours = num(filters.cartAgeMinHours);
  let cartAgeMaxHours = num(filters.cartAgeMaxHours);
  let cartAgeMinDays = num(filters.cartAgeMinDays ?? filters.abandonedCartDays);
  let cartAgeMaxDays = num(filters.cartAgeMaxDays);
  if (cartAgePreset === "lt1h") cartAgeMaxHours = 1;
  if (cartAgePreset === "1-24h") { cartAgeMinHours = 1; cartAgeMaxHours = 24; }
  if (cartAgePreset === "1-3d") { cartAgeMinDays = 1; cartAgeMaxDays = 3; }
  if (cartAgePreset === "3-7d") { cartAgeMinDays = 3; cartAgeMaxDays = 7; }
  if (cartAgePreset === "7-30d") { cartAgeMinDays = 7; cartAgeMaxDays = 30; }
  if (cartAgePreset === "30plus") cartAgeMinDays = 30;
  const oldestCart: Record<string, Date> = {};
  if (cartAgeMinHours !== undefined) oldestCart.$lte = new Date(now - cartAgeMinHours * HOUR_MS);
  if (cartAgeMinDays !== undefined) oldestCart.$lte = new Date(now - cartAgeMinDays * DAY_MS);
  if (cartAgeMaxHours !== undefined) oldestCart.$gte = new Date(now - cartAgeMaxHours * HOUR_MS);
  if (cartAgeMaxDays !== undefined) oldestCart.$gte = new Date(now - cartAgeMaxDays * DAY_MS);
  if (Object.keys(oldestCart).length) statsMatch.oldestCartItemAt = oldestCart;

  const hasWishlist = bool(filters.hasWishlist);
  if (hasWishlist === true) statsMatch.wishlistCount = { $gt: 0 };
  if (hasWishlist === false) statsMatch.wishlistCount = 0;
  const wishlistCountMin = num(filters.wishlistCountMin ?? filters.minWishlistItems);
  const wishlistCountMax = num(filters.wishlistCountMax ?? filters.maxWishlistItems);
  if (wishlistCountMin !== undefined || wishlistCountMax !== undefined) statsMatch.wishlistCount = { ...(statsMatch.wishlistCount || {}), ...(wishlistCountMin !== undefined ? { $gte: wishlistCountMin } : {}), ...(wishlistCountMax !== undefined ? { $lte: wishlistCountMax } : {}) };
  const wishlistAgePreset = text(filters.wishlistAge).toLowerCase();
  let wishlistAgeMinDays = num(filters.wishlistAgeMinDays);
  let wishlistAgeMaxDays = num(filters.wishlistAgeMaxDays);
  const oldestWishlist: Record<string, Date> = {};
  if (wishlistAgePreset === "today") oldestWishlist.$gte = startOfToday();
  if (wishlistAgePreset === "1-7d") { wishlistAgeMinDays = 1; wishlistAgeMaxDays = 7; }
  if (wishlistAgePreset === "7-30d") { wishlistAgeMinDays = 7; wishlistAgeMaxDays = 30; }
  if (wishlistAgePreset === "30-90d") { wishlistAgeMinDays = 30; wishlistAgeMaxDays = 90; }
  if (wishlistAgePreset === "90plus") wishlistAgeMinDays = 90;
  if (wishlistAgeMinDays !== undefined) oldestWishlist.$lte = new Date(now - wishlistAgeMinDays * DAY_MS);
  if (wishlistAgeMaxDays !== undefined) oldestWishlist.$gte = new Date(now - wishlistAgeMaxDays * DAY_MS);
  if (Object.keys(oldestWishlist).length) statsMatch.oldestWishlistItemAt = oldestWishlist;

  const cartWishlist = text(filters.cartWishlist).toLowerCase();
  if (["both", "productinboth"].includes(cartWishlist)) statsMatch.productsInBothCount = { $gt: 0 };
  if (["cartonly", "cart_only"].includes(cartWishlist)) Object.assign(statsMatch, { cartItemCount: { $gt: 0 }, wishlistCount: 0 });
  if (["wishlistonly", "wishlist_only"].includes(cartWishlist)) Object.assign(statsMatch, { wishlistCount: { $gt: 0 }, cartItemCount: 0 });

  const orderStatus = text(filters.orderStatus).toLowerCase();
  if (["never", "neverordered", "none"].includes(orderStatus)) statsMatch.orderCount = 0;
  if (["has", "hasorders", "ordered"].includes(orderStatus)) statsMatch.orderCount = { $gt: 0 };
  const orderCountMin = num(filters.orderCountMin);
  const orderCountMax = num(filters.orderCountMax);
  if (orderCountMin !== undefined || orderCountMax !== undefined) statsMatch.orderCount = { ...(statsMatch.orderCount || {}), ...(orderCountMin !== undefined ? { $gte: orderCountMin } : {}), ...(orderCountMax !== undefined ? { $lte: orderCountMax } : {}) };
  const minSpend = num(filters.minSpend ?? filters.minTotalSpend);
  const maxSpend = num(filters.maxSpend ?? filters.maxTotalSpend);
  if (minSpend !== undefined || maxSpend !== undefined) statsMatch.totalSpend = { ...(minSpend !== undefined ? { $gte: minSpend } : {}), ...(maxSpend !== undefined ? { $lte: maxSpend } : {}) };
  const couponUsed = bool(filters.couponUsed);
  if (couponUsed !== undefined) statsMatch.couponUsed = couponUsed;
  const discountUsed = bool(filters.discountUsed);
  if (discountUsed !== undefined) statsMatch.discountUsed = discountUsed;

  const lastOrderFrom = dateValue(filters.lastOrderFrom);
  const lastOrderTo = dateValue(filters.lastOrderTo);
  let lastOrderMaxDays = num(filters.lastOrderMaxDays);
  let lastOrderMinDays = num(filters.lastOrderMinDays);
  const lastOrderPreset = text(filters.lastOrder).toLowerCase();
  if (lastOrderPreset === "today") lastOrderMaxDays = 1;
  if (lastOrderPreset === "7d") lastOrderMaxDays = 7;
  if (lastOrderPreset === "30d") lastOrderMaxDays = 30;
  if (lastOrderPreset === "90plus") lastOrderMinDays = 90;
  const lastOrderMatch: Record<string, Date> = {};
  if (lastOrderFrom) lastOrderMatch.$gte = lastOrderFrom;
  if (lastOrderTo) lastOrderMatch.$lte = lastOrderTo;
  if (lastOrderMaxDays !== undefined) lastOrderMatch.$gte = new Date(now - lastOrderMaxDays * DAY_MS);
  if (lastOrderMinDays !== undefined) lastOrderMatch.$lte = new Date(now - lastOrderMinDays * DAY_MS);
  if (Object.keys(lastOrderMatch).length) statsMatch.lastOrderAt = lastOrderMatch;

  const lastActive = text(filters.lastActive).toLowerCase();
  const lastActiveMatch: Record<string, Date> = {};
  if (lastActive === "today") lastActiveMatch.$gte = startOfToday();
  if (["24h", "1d"].includes(lastActive)) lastActiveMatch.$gte = new Date(now - DAY_MS);
  if (["3d", "3days"].includes(lastActive)) lastActiveMatch.$gte = new Date(now - 3 * DAY_MS);
  if (["7d", "7days"].includes(lastActive)) lastActiveMatch.$gte = new Date(now - 7 * DAY_MS);
  if (["30+d", "30plus", "30daysplus"].includes(lastActive)) lastActiveMatch.$lte = new Date(now - 30 * DAY_MS);
  const lastActiveMaxDays = num(filters.lastActiveMaxDays);
  const lastActiveMinDays = num(filters.lastActiveMinDays);
  if (lastActiveMaxDays !== undefined) lastActiveMatch.$gte = new Date(now - lastActiveMaxDays * DAY_MS);
  if (lastActiveMinDays !== undefined) lastActiveMatch.$lte = new Date(now - lastActiveMinDays * DAY_MS);
  if (Object.keys(lastActiveMatch).length) statsMatch.resolvedLastActiveAt = lastActiveMatch;

  if (Object.keys(statsMatch).length) pipeline.push({ $match: statsMatch });

  pipeline.push({
    $project: {
      passwordHash: 0,
      cartDocs: 0,
      wishlistDocs: 0,
      orderStats: 0,
      lastActivityDocs: 0,
      accountDocs: 0,
      account: 0,
      cartProducts: 0,
      cart: 0,
      wishlist: 0,
      orders: 0,
      cartItems: 0,
      wishlistItems: 0,
    },
  });

  return pipeline;
}

export async function listAdminCustomers(filters: CustomerFilterInput) {
  const page = Math.max(1, Math.floor(num(filters.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(num(filters.limit) || 20)));
  const pipeline = customerPipeline(filters);

  pipeline.push({
    $facet: {
      data: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ],
      total: [{ $count: "count" }],
    },
  });

  const [result] = await User.aggregate(pipeline).allowDiskUse(true);
  const customers = result?.data || [];
  const total = Number(result?.total?.[0]?.count || 0);
  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

export async function matchingCustomerIds(filters: CustomerFilterInput) {
  const pipeline = customerPipeline(filters);
  pipeline.push({ $project: { _id: 1 } });
  const rows = await User.aggregate(pipeline).allowDiskUse(true);
  return rows.map((row: any) => String(row._id));
}
