import mongoose, { Types } from "mongoose";
import Order, { type OrderStatus } from "../models/Order.model";
import Product from "../models/Product.model";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import User from "../models/User.model";
import Address from "../models/user/address.model";
import Notification from "../models/Notification.model";
import { getUserCart } from "./cart.service";
import { trackUserActivity } from "./activity.service";
import {
  createRazorpayGatewayOrder,
  verifyRazorpayPaymentSignature,
} from "./razorpay.service";
import { calculateDeliveryCharge, normalizeDeliveryPaymentMethod } from "./delivery-charge.service";
import { sendAdminOrderNotificationEmailOnce, sendOrderConfirmationEmailOnce } from "./commerce-email.service";

const roundMoney = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

function makeOrderNumber() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `HIVRA-${stamp}-${suffix}`;
}

function makeInvoiceNumber(orderNumber: string) {
  return `INV-${orderNumber.replace(/^HIVRA-/, "")}`;
}

function assertObjectId(value: unknown, field: string) {
  const id = String(value || "");
  if (!Types.ObjectId.isValid(id)) throw new Error(`Invalid ${field}.`);
  return id;
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAddress(value: any) {
  if (!value || typeof value !== "object") throw new Error("Shipping address is required.");
  const snapshot = {
    fullName: clean(value.fullName || value.name),
    phone: clean(value.phone),
    alternatePhone: clean(value.alternatePhone),
    homeNumber: clean(value.homeNumber),
    officeNumber: clean(value.officeNumber),
    addressLine1: clean(value.addressLine1),
    addressLine2: clean(value.addressLine2),
    landmark: clean(value.landmark),
    city: clean(value.city),
    district: clean(value.district),
    state: clean(value.state),
    postalCode: clean(value.postalCode || value.pincode),
    country: clean(value.country) || "India",
    countryCode: clean(value.countryCode) || "IN",
  };

  const missing = ["fullName", "phone", "addressLine1", "city", "state", "postalCode"].filter(
    (field) => !snapshot[field as keyof typeof snapshot]
  );
  if (missing.length) throw new Error(`Shipping address is missing: ${missing.join(", ")}.`);
  return snapshot;
}

async function resolveShippingAddress(userId: string, payload: any) {
  const addressId = clean(payload?.addressId || payload?.shippingAddressId);
  if (addressId) {
    assertObjectId(addressId, "address ID");
    const address = await Address.findOne({ _id: addressId, user: userId }).lean();
    if (!address) throw new Error("Shipping address was not found for this account.");
    return normalizeAddress(address);
  }
  return normalizeAddress(payload?.shippingAddress);
}

function imageUrl(item: any) {
  const images = Array.isArray(item?.selectedColor?.images)
    ? item.selectedColor.images
    : Array.isArray(item?.product?.mainImages)
      ? item.product.mainImages
      : [];
  const preferred = images.find((entry: any) => entry?.isDefault) || images[0];
  return clean(preferred?.url || item?.image || item?.imageUrl);
}

async function buildOrderSnapshot(userId: string, payload: any, paymentMethod: "cod" | "online") {
  assertObjectId(userId, "user ID");
  const [cart, shippingAddress, user] = await Promise.all([
    getUserCart(userId),
    resolveShippingAddress(userId, payload),
    User.findById(userId).select("name email phone").lean(),
  ]);

  if (!user) throw new Error("Customer account was not found.");
  const rawItems = Array.isArray((cart as any)?.items) ? (cart as any).items : [];
  if (!rawItems.length) throw new Error("Your cart is empty.");
  const unavailable = rawItems.filter((item: any) => !item?.available || !item?.product?._id);
  if (unavailable.length) throw new Error("One or more cart items are unavailable or out of stock. Refresh your cart and try again.");

  const items = rawItems.map((item: any) => {
    const quantity = Number(item.quantity || 0);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Invalid cart quantity.");
    const productId = assertObjectId(item.product?._id, "product ID");
    const colorId = assertObjectId(item.colorId, "color ID");
    const sizeId = assertObjectId(item.sizeId, "size ID");
    const originalUnitPrice = roundMoney(Number(item.product?.compareAtPrice ?? item.unitPrice ?? 0));
    const unitPrice = roundMoney(Number(item.unitPrice || 0));
    const lineSubtotal = roundMoney(unitPrice * quantity);
    const lineDiscount = roundMoney(Number(item.discount?.totalDiscount || 0));
    const finalTotal = roundMoney(Number(item.discount?.finalLineTotal ?? lineSubtotal));
    const finalUnitPrice = quantity ? roundMoney(finalTotal / quantity) : 0;

    return {
      cartItemId: String(item._id || ""),
      product: new Types.ObjectId(productId),
      productId,
      name: clean(item.product?.name) || "Product",
      slug: clean(item.product?.slug),
      image: imageUrl(item),
      colorId: new Types.ObjectId(colorId),
      colorName: clean(item.selectedColor?.name),
      colorHex: clean(item.selectedColor?.hex),
      sizeId: new Types.ObjectId(sizeId),
      sizeName: clean(item.selectedSize?.size),
      sku: clean(item.selectedSize?.sku),
      quantity,
      originalUnitPrice,
      unitPrice,
      discount: lineDiscount,
      finalUnitPrice,
      subtotal: lineSubtotal,
      finalTotal,
    };
  });

  const subtotal = roundMoney(Number((cart as any).subtotal || 0));
  const automaticDiscount = roundMoney(Number((cart as any).automaticDiscount || 0));
  const codeDiscount = roundMoney(Number((cart as any).codeDiscount || 0));
  const discount = roundMoney(Number((cart as any).discount || automaticDiscount + codeDiscount));
  const tax = roundMoney(Number((cart as any).tax || 0));
  const deliveryCharge = await calculateDeliveryCharge(subtotal, paymentMethod);
  const shipping = roundMoney(deliveryCharge.charge);
  const total = roundMoney(Math.max(0, subtotal - discount + tax + shipping));
  if (total < 0) throw new Error("Calculated order total is invalid.");

  return {
    user: new Types.ObjectId(userId),
    customer: {
      name: clean((user as any).name),
      email: clean((user as any).email),
      phone: clean((user as any).phone),
    },
    items,
    shippingAddress,
    subtotal,
    automaticDiscount,
    automaticDiscountDetails: (cart as any).discountSummary?.automatic || {},
    codeDiscount,
    codeDiscountDetails: (cart as any).discountSummary?.code || {},
    discount,
    discountCode: clean((cart as any).appliedDiscountCode).toUpperCase(),
    tax,
    taxName: clean((cart as any).taxSummary?.name) || "GST",
    taxPercentage: Number((cart as any).taxSummary?.percentage || 0),
    taxDetails: (cart as any).taxSummary || {},
    shipping,
    deliveryCharge: {
      paymentMethod: deliveryCharge.paymentMethod,
      baseAmount: deliveryCharge.baseAmount,
      charge: deliveryCharge.charge,
      ruleId: deliveryCharge.rule?.id || null,
      minAmount: deliveryCharge.rule?.minAmount ?? null,
      maxAmount: deliveryCharge.rule?.maxAmount ?? null,
    },
    total,
  };
}

async function decrementInventory(items: any[]) {
  const changed: Array<{ productId: string; colorId: string; sizeId: string; quantity: number }> = [];
  try {
    for (const item of items) {
      const productId = String(item.productId || item.product || "");
      const colorId = String(item.colorId || "");
      const sizeId = String(item.sizeId || "");
      const quantity = Number(item.quantity || 0);
      if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(colorId) || !Types.ObjectId.isValid(sizeId) || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Order contains an invalid product variant.");
      }

      const result = await Product.updateOne(
        { _id: productId, isActive: { $ne: false } },
        { $inc: { "colors.$[color].sizes.$[size].stock": -quantity } },
        {
          arrayFilters: [
            { "color._id": new Types.ObjectId(colorId) },
            { "size._id": new Types.ObjectId(sizeId), "size.isActive": true, "size.stock": { $gte: quantity } },
          ],
        }
      );
      if (!result.modifiedCount) throw new Error(`${item.name || "A product"} no longer has enough stock.`);
      changed.push({ productId, colorId, sizeId, quantity });
    }
    return changed;
  } catch (error) {
    for (const item of changed.reverse()) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { "colors.$[color].sizes.$[size].stock": item.quantity } },
        { arrayFilters: [{ "color._id": new Types.ObjectId(item.colorId) }, { "size._id": new Types.ObjectId(item.sizeId) }] }
      ).catch(() => undefined);
    }
    throw error;
  }
}

