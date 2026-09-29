import { Types } from "mongoose";
import Product from "../models/Product.model";
import User from "../models/User.model";
import Notification from "../models/Notification.model";
import { sendEmail } from "./mail.service";

const money = (value: unknown) => {
  const amount = Number(value || 0);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const frontendUrl = () => String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

function baseTemplate(input: { title: string; preheader: string; body: string }) {
  return `<!doctype html>
  <html>
    <body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#211A18;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ef;padding:24px 12px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #eadfda;border-radius:20px;overflow:hidden;">
            <tr><td style="padding:24px 28px;background:#211A18;color:#ffffff;">
              <div style="font-size:20px;font-weight:700;letter-spacing:4px;">HIVRASOFT</div>
              <div style="margin-top:8px;font-size:12px;color:#ffffffaa;">${escapeHtml(input.title)}</div>
            </td></tr>
            <tr><td style="padding:28px;">${input.body}</td></tr>
            <tr><td style="padding:18px 28px;border-top:1px solid #eee4df;font-size:11px;color:#766a65;">
              This is an automatic HivraSoft store email.
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}

function cta(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:20px;padding:12px 18px;border-radius:10px;background:#A51D45;color:#fff;text-decoration:none;font-size:13px;font-weight:700;">${escapeHtml(label)}</a>`;
}

function imageBlock(url: string, alt: string) {
  if (!url) return "";
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" width="170" style="display:block;width:170px;max-width:100%;height:auto;margin:18px 0;border-radius:14px;border:1px solid #eee4df;" />`;
}

function productSnapshot(product: any, colorId?: string | null, sizeId?: string | null) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const color = colors.find((item: any) => String(item?._id || "") === String(colorId || ""))
    || colors.find((item: any) => item?.isDefault === true)
    || colors[0]
    || null;
  const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
  const size = sizes.find((item: any) => String(item?._id || "") === String(sizeId || "")) || sizes[0] || null;
  const images = Array.isArray(color?.images) ? color.images : [];
  const image = images.find((item: any) => item?.isDefault === true) || images[0] || null;
  return {
    name: String(color?.nameProduct || "Product"),
    image: String(image?.url || ""),
    price: Number(size?.showPrice ?? color?.showPrice ?? 0),
  };
}

async function customerAndProduct(userId: string, productId: string, colorId?: string | null, sizeId?: string | null) {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid user or product ID for email.");
  }
  const [user, product] = await Promise.all([
    User.findById(userId).select("name email isActive role").lean(),
    Product.findById(productId).select("colors isActive").lean(),
  ]);
  if (!user || user.role !== "customer" || user.isActive === false || !user.email) return null;
  if (!product || (product as any).isActive === false) return null;
  return { user, product: productSnapshot(product, colorId, sizeId) };
}

export async function sendCartAddedEmail(input: {
  userId: string;
  productId: string;
  colorId?: string | null;
  sizeId?: string | null;
  quantity: number;
  cartTotal?: number;
}) {
  const data = await customerAndProduct(input.userId, input.productId, input.colorId, input.sizeId);
  if (!data) return false;
  const quantity = Math.max(1, Number(input.quantity || 1));
  const body = `
    <p style="margin:0 0 14px;font-size:15px;">Hi <strong>${escapeHtml((data.user as any).name || "Customer")}</strong>,</p>
    <p style="margin:0;color:#5f5550;font-size:14px;line-height:1.6;">You added this product to your cart.</p>
    ${imageBlock(data.product.image, data.product.name)}
    <div style="font-size:17px;font-weight:700;">${escapeHtml(data.product.name)}</div>
    <div style="margin-top:8px;font-size:13px;color:#5f5550;">Quantity: <strong>${quantity}</strong></div>
    <div style="margin-top:5px;font-size:13px;color:#5f5550;">Price: <strong>${money(data.product.price)}</strong></div>
    ${Number.isFinite(Number(input.cartTotal)) ? `<div style="margin-top:5px;font-size:13px;color:#5f5550;">Cart Total: <strong>${money(input.cartTotal)}</strong></div>` : ""}
    ${cta("View Cart", `${frontendUrl()}/account/card`)}
  `;
  await sendEmail({
    to: String((data.user as any).email),
    subject: "Product added to your cart",
    html: baseTemplate({ title: "Cart Update", preheader: `${data.product.name} was added to your cart.`, body }),
  });
  return true;
}

