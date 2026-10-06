import { Types } from "mongoose";
import NotificationSchedule from "../models/NotificationSchedule.model";
import NotificationScheduleHistory from "../models/NotificationScheduleHistory.model";
import Notification from "../models/Notification.model";
import User from "../models/User.model";
import { matchingCustomerIds } from "./customer-admin.service";

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

function indiaMonthDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value || 0);
  const day = Number(parts.find((part) => part.type === "day")?.value || 0);
  return { month, day };
}

async function baseRecipients(schedule: any) {
  if (schedule.audience === "all") {
    return (await User.find({ role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean()).map((user: any) => String(user._id));
  }
  if (schedule.audience === "selected") {
    const ids = (schedule.userIds || []).map((id: any) => String(id)).filter((id: string) => Types.ObjectId.isValid(id));
    return (await User.find({ _id: { $in: ids }, role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean()).map((user: any) => String(user._id));
  }
  return matchingCustomerIds({ ...(schedule.filters || {}), accountStatus: "active" });
}

export async function resolveScheduleRecipients(schedule: any, runAt: Date) {
  let ids = await baseRecipients(schedule);
  if (!ids.length || schedule.eventType === "none") return ids;

  const { month, day } = indiaMonthDay(runAt);
  const field = schedule.eventType === "birthday" ? "birthday" : "anniversary";
  const rows = await User.aggregate([
    { $match: { _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) }, role: "customer", isActive: true, [field]: { $ne: null } } },
    { $match: { $expr: { $and: [ { $eq: [{ $month: `$${field}` }, month] }, { $eq: [{ $dayOfMonth: `$${field}` }, day] } ] } } },
    { $project: { _id: 1 } },
  ]);
  ids = rows.map((row: any) => String(row._id));
  return ids;
}

export async function executeNotificationSchedule(scheduleId: string, runAt = new Date()) {
  const schedule = await NotificationSchedule.findById(scheduleId).lean();
  if (!schedule || !schedule.isActive) return { status: "skipped" as const, recipientCount: 0 };

  try {
    const userIds = await resolveScheduleRecipients(schedule, runAt);
    if (!userIds.length) {
      await NotificationScheduleHistory.create({
        schedule: schedule._id,
        scheduleName: schedule.name,
        ranAt: runAt,
        recipientCount: 0,
        status: "skipped",
        note: schedule.eventType === "none" ? "No active users matched the audience." : `No users matched ${schedule.eventType} for this date.`,
      });
      return { status: "skipped" as const, recipientCount: 0 };
    }

    const notification = await Notification.create({
      title: schedule.title,
      message: schedule.message,
      type: schedule.type,
      audience: "selected",
      userIds: userIds.map((id) => new Types.ObjectId(id)),
      filters: schedule.filters || {},
      recipientCount: userIds.length,
      link: schedule.link || "",
      isActive: true,
      createdBy: schedule.createdBy || null,
      source: "system",
      metadata: { scheduleId: String(schedule._id), scheduleName: schedule.name, eventType: schedule.eventType, recurrence: schedule.recurrence },
    });

    await NotificationScheduleHistory.create({
      schedule: schedule._id,
      scheduleName: schedule.name,
      ranAt: runAt,
      recipientCount: userIds.length,
      status: "success",
      note: `Notification created for ${userIds.length} user${userIds.length === 1 ? "" : "s"}.`,
      notification: notification._id,
    });
    return { status: "success" as const, recipientCount: userIds.length, notificationId: String(notification._id) };
  } catch (error) {
    await NotificationScheduleHistory.create({
      schedule: schedule._id,
      scheduleName: schedule.name,
      ranAt: runAt,
      recipientCount: 0,
      status: "failed",
      note: error instanceof Error ? error.message : "Schedule execution failed.",
    }).catch(() => undefined);
    throw error;
  }
}

export async function runDueNotificationSchedules() {
  const now = new Date();
  const due = await NotificationSchedule.find({ isActive: true, nextRunAt: { $lte: now } }).sort({ nextRunAt: 1 }).limit(25).lean();
  let processed = 0;

  for (const row of due as any[]) {
    let nextRunAt = nextOccurrence(new Date(row.nextRunAt), row.recurrence);
    while (nextRunAt.getTime() <= now.getTime()) {
      nextRunAt = nextOccurrence(nextRunAt, row.recurrence);
    }
    const claimed = await NotificationSchedule.findOneAndUpdate(
      { _id: row._id, isActive: true, nextRunAt: row.nextRunAt },
      { $set: { nextRunAt, lastRunAt: now }, $inc: { runCount: 1 } },
      { new: true }
    );
    if (!claimed) continue;
    try {
      await executeNotificationSchedule(String(row._id), now);
    } catch (error) {
      console.error("NOTIFICATION SCHEDULE RUN ERROR:", error);
    }
    processed += 1;
  }
  return processed;
}

let timer: NodeJS.Timeout | null = null;
export function startNotificationScheduleWorker() {
  if (process.env.NOTIFICATION_SCHEDULES_ENABLED === "false" || timer) return;
  const run = async () => {
    try {
      const processed = await runDueNotificationSchedules();
      if (processed > 0) console.log(`🔔 Notification scheduler processed ${processed} schedule(s).`);
    } catch (error) {
      console.error("NOTIFICATION SCHEDULER ERROR:", error);
    }
  };
  void run();
  timer = setInterval(() => void run(), MINUTE_MS);
  timer.unref?.();
}