async function restoreInventory(items: any[]) {
  for (const item of items) {
    const productId = String(item.productId || item.product || "");
    const colorId = String(item.colorId || "");
    const sizeId = String(item.sizeId || "");
    const quantity = Number(item.quantity || 0);
    if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(colorId) || !Types.ObjectId.isValid(sizeId) || !Number.isInteger(quantity) || quantity < 1) continue;
    await Product.updateOne(
      { _id: productId },
      { $inc: { "colors.$[color].sizes.$[size].stock": quantity } },
      { arrayFilters: [{ "color._id": new Types.ObjectId(colorId) }, { "size._id": new Types.ObjectId(sizeId) }] }
    );
  }
}

async function removePurchasedCartItems(userId: string, items: any[]) {
  const ids = items.map((item) => String(item.cartItemId || "")).filter((id) => Types.ObjectId.isValid(id));
  if (!ids.length) return;
  await Cart.updateOne(
    { user: userId },
    {
      $pull: { items: { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } } },
      $set: { discountCode: "" },
    }
  );
}

async function trackPurchasedCommerce(order: any) {
  const userId = String(order?.user || "");
  if (!Types.ObjectId.isValid(userId)) return;

  const wishlist = await Wishlist.findOne({ user: userId }).select("items.product items.colorId items.sizeId").lean();
  const wishlistItems = Array.isArray((wishlist as any)?.items) ? (wishlist as any).items : [];

  for (const item of Array.isArray(order?.items) ? order.items : []) {
    const productId = String(item?.productId || item?.product || "");
    if (!Types.ObjectId.isValid(productId)) continue;

    await trackUserActivity({
      userId,
      type: "cart_purchase",
      productId,
      orderId: String(order._id),
      metadata: {
        orderNumber: order.orderNumber,
        quantity: Number(item?.quantity || 0),
        colorId: String(item?.colorId || ""),
        sizeId: String(item?.sizeId || ""),
        purchasedAt: new Date(),
      },
    }).catch(() => undefined);

    const wasWishlisted = wishlistItems.some((saved: any) => String(saved?.product || "") === productId);
    if (wasWishlisted) {
      await trackUserActivity({
        userId,
        type: "wishlist_purchase",
        productId,
        orderId: String(order._id),
        metadata: {
          orderNumber: order.orderNumber,
          colorId: String(item?.colorId || ""),
          sizeId: String(item?.sizeId || ""),
          purchasedAt: new Date(),
        },
      }).catch(() => undefined);
    }
  }
}

