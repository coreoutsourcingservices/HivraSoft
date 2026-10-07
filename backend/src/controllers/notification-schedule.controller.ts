import type { Request, Response } from "express";
import mongoose from "mongoose";
import NotificationSchedule from "../models/NotificationSchedule.model";
import NotificationScheduleHistory from "../models/NotificationScheduleHistory.model";
import { matchingCustomerIds } from "../services/customer-admin.service";
import User from "../models/User.model";
import { sanitizeNotificationHtml } from "../services/notification-html.service";
import {
  executeNotificationSchedule,
  parseScheduleDateTime,
} from "../services/notification-schedule.service";

const NOTIFICATION_TYPES = [
  "general",
  "promotion",
  "order",
  "account",
  "system",
] as const;

const AUDIENCE_TYPES = ["all", "selected", "filtered"] as const;

const EVENT_TYPES = ["none", "birthday", "anniversary"] as const;

const RECURRENCE_TYPES = ["daily", "monthly", "yearly"] as const;

type NotificationType = (typeof NOTIFICATION_TYPES)[number];
type AudienceType = (typeof AUDIENCE_TYPES)[number];
type EventType = (typeof EVENT_TYPES)[number];
type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

type NormalizedScheduleBody = {
  name: string;
  title: string;
  message: string;
  subject: string;
  deliveryEmail: boolean;
  deliveryWebsite: boolean;
  daysBefore: number[];
  type: NotificationType;
  link: string;
  audience: AudienceType;
  eventType: EventType;
  recurrence: RecurrenceType;
  startDate: string;
  time: string;
  timezone: string;
  filters: Record<string, unknown>;
  userIds: string[];
  nextRunAt: Date;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => clean(item))
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )
  );
}

function isOneOf<T extends readonly string[]>(
  value: string,
  allowed: T
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

function normalizedBody(body: any): NormalizedScheduleBody {
  const name = clean(body?.name);
  const title = clean(body?.title);
  const message = sanitizeNotificationHtml(body?.message);
  const subject = clean(body?.subject || body?.title);
  const deliveryEmail = Boolean(body?.deliveryEmail ?? body?.sendToEmail ?? false);
  const deliveryWebsite = Boolean(body?.deliveryWebsite ?? body?.sendToWebsite ?? true);
  const rawDaysBefore: unknown[] = Array.isArray(body?.daysBefore) ? body.daysBefore : [0];
  const daysBefore = Array.from(new Set(rawDaysBefore.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 3))).sort((a, b) => b - a);

  const rawType = clean(body?.type || "general").toLowerCase();
  const link = clean(body?.link);

  const rawAudience = clean(
    body?.audience || body?.audienceType || "all"
  ).toLowerCase();

  const rawEventType = clean(body?.eventType || "none").toLowerCase();

  const rawRecurrence = clean(
    body?.recurrence || "daily"
  ).toLowerCase();

  const startDate = clean(body?.startDate);
  const time = clean(body?.time);
  const timezone =
    clean(body?.timezone || "Asia/Kolkata") || "Asia/Kolkata";

  const filters: Record<string, unknown> =
    body?.filters &&
    typeof body.filters === "object" &&
    !Array.isArray(body.filters)
      ? body.filters
      : {};

  const userIds = normalizeIds(body?.userIds);

  if (!name || !title || !subject || !message) {
    throw new Error(
      "Schedule name, title, subject and message are required."
    );
  }

  if (!deliveryEmail && !deliveryWebsite) {
    throw new Error("Select at least one delivery channel: Email or Website.");
  }

  if (!isOneOf(rawType, NOTIFICATION_TYPES)) {
    throw new Error("Invalid notification type.");
  }

  if (!isOneOf(rawAudience, AUDIENCE_TYPES)) {
    throw new Error(
      "Audience must be all, selected or filtered."
    );
  }

  if (!isOneOf(rawEventType, EVENT_TYPES)) {
    throw new Error(
      "eventType must be none, birthday or anniversary."
    );
  }

  if (!isOneOf(rawRecurrence, RECURRENCE_TYPES)) {
    throw new Error(
      "recurrence must be daily, monthly or yearly."
    );
  }

  if (rawAudience === "selected" && !userIds.length) {
    throw new Error("Select at least one user.");
  }

  if (timezone !== "Asia/Kolkata") {
    throw new Error(
      "Currently schedule timezone must be Asia/Kolkata."
    );
  }

  const nextRunAt = parseScheduleDateTime(startDate, time);

  return {
    name,
    title,
    subject,
    message,
    deliveryEmail,
    deliveryWebsite,
    daysBefore: rawEventType === "none" ? [0] : (daysBefore.length ? daysBefore : [0]),
    type: rawType,
    link,
    audience: rawAudience,
    eventType: rawEventType,
    recurrence: rawEventType === "none" ? rawRecurrence : "daily",
    startDate,
    time,
    timezone,
    filters,
    userIds,
    nextRunAt,
  };
}

