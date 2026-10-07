"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedAdminTransitions = void 0;
exports.createOrderStatusNotification = createOrderStatusNotification;
exports.createOrderFromCart = createOrderFromCart;
exports.createRazorpayOrderFromCart = createRazorpayOrderFromCart;
exports.verifyRazorpayPaymentForUser = verifyRazorpayPaymentForUser;
exports.finalizeRazorpayWebhookPayment = finalizeRazorpayWebhookPayment;
exports.markRazorpayPaymentFailed = markRazorpayPaymentFailed;
exports.getDeliveryChargePreview = getDeliveryChargePreview;
exports.getUserOrders = getUserOrders;
exports.getUserOrderById = getUserOrderById;
exports.cancelUserOrder = cancelUserOrder;
exports.restoreOrderInventoryIfNeeded = restoreOrderInventoryIfNeeded;
exports.isAdminTransitionAllowed = isAdminTransitionAllowed;
const mongoose_1 = require("mongoose");
const Order_model_1 = __importDefault(require("../models/Order.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Cart_model_1 = __importDefault(require("../models/Cart.model"));
const Wishlist_model_1 = __importDefault(require("../models/Wishlist.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const address_model_1 = __importDefault(require("../models/user/address.model"));
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const cart_service_1 = require("./cart.service");
const activity_service_1 = require("./activity.service");
const razorpay_service_1 = require("./razorpay.service");
const delivery_charge_service_1 = require("./delivery-charge.service");
const commerce_email_service_1 = require("./commerce-email.service");
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
function makeOrderNumber() {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `HIVRA-${stamp}-${suffix}`;
}
function makeInvoiceNumber(orderNumber) {
    return `INV-${orderNumber.replace(/^HIVRA-/, "")}`;
}
function assertObjectId(value, field) {
    const id = String(value || "");
    if (!mongoose_1.Types.ObjectId.isValid(id))
        throw new Error(`Invalid ${field}.`);
    return id;
}
function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}
function normalizeAddress(value) {
    if (!value || typeof value !== "object")
        throw new Error("Shipping address is required.");
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
    const missing = ["fullName", "phone", "addressLine1", "city", "state", "postalCode"].filter((field) => !snapshot[field]);
    if (missing.length)
        throw new Error(`Shipping address is missing: ${missing.join(", ")}.`);
    return snapshot;
}
async function resolveShippingAddress(userId, payload) {
    const addressId = clean(payload?.addressId || payload?.shippingAddressId);
    if (addressId) {
        assertObjectId(addressId, "address ID");
        const address = await address_model_1.default.findOne({ _id: addressId, user: userId }).lean();
        if (!address)
            throw new Error("Shipping address was not found for this account.");
        return normalizeAddress(address);
    }
    return normalizeAddress(payload?.shippingAddress);
}
function imageUrl(item) {
    const images = Array.isArray(item?.selectedColor?.images)
        ? item.selectedColor.images
        : Array.isArray(item?.product?.mainImages)
            ? item.product.mainImages
            : [];
    const preferred = images.find((entry) => entry?.isDefault) || images[0];
    return clean(preferred?.url || item?.image || item?.imageUrl);
}
async function buildOrderSnapshot(userId, payload, paymentMethod) {
    assertObjectId(userId, "user ID");
    const [cart, shippingAddress, user] = await Promise.all([
        (0, cart_service_1.getUserCart)(userId),
        resolveShippingAddress(userId, payload),
        User_model_1.default.findById(userId).select("name email phone").lean(),
    ]);
    if (!user)
        throw new Error("Customer account was not found.");
    const rawItems = Array.isArray(cart?.items) ? cart.items : [];
    if (!rawItems.length)
        throw new Error("Your cart is empty.");
    const unavailable = rawItems.filter((item) => !item?.available || !item?.product?._id);
    if (unavailable.length)
        throw new Error("One or more cart items are unavailable or out of stock. Refresh your cart and try again.");
    const items = rawItems.map((item) => {
        const quantity = Number(item.quantity || 0);
        if (!Number.isInteger(quantity) || quantity < 1)
            throw new Error("Invalid cart quantity.");
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
            product: new mongoose_1.Types.ObjectId(productId),
            productId,
            name: clean(item.product?.name) || "Product",
            slug: clean(item.product?.slug),
            image: imageUrl(item),
            colorId: new mongoose_1.Types.ObjectId(colorId),
            colorName: clean(item.selectedColor?.name),
            colorHex: clean(item.selectedColor?.hex),
            sizeId: new mongoose_1.Types.ObjectId(sizeId),
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
    const subtotal = roundMoney(Number(cart.subtotal || 0));
    const offerDiscount = roundMoney(Number(cart.offerDiscount || 0));
    const automaticDiscount = roundMoney(Number(cart.automaticDiscount || 0));
    const codeDiscount = roundMoney(Number(cart.codeDiscount || 0));
    const discount = roundMoney(Number(cart.discount || offerDiscount + automaticDiscount + codeDiscount));
    const tax = roundMoney(Number(cart.tax || 0));
    const deliveryCharge = await (0, delivery_charge_service_1.calculateDeliveryCharge)(subtotal, paymentMethod);
    const shipping = roundMoney(deliveryCharge.charge);
    const total = roundMoney(Math.max(0, subtotal - discount + tax + shipping));
    if (total < 0)
        throw new Error("Calculated order total is invalid.");
    return {
        user: new mongoose_1.Types.ObjectId(userId),
        customer: {
            name: clean(user.name),
            email: clean(user.email),
            phone: clean(user.phone),
        },
        items,
        shippingAddress,
        subtotal,
        offerDiscount,
        offerDiscountDetails: cart.discountSummary?.offers || {},
        automaticDiscount,
        automaticDiscountDetails: cart.discountSummary?.automatic || {},
        codeDiscount,
        codeDiscountDetails: cart.discountSummary?.code || {},
        discount,
        discountCode: clean(cart.appliedDiscountCode).toUpperCase(),
        tax,
        taxName: clean(cart.taxSummary?.name) || "GST",
        taxPercentage: Number(cart.taxSummary?.percentage || 0),
        taxDetails: cart.taxSummary || {},
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
async function decrementInventory(items) {
    const changed = [];
    try {
        for (const item of items) {
            const productId = String(item.productId || item.product || "");
            const colorId = String(item.colorId || "");
            const sizeId = String(item.sizeId || "");
            const quantity = Number(item.quantity || 0);
            if (!mongoose_1.Types.ObjectId.isValid(productId) || !mongoose_1.Types.ObjectId.isValid(colorId) || !mongoose_1.Types.ObjectId.isValid(sizeId) || !Number.isInteger(quantity) || quantity < 1) {
                throw new Error("Order contains an invalid product variant.");
            }
            const result = await Product_model_1.default.updateOne({ _id: productId, isActive: { $ne: false } }, { $inc: { "colors.$[color].sizes.$[size].stock": -quantity } }, {
                arrayFilters: [
                    { "color._id": new mongoose_1.Types.ObjectId(colorId) },
                    { "size._id": new mongoose_1.Types.ObjectId(sizeId), "size.isActive": true, "size.stock": { $gte: quantity } },
                ],
            });
            if (!result.modifiedCount)
                throw new Error(`${item.name || "A product"} no longer has enough stock.`);
            changed.push({ productId, colorId, sizeId, quantity });
        }
        return changed;
    }
    catch (error) {
        for (const item of changed.reverse()) {
            await Product_model_1.default.updateOne({ _id: item.productId }, { $inc: { "colors.$[color].sizes.$[size].stock": item.quantity } }, { arrayFilters: [{ "color._id": new mongoose_1.Types.ObjectId(item.colorId) }, { "size._id": new mongoose_1.Types.ObjectId(item.sizeId) }] }).catch(() => undefined);
        }
        throw error;
    }
}
async function restoreInventory(items) {
    for (const item of items) {
        const productId = String(item.productId || item.product || "");
        const colorId = String(item.colorId || "");
        const sizeId = String(item.sizeId || "");
        const quantity = Number(item.quantity || 0);
        if (!mongoose_1.Types.ObjectId.isValid(productId) || !mongoose_1.Types.ObjectId.isValid(colorId) || !mongoose_1.Types.ObjectId.isValid(sizeId) || !Number.isInteger(quantity) || quantity < 1)
            continue;
        await Product_model_1.default.updateOne({ _id: productId }, { $inc: { "colors.$[color].sizes.$[size].stock": quantity } }, { arrayFilters: [{ "color._id": new mongoose_1.Types.ObjectId(colorId) }, { "size._id": new mongoose_1.Types.ObjectId(sizeId) }] });
    }
}
async function removePurchasedCartItems(userId, items) {
    const ids = items.map((item) => String(item.cartItemId || "")).filter((id) => mongoose_1.Types.ObjectId.isValid(id));
    if (!ids.length)
        return;
    await Cart_model_1.default.updateOne({ user: userId }, {
        $pull: { items: { _id: { $in: ids.map((id) => new mongoose_1.Types.ObjectId(id)) } } },
        $set: { discountCode: "" },
    });
}
async function trackPurchasedCommerce(order) {
    const userId = String(order?.user || "");
    if (!mongoose_1.Types.ObjectId.isValid(userId))
        return;
    const wishlist = await Wishlist_model_1.default.findOne({ user: userId }).select("items.product items.colorId items.sizeId").lean();
    const wishlistItems = Array.isArray(wishlist?.items) ? wishlist.items : [];
    for (const item of Array.isArray(order?.items) ? order.items : []) {
        const productId = String(item?.productId || item?.product || "");
        if (!mongoose_1.Types.ObjectId.isValid(productId))
            continue;
        await (0, activity_service_1.trackUserActivity)({
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
        const wasWishlisted = wishlistItems.some((saved) => String(saved?.product || "") === productId);
        if (wasWishlisted) {
            await (0, activity_service_1.trackUserActivity)({
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
async function createOrderStatusNotification(order, status, createdBy) {
    const normalized = String(status || "").toLowerCase();
    const titles = {
        confirmed: "Order Confirmed 🎉",
        processing: "Order Processing",
        shipped: "Order Shipped",
        out_for_delivery: "Out for Delivery",
        delivered: "Order Delivered",
        cancelled: "Order Cancelled",
        returned: "Order Returned",
        refunded: "Order Refunded",
    };
    if (!titles[normalized] || !order?.user)
        return;
    const orderNumber = String(order.orderNumber || order._id);
    const message = normalized === "confirmed"
        ? `Your order ${orderNumber} has been confirmed.`
        : `Your order ${orderNumber} is now ${normalized.replaceAll("_", " ")}.`;
    const first = Array.isArray(order.items) ? order.items[0] : null;
    const image = clean(first?.image || first?.imageUrl);
    const dedupeKey = `order:${String(order._id)}:status:${normalized}`;
    await Notification_model_1.default.updateOne({ dedupeKey }, {
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
            createdBy: createdBy && mongoose_1.Types.ObjectId.isValid(String(createdBy)) ? new mongoose_1.Types.ObjectId(String(createdBy)) : null,
            source: "system",
            dedupeKey,
            metadata: {
                orderId: String(order._id),
                orderNumber,
                status: normalized,
                imageUrl: image,
            },
        },
    }, { upsert: true });
}
async function trackCreated(order) {
    await (0, activity_service_1.trackUserActivity)({
        userId: String(order.user),
        type: "order_created",
        orderId: String(order._id),
        metadata: {
            orderNumber: order.orderNumber,
            total: Number(order.total || 0),
            itemCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            paymentMethod: order.paymentMethod,
        },
    });
}
async function createOrderFromCart(userId, payload) {
    const paymentMethod = clean(payload?.paymentMethod || "cod").toLowerCase();
    if (paymentMethod !== "cod") {
        throw new Error("Use /api/orders/razorpay/create for Razorpay payments.");
    }
    const snapshot = await buildOrderSnapshot(userId, payload, "cod");
    const orderNumber = makeOrderNumber();
    const order = await Order_model_1.default.create({
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
    }
    catch (error) {
        await Order_model_1.default.findByIdAndDelete(order._id).catch(() => undefined);
        throw error;
    }
    await removePurchasedCartItems(userId, order.items);
    await trackPurchasedCommerce(order).catch(() => undefined);
    await trackCreated(order);
    await createOrderStatusNotification(order.toObject(), "confirmed");
    void (0, commerce_email_service_1.sendOrderConfirmationEmailOnce)(order.toObject()).catch((error) => console.error("ORDER CONFIRMATION EMAIL ERROR:", error));
    void (0, commerce_email_service_1.sendAdminOrderNotificationEmailOnce)(order.toObject()).catch((error) => console.error("ADMIN ORDER EMAIL ERROR:", error));
    return order;
}
async function createRazorpayOrderFromCart(userId, payload) {
    const snapshot = await buildOrderSnapshot(userId, payload, "online");
    const orderNumber = makeOrderNumber();
    const order = await Order_model_1.default.create({
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
        const { gatewayOrder, keyId } = await (0, razorpay_service_1.createRazorpayGatewayOrder)({
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
    }
    catch (error) {
        order.paymentStatus = "failed";
        order.statusHistory.push({ status: "pending_payment", message: "Unable to initialize Razorpay payment.", at: new Date() });
        await order.save().catch(() => undefined);
        throw error;
    }
}
async function finalizePaidOrder(orderId, paymentId, source) {
    assertObjectId(orderId, "order ID");
    const current = await Order_model_1.default.findById(orderId);
    if (!current)
        throw new Error("Order not found.");
    if (current.status === "cancelled")
        throw new Error("Cancelled order cannot be confirmed.");
    if (current.inventoryCommitted && current.paymentStatus === "paid")
        return current;
    const claimed = await Order_model_1.default.findOneAndUpdate({
        _id: current._id,
        inventoryCommitted: { $ne: true },
        fulfillmentState: { $in: ["pending", "failed"] },
        status: { $ne: "cancelled" },
    }, { $set: { fulfillmentState: "processing" } }, { new: true });
    if (!claimed) {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const latest = await Order_model_1.default.findById(current._id);
            if (!latest)
                throw new Error("Order not found.");
            if (latest.inventoryCommitted && latest.paymentStatus === "paid")
                return latest;
            if (latest.status === "cancelled")
                throw new Error("Cancelled order cannot be confirmed.");
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
        const updated = await Order_model_1.default.findByIdAndUpdate(claimed._id, {
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
        }, { new: true });
        if (!updated)
            throw new Error("Unable to finalize paid order.");
        await removePurchasedCartItems(String(updated.user), updated.items).catch(() => undefined);
        await trackPurchasedCommerce(updated).catch(() => undefined);
        await createOrderStatusNotification(updated.toObject(), "confirmed").catch(() => undefined);
        void (0, commerce_email_service_1.sendOrderConfirmationEmailOnce)(updated.toObject()).catch((error) => console.error("ORDER CONFIRMATION EMAIL ERROR:", error));
        void (0, commerce_email_service_1.sendAdminOrderNotificationEmailOnce)(updated.toObject()).catch((error) => console.error("ADMIN ORDER EMAIL ERROR:", error));
        await (0, activity_service_1.trackUserActivity)({
            userId: String(updated.user),
            type: "order_paid",
            orderId: String(updated._id),
            metadata: { orderNumber: updated.orderNumber, total: Number(updated.total || 0), paymentMethod: "razorpay" },
        }).catch(() => undefined);
        return updated;
    }
    catch (error) {
        if (inventoryChanged) {
            await restoreInventory(claimed.items).catch(() => undefined);
        }
        await Order_model_1.default.updateOne({ _id: claimed._id }, { $set: { fulfillmentState: "failed", inventoryCommitted: false } }).catch(() => undefined);
        throw error;
    }
}
async function verifyRazorpayPaymentForUser(userId, payload) {
    const internalOrderId = assertObjectId(payload?.internalOrderId, "internal order ID");
    const razorpayOrderId = clean(payload?.razorpay_order_id);
    const razorpayPaymentId = clean(payload?.razorpay_payment_id);
    const razorpaySignature = clean(payload?.razorpay_signature);
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
        throw new Error("Razorpay payment details are incomplete.");
    const order = await Order_model_1.default.findOne({ _id: internalOrderId, user: userId });
    if (!order)
        throw new Error("Order not found.");
    const savedOrderId = clean(order.payment?.razorpayOrderId);
    if (!savedOrderId || savedOrderId !== razorpayOrderId)
        throw new Error("Razorpay order ID does not match this order.");
    const valid = (0, razorpay_service_1.verifyRazorpayPaymentSignature)({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!valid) {
        await Order_model_1.default.updateOne({ _id: order._id, paymentStatus: { $ne: "paid" } }, { $set: { paymentStatus: "failed" }, $push: { statusHistory: { status: "pending_payment", message: "Razorpay signature verification failed.", at: new Date() } } });
        throw new Error("Invalid Razorpay payment signature.");
    }
    return finalizePaidOrder(String(order._id), razorpayPaymentId, "verify");
}
async function finalizeRazorpayWebhookPayment(razorpayOrderId, razorpayPaymentId = "") {
    const order = await Order_model_1.default.findOne({ "payment.razorpayOrderId": razorpayOrderId });
    if (!order)
        return null;
    return finalizePaidOrder(String(order._id), razorpayPaymentId, "webhook");
}
async function markRazorpayPaymentFailed(razorpayOrderId, paymentId = "") {
    const order = await Order_model_1.default.findOne({ "payment.razorpayOrderId": razorpayOrderId });
    if (!order || order.paymentStatus === "paid")
        return order;
    const payment = order.payment && typeof order.payment === "object" ? order.payment : {};
    order.paymentStatus = "failed";
    order.payment = { ...payment, razorpayPaymentId: paymentId || payment.razorpayPaymentId || "", transactionId: paymentId || payment.transactionId || "" };
    order.statusHistory.push({ status: "pending_payment", message: "Razorpay reported a failed payment.", at: new Date() });
    await order.save();
    return order;
}
async function getDeliveryChargePreview(userId, paymentMethod) {
    assertObjectId(userId, "user ID");
    const cart = await (0, cart_service_1.getUserCart)(userId);
    const subtotal = roundMoney(Number(cart?.subtotal || 0));
    const normalizedMethod = (0, delivery_charge_service_1.normalizeDeliveryPaymentMethod)(paymentMethod);
    const delivery = await (0, delivery_charge_service_1.calculateDeliveryCharge)(subtotal, normalizedMethod);
    const cartTotalBeforeDelivery = roundMoney(Number(cart?.total || 0));
    return {
        paymentMethod: normalizedMethod,
        baseAmount: subtotal,
        cartTotalBeforeDelivery,
        deliveryCharge: delivery.charge,
        payableTotal: roundMoney(cartTotalBeforeDelivery + delivery.charge),
        matchedRule: delivery.rule,
    };
}
async function getUserOrders(userId) {
    return Order_model_1.default.find({ user: userId }).sort({ createdAt: -1 }).lean();
}
async function getUserOrderById(userId, orderId) {
    assertObjectId(orderId, "order ID");
    return Order_model_1.default.findOne({ _id: orderId, user: userId }).lean();
}
async function cancelUserOrder(userId, orderId, reason = "") {
    assertObjectId(orderId, "order ID");
    const order = await Order_model_1.default.findOne({ _id: orderId, user: userId });
    if (!order)
        throw new Error("Order not found.");
    if (!["pending_payment", "confirmed"].includes(order.status))
        throw new Error("This order can no longer be cancelled online.");
    if (order.paymentStatus === "paid")
        throw new Error("Paid orders require a refund workflow. Please contact support.");
    if (order.inventoryCommitted)
        await restoreInventory(order.items);
    order.status = "cancelled";
    order.inventoryCommitted = false;
    order.fulfillmentState = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = clean(reason) || "Cancelled by customer";
    order.statusHistory.push({ status: "cancelled", message: order.cancellationReason, at: new Date(), by: new mongoose_1.Types.ObjectId(userId) });
    await order.save();
    await createOrderStatusNotification(order.toObject(), "cancelled", userId).catch(() => undefined);
    await (0, activity_service_1.trackUserActivity)({
        userId,
        type: "order_cancelled",
        orderId: String(order._id),
        metadata: { orderNumber: order.orderNumber, status: "cancelled", total: Number(order.total || 0) },
    }).catch(() => undefined);
    return order;
}
async function restoreOrderInventoryIfNeeded(order) {
    if (!order?.inventoryCommitted)
        return;
    await restoreInventory(Array.isArray(order.items) ? order.items : []);
}
exports.allowedAdminTransitions = {
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
function isAdminTransitionAllowed(currentStatus, nextStatus) {
    if (currentStatus === nextStatus)
        return true;
    return (exports.allowedAdminTransitions[currentStatus] || []).includes(nextStatus);
}
//# sourceMappingURL=order.service.js.map