export async function createOrderStatusNotification(order: any, status: string, createdBy?: string | Types.ObjectId | null) {
  const normalized = String(status || "").toLowerCase();
  const titles: Record<string, string> = {
    confirmed: "Order Confirmed 🎉",
    processing: "Order Processing",
    shipped: "Order Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Order Delivered",
    cancelled: "Order Cancelled",
    returned: "Order Returned",
    refunded: "Order Refunded",
  };
  if (!titles[normalized] || !order?.user) return;
  const orderNumber = String(order.orderNumber || order._id);
  const message = normalized === "confirmed"
    ? `Your order ${orderNumber} has been confirmed.`
    : `Your order ${orderNumber} is now ${normalized.replaceAll("_", " ")}.`;
  const first = Array.isArray(order.items) ? order.items[0] : null;
  const image = clean(first?.image || first?.imageUrl);
  const dedupeKey = `order:${String(order._id)}:status:${normalized}`;

  await Notification.updateOne(
    { dedupeKey },
    {
      $setOnInsert: {
        title: titles[normalized],
        message,
        type: "order",
        audience: "selected",
        userIds: [order.user],
        filters: {},
        recipientCount: 1,
        link: `/account/orders?order=${encodeURIComponent(String(order._id))}`,
        imageUrl: image,
        isActive: true,
        readBy: [],
        createdBy: createdBy && Types.ObjectId.isValid(String(createdBy)) ? new Types.ObjectId(String(createdBy)) : null,
        source: "system",
        dedupeKey,
        metadata: {
          orderId: String(order._id),
          orderNumber,
          status: normalized,
          imageUrl: image,
        },
      },
    },
    { upsert: true }
  );
}