export async function sendWishlistAddedEmail(input: {
  userId: string;
  productId: string;
  colorId?: string | null;
  sizeId?: string | null;
}) {
  const data = await customerAndProduct(input.userId, input.productId, input.colorId, input.sizeId);
  if (!data) return false;
  const body = `
    <p style="margin:0 0 14px;font-size:15px;">Hi <strong>${escapeHtml((data.user as any).name || "Customer")}</strong>,</p>
    <p style="margin:0;color:#5f5550;font-size:14px;line-height:1.6;">You added this product to your wishlist.</p>
    ${imageBlock(data.product.image, data.product.name)}
    <div style="font-size:17px;font-weight:700;">${escapeHtml(data.product.name)}</div>
    <div style="margin-top:8px;font-size:13px;color:#5f5550;">Price: <strong>${money(data.product.price)}</strong></div>
    ${cta("View Wishlist", `${frontendUrl()}/account/wishlist`)}
  `;
  await sendEmail({
    to: String((data.user as any).email),
    subject: "Product added to your wishlist",
    html: baseTemplate({ title: "Wishlist Update", preheader: `${data.product.name} was saved to your wishlist.`, body }),
  });
  return true;
}

export async function sendCartReminderEmail(input: {
  userId: string;
  productId: string;
  colorId?: string | null;
  sizeId?: string | null;
  quantity: number;
  stageMinutes: number;
}) {
  const data = await customerAndProduct(input.userId, input.productId, input.colorId, input.sizeId);
  if (!data) return false;
  const isDay = input.stageMinutes >= 1440;
  const label = isDay ? "24 hours" : `${input.stageMinutes} minutes`;
  const body = `
    <p style="margin:0 0 14px;font-size:15px;">Hi <strong>${escapeHtml((data.user as any).name || "Customer")}</strong>,</p>
    <p style="margin:0;color:#5f5550;font-size:14px;line-height:1.6;">This product has been waiting in your cart for ${escapeHtml(label)}.</p>
    ${imageBlock(data.product.image, data.product.name)}
    <div style="font-size:17px;font-weight:700;">${escapeHtml(data.product.name)}</div>
    <div style="margin-top:8px;font-size:13px;color:#5f5550;">Quantity: <strong>${Math.max(1, Number(input.quantity || 1))}</strong></div>
    <div style="margin-top:5px;font-size:13px;color:#5f5550;">Price: <strong>${money(data.product.price)}</strong></div>
    ${cta("Complete Your Order", `${frontendUrl()}/account/card`)}
  `;
  await sendEmail({
    to: String((data.user as any).email),
    subject: isDay ? "Your cart is still waiting" : "You left something in your cart",
    html: baseTemplate({ title: "Cart Reminder", preheader: `${data.product.name} is still in your cart.`, body }),
  });
  return true;
}

export async function sendWishlistReminderEmail(input: {
  userId: string;
  productId: string;
  colorId?: string | null;
  sizeId?: string | null;
  stageMinutes: number;
}) {
  const data = await customerAndProduct(input.userId, input.productId, input.colorId, input.sizeId);
  if (!data) return false;
  const isDay = input.stageMinutes >= 1440;
  const label = isDay ? "24 hours" : `${input.stageMinutes} minutes`;
  const body = `
    <p style="margin:0 0 14px;font-size:15px;">Hi <strong>${escapeHtml((data.user as any).name || "Customer")}</strong>,</p>
    <p style="margin:0;color:#5f5550;font-size:14px;line-height:1.6;">A product you saved ${escapeHtml(label)} ago is still on your wishlist.</p>
    ${imageBlock(data.product.image, data.product.name)}
    <div style="font-size:17px;font-weight:700;">${escapeHtml(data.product.name)}</div>
    <div style="margin-top:8px;font-size:13px;color:#5f5550;">Price: <strong>${money(data.product.price)}</strong></div>
    ${cta("View Product / Buy Now", `${frontendUrl()}/account/wishlist`)}
  `;
  await sendEmail({
    to: String((data.user as any).email),
    subject: isDay ? "Your wishlist item is still waiting" : "Still thinking about your wishlist item?",
    html: baseTemplate({ title: "Wishlist Reminder", preheader: `${data.product.name} is still in your wishlist.`, body }),
  });
  return true;
}

