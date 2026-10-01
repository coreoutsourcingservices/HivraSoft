import { API_URL, apiFetch } from "./api";
import type { Order, OrderItem, OrdersApiResponse, ShippingAddress } from "@/types/order";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}
function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeItem(value: unknown, index: number): OrderItem {
  const raw = asRecord(value);
  const product = asRecord(raw.product);
  const quantity = Math.max(1, number(raw.quantity ?? raw.qty, 1));
  const unitPrice = number(raw.unitPrice ?? raw.finalUnitPrice ?? raw.price ?? product.price, 0);
  const subtotal = number(raw.subtotal, unitPrice * quantity);
  return {
    id: text(raw._id ?? raw.id ?? raw.cartItemId, `item-${index}`),
    productId: text(raw.productId ?? product._id) || undefined,
    name: text(raw.name ?? raw.productName ?? product.name, "Product"),
    slug: text(raw.slug ?? product.slug) || undefined,
    image: text(raw.image ?? raw.imageUrl) || undefined,
    color: text(raw.colorName ?? raw.color) || undefined,
    colorHex: text(raw.colorHex) || undefined,
    size: text(raw.sizeName ?? raw.size) || undefined,
    sku: text(raw.sku) || undefined,
    quantity,
    originalUnitPrice: number(raw.originalUnitPrice, unitPrice),
    unitPrice,
    discount: number(raw.discount, 0),
    finalUnitPrice: number(raw.finalUnitPrice, unitPrice),
    subtotal,
    finalTotal: number(raw.finalTotal, subtotal),
  };
}

export function normalizeOrder(value: unknown, index = 0): Order {
  const raw = asRecord(value);
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items = itemsRaw.map(normalizeItem);
  const subtotal = number(raw.subtotal, items.reduce((sum, item) => sum + item.subtotal, 0));
  const automaticDiscount = number(raw.automaticDiscount, 0);
  const codeDiscount = number(raw.codeDiscount, 0);
  const discount = number(raw.discount, automaticDiscount + codeDiscount);
  const shipping = number(raw.shipping, 0);
  const tax = number(raw.tax, 0);
  const id = text(raw._id ?? raw.id, `order-${index}`);
  return {
    id,
    orderNumber: text(raw.orderNumber, id),
    invoiceNumber: text(raw.invoiceNumber) || undefined,
    status: text(raw.status, "confirmed").toLowerCase(),
    paymentStatus: text(raw.paymentStatus) || undefined,
    paymentMethod: text(raw.paymentMethod) || undefined,
    payment: asRecord(raw.payment),
    items,
    subtotal,
    automaticDiscount,
    automaticDiscountDetails: asRecord(raw.automaticDiscountDetails),
    codeDiscount,
    codeDiscountDetails: asRecord(raw.codeDiscountDetails),
    discount,
    discountCode: text(raw.discountCode) || undefined,
    tax,
    taxName: text(raw.taxName) || undefined,
    taxPercentage: number(raw.taxPercentage, 0),
    taxDetails: asRecord(raw.taxDetails),
    shipping,
    total: number(raw.total, Math.max(0, subtotal - discount + tax + shipping)),
    shippingAddress: asRecord(raw.shippingAddress) as ShippingAddress,
    customer: asRecord(raw.customer),
    statusHistory: Array.isArray(raw.statusHistory) ? (raw.statusHistory as Array<Record<string, unknown>>) : [],
    createdAt: text(raw.createdAt, new Date(0).toISOString()),
    updatedAt: text(raw.updatedAt) || undefined,
    deliveredAt: text(raw.deliveredAt) || undefined,
    estimatedDelivery: text(raw.estimatedDelivery) || undefined,
  };
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await apiFetch<OrdersApiResponse>("/api/orders");
  const rows = Array.isArray(response.orders) ? response.orders : [];
  return rows.map(normalizeOrder);
}

export async function getMyOrder(id: string): Promise<Order> {
  const response = await apiFetch<{ success: boolean; order: unknown }>(`/api/orders/${encodeURIComponent(id)}`);
  return normalizeOrder(response.order);
}

export async function cancelMyOrder(id: string, reason?: string) {
  const response = await apiFetch<{ success: boolean; order: unknown }>(`/api/orders/${encodeURIComponent(id)}/cancel`, {
    method: "PATCH",
    body: { reason: reason || "Cancelled by customer" },
  });
  return normalizeOrder(response.order);
}

export function userInvoiceUrl(id: string) {
  return `${API_URL}/api/orders/${encodeURIComponent(id)}/invoice`;
}