async function trackCreated(order: any) {
  await trackUserActivity({
    userId: String(order.user),
    type: "order_created",
    orderId: String(order._id),
    metadata: {
      orderNumber: order.orderNumber,
      total: Number(order.total || 0),
      itemCount: (order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0),
      paymentMethod: order.paymentMethod,
    },
  });
}

export async function createOrderFromCart(userId: string, payload: any) {
  const paymentMethod = clean(payload?.paymentMethod || "cod").toLowerCase();
  if (paymentMethod !== "cod") {
    throw new Error("Use /api/orders/razorpay/create for Razorpay payments.");
  }

  const snapshot = await buildOrderSnapshot(userId, payload, "cod");
  const orderNumber = makeOrderNumber();
  const order = await Order.create({
    ...snapshot,
    orderNumber,
    invoiceNumber: makeInvoiceNumber(orderNumber),
    paymentMethod: "cod",
    paymentStatus: "pending",
    payment: { gateway: "cod", amount: snapshot.total, currency: "INR", paidAt: null },
    status: "confirmed",
    statusHistory: [{ status: "confirmed", message: "Cash on delivery order placed.", at: new Date() }],
    inventoryCommitted: false,
    fulfillmentState: "processing",
  });

  try {
    await decrementInventory(order.items);
    order.inventoryCommitted = true;
    order.fulfillmentState = "done";
    await order.save();
  } catch (error) {
    await Order.findByIdAndDelete(order._id).catch(() => undefined);
    throw error;
  }

  await removePurchasedCartItems(userId, order.items);
  await trackPurchasedCommerce(order).catch(() => undefined);
  await trackCreated(order);
  await createOrderStatusNotification(order.toObject(), "confirmed");
  void sendOrderConfirmationEmailOnce(order.toObject()).catch((error) =>
    console.error("ORDER CONFIRMATION EMAIL ERROR:", error)
  );
  void sendAdminOrderNotificationEmailOnce(order.toObject()).catch((error) =>
    console.error("ADMIN ORDER EMAIL ERROR:", error)
  );
  return order;
}

export async function createRazorpayOrderFromCart(userId: string, payload: any) {
  const snapshot = await buildOrderSnapshot(userId, payload, "online");
  const orderNumber = makeOrderNumber();
  const order = await Order.create({
    ...snapshot,
    orderNumber,
    invoiceNumber: makeInvoiceNumber(orderNumber),
    paymentMethod: "razorpay",
    paymentStatus: "pending",
    payment: { gateway: "razorpay", amount: snapshot.total, currency: "INR", paidAt: null },
    status: "confirmed",
    statusHistory: [{ status: "confirmed", message: "Order placed. Razorpay payment is pending.", at: new Date() }],
    inventoryCommitted: false,
    fulfillmentState: "pending",
  });

  try {
    const { gatewayOrder, keyId } = await createRazorpayGatewayOrder({
      amountInRupees: snapshot.total,
      receipt: orderNumber,
      notes: { internalOrderId: String(order._id), orderNumber },
    });
    order.payment = {
      gateway: "razorpay",
      razorpayOrderId: gatewayOrder.id,
      razorpayPaymentId: "",
      transactionId: "",
      amount: snapshot.total,
      currency: gatewayOrder.currency || "INR",
      paidAt: null,
    };
    await order.save();
    await trackCreated(order);
    return {
      internalOrderId: String(order._id),
      orderNumber: order.orderNumber,
      razorpayOrderId: gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency || "INR",
      keyId,
      order,
    };
  } catch (error) {
    order.paymentStatus = "failed";
    order.statusHistory.push({ status: "pending_payment", message: "Unable to initialize Razorpay payment.", at: new Date() } as any);
    await order.save().catch(() => undefined);
    throw error;
  }
}

