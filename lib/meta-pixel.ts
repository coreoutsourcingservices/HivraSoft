// Analytics must never interrupt shopping or checkout.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "950535477792189";
export const META_PIXEL_ENABLED = process.env.NEXT_PUBLIC_META_PIXEL_ENABLED !== "false" && /^\d{10,20}$/.test(META_PIXEL_ID);
type Parameters = Record<string, unknown>;
type PixelWindow = Window & { fbq?: (...args: unknown[]) => void };
const pending: Array<[string, Parameters, string | undefined]> = [];
const purchases = new Set<string>();

export function flushMetaEvents() {
  if (typeof window === "undefined" || !META_PIXEL_ENABLED) return;
  const fbq = (window as PixelWindow).fbq;
  if (!fbq) return;
  while (pending.length) {
    const [name, parameters, eventId] = pending[0];
    try {
      if (eventId) fbq("track", name, parameters, { eventID: eventId });
      else fbq("track", name, parameters);
      pending.shift();
    } catch { return; }
  }
}

export function trackMetaEvent(name: string, parameters: Parameters = {}, eventId?: string) {
  if (typeof window === "undefined" || !META_PIXEL_ENABLED) return;
  pending.push([name, parameters, eventId]);
  flushMetaEvents();
}

export function trackMetaPurchase(order: { id: string; total: number }) {
  if (typeof window === "undefined" || !META_PIXEL_ENABLED || !order.id || !Number.isFinite(order.total) || order.total < 0) return;
  const key = `hivrasoft:meta:purchase:${order.id}`;
  if (purchases.has(key)) return;
  try { if (window.localStorage.getItem(key)) return; } catch { /* Storage may be unavailable. */ }
  purchases.add(key);
  trackMetaEvent("Purchase", { value: order.total, currency: "INR", order_id: order.id }, `purchase:${order.id}`);
  try { window.localStorage.setItem(key, "1"); } catch { /* Keep in-memory deduplication. */ }
}

export function metaCartParameters(cart: { total: number; items: Array<{ productId: string; quantity: number }> }) {
  return { currency: "INR", value: cart.total, content_type: "product", content_ids: cart.items.map(item => item.productId), contents: cart.items.map(item => ({ id: item.productId, quantity: item.quantity })), num_items: cart.items.reduce((total, item) => total + item.quantity, 0) };
}
