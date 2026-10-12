import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import AdminAuditLog, { type AdminAuditAction } from "../models/AdminAuditLog.model";

// Allowlist: authentication material, payment data and arbitrary HTML never enter audit records.
const safeFields = new Set(["name", "username", "email", "phone", "role", "status", "accountStatus", "adminStatus", "isActive", "emailVerified", "title", "slug", "price", "salePrice", "regularPrice", "originalPrice", "showPrice", "discountPrice", "nameProduct", "nameColor", "size", "stock", "quantity", "orderStatus", "paymentStatus", "amount", "total", "discount", "discountType", "discountValue", "isPublished", "published", "sku", "ids", "productId", "categoryId", "isDefault", "sizes", "colors", "variants"]);
export function safeAuditValues(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return undefined;
  if (typeof value === "string") return value.replace(/<[^>]*>/g, "").slice(0, 300);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map(v => safeAuditValues(v, depth + 1));
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([k]) => safeFields.has(k)).map(([k, v]) => [k, safeAuditValues(v, depth + 1)]));
  return undefined;
}
export async function auditEvent(req: Request, action: AdminAuditAction, module: string, recordId: string, metadata: Record<string, unknown> = {}, success = true) {
  const u = req.user;
  await AdminAuditLog.create({ action, module, recordId: recordId || "collection", recordName: String(metadata.recordName || "").slice(0, 200), performedBy: u?._id || null,
    actor: { name: u?.name || "", username: u?.username || "", email: u?.email || "", role: u?.role || "" }, status: success ? "success" : "failure", ip: req.ip || "", metadata });
}
const models: Record<string, string> = { products: "Product", categories: "Category", orders: "Order", customers: "User", admins: "User", banners: "Banner", blogs: "Blog", reviews: "Review", notifications: "Notification", "notification-schedules": "NotificationSchedule", "delivery-charges": "DeliveryChargeRule", "discount-codes": "DiscountCode", "blog-categories": "BlogCategory", "blog-tags": "BlogTag", offers: "Offer", "on-trend-picks": "OnTrendPick", "always-in-it": "AlwaysInIt", "prime-selection": "PrimeSelection", uploads: "GalleryMedia", "automatic-discount": "DiscountSetting", tax: "TaxSetting" };
export async function staffAuditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const parts = req.path.split("/").filter(Boolean).filter(p => !["api", "admin", "superadmin"].includes(p));
  const module = parts[0] || "staff";
  const recordId = parts.find(p => /^[a-f\d]{24}$/i.test(p)) || "collection";
  let previous: unknown;
  // Read snapshots only after authentication, via res.locals callback used below.
  res.locals.auditSnapshot = async () => {
    if (previous !== undefined || recordId === "collection") return;
    const model = mongoose.models[models[module]];
    if (model) previous = safeAuditValues(await model.findById(recordId).lean());
  };
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (!req.user || !["admin", "super_admin"].includes(req.user.role) || res.locals.auditHandled) return originalJson(body);
    res.locals.auditHandled = true;
    const payload = body as Record<string, any> | null;
    const entity = payload?.data || payload?.product || payload?.order || payload?.category || payload?.banner || payload?.blog || payload?.user;
    const affected = recordId !== "collection" ? recordId : String(entity?._id || entity?.id || "collection");
    const last = parts.at(-1) || "";
    const actionMap: Record<string, AdminAuditAction> = { login: "LOGIN", logout: "LOGOUT", approve: "APPROVE", reject: "REJECT", block: "BLOCK", unblock: "UNBLOCK", "change-password": "UPDATE", reset: "UPDATE", "retry-credentials": "UPDATE" };
    const action = actionMap[last] || (req.method === "DELETE" ? "DELETE" : req.method === "POST" ? "CREATE" : "UPDATE");
    void auditEvent(req, action, module, affected, { method: req.method, path: req.path, recordName: String(entity?.name || entity?.title || ""), previous, updated: safeAuditValues(entity || req.body), httpStatus: res.statusCode }, res.statusCode < 400)
      .then(() => originalJson(body))
      .catch(() => { console.error("Staff audit write failed; inspect database availability."); res.status(503); originalJson({ message: "Operation may have completed, but its audit record could not be saved. Contact your administrator before retrying." }); });
    return res;
  }) as Response["json"];
  res.on("finish", () => {
    if (!req.user || !["admin", "super_admin"].includes(req.user.role)) return;
    if (res.locals.auditHandled) return;
    const last = parts.at(-1) || "";
    const actions: Record<string, AdminAuditAction> = { login: "LOGIN", logout: "LOGOUT", approve: "APPROVE", reject: "REJECT", block: "BLOCK", unblock: "UNBLOCK" };
    const action = actions[last] || (req.method === "DELETE" ? "DELETE" : req.method === "POST" ? "CREATE" : "UPDATE");
    void auditEvent(req, action, module, recordId, { method: req.method, path: req.path, previous, updated: safeAuditValues(req.body), httpStatus: res.statusCode }, res.statusCode < 400).catch(() => console.error("Staff audit write failed; inspect database availability."));
  });
  next();
}