async function finalizePaidOrder(orderId: string, paymentId: string, source: "verify" | "webhook") {
  assertObjectId(orderId, "order ID");
  const current = await Order.findById(orderId);
  if (!current) throw new Error("Order not found.");
  if (current.status === "cancelled") throw new Error("Cancelled order cannot be confirmed.");
  if (current.inventoryCommitted && current.paymentStatus === "paid") return current;

  const claimed = await Order.findOneAndUpdate(
    {
      _id: current._id,
      inventoryCommitted: { $ne: true },
      fulfillmentState: { $in: ["pending", "failed"] },
      status: { $ne: "cancelled" },
    },
    { $set: { fulfillmentState: "processing" } },
    { new: true }
  );

  if (!claimed) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const latest = await Order.findById(current._id);
      if (!latest) throw new Error("Order not found.");
      if (latest.inventoryCommitted && latest.paymentStatus === "paid") return latest;
      if (latest.status === "cancelled") throw new Error("Cancelled order cannot be confirmed.");
      if (latest.fulfillmentState === "failed") {
        return finalizePaidOrder(String(latest._id), paymentId, source);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Payment confirmation is already being processed. Please check the order again shortly.");
  }

  let inventoryChanged = false;
  try {
    await decrementInventory(claimed.items);
    inventoryChanged = true;
    const now = new Date();
    const savedPayment = claimed.payment && typeof claimed.payment === "object" ? claimed.payment : {};
    const updated = await Order.findByIdAndUpdate(
      claimed._id,
      {
        $set: {
          inventoryCommitted: true,
          fulfillmentState: "done",
          paymentStatus: "paid",
          status: "confirmed",
          payment: {
            ...savedPayment,
            gateway: "razorpay",
            razorpayPaymentId: paymentId || savedPayment.razorpayPaymentId || "",
            transactionId: paymentId || savedPayment.transactionId || "",
            amount: Number(claimed.total || 0),
            currency: savedPayment.currency || "INR",
            paidAt: now,
          },
        },
        $push: {
          statusHistory: {
            status: "confirmed",
            message: source === "webhook" ? "Payment confirmed by Razorpay webhook." : "Razorpay payment verified successfully.",
            at: now,
          },
        },
      },
      { new: true }
    );
    if (!updated) throw new Error("Unable to finalize paid order.");

    await removePurchasedCartItems(String(updated.user), updated.items).catch(() => undefined);
    await trackPurchasedCommerce(updated).catch(() => undefined);
    await createOrderStatusNotification(updated.toObject(), "confirmed").catch(() => undefined);
    void sendOrderConfirmationEmailOnce(updated.toObject()).catch((error) =>
      console.error("ORDER CONFIRMATION EMAIL ERROR:", error)
    );
    void sendAdminOrderNotificationEmailOnce(updated.toObject()).catch((error) =>
      console.error("ADMIN ORDER EMAIL ERROR:", error)
    );
    await trackUserActivity({
      userId: String(updated.user),
      type: "order_paid",
      orderId: String(updated._id),
      metadata: { orderNumber: updated.orderNumber, total: Number(updated.total || 0), paymentMethod: "razorpay" },
    }).catch(() => undefined);
    return updated;
  } catch (error) {
    if (inventoryChanged) {
      await restoreInventory(claimed.items).catch(() => undefined);
    }
    await Order.updateOne({ _id: claimed._id }, { $set: { fulfillmentState: "failed", inventoryCommitted: false } }).catch(() => undefined);
    throw error;
  }
}

export async function verifyRazorpayPaymentForUser(userId: string, payload: any) {
  const internalOrderId = assertObjectId(payload?.internalOrderId, "internal order ID");
  const razorpayOrderId = clean(payload?.razorpay_order_id);
  const razorpayPaymentId = clean(payload?.razorpay_payment_id);
  const razorpaySignature = clean(payload?.razorpay_signature);
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) throw new Error("Razorpay payment details are incomplete.");

  const order = await Order.findOne({ _id: internalOrderId, user: userId });
  if (!order) throw new Error("Order not found.");
  const savedOrderId = clean((order.payment as any)?.razorpayOrderId);
  if (!savedOrderId || savedOrderId !== razorpayOrderId) throw new Error("Razorpay order ID does not match this order.");

  const valid = verifyRazorpayPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!valid) {
    await Order.updateOne(
      { _id: order._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "failed" }, $push: { statusHistory: { status: "pending_payment", message: "Razorpay signature verification failed.", at: new Date() } } }
    );
    throw new Error("Invalid Razorpay payment signature.");
  }
  return finalizePaidOrder(String(order._id), razorpayPaymentId, "verify");
}