export async function listNotificationSchedules(
  _req: Request,
  res: Response
) {
  try {
    const schedules = await NotificationSchedule.find({})
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();

    return res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load notification schedules.",
    });
  }
}

export async function getNotificationSchedule(
  req: Request,
  res: Response
) {
  try {
    const id = clean(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const schedule = await NotificationSchedule.findById(id)
      .populate({
        path: "userIds",
        select: "name email phone",
      })
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    return res.json({
      success: true,
      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load schedule.",
    });
  }
}

export async function createNotificationSchedule(
  req: Request,
  res: Response
) {
  try {
    const input = normalizedBody(req.body || {});

    const schedule = new NotificationSchedule({
      name: input.name,
      title: input.title,
      subject: input.subject,
      message: input.message,
      deliveryEmail: input.deliveryEmail,
      deliveryWebsite: input.deliveryWebsite,
      daysBefore: input.daysBefore,
      type: input.type,
      link: input.link,
      audience: input.audience,
      eventType: input.eventType,
      recurrence: input.recurrence,
      startDate: input.startDate,
      time: input.time,
      timezone: input.timezone,
      filters: input.filters,
      nextRunAt: input.nextRunAt,

      userIds: input.userIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),

      isActive: req.body?.isActive !== false,

      createdBy: req.user?._id
        ? new mongoose.Types.ObjectId(String(req.user._id))
        : null,
    });

    await schedule.save();

    return res.status(201).json({
      success: true,
      message: "Notification schedule created.",
      schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create schedule.",
    });
  }
}

export async function updateNotificationSchedule(
  req: Request,
  res: Response
) {
  try {
    const id = clean(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const input = normalizedBody(req.body || {});

    const updateData: Record<string, unknown> = {
      name: input.name,
      title: input.title,
      subject: input.subject,
      message: input.message,
      deliveryEmail: input.deliveryEmail,
      deliveryWebsite: input.deliveryWebsite,
      daysBefore: input.daysBefore,
      type: input.type,
      link: input.link,
      audience: input.audience,
      eventType: input.eventType,
      recurrence: input.recurrence,
      startDate: input.startDate,
      time: input.time,
      timezone: input.timezone,
      filters: input.filters,
      nextRunAt: input.nextRunAt,

      userIds: input.userIds.map(
        (userId) => new mongoose.Types.ObjectId(userId)
      ),
    };

    if (req.body?.isActive !== undefined) {
      updateData.isActive = Boolean(req.body.isActive);
    }

    const schedule =
      await NotificationSchedule.findByIdAndUpdate(
        id,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification schedule updated.",
      schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update schedule.",
    });
  }
}

