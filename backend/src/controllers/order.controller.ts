import type { Request, Response } from "express";
import {
  cancelUserOrder,
  createOrderFromCart,
  createRazorpayOrderFromCart,
  finalizeRazorpayWebhookPayment,
  getDeliveryChargePreview,
  getUserOrderById,
  getUserOrders,
  markRazorpayPaymentFailed,
  verifyRazorpayPaymentForUser,
} from "../services/order.service";
import { verifyRazorpayWebhookSignature } from "../services/razorpay.service";
import { buildInvoicePdf } from "../services/invoice.service";

function userId(req: Request) {
  if (!req.user?._id) throw new Error("Not authenticated.");
  return String(req.user._id);
}

function param(req: Request, name: string) {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : String(value || "");
}

function errorResponse(res: Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const notFound = /not found/i.test(message);
  const unauthorized = /not authenticated|unauthorized/i.test(message);
  return res.status(unauthorized ? 401 : notFound ? 404 : 400).json({ success: false, message });
}

export async function createOrderController(req: Request, res: Response) {
  try {
    const order = await createOrderFromCart(userId(req), req.body || {});
    return res.status(201).json({ success: true, message: "Order placed successfully.", order });
  } catch (error) {
    return errorResponse(res, error, "Unable to place order.");
  }
}

export async function createRazorpayOrderController(req: Request, res: Response) {
  try {
    const result = await createRazorpayOrderFromCart(userId(req), req.body || {});
    return res.status(201).json({ success: true, message: "Razorpay order created.", ...result });
  } catch (error) {
    return errorResponse(res, error, "Unable to create Razorpay order.");
  }
}

export async function verifyRazorpayOrderController(req: Request, res: Response) {
  try {
    const order = await verifyRazorpayPaymentForUser(userId(req), req.body || {});
    return res.json({ success: true, message: "Payment verified and order confirmed.", order });
  } catch (error) {
    return errorResponse(res, error, "Unable to verify Razorpay payment.");
  }
}

export async function previewDeliveryChargeController(req: Request, res: Response) {
  try {
    const preview = await getDeliveryChargePreview(userId(req), req.body?.paymentMethod);
    return res.json({ success: true, preview });
  } catch (error) {
    return errorResponse(res, error, "Unable to calculate delivery charge.");
  }
}

export async function getMyOrdersController(req: Request, res: Response) {
  try {
    const orders = await getUserOrders(userId(req));
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return errorResponse(res, error, "Unable to load orders.");
  }
}

export async function getMyOrderController(req: Request, res: Response) {
  try {
    const order = await getUserOrderById(userId(req), param(req, "id"));
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    return res.json({ success: true, order });
  } catch (error) {
    return errorResponse(res, error, "Unable to load order.");
  }
}

export async function cancelMyOrderController(req: Request, res: Response) {
  try {
    const order = await cancelUserOrder(userId(req), param(req, "id"), String(req.body?.reason || ""));
    return res.json({ success: true, message: "Order cancelled.", order });
  } catch (error) {
    return errorResponse(res, error, "Unable to cancel order.");
  }
}

export async function downloadMyInvoiceController(req: Request, res: Response) {
  try {
    const order = await getUserOrderById(userId(req), param(req, "id"));
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    const pdf = buildInvoicePdf(order as any);
    const name = String((order as any).invoiceNumber || (order as any).orderNumber || "invoice").replace(/[^A-Za-z0-9_-]/g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
    res.setHeader("Content-Length", String(pdf.length));
    return res.status(200).send(pdf);
  } catch (error) {
    return errorResponse(res, error, "Unable to download invoice.");
  }
}

export async function razorpayWebhookController(req: Request, res: Response) {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const signature = String(req.header("x-razorpay-signature") || "");
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature." });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventName = String(event?.event || "");
    const paymentEntity = event?.payload?.payment?.entity || {};
    const orderEntity = event?.payload?.order?.entity || {};
    const razorpayOrderId = String(paymentEntity?.order_id || orderEntity?.id || "");
    const paymentId = String(paymentEntity?.id || "");

    if (["payment.captured", "order.paid"].includes(eventName) && razorpayOrderId) {
      await finalizeRazorpayWebhookPayment(razorpayOrderId, paymentId);
    } else if (eventName === "payment.failed" && razorpayOrderId) {
      await markRazorpayPaymentFailed(razorpayOrderId, paymentId);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return res.status(400).json({ success: false, message });
  }
}