export async function finalizeRazorpayWebhookPayment(razorpayOrderId: string, razorpayPaymentId = "") {
  const order = await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId });
  if (!order) return null;
  return finalizePaidOrder(String(order._id), razorpayPaymentId, "webhook");
}

export async function markRazorpayPaymentFailed(razorpayOrderId: string, paymentId = "") {
  const order = await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId });
  if (!order || order.paymentStatus === "paid") return order;
  const payment = order.payment && typeof order.payment === "object" ? order.payment : {};
  order.paymentStatus = "failed";
  order.payment = { ...payment, razorpayPaymentId: paymentId || (payment as any).razorpayPaymentId || "", transactionId: paymentId || (payment as any).transactionId || "" };
  order.statusHistory.push({ status: "pending_payment", message: "Razorpay reported a failed payment.", at: new Date() } as any);
  await order.save();
  return order;
}

export async function getDeliveryChargePreview(userId: string, paymentMethod: unknown) {
  assertObjectId(userId, "user ID");
  const cart = await getUserCart(userId);
  const subtotal = roundMoney(Number((cart as any)?.subtotal || 0));
  const normalizedMethod = normalizeDeliveryPaymentMethod(paymentMethod);
  const delivery = await calculateDeliveryCharge(subtotal, normalizedMethod);
  const cartTotalBeforeDelivery = roundMoney(Number((cart as any)?.total || 0));

  return {
    paymentMethod: normalizedMethod,
    baseAmount: subtotal,
    cartTotalBeforeDelivery,
    deliveryCharge: delivery.charge,
    payableTotal: roundMoney(cartTotalBeforeDelivery + delivery.charge),
    matchedRule: delivery.rule,
  };
}

export async function getUserOrders(userId: string) {
  return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function getUserOrderById(userId: string, orderId: string) {
  assertObjectId(orderId, "order ID");
  return Order.findOne({ _id: orderId, user: userId }).lean();
}

export async function cancelUserOrder(userId: string, orderId: string, reason = "") {
  assertObjectId(orderId, "order ID");
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error("Order not found.");
  if (!["pending_payment", "confirmed"].includes(order.status)) throw new Error("This order can no longer be cancelled online.");
  if (order.paymentStatus === "paid") throw new Error("Paid orders require a refund workflow. Please contact support.");

  if (order.inventoryCommitted) await restoreInventory(order.items);
  order.status = "cancelled";
  order.inventoryCommitted = false;
  order.fulfillmentState = "cancelled";
  order.cancelledAt = new Date();
  order.cancellationReason = clean(reason) || "Cancelled by customer";
  order.statusHistory.push({ status: "cancelled", message: order.cancellationReason, at: new Date(), by: new Types.ObjectId(userId) } as any);
  await order.save();
  await createOrderStatusNotification(order.toObject(), "cancelled", userId).catch(() => undefined);
  await trackUserActivity({
    userId,
    type: "order_cancelled",
    orderId: String(order._id),
    metadata: { orderNumber: order.orderNumber, status: "cancelled", total: Number(order.total || 0) },
  }).catch(() => undefined);
  return order;
}

export async function restoreOrderInventoryIfNeeded(order: any) {
  if (!order?.inventoryCommitted) return;
  await restoreInventory(Array.isArray(order.items) ? order.items : []);
}

export const allowedAdminTransitions: Record<string, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned"],
  returned: ["refunded"],
  cancelled: [],
  canceled: [],
  refunded: [],
};

export function isAdminTransitionAllowed(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return true;
  return (allowedAdminTransitions[currentStatus] || []).includes(nextStatus as OrderStatus);
}
