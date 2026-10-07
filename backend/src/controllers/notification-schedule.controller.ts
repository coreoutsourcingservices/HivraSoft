import type { Request, Response } from "express";
import mongoose from "mongoose";
import NotificationSchedule from "../models/NotificationSchedule.model";
import NotificationScheduleHistory from "../models/NotificationScheduleHistory.model";
import { matchingCustomerIds } from "../services/customer-admin.service";
import User from "../models/User.model";
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
  const message = clean(body?.message);

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

  if (!name || !title || !message) {
    throw new Error(
      "Schedule name, notification title and message are required."
    );
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
    message,
    type: rawType,
    link,
    audience: rawAudience,
    eventType: rawEventType,
    recurrence: rawRecurrence,
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
      message: input.message,
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
      message: input.message,
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
