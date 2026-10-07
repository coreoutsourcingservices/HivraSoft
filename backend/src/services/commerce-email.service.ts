import { Types } from "mongoose";
import path from "node:path";
import Product from "../models/Product.model";
import User from "../models/User.model";
import Notification from "../models/Notification.model";
import { sendEmail } from "./mail.service";

const ADMIN_ORDER_EMAIL = "hivrasoft@gmail.com";
const YOUTUBE_URL = "https://www.youtube.com/@HivraSoft";
const INSTAGRAM_URL = "https://www.instagram.com/hivrasoft/";
const FACEBOOK_URL = "https://www.facebook.com/hivrasoft/";
const BRAND_LOGO_CID = "hivra-soft-logo";
const BRAND_LOGO_PATH = path.resolve(__dirname, "../../public/hivra-soft-logo.jpg");

const brandLogoAttachment = () => [{
  filename: "hivra-soft-logo.jpg",
  path: BRAND_LOGO_PATH,
  cid: BRAND_LOGO_CID,
}];

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

function formatDateTime(value: unknown) {
  const date = value ? new Date(value as any) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function reminderStageLabel(stageMinutes: number) {
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

function baseTemplate(input: { title: string; preheader: string; body: string }) {
  return `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>
    <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f6f6f6;">
        <tr>
          <td align="center" style="padding:18px 10px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #f4c6d5;overflow:hidden;">
              <tr>
                <td align="center" style="background:#090909;padding:18px;border-radius:18px 18px 0 0;">
                  <img src="cid:${BRAND_LOGO_CID}" alt="Hivra Soft - Intimate Comfort" width="250" style="display:block;width:250px;max-width:88%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                </td>
              </tr>
              <tr>
                <td align="center" style="background:#fff0f6;padding:24px 18px;border-bottom:1px solid #f4c6d5;">
                  <div style="font-family:Georgia,Times New Roman,serif;font-size:26px;line-height:1.25;font-weight:700;color:#111111;">${escapeHtml(input.title)}</div>
                  <div style="margin-top:8px;font-size:12px;color:#6c5d63;">Thank you for shopping with HivraSoft 💕</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 26px 20px;">${input.body}</td>
              </tr>
              <tr>
                <td style="padding:0 26px 22px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#ffe9f2;border:1px solid #f4c6d5;border-radius:14px;">
                    <tr>
                      <td align="center" style="padding:14px 10px;font-size:12px;color:#7f1741;">
                        <strong>Need help? Contact us anytime!</strong>&nbsp;&nbsp;✉️&nbsp; hivrasoft@gmail.com
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 20px 20px;background:#fff5f8;border-top:1px solid #f7d7e2;">
                  <div style="font-size:11px;color:#92747e;">Warm Regards</div>
                  <div style="margin-top:3px;font-size:16px;font-weight:800;color:#d11155;">Team HivraSoft</div>
                  <div style="margin-top:2px;font-size:10px;color:#9b7c86;">Intimate Comfort</div>
                </td>
              </tr>
              <tr>
                <td align="center" style="background:#070707;padding:22px 16px 24px;">
                  <div style="font-family:Georgia,Times New Roman,serif;font-size:19px;font-weight:700;color:#ffffff;">Follow Us On</div>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:14px auto 0;">
                    <tr>
                      <td style="padding:0 9px;">
                        <a href="${FACEBOOK_URL}" aria-label="HivraSoft Facebook" style="display:inline-block;text-decoration:none;">
                          <img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" width="30" height="30" style="display:block;width:30px;height:30px;border:0;" />
                        </a>
                      </td>
                      <td style="padding:0 9px;">
                        <a href="${INSTAGRAM_URL}" aria-label="HivraSoft Instagram" style="display:inline-block;text-decoration:none;">
                          <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" width="30" height="30" style="display:block;width:30px;height:30px;border:0;" />
                        </a>
                      </td>
                      <td style="padding:0 9px;">
                        <a href="${YOUTUBE_URL}" aria-label="HivraSoft YouTube" style="display:inline-block;text-decoration:none;">
                          <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" width="32" height="30" style="display:block;width:32px;height:30px;border:0;" />
                        </a>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:12px;font-size:9px;color:#b8b8b8;">You are receiving this email because you use HivraSoft.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function cta(label: string, href: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;"><tr><td style="background:#ce0f55;border-radius:10px;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">${escapeHtml(label)}</a></td></tr></table>`;
}

function imageBlock(url: string, alt: string) {
  if (!url) return "";
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" width="120" style="display:block;width:120px;max-width:100%;height:auto;margin:16px 0;border-radius:12px;border:1px solid #f2d2dc;" />`;
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
    colorName: String(color?.nameColor || ""),
    sizeName: String(size?.size || ""),
  };
}

async function customerAndProduct(userId: string, productId: string, colorId?: string | null, sizeId?: string | null) {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid user or product ID for email.");
  }
  const [user, product] = await Promise.all([
    User.findById(userId).select("name email phone isActive role").lean(),
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
  const label = reminderStageLabel(input.stageMinutes);
  const isTwoDay = input.stageMinutes >= 2880;
  const quantity = Math.max(1, Number(input.quantity || 1));
  const body = `
    <p style="margin:0 0 8px;text-align:center;font-size:14px;">Hi <strong>${escapeHtml((data.user as any).name || "Customer")}</strong>,</p>
    <p style="margin:0 auto 18px;max-width:500px;text-align:center;color:#5f5550;font-size:13px;line-height:1.7;">Your selected product has been waiting in your cart for ${escapeHtml(label)}. <strong style="color:#ce0f55;">Quantity is limited, so please buy as soon as possible before stock runs out.</strong></p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#fff3f7;border:1px solid #f3bfd0;border-radius:12px;">
      <tr>
        <td style="padding:14px;width:130px;vertical-align:top;">${imageBlock(data.product.image, data.product.name)}</td>
        <td style="padding:16px 14px;vertical-align:middle;">
          <div style="font-size:16px;font-weight:800;color:#22191c;">${escapeHtml(data.product.name)}</div>
          ${data.product.sizeName ? `<div style="margin-top:7px;font-size:12px;color:#6c5d63;">Size: <strong>${escapeHtml(data.product.sizeName)}</strong></div>` : ""}
          <div style="margin-top:7px;font-size:12px;color:#6c5d63;">Quantity: <strong>${quantity}</strong></div>
          <div style="margin-top:7px;font-size:12px;color:#6c5d63;">Price: <strong>${money(data.product.price)}</strong></div>
        </td>
      </tr>
    </table>
    ${cta("Buy Now / Complete Order", `${frontendUrl()}/account/card`)}
  `;
  await sendEmail({
    to: String((data.user as any).email),
    subject: isTwoDay ? "Your cart is still waiting — stock is limited" : "Your cart is waiting — buy before stock runs out",
    attachments: brandLogoAttachment(),
    html: baseTemplate({ title: isTwoDay ? "Your Cart is Still Waiting!" : "Your Cart is Waiting!", preheader: `${data.product.name} is still in your cart and stock may change.`, body }),
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
  const label = reminderStageLabel(input.stageMinutes);
  const isTwoDay = input.stageMinutes >= 2880;
  const body = `
    <p style="margin:0 0 8px;text-align:center;font-size:14px;">Hi <strong>${escapeHtml((data.user as any).name || "Customer")}</strong>,</p>
    <p style="margin:0 auto 18px;max-width:500px;text-align:center;color:#5f5550;font-size:13px;line-height:1.7;">The product you saved has been in your wishlist for ${escapeHtml(label)}. If you still want it, <strong style="color:#ce0f55;">buy it soon because availability and stock can change.</strong></p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#fff3f7;border:1px solid #f3bfd0;border-radius:12px;">
      <tr>
        <td style="padding:14px;width:130px;vertical-align:top;">${imageBlock(data.product.image, data.product.name)}</td>
        <td style="padding:16px 14px;vertical-align:middle;">
          <div style="font-size:16px;font-weight:800;color:#22191c;">${escapeHtml(data.product.name)}</div>
          ${data.product.sizeName ? `<div style="margin-top:7px;font-size:12px;color:#6c5d63;">Size: <strong>${escapeHtml(data.product.sizeName)}</strong></div>` : ""}
          <div style="margin-top:7px;font-size:12px;color:#6c5d63;">Price: <strong>${money(data.product.price)}</strong></div>
        </td>
      </tr>
    </table>
    ${cta("View Wishlist / Buy Now", `${frontendUrl()}/account/wishlist`)}
  `;
  await sendEmail({
    to: String((data.user as any).email),
    subject: isTwoDay ? "Your wishlist item is still waiting after 2 days" : "Your wishlist item is still waiting",
    attachments: brandLogoAttachment(),
    html: baseTemplate({ title: "Still on Your Wishlist!", preheader: `${data.product.name} is still in your wishlist.`, body }),
  });
  return true;
}

function orderItemRows(items: any[]) {
  return items.map((item: any) => `
    <tr>
      <td style="padding:11px 8px;border-bottom:1px solid #f4d6df;width:64px;vertical-align:middle;">
        ${item?.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item?.name || "Product")}" width="52" style="display:block;width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid #f0d5dd;" />` : ""}
      </td>
      <td style="padding:11px 8px;border-bottom:1px solid #f4d6df;vertical-align:middle;">
        <div style="font-weight:700;font-size:12px;color:#222;">${escapeHtml(item?.name || "Product")}</div>
        <div style="margin-top:4px;font-size:10px;color:#7b6970;">${[item?.colorName, item?.sizeName].filter(Boolean).map(escapeHtml).join(" / ")}</div>
      </td>
      <td align="center" style="padding:11px 8px;border-bottom:1px solid #f4d6df;font-size:12px;vertical-align:middle;">${Math.max(1, Number(item?.quantity || 1))}</td>
      <td align="right" style="padding:11px 8px;border-bottom:1px solid #f4d6df;font-size:12px;font-weight:700;vertical-align:middle;">${money(item?.finalTotal ?? item?.subtotal ?? 0)}</td>
    </tr>`).join("");
}

function orderSummaryRows(order: any) {
  const rows: string[] = [];
  rows.push(`<tr><td style="padding:5px 8px;text-align:right;color:#8a747d;font-size:11px;">Subtotal</td><td style="padding:5px 8px;text-align:right;font-size:11px;">${money(order?.subtotal)}</td></tr>`);
  if (Number(order?.discount || 0) > 0) rows.push(`<tr><td style="padding:5px 8px;text-align:right;color:#8a747d;font-size:11px;">Discount</td><td style="padding:5px 8px;text-align:right;font-size:11px;">- ${money(order.discount)}</td></tr>`);
  if (Number(order?.tax || 0) > 0) rows.push(`<tr><td style="padding:5px 8px;text-align:right;color:#8a747d;font-size:11px;">${escapeHtml(order?.taxName || "GST")}</td><td style="padding:5px 8px;text-align:right;font-size:11px;">${money(order.tax)}</td></tr>`);
  rows.push(`<tr><td style="padding:5px 8px;text-align:right;color:#8a747d;font-size:11px;">Shipping</td><td style="padding:5px 8px;text-align:right;font-size:11px;color:${Number(order?.shipping || 0) > 0 ? "#333" : "#1b9a54"};font-weight:700;">${Number(order?.shipping || 0) > 0 ? money(order.shipping) : "FREE"}</td></tr>`);
  rows.push(`<tr><td style="padding:9px 8px;text-align:right;border-top:1px solid #efbdce;color:#ce0f55;font-size:13px;font-weight:700;">Total</td><td style="padding:9px 8px;text-align:right;border-top:1px solid #efbdce;color:#ce0f55;font-size:13px;font-weight:800;">${money(order?.total)}</td></tr>`);
  return rows.join("");
}

function shippingAddressBlock(order: any) {
  const address = order?.shippingAddress || {};
  const lines = [
    address?.homeNumber || address?.officeNumber,
    address?.addressLine1,
    address?.addressLine2,
    address?.landmark,
    [address?.city, address?.district, address?.postalCode].filter(Boolean).join(" "),
    [address?.state, address?.country].filter(Boolean).join(", "),
  ].filter(Boolean);
  if (!lines.length) return "";
  return `
    <div style="margin-top:18px;text-align:center;font-size:11px;font-weight:800;color:#ce0f55;">SHIPPING TO</div>
    <div style="margin-top:8px;padding:14px;background:#f8f8f8;border-radius:10px;text-align:center;font-size:11px;line-height:1.65;color:#333;">
      <div style="font-weight:700;">📍 ${escapeHtml(address?.fullName || order?.customer?.name || "Customer")}</div>
      ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
    </div>`;
}

export async function sendOrderConfirmationEmailOnce(order: any) {
  const orderId = String(order?._id || "");
  const userId = String(order?.user || "");
  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) return false;

  const dedupeKey = `order:${orderId}:status:confirmed`;
  const notification = await Notification.findOne({ dedupeKey });
  if ((notification?.metadata as any)?.orderEmailSentAt) return false;

  const user = await User.findById(userId).select("name email phone isActive role").lean();
  if (!user || user.role !== "customer" || user.isActive === false || !user.email) return false;

  const items = Array.isArray(order?.items) ? order.items : [];
  const body = `
    <p style="margin:0 0 14px;text-align:center;font-size:13px;color:#444;">Hi <strong>${escapeHtml((user as any).name || order?.customer?.name || "Customer")}</strong>,</p>
    <p style="margin:0 auto 18px;max-width:500px;text-align:center;color:#5f5550;font-size:12px;line-height:1.7;">We've received your order and it's now being processed. We'll notify you once it's on its way! 🚚</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#fff4f7;border:1px solid #f3bfd0;border-radius:10px;">
      <tr><td style="padding:10px 14px;font-size:10px;color:#a2828e;">Order Number</td><td align="right" style="padding:10px 14px;font-size:11px;color:#ce0f55;font-weight:700;">${escapeHtml(order?.orderNumber || orderId)}</td></tr>
      <tr><td style="padding:0 14px 10px;font-size:10px;color:#a2828e;">Order Date</td><td align="right" style="padding:0 14px 10px;font-size:11px;">${escapeHtml(formatDateTime(order?.createdAt))}</td></tr>
      <tr><td style="padding:0 14px 10px;font-size:10px;color:#a2828e;">Payment Method</td><td align="right" style="padding:0 14px 10px;font-size:11px;">${escapeHtml(String(order?.paymentMethod || "").replaceAll("_", " ").toUpperCase())}</td></tr>
    </table>

    <div style="margin-top:18px;text-align:center;font-size:11px;font-weight:800;color:#ce0f55;">ORDER SUMMARY</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;width:100%;background:#fff4f7;border:1px solid #f3bfd0;border-radius:10px;overflow:hidden;">
      <tr style="background:#fff0f5;"><td colspan="2" style="padding:8px;font-size:9px;color:#a2828e;">Product</td><td align="center" style="padding:8px;font-size:9px;color:#a2828e;">Qty</td><td align="right" style="padding:8px;font-size:9px;color:#a2828e;">Price</td></tr>
      ${orderItemRows(items)}
      ${orderSummaryRows(order)}
    </table>
    ${shippingAddressBlock(order)}
    ${cta("View Order", `${frontendUrl()}/account/orders?order=${encodeURIComponent(orderId)}`)}
  `;

  await sendEmail({
    to: String((user as any).email),
    subject: `Your HivraSoft order ${order?.orderNumber || orderId} is confirmed`,
    attachments: brandLogoAttachment(),
    html: baseTemplate({ title: "Your Order is Confirmed!", preheader: `Order ${order?.orderNumber || orderId} has been confirmed.`, body }),
  });

  if (notification) {
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { "metadata.orderEmailSentAt": new Date(), "metadata.orderEmail": String((user as any).email) } }
    ).catch(() => undefined);
  }
  return true;
}

export async function sendAdminOrderNotificationEmailOnce(order: any) {
  const orderId = String(order?._id || "");
  const userId = String(order?.user || "");
  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) return false;

  const dedupeKey = `order:${orderId}:status:confirmed`;
  const notification = await Notification.findOne({ dedupeKey });
  if ((notification?.metadata as any)?.adminOrderEmailSentAt) return false;

  const user = await User.findById(userId).select("name email phone role").lean();
  if (!user || user.role !== "customer") return false;

  const items = Array.isArray(order?.items) ? order.items : [];
  const body = `
    <p style="margin:0 0 16px;text-align:center;font-size:13px;color:#444;">A customer has placed an order on HivraSoft.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#fff4f7;border:1px solid #f3bfd0;border-radius:10px;">
      <tr><td style="padding:9px 14px;font-size:10px;color:#9b7c86;">User Name</td><td align="right" style="padding:9px 14px;font-size:11px;font-weight:700;">${escapeHtml((user as any).name || order?.customer?.name || "Customer")}</td></tr>
      <tr><td style="padding:0 14px 9px;font-size:10px;color:#9b7c86;">User Number</td><td align="right" style="padding:0 14px 9px;font-size:11px;">${escapeHtml((user as any).phone || order?.customer?.phone || "—")}</td></tr>
      <tr><td style="padding:0 14px 9px;font-size:10px;color:#9b7c86;">User Email</td><td align="right" style="padding:0 14px 9px;font-size:11px;">${escapeHtml((user as any).email || order?.customer?.email || "—")}</td></tr>
      <tr><td style="padding:0 14px 9px;font-size:10px;color:#9b7c86;">Order Number</td><td align="right" style="padding:0 14px 9px;font-size:11px;color:#ce0f55;font-weight:700;">${escapeHtml(order?.orderNumber || orderId)}</td></tr>
      <tr><td style="padding:0 14px 9px;font-size:10px;color:#9b7c86;">Purchase Time</td><td align="right" style="padding:0 14px 9px;font-size:11px;">${escapeHtml(formatDateTime(order?.createdAt))}</td></tr>
      <tr><td style="padding:0 14px 11px;font-size:10px;color:#9b7c86;">Payment Method</td><td align="right" style="padding:0 14px 11px;font-size:11px;">${escapeHtml(String(order?.paymentMethod || "").replaceAll("_", " ").toUpperCase())}</td></tr>
    </table>

    <div style="margin-top:18px;text-align:center;font-size:11px;font-weight:800;color:#ce0f55;">PRODUCTS PURCHASED</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;width:100%;background:#fff4f7;border:1px solid #f3bfd0;border-radius:10px;overflow:hidden;">
      <tr style="background:#fff0f5;"><td colspan="2" style="padding:8px;font-size:9px;color:#a2828e;">Product</td><td align="center" style="padding:8px;font-size:9px;color:#a2828e;">Qty</td><td align="right" style="padding:8px;font-size:9px;color:#a2828e;">Price</td></tr>
      ${orderItemRows(items)}
      ${orderSummaryRows(order)}
    </table>
    ${shippingAddressBlock(order)}
  `;

  await sendEmail({
    to: ADMIN_ORDER_EMAIL,
    subject: `New HivraSoft order: ${order?.orderNumber || orderId}`,
    attachments: brandLogoAttachment(),
    html: baseTemplate({ title: "New Order Received!", preheader: `${(user as any).name || "Customer"} placed order ${order?.orderNumber || orderId}.`, body }),
  });

  if (notification) {
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { "metadata.adminOrderEmailSentAt": new Date(), "metadata.adminOrderEmail": ADMIN_ORDER_EMAIL } }
    ).catch(() => undefined);
  }
  return true;
}
