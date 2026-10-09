import { Types } from "mongoose";
import NotificationSchedule from "../models/NotificationSchedule.model";
import NotificationScheduleHistory from "../models/NotificationScheduleHistory.model";
import Notification from "../models/Notification.model";
import NotificationDelivery from "../models/NotificationDelivery.model";
import User from "../models/User.model";
import { matchingCustomerIds } from "./customer-admin.service";
import { sendEmail } from "./mail.service";
import { runDueCustomerPromotions, indiaDate, selectedDates } from "./promotion-date.service";
import { runDuePersonalPromotions } from "./customer-promotion-message.service";

const MINUTE_MS = 60_000;
const INDIA_OFFSET = "+05:30";

export function parseScheduleDateTime(startDate: string, time: string) {
  const dateText = String(startDate || "").trim();
  const timeText = String(time || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error("startDate must be YYYY-MM-DD.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeText)) throw new Error("time must be HH:mm.");
  const value = new Date(`${dateText}T${timeText}:00${INDIA_OFFSET}`);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid schedule date/time.");
  return value;
}

export function nextOccurrence(current: Date, recurrence: "daily" | "monthly" | "yearly") {
  const next = new Date(current);
  if (recurrence === "daily") next.setUTCDate(next.getUTCDate() + 1);
  if (recurrence === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  if (recurrence === "yearly") next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

function indiaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value || 0),
    month: Number(parts.find((part) => part.type === "month")?.value || 0),
    day: Number(parts.find((part) => part.type === "day")?.value || 0),
  };
}

function targetDate(runAt: Date, daysBefore: number) {
  return new Date(runAt.getTime() + Math.max(0, daysBefore) * 86_400_000);
}

async function baseRecipientIds(schedule: any) {
  if (schedule.audience === "all") {
    return (await User.find({ role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean()).map((user: any) => String(user._id));
  }
  if (schedule.audience === "selected") {
    const ids = (schedule.userIds || []).map((id: any) => String(id)).filter((id: string) => Types.ObjectId.isValid(id));
    return (await User.find({ _id: { $in: ids }, role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean()).map((user: any) => String(user._id));
  }
  return matchingCustomerIds({ ...(schedule.filters || {}), accountStatus: "active" });
}

export async function resolveScheduleRecipients(schedule: any, runAt: Date, daysBefore = 0) {
  const ids = await baseRecipientIds(schedule);
  if (!ids.length) return [] as any[];
  if (schedule.eventType === "none") {
    const recipients = await User.find({ _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) }, role: "customer", isActive: true }).select("name email birthday anniversary sendNdata").lean();
    // Existing order and reminder schedule types retain their normal delivery rules.
    return schedule.type === "promotion" ? recipients.filter((user: any) => selectedDates(user.sendNdata).includes(indiaDate(runAt))) : recipients;
  }

  const target = targetDate(runAt, daysBefore);
  const { month, day } = indiaParts(target);
  const field = schedule.eventType === "birthday" ? "birthday" : "anniversary";
  return User.aggregate([
    { $match: { _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) }, role: "customer", isActive: true, [field]: { $ne: null } } },
    { $match: { $expr: { $and: [{ $eq: [{ $month: `$${field}` }, month] }, { $eq: [{ $dayOfMonth: `$${field}` }, day] }] } } },
    { $project: { _id: 1, name: 1, email: 1, birthday: 1, anniversary: 1 } },
  ]);
}

function uniqueTimings(schedule: any) {
  if (schedule.eventType === "none") return [0];
  const raw: unknown[] = Array.isArray(schedule.daysBefore) ? schedule.daysBefore : [0];
  const values = Array.from(new Set(raw.map((v: unknown) => Number(v)).filter((v: number) => Number.isInteger(v) && v >= 0 && v <= 3)));
  return values.length ? values.sort((a, b) => b - a) : [0];
}

function deliveryKey(scheduleId: string, userId: string, channel: "email" | "website", eventYear: number, daysBefore: number) {
  return `schedule:${scheduleId}:user:${userId}:${channel}:year:${eventYear}:before:${daysBefore}`;
}

async function unsentUsers(schedule: any, users: any[], channel: "email" | "website", eventYear: number, daysBefore: number) {
  if (!users.length) return [];
  const keys = users.map((user) => deliveryKey(String(schedule._id), String(user._id), channel, eventYear, daysBefore));
  const existing = await NotificationDelivery.find({ dedupeKey: { $in: keys } }).select("dedupeKey").lean();
  const seen = new Set(existing.map((row: any) => String(row.dedupeKey)));
  return users.filter((user) => !seen.has(deliveryKey(String(schedule._id), String(user._id), channel, eventYear, daysBefore)));
}

export async function executeNotificationSchedule(scheduleId: string, runAt = new Date()) {
  const schedule = await NotificationSchedule.findById(scheduleId).lean();
  if (!schedule || !schedule.isActive) return { status: "skipped" as const, recipientCount: 0, emailSent: 0, websiteSent: 0, failed: 0 };

  try {
    const timings = uniqueTimings(schedule);
    const recipientIds = new Set<string>();
    let emailSent = 0;
    let websiteSent = 0;
    let failed = 0;
    const notificationIds: string[] = [];

    for (const daysBefore of timings) {
      const users = await resolveScheduleRecipients(schedule, runAt, daysBefore);
      if (!users.length) continue;
      const target = targetDate(runAt, daysBefore);
      const eventYear = indiaParts(target).year;

      if (schedule.deliveryWebsite) {
        const websiteUsers = await unsentUsers(schedule, users, "website", eventYear, daysBefore);
        if (websiteUsers.length) {
          const day = indiaParts(runAt);
          const masterKey = `schedule:${scheduleId}:website:${day.year}-${day.month}-${day.day}:before:${daysBefore}`;
          const notification = await Notification.findOneAndUpdate(
            { dedupeKey: masterKey },
            { $setOnInsert: {
              title: schedule.title, subject: schedule.subject || schedule.title, message: schedule.message, type: schedule.type,
              audience: "selected", userIds: websiteUsers.map((user: any) => user._id), filters: schedule.filters || {}, recipientCount: websiteUsers.length,
              link: schedule.link || "", isActive: true, deliveryEmail: false, deliveryWebsite: true, createdBy: schedule.createdBy || null,
              source: "system", dedupeKey: masterKey, metadata: { scheduleId: String(schedule._id), scheduleName: schedule.name, eventType: schedule.eventType, daysBefore, eventYear },
            } },
            { upsert: true, returnDocument: "after" }
          );
          notificationIds.push(String(notification._id));
          const docs = websiteUsers.map((user: any) => ({ notification: notification._id, schedule: schedule._id, user: user._id, channel: "website", status: "sent", scheduledFor: runAt, processedAt: new Date(), sentAt: new Date(), failureReason: "", dedupeKey: deliveryKey(scheduleId, String(user._id), "website", eventYear, daysBefore), eventType: schedule.eventType, eventYear, daysBefore, metadata: { scheduleName: schedule.name } }));
          try { const inserted = await NotificationDelivery.insertMany(docs, { ordered: false }); websiteSent += inserted.length; inserted.forEach((row: any) => recipientIds.add(String(row.user))); }
          catch (error: any) { const inserted = error?.insertedDocs || []; websiteSent += inserted.length; inserted.forEach((row: any) => recipientIds.add(String(row.user))); }
        }
      }

      if (schedule.deliveryEmail) {
        const emailUsers = await unsentUsers(schedule, users, "email", eventYear, daysBefore);
        for (const user of emailUsers as any[]) {
          const userId = String(user._id);
          let delivery: any;
          try {
            delivery = await NotificationDelivery.create({ schedule: schedule._id, user: user._id, channel: "email", status: "pending", scheduledFor: runAt, dedupeKey: deliveryKey(scheduleId, userId, "email", eventYear, daysBefore), eventType: schedule.eventType, eventYear, daysBefore, metadata: { scheduleName: schedule.name, subject: schedule.subject || schedule.title } });
          } catch (error: any) {
            if (error?.code === 11000) continue;
            throw error;
          }
          try {
            if (!String(user.email || "").trim()) throw new Error("Customer email is missing.");
            await sendEmail({ to: String(user.email), subject: schedule.subject || schedule.title, html: schedule.message });
            await NotificationDelivery.findByIdAndUpdate(delivery._id, { $set: { status: "sent", processedAt: new Date(), sentAt: new Date(), failureReason: "" } });
            emailSent += 1; recipientIds.add(userId);
          } catch (error) {
            failed += 1;
            await NotificationDelivery.findByIdAndUpdate(delivery._id, { $set: { status: "failed", processedAt: new Date(), failureReason: error instanceof Error ? error.message : "Email delivery failed." } });
          }
        }
      }
    }

    const delivered = emailSent + websiteSent;
    const status = delivered > 0 ? "success" : "skipped";
    const note = delivered > 0
      ? `Website: ${websiteSent}, Email: ${emailSent}, Failed: ${failed}. Unique recipients: ${recipientIds.size}.`
      : `No new ${schedule.eventType === "none" ? "audience" : schedule.eventType} deliveries were due (or they were already processed).`;
    await NotificationScheduleHistory.create({ schedule: schedule._id, scheduleName: schedule.name, ranAt: runAt, recipientCount: recipientIds.size, status, note, notification: notificationIds[0] ? new Types.ObjectId(notificationIds[0]) : null });
    return { status: status as "success" | "skipped", recipientCount: recipientIds.size, emailSent, websiteSent, failed, notificationIds };
  } catch (error) {
    await NotificationScheduleHistory.create({ schedule: schedule._id, scheduleName: schedule.name, ranAt: runAt, recipientCount: 0, status: "failed", note: error instanceof Error ? error.message : "Schedule execution failed." }).catch(() => undefined);
    throw error;
  }
}

export async function runDueNotificationSchedules() {
  const now = new Date();
  const due = await NotificationSchedule.find({ isActive: true, nextRunAt: { $lte: now } }).sort({ nextRunAt: 1 }).limit(25).lean();
  let processed = 0;

  for (const row of due as any[]) {
    const recurrence = row.eventType && row.eventType !== "none" ? "daily" : row.recurrence;
    let nextRunAt = nextOccurrence(new Date(row.nextRunAt), recurrence);
    while (nextRunAt.getTime() <= now.getTime()) nextRunAt = nextOccurrence(nextRunAt, recurrence);
    const claimed = await NotificationSchedule.findOneAndUpdate({ _id: row._id, isActive: true, nextRunAt: row.nextRunAt }, { $set: { nextRunAt, lastRunAt: now }, $inc: { runCount: 1 } }, { returnDocument: "after" });
    if (!claimed) continue;
    try { await executeNotificationSchedule(String(row._id), now); }
    catch (error) { console.error("NOTIFICATION SCHEDULE RUN ERROR:", error); }
    processed += 1;
  }
  return processed;
}

let timer: NodeJS.Timeout | null = null;
export function startNotificationScheduleWorker() {
  if (process.env.NOTIFICATION_SCHEDULES_ENABLED === "false" || timer) return;
  const run = async () => {
    try {
      const delivered = await runDueCustomerPromotions();
      if (delivered > 0) console.log(`🔔 ${delivered} customer-date promotion delivery(s).`);
      const personal = await runDuePersonalPromotions();
      if (personal > 0) console.log(`🔔 ${personal} customer-authored promotional notification(s) sent.`);
      const processed = await runDueNotificationSchedules(); if (processed > 0) console.log(`🔔 Notification scheduler processed ${processed} schedule(s).`);
    }
    catch (error) { console.error("NOTIFICATION SCHEDULER ERROR:", error); }
  };
  void run();
  timer = setInterval(() => void run(), MINUTE_MS);
  timer.unref?.();
}
