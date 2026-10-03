import { Types } from "mongoose";
import UserActivity from "../models/UserActivity.model";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import Order from "../models/Order.model";
import Notification from "../models/Notification.model";

export type CommerceTrackingKind = "cart" | "wishlist";

export type CommerceTrackingQuery = {
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  status?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function objectId(value: unknown) {
  const id = text(value);
  return Types.ObjectId.isValid(id) ? id : "";
}

function dateOrNull(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getVariant(product: any, colorId: string, sizeId: string) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const color = colors.find((entry: any) => String(entry?._id || "") === colorId)
    || colors.find((entry: any) => entry?.isDefault === true)
    || colors[0]
    || null;
  const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
  const size = sizes.find((entry: any) => String(entry?._id || "") === sizeId) || sizes[0] || null;
  const images = Array.isArray(color?.images) ? color.images : [];
  const image = images.find((entry: any) => entry?.isDefault === true) || images[0] || null;
  return {
    name: String(color?.nameProduct || "Product unavailable"),
    slug: String(color?.slugProduct || ""),
    colorName: String(color?.nameColor || ""),
    sizeName: String(size?.size || ""),
    price: Number(size?.showPrice ?? color?.showPrice ?? 0),
    imageUrl: String(image?.url || ""),
  };
}

function getProductSnapshot(metadata: any) {
  const snapshot = metadata?.productSnapshot;
  if (!snapshot || typeof snapshot !== "object") return null;

  const name = text(snapshot.name);
  const slug = text(snapshot.slug);
  const colorName = text(snapshot.colorName);
  const sizeName = text(snapshot.sizeName);
  const imageUrl = text(snapshot.imageUrl);
  const price = Number(snapshot.price ?? 0);

  if (!name && !slug && !colorName && !sizeName && !imageUrl && !Number.isFinite(price)) return null;

  return {
    name: name || "Product unavailable",
    slug,
    colorName,
    sizeName,
    price: Number.isFinite(price) ? price : 0,
    imageUrl,
  };
}

function activeItemFor(kind: CommerceTrackingKind, document: any, productId: string, colorId: string, sizeId: string) {
  const items = Array.isArray(document?.items) ? document.items : [];
  return items.find((item: any) => {
    if (String(item?.product || "") !== productId) return false;
    const savedColor = String(item?.colorId || "");
    const savedSize = String(item?.sizeId || "");
    if (colorId && savedColor !== colorId) return false;
    if (sizeId && savedSize !== sizeId) return false;
    return true;
  }) || null;
}

function orderItemProductId(item: any) {
  return objectId(item?.product) || objectId(item?.productId);
}

function purchaseExists(orders: any[], userId: string, productId: string, addedAt: Date) {
  return orders.some((order: any) => {
    if (String(order?.user || "") !== userId) return false;
    if (order?.inventoryCommitted !== true) return false;

    const orderStatus = text(order?.status).toLowerCase();
    if (orderStatus === "cancelled" || orderStatus === "canceled") return false;

    const createdAt = new Date(order?.createdAt || 0);
    if (Number.isNaN(createdAt.getTime()) || createdAt < addedAt) return false;

    return (Array.isArray(order?.items) ? order.items : []).some(
      (item: any) => orderItemProductId(item) === productId
    );
  });
}

function getOrderProductSnapshot(
  orders: any[],
  userId: string,
  productId: string,
  colorId: string,
  sizeId: string,
  addedAt: Date
) {
  const candidates: Array<{ item: any; score: number; distance: number; createdAt: number }> = [];
  const addedAtMs = addedAt.getTime();

  for (const order of orders) {
    const sameUser = String(order?.user || "") === userId;
    const createdAt = new Date(order?.createdAt || 0);
    const createdAtMs = Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getTime();

    for (const item of Array.isArray(order?.items) ? order.items : []) {
      if (orderItemProductId(item) !== productId) continue;

      const itemColorId = objectId(item?.colorId);
      const itemSizeId = objectId(item?.sizeId);
      let score = 0;

      // Variant match is the strongest signal. If this customer never ordered the
      // product, another customer's immutable order snapshot is still a safe
      // fallback for product name/image/color/size/price. Purchase status remains
      // customer-specific in purchaseExists().
      if (colorId && itemColorId === colorId) score += 16;
      if (sizeId && itemSizeId === sizeId) score += 16;
      if (sameUser) score += 8;
      if (createdAtMs >= addedAtMs) score += 1;

      candidates.push({
        item,
        score,
        distance: createdAtMs ? Math.abs(createdAtMs - addedAtMs) : Number.MAX_SAFE_INTEGER,
        createdAt: createdAtMs,
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.createdAt - a.createdAt;
  });

  const item = candidates[0]?.item;
  if (!item) return null;

  const price = Number(
    item?.finalUnitPrice
      ?? item?.unitPrice
      ?? item?.originalUnitPrice
      ?? item?.price
      ?? 0
  );

  return {
    name: text(item?.name) || "Product",
    slug: text(item?.slug),
    colorName: text(item?.colorName),
    sizeName: text(item?.sizeName),
    price: Number.isFinite(price) ? price : 0,
    imageUrl: text(item?.image || item?.imageUrl),
  };
}

export async function listCommerceTracking(kind: CommerceTrackingKind, query: CommerceTrackingQuery = {}) {
  const page = Math.max(1, Number(query.page || 1) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit || 20) || 20));
  const search = text(query.search);
  const statusFilter = text(query.status).toUpperCase();
  const activityType = kind === "cart" ? "cart_add" : "wishlist_add";

  const createdAt: Record<string, Date> = {};
  const from = dateOrNull(query.dateFrom);
  const to = dateOrNull(query.dateTo);
  if (from) {
    from.setHours(0, 0, 0, 0);
    createdAt.$gte = from;
  }
  if (to) {
    to.setHours(23, 59, 59, 999);
    createdAt.$lte = to;
  }

  const match: Record<string, any> = { type: activityType };
  if (Object.keys(createdAt).length) match.createdAt = createdAt;

  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $limit: 5000 },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
      },
    },
    { $set: { userDoc: { $arrayElemAt: ["$userDoc", 0] } } },
    { $match: { "userDoc.role": "customer" } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $set: { productDoc: { $arrayElemAt: ["$productDoc", 0] } } },
    {
      $lookup: {
        from: "categories",
        localField: "productDoc.categories",
        foreignField: "_id",
        as: "categoryDocs",
      },
    },
  ];



  const activities = await UserActivity.aggregate(pipeline);
  const userIds = Array.from(new Set(activities.map((row: any) => objectId(row?.user)).filter(Boolean)));
  const productIds = Array.from(new Set(activities.map((row: any) => objectId(row?.product)).filter(Boolean)));
  const userObjectIds = userIds.map((id) => new Types.ObjectId(id));
  const productObjectIds = productIds.map((id) => new Types.ObjectId(id));

  const [activeDocs, orders] = await Promise.all([
    kind === "cart"
      ? Cart.find({ user: { $in: userObjectIds } }).lean()
      : Wishlist.find({ user: { $in: userObjectIds } }).lean(),
    productIds.length
      ? Order.find({
          $or: [
            { "items.product": { $in: productObjectIds } },
            { "items.productId": { $in: [...productIds, ...productObjectIds] } },
          ],
        })
          .select("user items createdAt inventoryCommitted status")
          .lean()
      : [],
  ]);

  const activeByUser = new Map(activeDocs.map((doc: any) => [String(doc.user), doc]));

  let rows = activities.map((activity: any) => {
    const metadata = activity?.metadata && typeof activity.metadata === "object" ? activity.metadata : {};
    const userId = objectId(activity.user);
    const productId = objectId(activity.product);
    const colorId = text((metadata as any).colorId);
    const sizeId = text((metadata as any).sizeId);
    const rawAddedAt = (metadata as any).addedAt || activity.createdAt;
    const addedAt = new Date(rawAddedAt);
    const normalizedAddedAt = Number.isNaN(addedAt.getTime()) ? new Date(activity.createdAt) : addedAt;
    const activeItem = activeItemFor(kind, activeByUser.get(userId), productId, colorId, sizeId);
    const purchased = purchaseExists(orders as any[], userId, productId, normalizedAddedAt);
    const status = purchased ? "PURCHASED" : activeItem ? (kind === "cart" ? "IN_CART" : "IN_WISHLIST") : "REMOVED";
    const snapshot = getProductSnapshot(metadata);
    const orderSnapshot = getOrderProductSnapshot(
      orders as any[],
      userId,
      productId,
      colorId,
      sizeId,
      normalizedAddedAt
    );
    const product = snapshot
      || (activity.productDoc ? getVariant(activity.productDoc, colorId, sizeId) : null)
      || orderSnapshot
      || getVariant(null, colorId, sizeId);
    const quantity = kind === "cart"
      ? Number(activeItem?.quantity ?? (metadata as any).finalQuantity ?? (metadata as any).quantity ?? 1)
      : 1;

    return {
      id: String(activity._id),
      kind,
      user: {
        id: userId,
        name: String(activity.userDoc?.name || "Customer"),
        email: String(activity.userDoc?.email || ""),
        phone: String(activity.userDoc?.phone || ""),
        photo: String(activity.userDoc?.avatar?.url || ""),
      },
      product: {
        id: productId,
        ...product,
        categoryName: Array.isArray(activity.categoryDocs)
          ? activity.categoryDocs.map((category: any) => String(category?.name || "").trim()).filter(Boolean).join(", ")
          : "",
        colorId,
        sizeId,
        isAvailable: Boolean(activity.productDoc),
        hasSnapshot: Boolean(snapshot),
        hasOrderSnapshot: Boolean(orderSnapshot),
      },
      quantity,
      addedAt: normalizedAddedAt,
      updatedAt: activeItem?.updatedAt || activity.updatedAt || activity.createdAt,
      status,
      email: {
        reminder24HourSent: false,
        reminder48HourSent: false,
      },
    };
  });

  if (search) {
    const needle = search.toLowerCase();
    rows = rows.filter((row: any) => {
      const values = [
        row.user?.id,
        row.user?.name,
        row.user?.email,
        row.user?.phone,
        row.product?.id,
        row.product?.name,
        row.product?.slug,
        row.product?.colorName,
        row.product?.sizeName,
        row.product?.categoryName,
      ];
      return values.some((value) => text(value).toLowerCase().includes(needle));
    });
  }

  if (statusFilter) rows = rows.filter((row: any) => row.status === statusFilter);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  rows = rows.slice((safePage - 1) * limit, safePage * limit);

  if (rows.length) {
    const pageUserIds = Array.from(new Set(rows.map((row: any) => row.user.id).filter(Boolean)));
    const pageProductIds = Array.from(new Set(rows.map((row: any) => row.product.id).filter(Boolean)));
    const notifications = await Notification.find({
      type: kind === "cart" ? "cart_reminder" : "wishlist_reminder",
      userIds: { $in: pageUserIds.map((id) => new Types.ObjectId(id)) },
      product: { $in: pageProductIds.map((id) => new Types.ObjectId(id)) },
    })
      .select("userIds product metadata")
      .lean();

    for (const row of rows as any[]) {
      const addedAtIso = new Date(row.addedAt).toISOString();
      const related = notifications.filter((notification: any) => {
        const hasUser = (notification.userIds || []).some((id: any) => String(id) === row.user.id);
        return hasUser
          && String(notification.product || "") === row.product.id
          && String(notification?.metadata?.addedAt || "") === addedAtIso;
      });
      row.email.reminder24HourSent = related.some((notification: any) => Number(notification?.metadata?.stageMinutes) === 1440 && Boolean(notification?.metadata?.emailSentAt));
      row.email.reminder48HourSent = related.some((notification: any) => Number(notification?.metadata?.stageMinutes) === 2880 && Boolean(notification?.metadata?.emailSentAt));
    }
  }

  return {
    rows,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}
