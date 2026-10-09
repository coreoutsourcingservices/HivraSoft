import type { Request, Response } from "express";
import { Types } from "mongoose";
import CustomerPromotionMessage, { type CustomerPromotionText } from "../models/CustomerPromotionMessage.model";
import Notification from "../models/Notification.model";
import NotificationDelivery from "../models/NotificationDelivery.model";
import User from "../models/User.model";
import { indiaDate, isValidPromotionDate, promotionSendTime } from "./promotion-date.service";

// These are personal, customer-authored WEBSITE promotional notifications.
// Does not modify/order, remind, email or admin promotional workflows.
export function messageEntries(value: unknown): CustomerPromotionText[] {
  // Old MongoDB records used one string. Keep them readable without a migration.
  if (typeof value === "string") {
    if (!value.trim() || value.length > 2000) throw new Error("Each message text must be 1-2000 characters.");
    return [{ id: 1, text: value.trim() }];
  }
  if (!Array.isArray(value) || !value.length || value.length > 100) {
    throw new Error("message must be an array of 1-100 items with {id, text}.");
  }
  const seen = new Set<number>();
  let totalLength = 0;
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Every message item must contain numeric id and text.");
    }
    const { id, text } = item as { id?: unknown; text?: unknown };
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1 || seen.has(id)) {
      throw new Error("Each message id must be a unique positive integer.");
    }
    if (typeof text !== "string" || !text.trim() || text.length > 2000) {
      throw new Error("Each message text must be 1-2000 characters.");
    }
    totalLength += text.length;
    if (totalLength > 12000) throw new Error("Combined message text may not exceed 12000 characters.");
    seen.add(id as number);
    return { id: id as number, text: text.trim() };
  });
}

// Return a consistent message array for legacy string and new array records.
function jsonPromotion(row: any) {
  const record = typeof row?.toObject === "function" ? row.toObject() : row;
  return { ...record, message: messageEntries(record.message) };
}

// These are personal, customer-authored WEBSITE promotional notifications.
// The client cannot choose the sent/processing status or a different user id.
function normalizePayload(body: any, existing?: { date: string; title: string; message: CustomerPromotionText[] | string }) {
  const date = body?.date === undefined ? existing?.date : body?.date;
  // The customer POST/PATCH contract needs only { date, message }.
  // Keep a server-generated title solely for the existing Notification model;
  // never let the user override this backend-owned delivery metadata.
  const title = existing?.title || "HivraSoft Promotion";
  const message = messageEntries(body?.message === undefined ? existing?.message : body?.message);
  if (body?.status !== undefined && body.status !== "pending") {
    throw new Error("status cannot be set by customer; only pending is allowed.");
  }
  if (typeof date !== "string" || !isValidPromotionDate(date) || date < indiaDate()) {
    throw new Error("date must be today/future in YYYY-MM-DD (India timezone).");
  }
  return { date, title, message, scheduledFor: promotionSendTime(date) };
}

const userId = (req: Request) => req.user!._id;
const validId = (id: unknown): id is string => typeof id === "string" && Types.ObjectId.isValid(id);
const errorText = (error: unknown) => error instanceof Error ? error.message : "Operation failed.";