export async function sendOrderConfirmationEmailOnce(order: any) {
  const orderId = String(order?._id || "");
  const userId = String(order?.user || "");
  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) return false;

  const dedupeKey = `order:${orderId}:status:confirmed`;
  const notification = await Notification.findOne({ dedupeKey });
  if ((notification?.metadata as any)?.orderEmailSentAt) return false;

  const user = await User.findById(userId).select("name email isActive role").lean();
  if (!user || user.role !== "customer" || user.isActive === false || !user.email) return false;

  const items = Array.isArray(order?.items) ? order.items : [];
  const itemRows = items.map((item: any) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee4df;width:72px;vertical-align:top;">
        ${item?.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item?.name || "Product")}" width="58" style="display:block;width:58px;height:58px;object-fit:cover;border-radius:9px;" />` : ""}
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #eee4df;vertical-align:top;">
        <div style="font-weight:700;font-size:13px;">${escapeHtml(item?.name || "Product")}</div>
        <div style="margin-top:4px;font-size:12px;color:#6d625d;">Qty: ${Math.max(1, Number(item?.quantity || 1))}</div>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #eee4df;font-size:13px;font-weight:700;vertical-align:top;">${money(item?.finalTotal ?? item?.subtotal ?? 0)}</td>
    </tr>`).join("");

  const summary: string[] = [];
  summary.push(`<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;"><span>Subtotal</span><strong>${money(order?.subtotal)}</strong></div>`);
  if (Number(order?.discount || 0) > 0) summary.push(`<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;"><span>Discount</span><strong>- ${money(order.discount)}</strong></div>`);
  if (Number(order?.tax || 0) > 0) summary.push(`<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;"><span>${escapeHtml(order?.taxName || "GST")}</span><strong>${money(order.tax)}</strong></div>`);
  if (Number(order?.shipping || 0) > 0) summary.push(`<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;"><span>Delivery Charge</span><strong>${money(order.shipping)}</strong></div>`);
  summary.push(`<div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #ddd0ca;font-size:15px;"><span>Grand Total</span><strong>${money(order?.total)}</strong></div>`);

  const body = `
    <p style="margin:0 0 8px;font-size:15px;">Hi <strong>${escapeHtml((user as any).name || order?.customer?.name || "Customer")}</strong>,</p>
    <p style="margin:0 0 18px;color:#5f5550;font-size:14px;line-height:1.6;">Your order has been confirmed.</p>
    <div style="padding:14px;border-radius:12px;background:#faf8f6;font-size:12px;line-height:1.8;">
      <strong>Order ID:</strong> ${escapeHtml(order?.orderNumber || orderId)}<br/>
      <strong>Order Date:</strong> ${escapeHtml(new Date(order?.createdAt || Date.now()).toLocaleString("en-IN"))}<br/>
      <strong>Payment Method:</strong> ${escapeHtml(String(order?.paymentMethod || "").toUpperCase())}<br/>
      <strong>Order Status:</strong> ${escapeHtml(String(order?.status || "confirmed").replaceAll("_", " ").toUpperCase())}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">${itemRows}</table>
    <div style="margin-top:16px;">${summary.join("")}</div>
    ${cta("View Order", `${frontendUrl()}/account/orders?order=${encodeURIComponent(orderId)}`)}
  `;

  await sendEmail({
    to: String((user as any).email),
    subject: "Your order has been confirmed",
    html: baseTemplate({ title: "Order Confirmation", preheader: `Order ${order?.orderNumber || orderId} has been confirmed.`, body }),
  });

  if (notification) {
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { "metadata.orderEmailSentAt": new Date(), "metadata.orderEmail": String((user as any).email) } }
    ).catch(() => undefined);
  }
  return true;
}