export async function updateNotificationScheduleStatus(
  req: Request,
  res: Response
) {
  try {
    const id = clean(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const schedule =
      await NotificationSchedule.findByIdAndUpdate(
        id,
        {
          $set: {
            isActive: Boolean(req.body?.isActive),
          },
        },
        {
          new: true,
        }
      );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    return res.json({
      success: true,
      message: schedule.isActive
        ? "Schedule activated."
        : "Schedule paused.",
      schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update schedule status.",
    });
  }
}

export async function deleteNotificationSchedule(
  req: Request,
  res: Response
) {
  try {
    const id = clean(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const schedule =
      await NotificationSchedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    await NotificationScheduleHistory.deleteMany({
      schedule: schedule._id,
    });

    return res.json({
      success: true,
      message: "Notification schedule deleted.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to delete schedule.",
    });
  }
}

export async function listNotificationScheduleHistory(
  req: Request,
  res: Response
) {
  try {
    const id = clean(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const history = await NotificationScheduleHistory.find({
      schedule: id,
    })
      .sort({ ranAt: -1 })
      .limit(250)
      .lean();

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load schedule history.",
    });
  }
}

export async function previewNotificationScheduleAudience(
  req: Request,
  res: Response
) {
  try {
    const rawAudience = clean(
      req.body?.audience ||
        req.body?.audienceType ||
        "all"
    ).toLowerCase();

    let ids: string[] = [];

    if (rawAudience === "all") {
      ids = (
        await User.find({
          role: "customer",
          isActive: true,
          accountStatus: "active",
        })
          .select("_id")
          .lean()
      ).map((user: any) => String(user._id));
    } else if (rawAudience === "selected") {
      ids = normalizeIds(req.body?.userIds);
    } else if (rawAudience === "filtered") {
      ids = await matchingCustomerIds({
        ...(req.body?.filters || {}),
        accountStatus: "active",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid audience.",
      });
    }

    const customers = ids.length
      ? await User.find({
          _id: {
            $in: ids.slice(0, 50),
          },
        })
          .select(
            "name email phone birthday anniversary accountStatus"
          )
          .lean()
      : [];

    return res.json({
      success: true,
      count: ids.length,
      customers,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to preview schedule audience.",
    });
  }
}

export async function runNotificationScheduleNow(
  req: Request,
  res: Response
) {
  try {
    const id = clean(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const schedule = await NotificationSchedule.findById(id)
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    const result = await executeNotificationSchedule(
      id,
      new Date()
    );

    return res.json({
      success: true,
      message: `Schedule run: ${result.status}.`,
      result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to run schedule.",
    });
  }
}


export async function getNotificationScheduleCalendar(req: Request, res: Response) {
  try {
    const monthText = clean(req.query.month) || new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(monthText)) return res.status(400).json({ success: false, message: "month must be YYYY-MM." });
    const [yearText, monthNumText] = monthText.split("-");
    const year = Number(yearText); const monthIndex = Number(monthNumText) - 1;
    const monthStart = new Date(year, monthIndex, 1); const monthEnd = new Date(year, monthIndex + 1, 1);
    const [schedules, users] = await Promise.all([
      NotificationSchedule.find({ isActive: true }).sort({ createdAt: -1 }).limit(100).lean(),
      User.find({ role: "customer", isActive: true, accountStatus: "active", $or: [{ birthday: { $ne: null } }, { anniversary: { $ne: null } }] }).select("name email birthday anniversary").limit(5000).lean(),
    ]);
    const events: any[] = [];
    for (const schedule of schedules as any[]) {
      if (schedule.eventType === "none") {
        const d = new Date(schedule.nextRunAt);
        if (d >= monthStart && d < monthEnd) events.push({ id: `schedule-${schedule._id}`, scheduleId: String(schedule._id), scheduleName: schedule.name, userName: "Audience", eventType: "scheduled", eventDate: null, sendDate: d.toISOString(), channels: [schedule.deliveryEmail ? "email" : "", schedule.deliveryWebsite ? "website" : ""].filter(Boolean), status: "Scheduled" });
        continue;
      }
      let allowed: Set<string> | null = null;
      if (schedule.audience === "selected") allowed = new Set((schedule.userIds || []).map((id: any) => String(id)));
      if (schedule.audience === "filtered") allowed = new Set(await matchingCustomerIds({ ...(schedule.filters || {}), accountStatus: "active" }));
      const timings = Array.isArray(schedule.daysBefore) && schedule.daysBefore.length ? schedule.daysBefore : [0];
      for (const user of users as any[]) {
        if (allowed && !allowed.has(String(user._id))) continue;
        const raw = schedule.eventType === "birthday" ? user.birthday : user.anniversary;
        if (!raw) continue;
        const original = new Date(raw); if (Number.isNaN(original.getTime())) continue;
        for (const eventYear of [year, year + 1]) {
          const eventDate = new Date(eventYear, original.getMonth(), original.getDate(), 12, 0, 0);
          for (const beforeRaw of timings) {
            const daysBefore = Number(beforeRaw || 0); const sendDate = new Date(eventDate); sendDate.setDate(sendDate.getDate() - daysBefore);
            if (sendDate < monthStart || sendDate >= monthEnd) continue;
            events.push({ id: `${schedule._id}-${user._id}-${eventYear}-${daysBefore}`, scheduleId: String(schedule._id), scheduleName: schedule.name, userId: String(user._id), userName: user.name || user.email || "Customer", eventType: schedule.eventType, eventDate: eventDate.toISOString(), sendDate: sendDate.toISOString(), daysBefore, channels: [schedule.deliveryEmail ? "email" : "", schedule.deliveryWebsite ? "website" : ""].filter(Boolean), status: "Scheduled" });
          }
        }
      }
    }
    events.sort((a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime());
    return res.json({ success: true, month: monthText, events: events.slice(0, 5000) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load notification calendar." });
  }
}
