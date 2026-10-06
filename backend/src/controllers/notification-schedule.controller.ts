import type { Request, Response } from "express";
import mongoose from "mongoose";
import NotificationSchedule from "../models/NotificationSchedule.model";
import NotificationScheduleHistory from "../models/NotificationScheduleHistory.model";
import { matchingCustomerIds } from "../services/customer-admin.service";
import User from "../models/User.model";
import {
  executeNotificationSchedule,
  parseScheduleDateTime,
  resolveScheduleRecipients,
} from "../services/notification-schedule.service";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => clean(item)).filter((id) => mongoose.Types.ObjectId.isValid(id))));
}

function normalizedBody(body: any) {
  const name = clean(body?.name);
  const title = clean(body?.title);
  const message = clean(body?.message);
  const type = clean(body?.type || "general").toLowerCase();
  const link = clean(body?.link);
  const audience = clean(body?.audience || body?.audienceType || "all").toLowerCase();
  const eventType = clean(body?.eventType || "none").toLowerCase();
  const recurrence = clean(body?.recurrence || "daily").toLowerCase();
  const startDate = clean(body?.startDate);
  const time = clean(body?.time);
  const timezone = clean(body?.timezone || "Asia/Kolkata") || "Asia/Kolkata";
  const filters = body?.filters && typeof body.filters === "object" ? body.filters : {};
  const userIds = normalizeIds(body?.userIds);

  if (!name || !title || !message) throw new Error("Schedule name, notification title and message are required.");
  if (!["general", "promotion", "order", "account", "system"].includes(type)) throw new Error("Invalid notification type.");
  if (!["all", "selected", "filtered"].includes(audience)) throw new Error("Audience must be all, selected or filtered.");
  if (!["none", "birthday", "anniversary"].includes(eventType)) throw new Error("eventType must be none, birthday or anniversary.");
  if (!["daily", "monthly", "yearly"].includes(recurrence)) throw new Error("recurrence must be daily, monthly or yearly.");
  if (audience === "selected" && !userIds.length) throw new Error("Select at least one user.");
  if (timezone !== "Asia/Kolkata") throw new Error("Currently schedule timezone must be Asia/Kolkata.");

  const nextRunAt = parseScheduleDateTime(startDate, time);
  return { name, title, message, type, link, audience, eventType, recurrence, startDate, time, timezone, filters, userIds, nextRunAt };
}

export async function listNotificationSchedules(_req: Request, res: Response) {
  try {
    const schedules = await NotificationSchedule.find({})
      .populate({ path: "createdBy", select: "name email" })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();
    return res.json({ success: true, count: schedules.length, schedules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load notification schedules." });
  }
}

export async function getNotificationSchedule(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid schedule ID." });
    const schedule = await NotificationSchedule.findById(id).populate({ path: "userIds", select: "name email phone" }).lean();
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found." });
    return res.json({ success: true, schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load schedule." });
  }
}

export async function createNotificationSchedule(req: Request, res: Response) {
  try {
    const input = normalizedBody(req.body || {});
    const schedule = await NotificationSchedule.create({
      ...input,
      userIds: input.userIds.map((id) => new mongoose.Types.ObjectId(id)),
      isActive: req.body?.isActive !== false,
      createdBy: req.user?._id || null,
    });
    return res.status(201).json({ success: true, message: "Notification schedule created.", schedule });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create schedule." });
  }
}

export async function updateNotificationSchedule(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid schedule ID." });
    const input = normalizedBody(req.body || {});
    const schedule = await NotificationSchedule.findByIdAndUpdate(
      id,
      {
        $set: {
          ...input,
          userIds: input.userIds.map((userId) => new mongoose.Types.ObjectId(userId)),
          ...(req.body?.isActive !== undefined ? { isActive: Boolean(req.body.isActive) } : {}),
        },
      },
      { new: true, runValidators: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found." });
    return res.json({ success: true, message: "Notification schedule updated.", schedule });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update schedule." });
  }
}

export async function updateNotificationScheduleStatus(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid schedule ID." });
    const schedule = await NotificationSchedule.findByIdAndUpdate(id, { $set: { isActive: Boolean(req.body?.isActive) } }, { new: true });
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found." });
    return res.json({ success: true, message: schedule.isActive ? "Schedule activated." : "Schedule paused.", schedule });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update schedule status." });
  }
}

export async function deleteNotificationSchedule(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid schedule ID." });
    const schedule = await NotificationSchedule.findByIdAndDelete(id);
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found." });
    await NotificationScheduleHistory.deleteMany({ schedule: schedule._id });
    return res.json({ success: true, message: "Notification schedule deleted." });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete schedule." });
  }
}

export async function listNotificationScheduleHistory(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid schedule ID." });
    const history = await NotificationScheduleHistory.find({ schedule: id }).sort({ ranAt: -1 }).limit(250).lean();
    return res.json({ success: true, count: history.length, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load schedule history." });
  }
}

export async function previewNotificationScheduleAudience(req: Request, res: Response) {
  try {
    const rawAudience = clean(req.body?.audience || req.body?.audienceType || "all").toLowerCase();
    let ids: string[] = [];
    if (rawAudience === "all") {
      ids = (await User.find({ role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean()).map((user: any) => String(user._id));
    } else if (rawAudience === "selected") {
      ids = normalizeIds(req.body?.userIds);
    } else if (rawAudience === "filtered") {
      ids = await matchingCustomerIds({ ...(req.body?.filters || {}), accountStatus: "active" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid audience." });
    }

    const customers = ids.length
      ? await User.find({ _id: { $in: ids.slice(0, 50) } }).select("name email phone birthday anniversary accountStatus").lean()
      : [];
    return res.json({ success: true, count: ids.length, customers });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to preview schedule audience." });
  }
}

export async function runNotificationScheduleNow(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid schedule ID." });
    const schedule = await NotificationSchedule.findById(id).lean();
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found." });
    const result = await executeNotificationSchedule(id, new Date());
    return res.json({ success: true, message: `Schedule run: ${result.status}.`, result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to run schedule." });
  }
}