// GET /api/notifications/my-promotions?page=1&limit=50
export async function getMyScheduledPromotions(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, Number.parseInt(String(req.query.limit || "50"), 10) || 50));
    const filter = { user: userId(req) };
    const [count, notifications] = await Promise.all([
      CustomerPromotionMessage.countDocuments(filter),
      CustomerPromotionMessage.find(filter).sort({ scheduledFor: 1, createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return res.json({ success: true, count, page, limit, notifications: notifications.map(jsonPromotion) });
  } catch (error) { return res.status(500).json({ success: false, message: errorText(error) }); }
}

// POST /api/notifications/my-promotions { date, message: [{ id, text }] }
export async function addMyScheduledPromotion(req: Request, res: Response) {
  let data: ReturnType<typeof normalizePayload>;
  try { data = normalizePayload(req.body); }
  catch (error) { return res.status(400).json({ success: false, message: errorText(error) }); }
  try {
    const notification = await CustomerPromotionMessage.create({ ...data, user: userId(req), status: "pending" });
    return res.status(201).json({ success: true, message: "Notification saved for your chosen date.", notification: jsonPromotion(notification) });
  } catch (error) { return res.status(500).json({ success: false, message: errorText(error) }); }
}

// PATCH /api/notifications/my-promotions/:id - pending entries only
export async function editMyScheduledPromotion(req: Request, res: Response) {
  const id = req.params.id;
  if (!validId(id)) return res.status(400).json({ success: false, message: "Invalid notification id." });
  try {
    const row = await CustomerPromotionMessage.findOne({ _id: id, user: userId(req) }).lean();
    if (!row) return res.status(404).json({ success: false, message: "Notification not found." });
    if (row.status !== "pending") return res.status(409).json({ success: false, message: "Already processing/sent; cannot edit." });
    let data: ReturnType<typeof normalizePayload>;
    try { data = normalizePayload(req.body, row); }
    catch (error) { return res.status(400).json({ success: false, message: errorText(error) }); }
    const notification = await CustomerPromotionMessage.findOneAndUpdate({ _id: id, user: userId(req), status: "pending" }, { $set: data }, { new: true, runValidators: true });
    if (!notification) return res.status(409).json({ success: false, message: "Notification started processing; retry is not allowed." });
    return res.json({ success: true, message: "Notification updated.", notification: jsonPromotion(notification) });
  } catch (error) { return res.status(500).json({ success: false, message: errorText(error) }); }
}

// DELETE /api/notifications/my-promotions/:id - owner only
export async function deleteMyScheduledPromotion(req: Request, res: Response) {
  const id = req.params.id;
  if (!validId(id)) return res.status(400).json({ success: false, message: "Invalid notification id." });
  try {
    const row = await CustomerPromotionMessage.findOneAndDelete({ _id: id, user: userId(req), status: { $in: ["pending", "sent", "cancelled"] } });
    if (!row) return res.status(404).json({ success: false, message: "Notification not found or already processing." });
    if (row.notification) {
      await Notification.updateOne({ _id: row.notification, userIds: userId(req), "metadata.customerCreatedPromotion": true }, { $addToSet: { deletedBy: userId(req) } });
    }
    return res.json({ success: true, message: "Saved notification deleted." });
  } catch (error) { return res.status(500).json({ success: false, message: errorText(error) }); }
}

const htmlEscape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\n/g, "<br>");

// Existing once/minute notification scheduler calls this. Website inbox only.
export async function runDuePersonalPromotions() {
  const now = new Date();
  const due = await CustomerPromotionMessage.find({ status: "pending", scheduledFor: { $lte: now } })
    .sort({ scheduledFor: 1 }).limit(50).lean();
  let sent = 0;
  for (const row of due) {
    const claimed = await CustomerPromotionMessage.findOneAndUpdate({ _id: row._id, status: "pending" }, { $set: { status: "processing" } }, { new: true });
    if (!claimed) continue;
    try {
      const owner = await User.findOne({ _id: claimed.user, role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean();
      if (!owner) {
        await CustomerPromotionMessage.updateOne({ _id: claimed._id, status: "processing" }, { $set: { status: "cancelled" } });
        continue;
      }
      const key = `my-promotion:${String(claimed._id)}`;
      const notification = await Notification.findOneAndUpdate(
        { dedupeKey: key },
        { $setOnInsert: {
          title: claimed.title, subject: claimed.title, message: messageEntries(claimed.message).map((item) => `${item.id}. ${htmlEscape(item.text)}`).join("<br>"),
          type: "promotion", audience: "selected", userIds: [claimed.user], recipientCount: 1,
          filters: {}, link: "", deliveryWebsite: true, deliveryEmail: false, isActive: true,
          createdBy: claimed.user, source: "system", dedupeKey: key,
          metadata: { customerScheduledPromotion: true, customerCreatedPromotion: true, selectedDate: claimed.date },
        } }, { upsert: true, new: true }
      );
      const deliveryKey = `${key}:website`;
      await NotificationDelivery.findOneAndUpdate(
        { dedupeKey: deliveryKey },
        { $setOnInsert: {
          notification: notification._id, user: claimed.user, channel: "website", status: "sent",
          scheduledFor: claimed.scheduledFor, processedAt: new Date(), sentAt: new Date(),
          dedupeKey: deliveryKey, eventType: "none", daysBefore: 0,
          metadata: { customerScheduledPromotion: true, customerCreatedPromotion: true, selectedDate: claimed.date },
        } }, { upsert: true, new: true }
      );
      await CustomerPromotionMessage.updateOne({ _id: claimed._id, status: "processing" }, { $set: { status: "sent", sentAt: new Date(), notification: notification._id } });
      sent++;
    } catch (error) {
      // Reset to pending so the worker can safely retry (dedupe keys prevent duplicates).
      await CustomerPromotionMessage.updateOne({ _id: claimed._id, status: "processing" }, { $set: { status: "pending" } });
      console.error("Customer promotional message delivery error:", error);
    }
  }
  return sent;
}
