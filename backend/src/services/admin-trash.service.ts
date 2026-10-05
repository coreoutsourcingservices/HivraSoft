import mongoose, { type Model } from "mongoose";

import AdminTrash, { type IAdminTrash, type TrashEntityType } from "../models/AdminTrash.model";
export type { TrashEntityType } from "../models/AdminTrash.model";
import AdminAuditLog from "../models/AdminAuditLog.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";
import Banner from "../models/Banner.model";
import Blog from "../models/Blog.model";
import BlogCategory from "../models/BlogCategory.model";
import BlogTag from "../models/BlogTag.model";
import Notification from "../models/Notification.model";
import DiscountSetting from "../models/DiscountSetting.model";
import DiscountCode from "../models/DiscountCode.model";
import TaxSetting from "../models/TaxSetting.model";
import DeliveryChargeRule from "../models/DeliveryChargeRule.model";
import Offer from "../models/Offer.model";
import OnTrendPick from "../models/OnTrendPick.model";
import AlwaysInIt from "../models/AlwaysInIt.model";
import PrimeSelection from "../models/PrimeSelection.model";
import { deleteCloudinaryImage, deleteCloudinaryVideo } from "./cloudinary.service";

export const TRASH_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type RegistryItem = {
  model: Model<any>;
  modelName: string;
  label: string;
  adminBaseUrl: string;
};

