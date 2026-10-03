import {
  catalogProductsFromResponse,
  toDisplayProduct,
  type CatalogColor,
  type CatalogImage,
  type CatalogProduct,
} from "@/lib/product-catalog";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type ProductImage = CatalogImage;
export type ProductColor = CatalogColor;
export type Product = ReturnType<typeof toDisplayProduct>;

export type CartItem = {
  _id: string;
  product: Product;
  colorId?: string;
  colorName?: string;
  colorSlug?: string;
  sizeId?: string;
  size?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
};

export type Cart = {
  _id?: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
};

export type WishlistItem = { _id?: string; product: Product; addedAt?: string };
export type OrderItem = { _id?: string; product?: Product | string; name: string; slug?: string; image?: string; color?: string; size?: string; sku?: string; quantity: number; unitPrice: number; totalPrice: number };
export type Order = { _id: string; orderNumber?: string; status: string; paymentStatus?: string; createdAt: string; items: OrderItem[]; subtotal?: number; discount?: number; shipping?: number; total?: number; grandTotal?: number };

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers || {}),
    },
  });

  let body: any = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
  return body;
}

function productOf(value: any): Product {
  const raw = value?.product && typeof value.product === "object" ? value.product : value || {};
  const display = toDisplayProduct(raw as CatalogProduct);
  return {
    ...display,
    price: Number(raw?.price ?? value?.unitPrice ?? value?.price ?? 0) || undefined,
    compareAtPrice: Number(raw?.compareAtPrice || 0) || undefined,
  };
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const r = await request(`/api/products/catalog/${encodeURIComponent(slug)}`);
  return productOf(r?.product || r?.data || r?.products?.[0] || r);
}

export async function getActiveProducts(): Promise<Product[]> {
  const r = await request("/api/products/catalog");
  return catalogProductsFromResponse(r);
}

export async function getCart(): Promise<Cart> {
  const r = await request("/api/cart");
  const raw = r?.data?.cart || r?.cart || r?.data || r || {};
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const items: CartItem[] = rawItems.map((x: any, i: number) => {
    const product = productOf(x);
    const qty = Number(x.quantity || x.qty || 1);
    const unit = Number(x.unitPrice ?? x.price ?? product.price ?? 0);
    return {
      _id: String(x._id || x.id || `${product._id}-${x.sku || i}`),
      product,
      colorId: String(x.colorId?._id || x.colorId || x.color?._id || ""),
<<<<<<< HEAD
      colorName: x.colorName || x.color?.nameColor || x.color?.name,
      colorSlug: x.colorSlug || x.color?.slugColor || x.color?.slug,
      sizeId: String(x.sizeId?._id || x.sizeId || x.size?._id || ""),
      size: typeof x.size === "string" ? x.size : x.size?.size,
      sku: x.sku || x.size?.sku,
      quantity: qty,
      unitPrice: unit,
      lineTotal: Number(x.lineTotal ?? x.totalPrice ?? unit * qty),
      image: x.image || product.mainImages?.[0]?.url || x.color?.images?.[0]?.url,
=======
      colorName: x.colorName || x.selectedColor?.name || x.color?.nameColor || x.color?.name,
      colorSlug: x.colorSlug || x.selectedColor?.slug || x.color?.slugColor || x.color?.slug,
      sizeId: String(x.sizeId?._id || x.sizeId || x.size?._id || ""),
      size: typeof x.size === "string" ? x.size : x.size?.size || x.selectedSize?.size,
      sku: x.sku || x.size?.sku || x.selectedSize?.sku,
      quantity: qty,
      unitPrice: unit,
      lineTotal: Number(x.lineTotal ?? x.subtotal ?? x.totalPrice ?? unit * qty),
      image: x.image || product.mainImages?.[0]?.url || x.selectedColor?.images?.[0]?.url || x.color?.images?.[0]?.url,
>>>>>>> aman
    };
  });
  const subtotal = Number(raw.subtotal ?? items.reduce((s, x) => s + x.lineTotal, 0));
  const discount = Number(raw.discount ?? raw.discountAmount ?? 0);
  const shipping = Number(raw.shipping ?? raw.shippingAmount ?? 0);
  return {
    _id: raw._id,
    items,
<<<<<<< HEAD
    itemCount: Number(raw.itemCount ?? items.reduce((s, x) => s + x.quantity, 0)),
=======
    itemCount: Number(raw.itemCount ?? raw.totalItems ?? items.reduce((s, x) => s + x.quantity, 0)),
>>>>>>> aman
    subtotal,
    discount,
    shipping,
    total: Number(raw.total ?? raw.grandTotal ?? subtotal - discount + shipping),
  };
}

