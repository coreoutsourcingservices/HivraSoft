import type { Request, Response } from "express";
import type { Types } from "mongoose";
import User from "../models/User.model";
import NotificationDelivery from "../models/NotificationDelivery.model";
import { sendEmail } from "./mail.service";

// Dates are explicit calendar dates in India, NOT repeating every month.
// Changing these dates never changes order, account or reminder notifications.
const INDIA_ZONE = "Asia/Kolkata";
const MAX_DATES = 62;

export function indiaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isValidPromotionDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function selectedDates(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return [...new Set(rows.map((entry) => typeof entry === "string" ? entry : (entry && typeof entry === "object" ? String((entry as {date?: unknown}).date || "") : "")))]
    .filter(isValidPromotionDate).sort();
}

export function nextPromotionDate(rows: unknown, now = new Date()): string | null {
  return selectedDates(rows).find((date) => date >= indiaDate(now)) || null;
}

// Scheduled send time is 10:00 AM IST on the customer's chosen date.
// For a date that is today and already past 10 AM, send on the next worker tick.
export function promotionSendTime(date: string, now = new Date()): Date {
  const at = new Date(`${date}T10:00:00+05:30`);
  return at.getTime() < now.getTime() && date === indiaDate(now) ? now : at;
}

export async function getMyPromotionDates(req: Request, res: Response) {
  try {
    const user = await User.findById(req.user?._id).select("sendNdata").lean();
    if (!user) return res.status(404).json({ success: false, message: "Customer not found." });
    return res.json({ success: true, sendNdata: selectedDates(user.sendNdata).map((date) => ({ date })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load dates." });
  }
}

export async function saveMyPromotionDates(req: Request, res: Response) {
  try {
    if (!Array.isArray(req.body?.sendNdata)) {
      return res.status(400).json({ success: false, message: "sendNdata must be an array of { date: YYYY-MM-DD }." });
    }
    const rows: unknown[] = req.body.sendNdata;
    if (rows.length > MAX_DATES || rows.some((row) => !row || typeof row !== "object" || typeof (row as any).date !== "string" || !isValidPromotionDate((row as any).date))) {
      return res.status(400).json({ success: false, message: "Select up to 62 valid calendar dates (YYYY-MM-DD)." });
    }
    const dates = selectedDates(rows);
    if (dates.some((date) => date < indiaDate())) {
      return res.status(400).json({ success: false, message: "Past dates cannot be selected." });
    }
    const today = indiaDate();
    const latestAllowed = new Date(`${today}T00:00:00Z`);
    latestAllowed.setUTCFullYear(latestAllowed.getUTCFullYear() + 1);
    const last = latestAllowed.toISOString().slice(0, 10);
    if (dates.some((date) => date > last)) {
      return res.status(400).json({ success: false, message: "Dates must be within the next 12 months." });
    }
    const user = await User.findOneAndUpdate(
      { _id: req.user?._id, role: "customer" },
      { $set: { sendNdata: dates.map((date) => ({ date })) } },
      { new: true }
    ).select("sendNdata");
    if (!user) return res.status(404).json({ success: false, message: "Customer not found." });
    // A customer's updates immediately reschedule any not-yet-sent promotions.
    const pending = await NotificationDelivery.find({ user: user._id, status: "pending", "metadata.customerScheduledPromotion": true });
    const nextDate = nextPromotionDate(user.sendNdata);
    for (const delivery of pending) {
      if (nextDate) {
        delivery.scheduledFor = promotionSendTime(nextDate);
      } else {
        delivery.status = "cancelled";
      }
      await delivery.save();
    }
    return res.json({ success: true, message: "Promotion dates saved.", sendNdata: dates.map((date) => ({ date })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to save dates." });
  }
}

type PromotionalNotification = {
  _id: Types.ObjectId;
  title: string;
  subject: string;
  message: string;
};
type Recipient = { _id: Types.ObjectId; email?: string; sendNdata?: { date: string }[] };

export async function queueCustomerPromotions(notification: PromotionalNotification, users: Recipient[], channels: { website: boolean; email: boolean }) {
  const now = new Date();
  const docs: Record<string, unknown>[] = [];
  const plannedUsers = new Set<string>();
  for (const user of users) {
    const date = nextPromotionDate(user.sendNdata, now);
    if (!date) continue; // No dates chosen = no promotional notifications.
    plannedUsers.add(String(user._id));
    for (const channel of (["website", "email"] as const)) {
      if (!channels[channel]) continue;
      docs.push({
        notification: notification._id, user: user._id, channel, status: "pending",
        scheduledFor: promotionSendTime(date, now),
        dedupeKey: `promo:${String(notification._id)}:${String(user._id)}:${channel}`,
        eventType: "none", daysBefore: 0,
        metadata: { customerScheduledPromotion: true, title: notification.title, selectedDate: date },
      });
    }
  }
  if (docs.length) {
    try { await NotificationDelivery.insertMany(docs, { ordered: false }); }
    catch (error: any) { if (error?.code !== 11000 && !error?.writeErrors?.every((entry: any) => entry?.code === 11000)) throw error; }
  }
  return { scheduledCustomers: plannedUsers.size, queuedDeliveries: docs.length };
}

// Reuses the existing worker; only pending promotions with customerChosen date markers are processed.
export async function runDueCustomerPromotions(): Promise<number> {
  const now = new Date();
  const due = await NotificationDelivery.find({
    status: "pending", scheduledFor: { $lte: now }, "metadata.customerScheduledPromotion": true,
  }).sort({ scheduledFor: 1 }).limit(50).populate("notification", "title subject message type isActive");
  let delivered = 0;
  for (const row of due) {
    const user = await User.findById(row.user).select("email role isActive accountStatus sendNdata").lean();
    const notification = row.notification as any;
    if (!user || user.role !== "customer" || !user.isActive || user.accountStatus !== "active" || !notification || (row.channel === "website" && !notification.isActive) || notification.type !== "promotion") {
      await NotificationDelivery.updateOne({ _id: row._id, status: "pending" }, { $set: { status: "cancelled", processedAt: now } });
      continue;
    }
    const nextDate = nextPromotionDate(user.sendNdata, now);
    // Never send on a date the customer didn't select (including after they changed it).
    if (nextDate !== indiaDate(now)) {
      if (nextDate) await NotificationDelivery.updateOne({ _id: row._id, status: "pending" }, { $set: { scheduledFor: promotionSendTime(nextDate, now), "metadata.selectedDate": nextDate } });
      else await NotificationDelivery.updateOne({ _id: row._id, status: "pending" }, { $set: { status: "cancelled", processedAt: now } });
      continue;
    }
    const claimed = await NotificationDelivery.findOneAndUpdate(
      { _id: row._id, status: "pending" },
      { $set: { status: "processing", processedAt: now } }, { new: true }
    );
    if (!claimed) continue;
    if (row.channel === "email") {
      try {
        if (!user.email) throw new Error("Customer email is missing.");
        await sendEmail({ to: user.email, subject: notification.subject || notification.title, html: notification.message });
        await NotificationDelivery.updateOne({ _id: row._id, status: "processing" }, { $set: { status: "sent", sentAt: new Date(), failureReason: "" } });
        delivered += 1;
      } catch (error) {
        await NotificationDelivery.updateOne({ _id: row._id, status: "processing" }, { $set: { status: "failed", failureReason: error instanceof Error ? error.message : "Email failed." } });
      }
    } else {
      await NotificationDelivery.updateOne({ _id: row._id, status: "processing" }, { $set: { status: "sent", sentAt: new Date(), failureReason: "" } });
      delivered += 1;
    }
  }
  return delivered;
}
