import { Types } from "mongoose";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import Product from "../models/Product.model";
import User from "../models/User.model";
import Order from "../models/Order.model";
import Notification from "../models/Notification.model";
import { sendCartReminderEmail, sendWishlistReminderEmail } from "./commerce-email.service";

const MINUTE_MS = 60_000;

const COMMERCE_REMINDER_STAGES = [1440, 2880] as const;

function configuredStages(value: string | undefined) {
  const configured = new Set(
    String(value || "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => COMMERCE_REMINDER_STAGES.includes(item as (typeof COMMERCE_REMINDER_STAGES)[number]))
  );

  // Cart and wishlist emails are intentionally limited to 24h and 48h / 2 day.
  COMMERCE_REMINDER_STAGES.forEach((stage) => configured.add(stage));
  return Array.from(configured).sort((a, b) => a - b);
}

function reminderStageText(stageMinutes: number) {
  if (stageMinutes === 1440) return "24 hours";
  if (stageMinutes === 2880) return "48 hours (2 days)";
  if (stageMinutes > 1440 && stageMinutes % 1440 === 0) {
    const days = stageMinutes / 1440;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (stageMinutes >= 60 && stageMinutes % 60 === 0) {
    const hours = stageMinutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${stageMinutes} minutes`;
}

function ageMinutes(date: unknown, now: number) {
  const timestamp = date ? new Date(date as any).getTime() : NaN;
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((now - timestamp) / MINUTE_MS));
}

function productName(product: any, colorId?: string) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const color = colors.find((item: any) => String(item?._id || "") === String(colorId || ""))
    || colors.find((item: any) => item?.isDefault === true)
    || colors[0];
  return String(color?.nameProduct || "Your product");
}

function productImage(product: any, colorId?: string) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const color = colors.find((item: any) => String(item?._id || "") === String(colorId || ""))
    || colors.find((item: any) => item?.isDefault === true)
    || colors[0];
  const images = Array.isArray(color?.images) ? color.images : [];
  const image = images.find((item: any) => item?.isDefault === true) || images[0];
  return String(image?.url || "");
}

async function activeCustomerIds(userIds: string[]) {
  if (!userIds.length) return new Set<string>();
  const users = await User.find({
    _id: { $in: userIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) },
    role: "customer",
    isActive: true,
  })
    .select("_id")
    .lean();
  return new Set(users.map((user: any) => String(user._id)));
}

async function wasPurchasedAfter(userId: string, productId: string, addedAt: Date) {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) return false;
  return Boolean(await Order.exists({
    user: new Types.ObjectId(userId),
    "items.product": new Types.ObjectId(productId),
    createdAt: { $gte: addedAt },
    inventoryCommitted: true,
    status: { $nin: ["cancelled", "canceled"] },
  }));
}

async function ensureReminderNotification(input: {
  dedupeKey: string;
  userId: string;
  productId: string;
  type: "cart_reminder" | "wishlist_reminder";
  title: string;
  message: string;
  link: string;
  imageUrl: string;
  stageMinutes: number;
  metadata: Record<string, unknown>;
}) {
  const userObjectId = new Types.ObjectId(input.userId);
  const productObjectId = new Types.ObjectId(input.productId);
  try {
    await Notification.updateOne(
      { dedupeKey: input.dedupeKey },
      {
        $setOnInsert: {
          title: input.title,
          message: input.message,
          type: input.type,
          audience: "selected",
          userIds: [userObjectId],
          filters: {},
          recipientCount: 1,
          link: input.link,
          imageUrl: input.imageUrl,
          isActive: true,
          readBy: [],
          deletedBy: [],
          createdBy: null,
          source: "system",
          dedupeKey: input.dedupeKey,
          product: productObjectId,
          reminderStageDays: input.stageMinutes / 1440,
          metadata: {
            ...input.metadata,
            stageMinutes: input.stageMinutes,
          },
        },
      },
      { upsert: true }
    );
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }
  return Notification.findOne({ dedupeKey: input.dedupeKey });
}

async function sendReminderOnce(input: {
  kind: "cart" | "wishlist";
  userId: string;
  productId: string;
  colorId?: string;
  sizeId?: string;
  quantity?: number;
  addedAt: Date;
  stageMinutes: number;
  product: any;
}) {
  const addedAtIso = input.addedAt.toISOString();
  const dedupeKey = [
    input.kind,
    input.userId,
    input.productId,
    input.colorId || "",
    input.sizeId || "",
    addedAtIso,
    `${input.stageMinutes}m`,
  ].join(":");
  const name = productName(input.product, input.colorId);
  const stageText = reminderStageText(input.stageMinutes);
  const notification = await ensureReminderNotification({
    dedupeKey,
    userId: input.userId,
    productId: input.productId,
    type: input.kind === "cart" ? "cart_reminder" : "wishlist_reminder",
    title: input.kind === "cart" ? "Your cart is waiting for you" : "A wishlist item is still waiting",
    message: input.kind === "cart"
      ? `${name} has been in your cart for ${stageText}. Complete your order while it is still available.`
      : `${name} has been in your wishlist for ${stageText}. Take another look before availability changes.`,
    link: input.kind === "cart" ? "/account/card" : "/account/wishlist",
    imageUrl: productImage(input.product, input.colorId),
    stageMinutes: input.stageMinutes,
    metadata: {
      colorId: input.colorId || "",
      sizeId: input.sizeId || "",
      addedAt: addedAtIso,
      quantity: Number(input.quantity || 1),
    },
  });

  if (!notification) return false;
  const meta = (notification.metadata || {}) as Record<string, any>;
  if (meta.emailSentAt) return false;

  try {
    const sent = input.kind === "cart"
      ? await sendCartReminderEmail({
          userId: input.userId,
          productId: input.productId,
          colorId: input.colorId,
          sizeId: input.sizeId,
          quantity: Number(input.quantity || 1),
          stageMinutes: input.stageMinutes,
        })
      : await sendWishlistReminderEmail({
          userId: input.userId,
          productId: input.productId,
          colorId: input.colorId,
          sizeId: input.sizeId,
          stageMinutes: input.stageMinutes,
        });

    if (sent) {
      await Notification.updateOne(
        { _id: notification._id },
        { $set: { "metadata.emailSentAt": new Date(), "metadata.emailAttemptedAt": new Date() } }
      );
      return true;
    }
    return false;
  } catch (error) {
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { "metadata.emailAttemptedAt": new Date(), "metadata.emailLastError": error instanceof Error ? error.message : "Email failed" } }
    ).catch(() => undefined);
    console.error(`${input.kind.toUpperCase()} REMINDER EMAIL ERROR:`, error);
    return false;
  }
}

export async function runAbandonedCartWishlistReminders() {
  const now = Date.now();
  const cartStages = configuredStages(process.env.CART_REMINDER_MINUTES);
  const wishlistStages = configuredStages(process.env.WISHLIST_REMINDER_MINUTES);
  const oldestNeededMinutes = Math.min(...cartStages, ...wishlistStages);
  const cutoff = new Date(now - oldestNeededMinutes * MINUTE_MS);

  const [carts, wishlists] = await Promise.all([
    Cart.find({ "items.addedAt": { $lte: cutoff } }).lean(),
    Wishlist.find({ "items.addedAt": { $lte: cutoff } }).lean(),
  ]);

  const userIds = Array.from(new Set([
    ...carts.map((cart: any) => String(cart.user || "")),
    ...wishlists.map((wishlist: any) => String(wishlist.user || "")),
  ])).filter((id) => Types.ObjectId.isValid(id));
  const activeUsers = await activeCustomerIds(userIds);

  const productIds = Array.from(new Set([
    ...carts.flatMap((cart: any) => (cart.items || []).map((item: any) => String(item.product || ""))),
    ...wishlists.flatMap((wishlist: any) => (wishlist.items || []).map((item: any) => String(item.product || ""))),
  ])).filter((id) => Types.ObjectId.isValid(id));
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select("colors isActive").lean()
    : [];
  const productMap = new Map(products.map((product: any) => [String(product._id), product]));

  let emailsSent = 0;

  for (const cart of carts as any[]) {
    const userId = String(cart.user || "");
    if (!activeUsers.has(userId)) continue;

    for (const item of cart.items || []) {
      const productId = String(item.product || "");
      const product = productMap.get(productId) as any;
      if (!product || product.isActive === false) continue;
      const addedAt = new Date(item.addedAt);
      if (Number.isNaN(addedAt.getTime())) continue;
      if (await wasPurchasedAfter(userId, productId, addedAt)) continue;
      const minutes = ageMinutes(addedAt, now);

      for (const stageMinutes of cartStages.filter((stage) => minutes >= stage)) {
        if (await sendReminderOnce({
          kind: "cart",
          userId,
          productId,
          colorId: String(item.colorId || ""),
          sizeId: String(item.sizeId || ""),
          quantity: Number(item.quantity || 1),
          addedAt,
          stageMinutes,
          product,
        })) emailsSent += 1;
      }
    }
  }

  for (const wishlist of wishlists as any[]) {
    const userId = String(wishlist.user || "");
    if (!activeUsers.has(userId)) continue;

    for (const item of wishlist.items || []) {
      const productId = String(item.product || "");
      const product = productMap.get(productId) as any;
      if (!product || product.isActive === false) continue;
      const addedAt = new Date(item.addedAt);
      if (Number.isNaN(addedAt.getTime())) continue;
      if (await wasPurchasedAfter(userId, productId, addedAt)) continue;
      const minutes = ageMinutes(addedAt, now);

      for (const stageMinutes of wishlistStages.filter((stage) => minutes >= stage)) {
        if (await sendReminderOnce({
          kind: "wishlist",
          userId,
          productId,
          colorId: String(item.colorId || ""),
          sizeId: String(item.sizeId || ""),
          addedAt,
          stageMinutes,
          product,
        })) emailsSent += 1;
      }
    }
  }

  return { emailsSent, cartCount: carts.length, wishlistCount: wishlists.length };
}

let reminderTimer: NodeJS.Timeout | null = null;

export function startReminderScheduler() {
  if (process.env.REMINDER_SCHEDULER_ENABLED === "false" || reminderTimer) return;

  const intervalMinutes = Math.max(1, Number(process.env.REMINDER_INTERVAL_MINUTES || 5));
  const intervalMs = intervalMinutes * MINUTE_MS;

  const run = async () => {
    try {
      const result = await runAbandonedCartWishlistReminders();
      if (result.emailsSent > 0) {
        console.log(`📧 Reminder scheduler sent ${result.emailsSent} email(s).`);
      }
    } catch (error) {
      console.error("REMINDER SCHEDULER ERROR:", error);
    }
  };

  void run();
  reminderTimer = setInterval(() => void run(), intervalMs);
  reminderTimer.unref?.();
}