export async function addToCart(input: { productId: string; colorId?: string; sizeId?: string; quantity?: number }) {
<<<<<<< HEAD
  return request("/api/cart/items", { method: "POST", body: JSON.stringify({ ...input, quantity: input.quantity || 1 }) });
}
export async function updateCartItem(itemId: string, quantity: number) {
  return request(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
}
export async function removeCartItem(itemId: string) { return request(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }); }
=======
  return request("/api/cart", { method: "POST", body: JSON.stringify({ ...input, quantity: input.quantity || 1 }) });
}
export async function updateCartItem(itemId: string, quantity: number) {
  return request(`/api/cart/${encodeURIComponent(itemId)}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
}
export async function removeCartItem(itemId: string) { return request(`/api/cart/${encodeURIComponent(itemId)}`, { method: "DELETE" }); }
>>>>>>> aman
export async function clearCart() { return request("/api/cart", { method: "DELETE" }); }

export async function getWishlist(): Promise<WishlistItem[]> {
  const r = await request("/api/wishlist");
  const raw = r?.data?.items || r?.wishlist?.items || r?.data || r?.items || [];
  return Array.isArray(raw) ? raw.map((x: any) => ({ _id: x._id || x.id, product: productOf(x), addedAt: x.addedAt || x.createdAt })) : [];
}
export async function addToWishlist(productId: string) { return request("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) }); }
export async function removeFromWishlist(productId: string) { return request(`/api/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE" }); }

async function firstWorking(paths: string[]) {
  let last: unknown;
  for (const p of paths) { try { return await request(p); } catch (e) { last = e; } }
  throw last instanceof Error ? last : new Error("Unable to load orders.");
}

export async function getMyOrders(): Promise<Order[]> {
  const r = await firstWorking(["/api/orders/my-orders", "/api/orders/my", "/api/orders"]);
  const raw = r?.data?.orders || r?.orders || r?.data || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((o: any) => ({
    _id: String(o._id || o.id),
    orderNumber: o.orderNumber || o.orderId || o.number,
    status: o.status || o.orderStatus || "processing",
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt || o.orderDate || new Date().toISOString(),
    items: (Array.isArray(o.items) ? o.items : []).map((x: any) => ({
      _id: x._id,
      product: x.product,
      name: x.name || x.product?.name || x.product?.colors?.[0]?.nameProduct || "Product",
      slug: x.slug || x.product?.slug || x.product?.colors?.[0]?.slugProduct,
      image: x.image?.url || x.image || x.product?.mainImages?.[0]?.url || x.product?.colors?.[0]?.images?.[0]?.url,
      color: x.color?.nameColor || x.color?.name || x.colorName || x.color,
      size: x.size?.size || x.size,
      sku: x.sku,
      quantity: Number(x.quantity || 1),
      unitPrice: Number(x.unitPrice ?? x.price ?? 0),
      totalPrice: Number(x.totalPrice ?? (x.unitPrice ?? x.price ?? 0) * (x.quantity || 1)),
    })),
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || o.discountAmount || 0),
    shipping: Number(o.shipping || o.shippingAmount || 0),
    total: Number(o.total || o.grandTotal || o.totalAmount || 0),
    grandTotal: Number(o.grandTotal || o.total || o.totalAmount || 0),
  }));
}

export function money(value: number) { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
export function dispatchStoreChanged() { if (typeof window !== "undefined") window.dispatchEvent(new Event("hivra:store-changed")); }
