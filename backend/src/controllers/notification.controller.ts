import type { Request, Response } from "express";
import mongoose from "mongoose";
import Notification, { type INotification } from "../models/Notification.model";
import User from "../models/User.model";
import { matchingCustomerIds } from "../services/customer-admin.service";
import { softDeleteEntity } from "../services/admin-trash.service";
import NotificationDelivery from "../models/NotificationDelivery.model";
import { sendEmail } from "../services/mail.service";
import { sanitizeNotificationHtml } from "../services/notification-html.service";
import { queueCustomerPromotions } from "../services/promotion-date.service";


function currentUserId(req: Request) {
  if (!req.user?._id) throw new Error("Not authenticated.");
  return String(req.user._id);
}

function normalizeUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )
  );
}

/* =========================================================
   ADMIN - CREATE NOTIFICATION
========================================================= */

export async function createAdminNotification(req: Request, res: Response) {
  try {
    const title = String(req.body?.title || "").trim();
    const subject = String(req.body?.subject || title).trim();
    const message = sanitizeNotificationHtml(req.body?.message);
    const rawType = String(req.body?.type || "general").trim().toLowerCase();
    const rawAudience = String(req.body?.audienceType || req.body?.audience || "all").trim().toLowerCase();
    const link = String(req.body?.link || "").trim();
    const deliveryEmail = Boolean(req.body?.deliveryEmail ?? req.body?.sendToEmail ?? false);
    const deliveryWebsite = Boolean(req.body?.deliveryWebsite ?? req.body?.sendToWebsite ?? true);

    if (!title) return res.status(400).json({ success: false, message: "Notification title is required." });
    if (!subject) return res.status(400).json({ success: false, message: "Notification subject is required." });
    if (!message) return res.status(400).json({ success: false, message: "Notification message is required." });
    if (!deliveryEmail && !deliveryWebsite) return res.status(400).json({ success: false, message: "Select at least one delivery channel: Email or Website." });
    if (!["general", "promotion", "order", "account", "system"].includes(rawType)) return res.status(400).json({ success: false, message: "Invalid notification type." });
    if (!["all", "selected", "filtered"].includes(rawAudience)) return res.status(400).json({ success: false, message: "Audience must be all, selected or filtered." });

    const type = rawType as "general" | "promotion" | "order" | "account" | "system";
    const audience = rawAudience as "all" | "selected" | "filtered";
    const filters = req.body?.filters && typeof req.body.filters === "object" ? req.body.filters : {};
    let userIds: string[] = [];

    if (audience === "all") {
      userIds = (await User.find({ role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean()).map((user: any) => String(user._id));
    } else if (audience === "selected") {
      userIds = normalizeUserIds(req.body?.userIds);
      if (!userIds.length) return res.status(400).json({ success: false, message: "Select at least one customer." });
      const existingUsers = await User.find({ _id: { $in: userIds }, role: "customer", isActive: true, accountStatus: "active" }).select("_id").lean();
      userIds = existingUsers.map((user: any) => String(user._id));
    } else {
      userIds = await matchingCustomerIds({ ...(filters as Record<string, unknown>), accountStatus: "active" });
    }
    if (!userIds.length) return res.status(400).json({ success: false, message: "No active customers match this audience." });

    const notification = await Notification.create({
      title, subject, message, type, audience,
      userIds: audience === "all" ? [] : userIds,
      filters: audience === "filtered" ? filters : {}, recipientCount: userIds.length, link,
      deliveryEmail, deliveryWebsite, isActive: deliveryWebsite && req.body?.isActive !== false,
      createdBy: req.user?._id || null, source: "admin", metadata: { channels: { email: deliveryEmail, website: deliveryWebsite }, ...(type === "promotion" ? { customerScheduledPromotion: true } : {}) },
    });

    // Promotion ONLY: respect dates chosen by customers and queue for 10 AM IST.
    // Order, reminder, general and other notification types stay as before.
    if (type === "promotion") {
      const users = await User.find({ _id: { $in: userIds }, role: "customer", isActive: true, accountStatus: "active" }).select("_id email sendNdata").lean();
      const scheduled = await queueCustomerPromotions(notification, users as any, { website: deliveryWebsite, email: deliveryEmail });
      return res.status(201).json({
        success: true,
        message: `Promotion queued for ${scheduled.scheduledCustomers} customer(s) on their chosen date(s).`,
        matchedCount: userIds.length,
        scheduledCount: scheduled.scheduledCustomers,
        queuedDeliveries: scheduled.queuedDeliveries,
        delivery: { websiteSent: 0, emailSent: 0, emailFailed: 0 },
        notification,
      });
    }

    const now = new Date();
    let websiteSent = 0;
    let emailSent = 0;
    let emailFailed = 0;

    if (deliveryWebsite) {
      const docs = userIds.map((id) => ({
        notification: notification._id, user: new mongoose.Types.ObjectId(id), channel: "website" as const,
        status: "sent" as const, scheduledFor: now, processedAt: now, sentAt: now,
        dedupeKey: `notification:${String(notification._id)}:${id}:website`, eventType: "none" as const, daysBefore: 0,
        metadata: { title },
      }));
      try { const result = await NotificationDelivery.insertMany(docs, { ordered: false }); websiteSent = result.length; }
      catch (error: any) { websiteSent = Number(error?.insertedDocs?.length || 0); }
    }

    if (deliveryEmail) {
      const users = await User.find({ _id: { $in: userIds }, role: "customer", isActive: true }).select("_id name email").lean();
      for (const user of users as any[]) {
        const id = String(user._id);
        const dedupeKey = `notification:${String(notification._id)}:${id}:email`;
        let delivery: any;
        try {
          delivery = await NotificationDelivery.create({ notification: notification._id, user: user._id, channel: "email", status: "pending", scheduledFor: now, dedupeKey, eventType: "none", daysBefore: 0, metadata: { subject } });
        } catch (error: any) {
          if (error?.code === 11000) continue;
          throw error;
        }
        try {
          if (!String(user.email || "").trim()) throw new Error("Customer email is missing.");
          await sendEmail({ to: String(user.email), subject, html: message });
          await NotificationDelivery.findByIdAndUpdate(delivery._id, { $set: { status: "sent", processedAt: new Date(), sentAt: new Date(), failureReason: "" } });
          emailSent += 1;
        } catch (error) {
          emailFailed += 1;
          await NotificationDelivery.findByIdAndUpdate(delivery._id, { $set: { status: "failed", processedAt: new Date(), failureReason: error instanceof Error ? error.message : "Email delivery failed." } });
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Notification processed for ${userIds.length} user${userIds.length === 1 ? "" : "s"}.`,
      matchedCount: userIds.length,
      delivery: { websiteSent, emailSent, emailFailed },
      notification,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create notification." });
  }
}

export async function previewAdminNotificationAudience(req: Request, res: Response) {
  try {
    const rawAudience = String(req.body?.audienceType || req.body?.audience || "all").toLowerCase();
    if (rawAudience === "all") {
      const count = await User.countDocuments({ role: "customer", isActive: true });
      return res.json({ success: true, count, customers: [] });
    }
    if (rawAudience === "selected") {
      const ids = normalizeUserIds(req.body?.userIds);
      const customers = await User.find({ _id: { $in: ids }, role: "customer", isActive: true })
        .select("name email phone accountStatus isActive").limit(50).lean();
      return res.json({ success: true, count: customers.length, customers });
    }
    const filters = req.body?.filters && typeof req.body.filters === "object" ? req.body.filters : {};
    const ids = await matchingCustomerIds({ ...(filters as Record<string, unknown>), accountStatus: "active" });
    const customers = ids.length
      ? await User.find({ _id: { $in: ids.slice(0, 50) } }).select("name email phone accountStatus isActive").lean()
      : [];
    return res.json({ success: true, count: ids.length, customers });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to preview audience." });
  }
}


/* =========================================================
   ADMIN - CONVENIENCE SEND ENDPOINTS
========================================================= */

export async function sendAdminNotificationToOne(req: Request, res: Response) {
  const userId = String(req.body?.userId || "").trim();
  req.body = { ...req.body, audience: "selected", userIds: userId ? [userId] : [] };
  return createAdminNotification(req, res);
}

export async function sendAdminNotificationBulk(req: Request, res: Response) {
  req.body = { ...req.body, audience: "selected", userIds: req.body?.userIds || [] };
  return createAdminNotification(req, res);
}

export async function broadcastAdminNotification(req: Request, res: Response) {
  req.body = { ...req.body, audience: "all", userIds: [], filters: {} };
  return createAdminNotification(req, res);
}

/* =========================================================
   ADMIN - LIST NOTIFICATIONS
========================================================= */

export async function listAdminNotifications(_req: Request, res: Response) {
  try {
    const notifications = await Notification.find({})
      .populate({ path: "createdBy", select: "name email role" })
      .populate({ path: "product", select: "colors isActive" })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();

    return res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load notifications.",
    });
  }
}

/* =========================================================
   ADMIN - DELETE NOTIFICATION
========================================================= */

export async function deleteAdminNotification(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const result = await softDeleteEntity("notification", id, currentUserId(req));
    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete notification.",
    });
  }
}

export async function listAdminNotificationDeliveries(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || "25"), 10) || 25));
    const filter: Record<string, unknown> = {};
    const status = String(req.query.status || "").trim().toLowerCase();
    const channel = String(req.query.channel || "").trim().toLowerCase();
    if (["pending", "sent", "failed", "cancelled"].includes(status)) filter.status = status;
    if (["email", "website"].includes(channel)) filter.channel = channel;
    const [total, deliveries] = await Promise.all([
      NotificationDelivery.countDocuments(filter),
      NotificationDelivery.find(filter).populate("user", "name email phone").populate("notification", "title subject type").populate("schedule", "name eventType").sort({ scheduledFor: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return res.json({ success: true, deliveries, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load notification delivery history." });
  }
}

async function promotionVisibilityFilter(
  userId: mongoose.Types.ObjectId
): Promise<mongoose.QueryFilter<INotification>> {
  const ids = await NotificationDelivery.distinct("notification", {
    user: userId, channel: "website", status: "sent", notification: { $ne: null },
  });
  return { $or: [
    { type: { $ne: "promotion" } },
    { type: "promotion", "metadata.customerScheduledPromotion": { $ne: true } },
    { type: "promotion", "metadata.customerScheduledPromotion": true, _id: { $in: ids } },
  ] };
}

/* =========================================================
   USER - MY NOTIFICATIONS
========================================================= */

export async function getMyNotifications(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notifications = await Notification.find({
      isActive: true,
      deletedBy: { $ne: userObjectId },
      $and: [await promotionVisibilityFilter(userObjectId)],
      $or: [
        { audience: "all" },
        { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const items = notifications.map((notification: any) => ({
      ...notification,
      _id: String(notification._id),
      isRead: Array.isArray(notification.readBy)
        ? notification.readBy.some((id: any) => String(id) === userId)
        : false,
    }));

    const unreadCount = items.filter((item: any) => !item.isRead).length;

    return res.json({
      success: true,
      count: items.length,
      unreadCount,
      notifications: items,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load notifications.",
    });
  }
}

export async function getMyUnreadNotificationCount(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const unreadCount = await Notification.countDocuments({
      isActive: true,
      deletedBy: { $ne: userObjectId },
      $and: [await promotionVisibilityFilter(userObjectId)],
      $or: [
        { audience: "all" },
        { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
      ],
      readBy: { $ne: userObjectId },
    });

    return res.json({ success: true, unreadCount });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load notification count.",
    });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const notificationId = String(req.params.id || "");

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        isActive: true,
        deletedBy: { $ne: userObjectId },
        $and: [await promotionVisibilityFilter(userObjectId)],
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
      },
      { $addToSet: { readBy: userObjectId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update notification.",
    });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Notification.updateMany(
      {
        isActive: true,
        deletedBy: { $ne: userObjectId },
        $and: [await promotionVisibilityFilter(userObjectId)],
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
        readBy: { $ne: userObjectId },
      },
      { $addToSet: { readBy: userObjectId } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update notifications.",
    });
  }
}


/* =========================================================
   USER - DELETE / HIDE ONE NOTIFICATION
   DELETE /api/notifications/:id
   Also reused by /api/user-settings/notifications/:id
========================================================= */

export async function deleteMyNotification(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const notificationId = String(req.params.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        isActive: true,
        deletedBy: { $ne: userObjectId },
        $and: [await promotionVisibilityFilter(userObjectId)],
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
      },
      { $addToSet: { deletedBy: userObjectId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
      id: notificationId,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete notification.",
    });
  }
}

/* =========================================================
   USER - DELETE / HIDE ALL NOTIFICATIONS
   DELETE /api/notifications
   Also reused by /api/user-settings/notifications
========================================================= */

export async function deleteAllMyNotifications(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Notification.updateMany(
      {
        isActive: true,
        deletedBy: { $ne: userObjectId },
        $and: [await promotionVisibilityFilter(userObjectId)],
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
      },
      { $addToSet: { deletedBy: userObjectId } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete notifications.",
    });
  }
}
