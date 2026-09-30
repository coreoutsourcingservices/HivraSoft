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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    name: String(color?.nameProduct || "Product"),
    slug: String(color?.slugProduct || ""),
    colorName: String(color?.nameColor || ""),
    sizeName: String(size?.size || ""),
    price: Number(size?.showPrice ?? color?.showPrice ?? 0),
    imageUrl: String(image?.url || ""),
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

function purchaseExists(orders: any[], userId: string, productId: string, addedAt: Date) {
  return orders.some((order: any) => {
    if (String(order?.user || "") !== userId) return false;
    const createdAt = new Date(order?.createdAt || 0);
    if (Number.isNaN(createdAt.getTime()) || createdAt < addedAt) return false;
    return (Array.isArray(order?.items) ? order.items : []).some(
      (item: any) => String(item?.product || item?.productId || "") === productId
    );
  });
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
  ];

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const or: any[] = [
      { "userDoc.name": rx },
      { "userDoc.email": rx },
      { "userDoc.phone": rx },
      { "productDoc.colors.nameProduct": rx },
    ];
    if (Types.ObjectId.isValid(search)) {
      const id = new Types.ObjectId(search);
      or.push({ user: id }, { product: id });
    }
    pipeline.push({ $match: { $or: or } });
  }

  const activities = await UserActivity.aggregate(pipeline);
  const userIds = Array.from(new Set(activities.map((row: any) => objectId(row?.user)).filter(Boolean)));
  const productIds = Array.from(new Set(activities.map((row: any) => objectId(row?.product)).filter(Boolean)));
  const userObjectIds = userIds.map((id) => new Types.ObjectId(id));
  const productObjectIds = productIds.map((id) => new Types.ObjectId(id));

  const [activeDocs, orders] = await Promise.all([
    kind === "cart"
      ? Cart.find({ user: { $in: userObjectIds } }).lean()
      : Wishlist.find({ user: { $in: userObjectIds } }).lean(),
    userIds.length && productIds.length
      ? Order.find({
          user: { $in: userObjectIds },
          "items.product": { $in: productObjectIds },
          inventoryCommitted: true,
          status: { $nin: ["cancelled", "canceled"] },
        })
          .select("user items.product items.productId createdAt")
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
    const product = getVariant(activity.productDoc, colorId, sizeId);
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
        colorId,
        sizeId,
      },
      quantity,
      addedAt: normalizedAddedAt,
      updatedAt: activeItem?.updatedAt || activity.updatedAt || activity.createdAt,
      status,
      email: {
        addedSent: Boolean((metadata as any).addedEmailSentAt),
        addedSentAt: (metadata as any).addedEmailSentAt || null,
        reminder20MinSent: false,
        reminder24HourSent: false,
        reminder48HourSent: false,
      },
    };
  });

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
      row.email.reminder20MinSent = related.some((notification: any) => Number(notification?.metadata?.stageMinutes) === 20 && Boolean(notification?.metadata?.emailSentAt));
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
