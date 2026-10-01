"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderController = createOrderController;
exports.createRazorpayOrderController = createRazorpayOrderController;
exports.verifyRazorpayOrderController = verifyRazorpayOrderController;
exports.previewDeliveryChargeController = previewDeliveryChargeController;
exports.getMyOrdersController = getMyOrdersController;
exports.getMyOrderController = getMyOrderController;
exports.cancelMyOrderController = cancelMyOrderController;
exports.downloadMyInvoiceController = downloadMyInvoiceController;
exports.razorpayWebhookController = razorpayWebhookController;
const order_service_1 = require("../services/order.service");
const razorpay_service_1 = require("../services/razorpay.service");
const invoice_service_1 = require("../services/invoice.service");
function userId(req) {
    if (!req.user?._id)
        throw new Error("Not authenticated.");
    return String(req.user._id);
}
function param(req, name) {
    const value = req.params[name];
    return Array.isArray(value) ? value[0] : String(value || "");
}
function errorResponse(res, error, fallback) {
    const message = error instanceof Error ? error.message : fallback;
    const notFound = /not found/i.test(message);
    const unauthorized = /not authenticated|unauthorized/i.test(message);
    return res.status(unauthorized ? 401 : notFound ? 404 : 400).json({ success: false, message });
}
async function createOrderController(req, res) {
    try {
        const order = await (0, order_service_1.createOrderFromCart)(userId(req), req.body || {});
        return res.status(201).json({ success: true, message: "Order placed successfully.", order });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to place order.");
    }
}
async function createRazorpayOrderController(req, res) {
    try {
        const result = await (0, order_service_1.createRazorpayOrderFromCart)(userId(req), req.body || {});
        return res.status(201).json({ success: true, message: "Razorpay order created.", ...result });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to create Razorpay order.");
    }
}
async function verifyRazorpayOrderController(req, res) {
    try {
        const order = await (0, order_service_1.verifyRazorpayPaymentForUser)(userId(req), req.body || {});
        return res.json({ success: true, message: "Payment verified and order confirmed.", order });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to verify Razorpay payment.");
    }
}
async function previewDeliveryChargeController(req, res) {
    try {
        const preview = await (0, order_service_1.getDeliveryChargePreview)(userId(req), req.body?.paymentMethod);
        return res.json({ success: true, preview });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to calculate delivery charge.");
    }
}
async function getMyOrdersController(req, res) {
    try {
        const orders = await (0, order_service_1.getUserOrders)(userId(req));
        return res.json({ success: true, count: orders.length, orders });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to load orders.");
    }
}
async function getMyOrderController(req, res) {
    try {
        const order = await (0, order_service_1.getUserOrderById)(userId(req), param(req, "id"));
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found." });
        return res.json({ success: true, order });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to load order.");
    }
}
async function cancelMyOrderController(req, res) {
    try {
        const order = await (0, order_service_1.cancelUserOrder)(userId(req), param(req, "id"), String(req.body?.reason || ""));
        return res.json({ success: true, message: "Order cancelled.", order });
    }
    catch (error) {
        return errorResponse(res, error, "Unable to cancel order.");
    }
}
async function downloadMyInvoiceController(req, res) {
    try {
        const order = await (0, order_service_1.getUserOrderById)(userId(req), param(req, "id"));
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found." });
        const pdf = (0, invoice_service_1.buildInvoicePdf)(order);
        const name = String(order.invoiceNumber || order.orderNumber || "invoice").replace(/[^A-Za-z0-9_-]/g, "-");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
        res.setHeader("Content-Length", String(pdf.length));
        return res.status(200).send(pdf);
    }
    catch (error) {
        return errorResponse(res, error, "Unable to download invoice.");
    }
}
async function razorpayWebhookController(req, res) {
    try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
        const signature = String(req.header("x-razorpay-signature") || "");
        if (!(0, razorpay_service_1.verifyRazorpayWebhookSignature)(rawBody, signature)) {
            return res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature." });
        }
        const event = JSON.parse(rawBody.toString("utf8"));
        const eventName = String(event?.event || "");
        const paymentEntity = event?.payload?.payment?.entity || {};
        const orderEntity = event?.payload?.order?.entity || {};
        const razorpayOrderId = String(paymentEntity?.order_id || orderEntity?.id || "");
        const paymentId = String(paymentEntity?.id || "");
        if (["payment.captured", "order.paid"].includes(eventName) && razorpayOrderId) {
            await (0, order_service_1.finalizeRazorpayWebhookPayment)(razorpayOrderId, paymentId);
        }
        else if (eventName === "payment.failed" && razorpayOrderId) {
            await (0, order_service_1.markRazorpayPaymentFailed)(razorpayOrderId, paymentId);
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Webhook processing failed.";
        return res.status(400).json({ success: false, message });
    }
}
//# sourceMappingURL=order.controller.js.map