export const trashRegistry: Record<TrashEntityType, RegistryItem> = {
  product: { model: Product, modelName: "Product", label: "Product", adminBaseUrl: "/admin/products" },
  category: { model: Category, modelName: "Category", label: "Category", adminBaseUrl: "/admin/categories" },
  banner: { model: Banner, modelName: "Banner", label: "Banner", adminBaseUrl: "/admin/banners" },
  blog: { model: Blog, modelName: "Blog", label: "Blog", adminBaseUrl: "/admin/blog" },
  blog_category: { model: BlogCategory, modelName: "BlogCategory", label: "Blog Category", adminBaseUrl: "/admin/blog/categories" },
  blog_tag: { model: BlogTag, modelName: "BlogTag", label: "Blog Tag", adminBaseUrl: "/admin/blog/tags" },
  notification: { model: Notification, modelName: "Notification", label: "Notification", adminBaseUrl: "/admin/notifications" },
  automatic_discount: { model: DiscountSetting, modelName: "DiscountSetting", label: "Automatic Discount", adminBaseUrl: "/admin/extra-add/automatic-discount" },
  discount_code: { model: DiscountCode, modelName: "DiscountCode", label: "Discount Code", adminBaseUrl: "/admin/extra-add/discount-code" },
  tax: { model: TaxSetting, modelName: "TaxSetting", label: "Tax", adminBaseUrl: "/admin/extra-add/tax" },
  delivery_charge: { model: DeliveryChargeRule, modelName: "DeliveryChargeRule", label: "Delivery Charge", adminBaseUrl: "/admin/extra-add/delivery-charge" },
  offer: { model: Offer, modelName: "Offer", label: "Offer", adminBaseUrl: "/admin/offers" },
  on_trend_pick: { model: OnTrendPick, modelName: "OnTrendPick", label: "On-Trend Pick", adminBaseUrl: "/admin/homepage/on-trend-picks" },
  always_in_it: { model: AlwaysInIt, modelName: "AlwaysInIt", label: "Always In It", adminBaseUrl: "/admin/homepage/always-in-it" },
  prime_selection: { model: PrimeSelection, modelName: "PrimeSelection", label: "Prime Selection", adminBaseUrl: "/admin/homepage/prime-selection" },
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function productName(snapshot: any): string {
  const colors = Array.isArray(snapshot?.colors) ? snapshot.colors : [];
  const defaultColor = colors.find((item: any) => item?.isDefault) || colors[0];
  return stringValue(defaultColor?.nameProduct) || "Product";
}

function snapshotPreviewImage(snapshot: any): string {
  const directCandidates = [
    snapshot?.avatar?.url,
    snapshot?.profileImage?.url,
    snapshot?.photo?.url,
    snapshot?.photo,
    snapshot?.image?.url,
    snapshot?.image,
    snapshot?.imageUrl,
    snapshot?.thumbnail?.url,
    snapshot?.thumbnail,
    snapshot?.coverImage?.url,
    snapshot?.featuredImage?.url,
    snapshot?.desktopImage?.url,
    snapshot?.mobileImage?.url,
  ];

  for (const candidate of directCandidates) {
    const url = stringValue(candidate);
    if (/^https?:\/\//i.test(url)) return url;
  }

  const imageArrays = [
    snapshot?.mainImages,
    snapshot?.images,
    ...(Array.isArray(snapshot?.colors)
      ? snapshot.colors.map((color: any) => color?.images)
      : []),
  ];

  for (const list of imageArrays) {
    if (!Array.isArray(list)) continue;
    const preferred = list.find((item: any) => item?.isDefault && item?.url) || list.find((item: any) => item?.url);
    const url = stringValue(preferred?.url || preferred);
    if (/^https?:\/\//i.test(url)) return url;
  }

  return "";
}

function snapshotDetails(type: TrashEntityType, snapshot: any) {
  const details: Array<{ label: string; value: string }> = [];
  const add = (label: string, value: unknown) => {
    const normalized = stringValue(value);
    if (normalized) details.push({ label, value: normalized });
  };

  add("Slug", snapshot?.slug);
  add("Gender", snapshot?.gender);
  add("Code", snapshot?.code);

  if (typeof snapshot?.isActive === "boolean") {
    details.push({ label: "Status", value: snapshot.isActive ? "Active" : "Inactive" });
  }

  if (type === "product") {
    const colors = Array.isArray(snapshot?.colors) ? snapshot.colors : [];
    details.push({ label: "Colors", value: String(colors.length) });
    const stock = colors.reduce(
      (total: number, color: any) =>
        total +
        (Array.isArray(color?.sizes)
          ? color.sizes.reduce((sum: number, size: any) => sum + Math.max(0, Number(size?.stock || 0)), 0)
          : 0),
      0
    );
    details.push({ label: "Stock", value: String(stock) });
  }

  return details.slice(0, 4);
}

export function recordNameFor(type: TrashEntityType, snapshot: any): string {
  switch (type) {
    case "product":
      return productName(snapshot);
    case "discount_code":
      return stringValue(snapshot?.code) || "Discount Code";
    case "tax":
      return stringValue(snapshot?.name) || stringValue(snapshot?.taxName) || "Tax Rule";
    case "delivery_charge":
      return `${String(snapshot?.paymentMethod || "Delivery").toUpperCase()} ${snapshot?.minAmount ?? 0}-${snapshot?.maxAmount ?? "∞"}`;
    case "automatic_discount":
      return stringValue(snapshot?.name) || "Automatic Discount";
    case "always_in_it":
    case "prime_selection":
      return `${stringValue(snapshot?.name) || trashRegistry[type].label} · ${stringValue(snapshot?.gender) || "all"}`;
    default:
      return (
        stringValue(snapshot?.title) ||
        stringValue(snapshot?.name) ||
        stringValue(snapshot?.slug) ||
        trashRegistry[type].label
      );
  }
}

function toObjectId(value: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid record ID.");
  }
  return new mongoose.Types.ObjectId(value);
}

function actorObjectId(adminId?: string | null): mongoose.Types.ObjectId | null {
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) return null;
  return new mongoose.Types.ObjectId(adminId);
}

async function audit(
  action: "SOFT_DELETE" | "RESTORE" | "PERMANENT_DELETE",
  type: TrashEntityType,
  id: string,
  name: string,
  adminId?: string | null,
  metadata: Record<string, unknown> = {}
) {
  await AdminAuditLog.create({
    action,
    module: type,
    recordId: id,
    recordName: name,
    performedBy: actorObjectId(adminId),
    metadata,
  }).catch(() => undefined);
}

export async function softDeleteEntity(
  type: TrashEntityType,
  id: string,
  adminId?: string | null
) {
  const registry = trashRegistry[type];
  if (!registry) throw new Error("Unsupported trash type.");

  const objectId = toObjectId(id);
  const existingTrash = await AdminTrash.findOne({ entityType: type, entityId: objectId }).lean();
  if (existingTrash) {
    return { trash: existingTrash, message: `${registry.label} is already in Trash.` };
  }

  const snapshot = await registry.model.collection.findOne({ _id: objectId } as any);

  if (!snapshot) throw new Error(`${registry.label} not found.`);
  if ((snapshot as any).isDeleted === true) {
    throw new Error(`${registry.label} is already deleted.`);
  }
  const recordName = recordNameFor(type, snapshot);
  const deletedAt = new Date();
  const expiresAt = new Date(deletedAt.getTime() + TRASH_RETENTION_DAYS * DAY_MS);
  const deletedBy = actorObjectId(adminId);

  const trash = await AdminTrash.create({
    entityType: type,
    entityId: objectId,
    modelName: registry.modelName,
    recordName,
    snapshot,
    deletedAt,
    expiresAt,
    deletedBy,
  });

  const set: Record<string, unknown> = {
    isDeleted: true,
    deletedAt,
    deletedBy,
  };
  if (registry.model.schema.path("isActive")) set.isActive = false;

  try {
    await registry.model.collection.updateOne({ _id: objectId } as any, { $set: set } as any);
  } catch (error) {
    await AdminTrash.deleteOne({ _id: trash._id }).catch(() => undefined);
    throw error;
  }

  await audit("SOFT_DELETE", type, id, recordName, adminId, { expiresAt });

  return {
    trash,
    message: `${registry.label} moved to Trash. It can be restored for ${TRASH_RETENTION_DAYS} days.`,
  };
}

export async function listTrash(input: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(input.page || 1));
  const limit = Math.min(100, Math.max(1, Number(input.limit || 20)));
  const filter: Record<string, unknown> = {};

  if (input.type && input.type !== "all" && input.type in trashRegistry) {
    filter.entityType = input.type;
  }

  const search = stringValue(input.search);
  if (search) {
    filter.recordName = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const [rows, total, typeCounts] = await Promise.all([
    AdminTrash.find(filter)
      .populate("deletedBy", "name email avatar")
      .sort({ deletedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AdminTrash.countDocuments(filter),
    AdminTrash.aggregate([{ $group: { _id: "$entityType", count: { $sum: 1 } } }]),
  ]);

  const now = Date.now();
  const data = rows.map((item: any) => ({
    _id: String(item._id),
    entityId: String(item.entityId),
    type: item.entityType,
    typeLabel: trashRegistry[item.entityType as TrashEntityType]?.label || item.entityType,
    name: item.recordName,
    deletedAt: item.deletedAt,
    permanentDeleteAt: item.expiresAt,
    remainingDays: Math.max(0, Math.ceil((new Date(item.expiresAt).getTime() - now) / DAY_MS)),
    imageUrl: snapshotPreviewImage(item.snapshot),
    details: snapshotDetails(item.entityType as TrashEntityType, item.snapshot),
    deletedBy: item.deletedBy || null,
  }));

  const counts = Object.fromEntries(typeCounts.map((row: any) => [row._id, row.count]));
  const expiringSoon = await AdminTrash.countDocuments({
    expiresAt: { $lte: new Date(now + 7 * DAY_MS) },
  });

  return {
    data,
    counts,
    stats: {
      total: await AdminTrash.countDocuments({}),
      products: Number(counts.product || 0),
      expiringSoon,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function restoreEntry(entry: IAdminTrash, adminId?: string | null) {
  const type = entry.entityType;
  const registry = trashRegistry[type];
  if (!registry) throw new Error("Unsupported trash type.");

  const objectId = entry.entityId;
  const current = await registry.model.collection.findOne({ _id: objectId } as any);
  if (!current) {
    throw new Error(`${registry.label} source record is missing and cannot be restored safely.`);
  }

  const snapshot = entry.snapshot as any;
  const set: Record<string, unknown> = {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };
  if (registry.model.schema.path("isActive") && typeof snapshot?.isActive === "boolean") {
    set.isActive = snapshot.isActive;
  }

  await registry.model.collection.updateOne({ _id: objectId } as any, { $set: set } as any);
  await AdminTrash.deleteOne({ _id: entry._id });
  await audit("RESTORE", type, String(objectId), entry.recordName, adminId);

  return { message: `${registry.label} restored successfully.` };
}

export async function restoreTrashEntity(type: TrashEntityType, id: string, adminId?: string | null) {
  const objectId = toObjectId(id);
  const entry = await AdminTrash.findOne({ entityType: type, entityId: objectId });
  if (!entry) throw new Error("Trash record not found.");
  return restoreEntry(entry, adminId);
}

type MediaRef = { publicId: string; resourceType: "image" | "video" };

function collectMediaRefs(value: unknown, path: string[] = [], output: MediaRef[] = []): MediaRef[] {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectMediaRefs(item, [...path, String(index)], output));
    return output;
  }
  if (typeof value !== "object") return output;

  const object = value as Record<string, unknown>;
  if (typeof object.publicId === "string" && object.publicId.trim()) {
    const joined = path.join(".").toLowerCase();
    const isPoster = joined.includes("poster");
    const isVideo = joined.includes("videos") && !isPoster;
    output.push({ publicId: object.publicId.trim(), resourceType: isVideo ? "video" : "image" });
  }

  Object.entries(object).forEach(([key, child]) => {
    if (key !== "publicId") collectMediaRefs(child, [...path, key], output);
  });
  return output;
}

async function cleanupSnapshotMedia(snapshot: Record<string, unknown>) {
  const refs = collectMediaRefs(snapshot);
  const unique = new Map<string, MediaRef>();
  refs.forEach((ref) => unique.set(`${ref.resourceType}:${ref.publicId}`, ref));

  const results = await Promise.allSettled(
    [...unique.values()].map((ref) =>
      ref.resourceType === "video"
        ? deleteCloudinaryVideo(ref.publicId)
        : deleteCloudinaryImage(ref.publicId)
    )
  );

  return {
    total: unique.size,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}

async function permanentlyDeleteEntry(entry: IAdminTrash, adminId?: string | null) {
  const type = entry.entityType;
  const registry = trashRegistry[type];
  if (!registry) throw new Error("Unsupported trash type.");

  const media = await cleanupSnapshotMedia(entry.snapshot as Record<string, unknown>);

  // Preserve reference integrity when a soft-deleted lookup record finally leaves Trash.
  if (type === "category") {
    await Product.updateMany(
      { categories: entry.entityId },
      { $pull: { categories: entry.entityId } }
    ).catch(() => undefined);
  }

  if (type === "blog_tag") {
    await Blog.updateMany(
      { tags: entry.entityId },
      { $pull: { tags: entry.entityId } }
    ).catch(() => undefined);
  }

  await registry.model.collection.deleteOne({ _id: entry.entityId } as any);
  await AdminTrash.deleteOne({ _id: entry._id });
  await audit("PERMANENT_DELETE", type, String(entry.entityId), entry.recordName, adminId, media);

  return { message: `${registry.label} permanently deleted.`, media };
}

export async function permanentlyDeleteTrashEntity(
  type: TrashEntityType,
  id: string,
  adminId?: string | null
) {
  const objectId = toObjectId(id);
  const entry = await AdminTrash.findOne({ entityType: type, entityId: objectId });
  if (!entry) throw new Error("Trash record not found.");
  return permanentlyDeleteEntry(entry, adminId);
}

export async function emptyTrash(type?: string, adminId?: string | null) {
  const filter: Record<string, unknown> = {};
  if (type && type !== "all") {
    if (!(type in trashRegistry)) throw new Error("Unsupported trash type.");
    filter.entityType = type;
  }

  const entries = await AdminTrash.find(filter);
  let deleted = 0;
  let failed = 0;
  for (const entry of entries) {
    try {
      await permanentlyDeleteEntry(entry, adminId);
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error("EMPTY TRASH ITEM ERROR:", entry.entityType, entry.entityId, error);
    }
  }
  return { deleted, failed };
}

export async function cleanupExpiredTrash() {
  const entries = await AdminTrash.find({ expiresAt: { $lte: new Date() } }).sort({ expiresAt: 1 });
  let deleted = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await permanentlyDeleteEntry(entry, null);
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error("TRASH CLEANUP ERROR:", entry.entityType, entry.entityId, error);
    }
  }

  return { deleted, failed };
}

let cleanupTimer: NodeJS.Timeout | null = null;

export function startTrashCleanupScheduler() {
  if (cleanupTimer) return;

  const run = () => {
    void cleanupExpiredTrash()
      .then((result) => {
        if (result.deleted || result.failed) {
          console.log(`🗑️ Trash cleanup: ${result.deleted} deleted, ${result.failed} failed.`);
        }
      })
      .catch((error) => console.error("TRASH SCHEDULER ERROR:", error));
  };

  run();
  cleanupTimer = setInterval(run, DAY_MS);
  cleanupTimer.unref?.();
}
