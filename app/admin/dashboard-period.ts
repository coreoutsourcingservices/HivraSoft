import type { AdminDashboardData } from "@/lib/admin-api";

export const dashboardPeriods = [["7_days", "7 Days"], ["1_month", "1 Month"], ["3_months", "3 Months"], ["6_months", "6 Months"], ["1_year", "1 Year"], ["all", "All"]] as const;
export type DashboardPeriod = typeof dashboardPeriods[number][0];
export type DashboardRange = { period: DashboardPeriod; from?: string; to?: string };
const day = 86_400_000;
const iso = (date: Date) => date.toISOString().slice(0, 10);
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

export function dashboardPeriodData(orders: Record<string, unknown>[], range: DashboardRange, now = new Date()): Pick<AdminDashboardData, "orderStatus" | "salesOverview" | "recentOrders"> {
  const end = new Date(`${range.to || iso(now)}T23:59:59.999Z`);
  const start = new Date(`${range.from || iso(end)}T00:00:00Z`);
  if (!range.from) {
    if (range.period === "7_days") start.setUTCDate(start.getUTCDate() - 6);
    else if (range.period === "all") {
      const earliest = Math.min(end.getTime(), ...orders.map((order) => Date.parse(String(order.createdAt))).filter(Number.isFinite));
      start.setTime(earliest); start.setUTCHours(0, 0, 0, 0);
    } else {
      const months = { "1_month": 1, "3_months": 3, "6_months": 6, "1_year": 12 }[range.period];
      const date = start.getUTCDate();
      start.setUTCDate(1); start.setUTCMonth(start.getUTCMonth() - months);
      const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
      start.setUTCDate(Math.min(date, last));
    }
  }
  const filtered = orders.filter((order) => {
    const time = Date.parse(String(order.createdAt));
    return time >= start.getTime() && time <= end.getTime();
  }).sort((a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)));
  const orderStatus = { pending: 0, completed: 0, cancelled: 0 };
  const monthly = (end.getTime() - start.getTime()) / day > 180;
  const weekly = !monthly && (end.getTime() - start.getTime()) / day > 45;
  const bucket = (date: Date) => {
    const d = new Date(date); d.setUTCHours(0, 0, 0, 0);
    if (monthly) d.setUTCDate(1);
    else if (weekly) d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
    return iso(d);
  };
  const buckets = new Map<string, AdminDashboardData["salesOverview"][number]>();
  const cursor = new Date(`${bucket(start)}T00:00:00Z`);
  while (cursor <= end) {
    const key = iso(cursor);
    buckets.set(key, { date: key, label: `${weekly ? "Wk " : ""}${cursor.toLocaleDateString("en-IN", { timeZone: "UTC", month: "short", ...(monthly ? { year: "2-digit" } : { day: "numeric" }) })}`, revenue: 0, orders: 0 });
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + (weekly ? 7 : 1));
  }
  for (const order of filtered) {
    const status = String(order.status || "pending").toLowerCase();
    const cancelled = ["cancelled", "canceled", "returned", "refunded"].includes(status);
    orderStatus[cancelled ? "cancelled" : ["completed", "delivered"].includes(status) ? "completed" : "pending"]++;
    const point = buckets.get(bucket(new Date(String(order.createdAt))));
    if (point) { point.orders++; if (!cancelled && status !== "failed") point.revenue = Math.round((point.revenue + Number(order.total || 0)) * 100) / 100; }
  }
  const recentOrders = filtered.slice(0, 8).map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const item = object(items[0]); const user = object(order.user); const customer = object(order.customer);
    return { id: String(order._id), orderNumber: String(order.orderNumber || ""), customer: String(user.name || customer.name || customer.fullName || "Customer"), amount: Number(order.total || 0), status: String(order.status || "pending"), date: String(order.createdAt), imageUrl: String(item.image || item.imageUrl || item.productImage || item.photo || ""), itemCount: items.length };
  });
  return { orderStatus, salesOverview: [...buckets.values()], recentOrders };
}
